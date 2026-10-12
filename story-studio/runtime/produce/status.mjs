#!/usr/bin/env node
// 只读恢复快照：核对当前文件的依赖与摘要，不替代内容审核或媒体播放。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentDigest, deliveryDigest, parseScriptMarkdown, validateReviewAuthority } from '../shared/content-contract.mjs';
import { fileSha256 } from '../voice/cache.mjs';
import { currentReviewBasis } from '../voice/generate.mjs';
import { compileTimeline } from '../remotion/timeline.mjs';

const ownFile = fileURLToPath(import.meta.url);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const fileState = file => fs.existsSync(file) ? 'present' : 'missing';
function inside(root, relative) {
  const absolute = path.resolve(root, relative);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) throw new Error(`文件超出本期目录: ${relative}`);
  return absolute;
}

export function inspectEpisode(episodeDir) {
  const root = path.resolve(episodeDir);
  const report = {
    episode: root,
    episodeRecord: fileState(inside(root, 'episode.md')),
    script: { status: 'missing' }, review: { status: 'missing' },
    audio: { status: 'missing' }, visual: { status: 'missing' },
    output: { mp4: fileState(inside(root, 'output/story-studio.mp4')), playback: 'unverified' },
  };
  const scriptFile = inside(root, 'script.md');
  let parsed;
  if (fs.existsSync(scriptFile)) {
    try {
      parsed = parseScriptMarkdown(fs.readFileSync(scriptFile, 'utf8'));
      report.script = { status: 'parsed', contentSha256: contentDigest(parsed), deliverySha256: deliveryDigest(parsed), sentences: parsed.sentences.length };
    } catch (error) { report.script = { status: 'invalid', reason: error.message }; }
  }

  const reviewFile = inside(root, 'review.json');
  if (fs.existsSync(reviewFile)) {
    if (!parsed) report.review = { status: 'uncheckable', reason: 'current script is missing or invalid' };
    else {
      try {
        const review = readJson(reviewFile);
        if (review.type === 'user_frozen') report.review = { status: 'needs-trusted-user-decision' };
        else {
          const basis = currentReviewBasis(review.basis || {}, root, report.script.contentSha256);
          const authority = validateReviewAuthority(review, basis);
          report.review = authority.valid ? { status: 'current-independent-record' } : { status: 'invalid', reason: authority.reason };
        }
      } catch (error) { report.review = { status: 'invalid', reason: error.message }; }
    }
  }

  const timingFile = inside(root, 'audio/timing.json');
  let timing;
  if (fs.existsSync(timingFile)) {
    try {
      timing = readJson(timingFile);
      if (timing.status !== 'complete' || !parsed || timing.scriptSha256 !== report.script.contentSha256) throw new Error('timing is incomplete or belongs to another script');
      if (timing.voice?.engine === 'volc' && timing.deliverySha256 !== report.script.deliverySha256) throw new Error('spoken delivery changed after timing was generated');
      if (!Array.isArray(timing.audio) || !timing.audio.length) throw new Error('timing has no source audio');
      for (const item of timing.audio) {
        if (!item.sourceFile || !item.audioSha256 || fileSha256(inside(root, item.sourceFile)) !== item.audioSha256) throw new Error(`audio file missing or changed: ${item.audioId}`);
      }
      const covered = new Set((timing.sentences ?? []).map(item => item.id));
      if (timing.voice?.engine === 'volc' && (covered.size !== parsed.sentences.length || parsed.sentences.some(item => !covered.has(item.id)))) throw new Error('generated timing does not cover every spoken sentence');
      report.audio = { status: 'current-files', sources: timing.audio.length, coveredSentences: covered.size, totalSentences: parsed.sentences.length, precision: timing.precision, listening: timing.listening?.status ?? 'unknown' };
    } catch (error) { timing = null; report.audio = { status: 'invalid', reason: error.message }; }
  }

  const shotsFile = inside(root, 'visual/shots.json');
  if (fs.existsSync(shotsFile)) {
    if (!parsed) report.visual = { status: 'uncheckable', reason: 'current script is missing or invalid' };
    else {
      try {
        const shots = readJson(shotsFile);
        const audioFiles = Object.fromEntries((timing?.audio ?? []).map(item => [item.audioId, item.sourceFile]));
        const videoFiles = {};
        const videoHashes = {};
        for (const item of shots.shots ?? []) {
          if (item.scene?.type !== 'video') continue;
          const source = item.scene.data?.sourceFile;
          if (!source || path.isAbsolute(source)) throw new Error(`video shot ${item.id} needs a relative sourceFile`);
          videoFiles[source] = source;
          videoHashes[source] = fileSha256(inside(root, source));
        }
        const customSceneSha256 = (shots.shots ?? []).some(item => item.scene?.type === 'custom')
          ? fileSha256(inside(root, 'visual/scenes/index.jsx')) : null;
        const timeline = compileTimeline({ scriptMarkdown: fs.readFileSync(scriptFile, 'utf8'), shots, timing, audioFiles, videoFiles, videoHashes, customSceneSha256 });
        const propsFile = inside(root, 'output/remotion-props.json');
        let prepared = 'missing';
        if (fs.existsSync(propsFile)) {
          try {
            const props = readJson(propsFile);
            const source = props.timeline?.source;
            prepared = JSON.stringify(source) === JSON.stringify(timeline.source)
              ? 'current-source-digests' : 'stale-or-unreadable';
          } catch { prepared = 'stale-or-unreadable'; }
        }
        report.visual = { status: 'static-valid', frames: timeline.durationInFrames, fps: timeline.fps, prepared, subtitleLimitations: timeline.subtitleLimitations ?? [] };
        if (report.output.mp4 === 'present') {
          const mp4File = inside(root, 'output/story-studio.mp4');
          const mp4Sha256 = fileSha256(mp4File);
          try {
            const manifest = readJson(inside(root, 'output/render-manifest.json'));
            report.output.source = JSON.stringify(manifest.source) === JSON.stringify(timeline.source)
              && manifest.mp4Sha256 === mp4Sha256
              ? 'matches-current-inputs' : 'stale-or-unverified';
          } catch { report.output.source = 'stale-or-unverified'; }
          try {
            const check = readJson(inside(root, 'output/playback-check.json'));
            const samples = check.progressSamplesSeconds;
            const monotonic = Array.isArray(samples) && samples.length >= 2
              && samples.every((value, index) => Number.isFinite(value) && value >= 0 && (index === 0 || value >= samples[index - 1]));
            report.output.playback = ['manual_playback_check', 'observed_player_playback'].includes(check.type)
              && check.mp4Sha256 === mp4Sha256
              && check.player
              && check.playedFromSeconds === 0
              && Number.isFinite(check.durationSeconds)
              && monotonic
              && samples[0] === 0
              && samples.at(-1) >= check.durationSeconds - 0.2
              && check.endState === 'playback-stopped-at-end'
              ? (check.type === 'observed_player_playback' ? 'completed-observed-current-output' : 'completed-manual-current-output') : 'stale-or-unverified';
          } catch { report.output.playback = 'unverified'; }
        }
      } catch (error) { report.visual = { status: 'invalid', reason: error.message }; }
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === ownFile) {
  if (!process.argv[2]) {
    console.error('用法: node story-studio/runtime/produce/status.mjs <本期目录>');
    process.exitCode = 1;
  } else {
    try { console.log(JSON.stringify(inspectEpisode(process.argv[2]), null, 2)); }
    catch (error) { console.error(`[story-produce] ${error.message}`); process.exitCode = 1; }
  }
}
