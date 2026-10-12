#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { compileTimeline, loadEpisodeInputs, renderReadingView } from './timeline.mjs';

const runtimeDir = resolve(import.meta.dirname);
const usage = 'node cli.mjs prepare|render|still|extract <episode-dir> [--frame=N] [--browser-executable=/absolute/path] [--remotion-bin=/absolute/path] [--ffmpeg-bin=/absolute/path] [--ffprobe-bin=/absolute/path]';
const [action, episodeArg, ...options] = process.argv.slice(2);
if (!['prepare', 'render', 'still', 'extract'].includes(action) || !episodeArg) throw new Error(usage);
const flags = Object.fromEntries(options.map(option => {
  const match = /^--([a-z-]+)=(.+)$/.exec(option);
  if (!match) throw new Error(`invalid option ${option}\n${usage}`);
  return [match[1], match[2]];
}));
const episodeDir = resolve(episodeArg);
const outputDir = join(episodeDir, 'output');
const publicDir = join(outputDir, 'remotion-public');
const propsFile = join(outputDir, 'remotion-props.json');
const renderManifestFile = join(outputDir, 'render-manifest.json');
const run = (file, args) => new Promise((done, fail) => {
  const child = spawn(file, args, { stdio: 'inherit', cwd: runtimeDir });
  child.once('error', fail);
  child.once('exit', (code, signal) => code === 0 ? done() : fail(new Error(`${file} exited ${code ?? signal}`)));
});
const fileDigest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
async function copyVerified(source, destination, digest) {
  await copyFile(source, destination);
  if (await fileDigest(destination) !== digest) throw new Error(`copied asset changed during prepare: ${source}`);
}

async function prepare() {
  const { scriptMarkdown, shots, timing } = await loadEpisodeInputs(episodeDir);
  await mkdir(publicDir, { recursive: true });
  let entryFile = join(runtimeDir, 'index.jsx');
  let customSceneSha256 = null;
  if ((shots.shots ?? []).some(shot => shot.scene?.type === 'custom')) {
    const sceneFile = join(episodeDir, 'visual/scenes/index.jsx');
    customSceneSha256 = await fileDigest(sceneFile);
    const generatedDir = join(runtimeDir, '.generated', customSceneSha256);
    await mkdir(generatedDir, { recursive: true });
    await copyVerified(sceneFile, join(generatedDir, 'custom-scenes.jsx'), customSceneSha256);
    entryFile = join(generatedDir, 'entry.jsx');
    await writeFile(entryFile, "import { registerRoot } from 'remotion';\nimport customScenes from './custom-scenes.jsx';\nimport { createStoryRoot } from '../../film.jsx';\nregisterRoot(createStoryRoot(customScenes));\n");
  }
  const audioFiles = {};
  const videoFiles = {};
  const videoHashes = {};
  if (timing && (shots.audioPlacements ?? []).length) {
    if (timing.exampleOnly || timing.status !== 'complete') throw new Error('audio placements require complete, non-example timing');
    const needed = new Set(shots.audioPlacements.map(item => item.audioId));
    for (const audio of timing.audio ?? []) {
      if (!needed.has(audio.audioId)) continue;
      const sourceFile = resolve(episodeDir, audio.sourceFile ?? '');
      if (!audio.sourceFile || relative(episodeDir, sourceFile).startsWith('..')) throw new Error(`audio ${audio.audioId} sourceFile must be inside the episode directory`);
      const digest = await fileDigest(sourceFile);
      if (!audio.audioSha256 || audio.audioSha256 !== digest) throw new Error(`audio ${audio.audioId} digest is missing or differs from timing.json`);
      const ext = extname(sourceFile).toLowerCase();
      if (!['.wav', '.mp3', '.m4a', '.aac'].includes(ext)) throw new Error(`unsupported audio extension ${ext}`);
      const publicFile = `voice-${digest.slice(0, 16)}${ext}`;
      await copyVerified(sourceFile, join(publicDir, publicFile), digest);
      audioFiles[audio.audioId] = publicFile;
    }
  }
  const ffprobe = flags['ffprobe-bin'] ?? process.env.STORY_STUDIO_FFPROBE ?? 'ffprobe';
  for (const shot of shots.shots ?? []) {
    if (shot.scene?.type !== 'video') continue;
    const data = shot.scene.data ?? {};
    const sourceFile = resolve(episodeDir, data.sourceFile ?? '');
    if (!data.sourceFile || isAbsolute(data.sourceFile) || relative(episodeDir, sourceFile).startsWith('..')) throw new Error(`video shot ${shot.id} sourceFile must be relative to the episode directory`);
    const ext = extname(sourceFile).toLowerCase();
    if (!['.mp4', '.mov', '.webm'].includes(ext)) throw new Error(`unsupported video extension ${ext}`);
    const duration = Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sourceFile], { encoding: 'utf8' }).trim());
    const shotSeconds = (shot.durationFrames ?? Math.round(shot.estimatedSeconds * (shots.fps ?? 30))) / (shots.fps ?? 30);
    if (!Number.isFinite(duration) || !Number.isFinite(data.sourceInSeconds) || !Number.isFinite(shotSeconds) || data.sourceInSeconds < 0 || shotSeconds <= 0 || data.sourceInSeconds + shotSeconds > duration + 0.01) {
      throw new Error(`video shot ${shot.id} source range exceeds the actual clip duration`);
    }
    if (!videoFiles[data.sourceFile]) {
      const digest = await fileDigest(sourceFile);
      const publicFile = `clip-${digest.slice(0, 16)}${ext}`;
      await copyVerified(sourceFile, join(publicDir, publicFile), digest);
      videoFiles[data.sourceFile] = publicFile;
      videoHashes[data.sourceFile] = digest;
    }
  }
  const timeline = compileTimeline({ scriptMarkdown, shots, timing, audioFiles, videoFiles, videoHashes, customSceneSha256 });
  await writeFile(propsFile, JSON.stringify({ timeline }, null, 2));
  await writeFile(join(outputDir, '视听脚本.md'), renderReadingView(timeline, { shots, timing }));
  return { timeline, entryFile };
}

const { timeline, entryFile } = await prepare();
if (action === 'prepare') {
  process.stdout.write(`${propsFile}\n${join(outputDir, '视听脚本.md')}\n`);
} else if (action === 'render' || action === 'still') {
  const browser = flags['browser-executable'] ?? process.env.STORY_STUDIO_BROWSER_EXECUTABLE;
  if (!browser || !isAbsolute(browser)) throw new Error('set --browser-executable to an absolute Chromium executable path');
  const remotion = flags['remotion-bin'] ?? join(runtimeDir, 'node_modules/.bin/remotion');
  const frame = flags.frame === undefined ? 0 : Number(flags.frame);
  if (action === 'still' && (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationInFrames)) throw new Error('still --frame must be within the film');
  const outputFile = join(outputDir, action === 'render' ? 'story-studio.mp4' : `frame-${String(frame).padStart(6, '0')}.png`);
  const args = [action, entryFile, 'StoryStudio', outputFile, `--props=${propsFile}`, `--public-dir=${publicDir}`, `--browser-executable=${browser}`];
  if (action === 'still') args.push(`--frame=${frame}`);
  await run(remotion, args);
  if (action === 'render') await writeFile(renderManifestFile, JSON.stringify({ version: 1, source: timeline.source, mp4Sha256: await fileDigest(outputFile) }, null, 2));
  process.stdout.write(`${outputFile}\n`);
} else {
  const frame = Number(flags.frame);
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationInFrames) throw new Error('extract requires --frame within the film');
  const ffmpeg = flags['ffmpeg-bin'] ?? process.env.STORY_STUDIO_FFMPEG ?? 'ffmpeg';
  const manifest = JSON.parse(await readFile(renderManifestFile, 'utf8'));
  if (JSON.stringify(manifest.source) !== JSON.stringify(timeline.source) || manifest.mp4Sha256 !== await fileDigest(join(outputDir, 'story-studio.mp4'))) {
    throw new Error('existing MP4 does not match the current episode inputs');
  }
  const outputFile = join(outputDir, `extracted-${String(frame).padStart(6, '0')}.png`);
  await run(ffmpeg, ['-y', '-ss', String(frame / timeline.fps), '-i', join(outputDir, 'story-studio.mp4'), '-frames:v', '1', outputFile]);
  process.stdout.write(`${outputFile}\n`);
}
