import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contentDigest, deliveryDigest, parseScriptMarkdown, sha256 } from '../shared/content-contract.mjs';
import { buildSubtitleCues } from './subtitle-cues.mjs';
import { rendererFingerprint } from './renderer-version.mjs';

const isInt = value => Number.isInteger(value) && value >= 0;
const secondsToFrame = (seconds, fps) => Math.round(seconds * fps);
const requireText = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  return value;
};
const mmss = (frame, fps) => {
  const seconds = frame / fps;
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${(seconds - minutes * 60).toFixed(2).padStart(5, '0')}`;
};

export function compileTimeline({ scriptMarkdown, shots, timing = null, audioFiles = {}, videoFiles = {}, videoHashes = {}, customSceneSha256 = null }) {
  const script = parseScriptMarkdown(scriptMarkdown);
  const sentenceById = new Map(script.sentences.map(sentence => [sentence.id, sentence]));
  const fps = shots.fps ?? 30;
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('shots.fps must be a positive integer');
  if (!Array.isArray(shots.units) || !Array.isArray(shots.shots) || shots.shots.length === 0) throw new Error('shots.units and nonempty shots.shots are required');
  const units = new Map();
  for (const unit of shots.units) {
    requireText(unit.id, 'unit.id');
    if (units.has(unit.id)) throw new Error(`duplicate unit ${unit.id}`);
    if (!Array.isArray(unit.sentenceIds)) throw new Error(`unit ${unit.id} needs sentenceIds`);
    for (const id of unit.sentenceIds) if (!sentenceById.has(id)) throw new Error(`unit ${unit.id} references unknown sentence ${id}`);
    units.set(unit.id, unit);
  }
  const seenShots = new Set();
  let cursor = 0;
  const renderedShots = shots.shots.map(shot => {
    requireText(shot.id, 'shot.id');
    if (seenShots.has(shot.id)) throw new Error(`duplicate shot ${shot.id}`);
    seenShots.add(shot.id);
    if (!units.has(shot.unitId)) throw new Error(`shot ${shot.id} references unknown unit ${shot.unitId}`);
    const startFrame = shot.startFrame ?? cursor;
    const durationFrames = shot.durationFrames ?? (Number.isFinite(shot.estimatedSeconds) ? secondsToFrame(shot.estimatedSeconds, fps) : undefined);
    if (!isInt(startFrame) || !Number.isInteger(durationFrames) || durationFrames <= 0) throw new Error(`shot ${shot.id} needs a nonnegative startFrame and positive durationFrames`);
    if (startFrame !== cursor) throw new Error(`shot ${shot.id} must start at previous shot end frame ${cursor}`);
    const scene = shot.scene ? { ...shot.scene, data: { ...shot.scene.data } } : { type: 'story', data: {} };
    if (!['story', 'battle', 'video', 'custom'].includes(scene.type)) throw new Error(`shot ${shot.id} has unsupported scene ${scene.type}`);
    if (scene.type === 'custom') {
      requireText(scene.data.key, `custom shot ${shot.id} key`);
      if (!customSceneSha256) throw new Error(`custom shot ${shot.id} has no episode scene module`);
    }
    if (scene.type === 'battle') {
      const data = scene.data;
      if (!['verified', 'demonstration'].includes(data?.evidenceStatus)) throw new Error(`battle shot ${shot.id} needs verified or demonstration evidenceStatus`);
      if (!Array.isArray(data.factions) || !Array.isArray(data.routes) || !Array.isArray(data.armies)) throw new Error(`battle shot ${shot.id} needs factions, routes and armies`);
      const factionIds = new Set(data.factions.map(item => item.id));
      const routeIds = new Set(data.routes.map(item => item.id));
      for (const route of data.routes) if (!Array.isArray(route.points) || route.points.length < 2 || route.points.some(point => !Array.isArray(point) || point.length !== 2 || point.some(value => !Number.isFinite(value)))) throw new Error(`battle route ${route.id} needs two or more finite XY points`);
      for (const army of data.armies) if (!factionIds.has(army.factionId) || !routeIds.has(army.routeId)) throw new Error(`battle army ${army.id} has unknown faction or route`);
    }
    if (scene.type === 'video') {
      const data = scene.data;
      requireText(data.sourceFile, `video shot ${shot.id} sourceFile`);
      if (!['muted', 'keep'].includes(data.audioMode)) throw new Error(`video shot ${shot.id} needs explicit audioMode muted or keep`);
      if (!Number.isFinite(data.sourceInSeconds) || data.sourceInSeconds < 0) throw new Error(`video shot ${shot.id} needs nonnegative sourceInSeconds`);
      if (!videoFiles[data.sourceFile]) throw new Error(`video shot ${shot.id} has no prepared public file`);
      scene.data = { ...data, publicFile: videoFiles[data.sourceFile], sourceInFrame: secondsToFrame(data.sourceInSeconds, fps) };
    }
    cursor = startFrame + durationFrames;
    return { ...shot, scene, startFrame, durationFrames, endFrame: cursor };
  });
  if (timing && timing.scriptSha256 && timing.scriptSha256 !== contentDigest(script)) throw new Error('timing scriptSha256 differs from current script');
  if ((shots.audioPlacements ?? []).length) {
    if (!timing || timing.status !== 'complete' || timing.exampleOnly) throw new Error('audio placements require complete, non-example timing');
    const isVolc = timing.voice?.engine === 'volc' || timing.audio?.some(item => item.source === 'volc-tts');
    if (isVolc && timing.deliverySha256 !== deliveryDigest(script)) throw new Error('timing deliverySha256 differs from current delivery instructions; regenerate voice');
  }
  const audioById = new Map((timing?.audio ?? []).map(item => [item.audioId, item]));
  if (audioById.size !== (timing?.audio ?? []).length) throw new Error('timing.audio has duplicate audioId');
  const placements = (shots.audioPlacements ?? []).map((item, index) => {
    const audio = audioById.get(item.audioId);
    if (!audio) throw new Error(`audio placement ${index} has no matching timing.audio entry`);
    if (!isInt(item.timelineStartFrame) || !Number.isFinite(item.sourceInSeconds) || !Number.isFinite(item.sourceOutSeconds) || item.sourceInSeconds < 0 || item.sourceOutSeconds <= item.sourceInSeconds || item.sourceOutSeconds > audio.durationSeconds + 0.001) throw new Error(`invalid audio placement ${index}`);
    if (!audioFiles[item.audioId]) throw new Error(`audio placement ${index} has no prepared public file`);
    const sourceInFrame = secondsToFrame(item.sourceInSeconds, fps);
    const sourceOutFrame = secondsToFrame(item.sourceOutSeconds, fps);
    const durationFrames = sourceOutFrame - sourceInFrame;
    if (durationFrames <= 0 || item.timelineStartFrame + durationFrames > cursor) throw new Error(`audio placement ${index} exceeds video timeline`);
    return { ...item, sourceInFrame, sourceOutFrame, durationFrames, publicFile: audioFiles[item.audioId] };
  });
  for (const shot of renderedShots) {
    if (shot.scene.type !== 'video' || shot.scene.data.audioMode !== 'keep') continue;
    if (placements.some(item => item.timelineStartFrame < shot.endFrame && item.timelineStartFrame + item.durationFrames > shot.startFrame)) {
      throw new Error(`video shot ${shot.id} retains source audio while narration overlaps`);
    }
  }
  const sentences = [];
  const speechCues = [];
  const subtitleCues = [];
  const subtitleLimitations = [];
  if (timing && placements.length) {
    if (!Array.isArray(timing.sentences)) throw new Error('timing.sentences is required for subtitles');
    for (const placement of placements) {
      for (const item of timing.sentences.filter(sentence => sentence.audioId === placement.audioId)) {
        const overlaps = item.startSeconds < placement.sourceOutSeconds && item.endSeconds > placement.sourceInSeconds;
        const fullyContained = item.startSeconds >= placement.sourceInSeconds && item.endSeconds <= placement.sourceOutSeconds;
        if (overlaps && !fullyContained) throw new Error(`audio placement cuts spoken sentence ${item.id}`);
      }
    }
    for (const item of timing.sentences) {
      const sentence = sentenceById.get(item.id);
      if (!sentence) throw new Error(`timing references unknown sentence ${item.id}`);
      if (!Number.isFinite(item.startSeconds) || !Number.isFinite(item.endSeconds) || item.endSeconds <= item.startSeconds) throw new Error(`invalid sentence timing ${item.id}`);
      const matches = placements.filter(p => p.audioId === item.audioId && item.startSeconds >= p.sourceInSeconds - 0.0001 && item.endSeconds <= p.sourceOutSeconds + 0.0001);
      if (matches.length > 1) throw new Error(`sentence ${item.id} appears in multiple audio placements`);
      if (!matches.length) continue;
      const placement = matches[0];
      const startFrame = placement.timelineStartFrame + secondsToFrame(item.startSeconds - placement.sourceInSeconds, fps);
      const endFrame = placement.timelineStartFrame + secondsToFrame(item.endSeconds - placement.sourceInSeconds, fps);
      const alignedSentence = { id: item.id, text: sentence.text, startFrame, endFrame, precision: item.precision ?? timing.precision ?? 'sentence' };
      sentences.push(alignedSentence);
      speechCues.push({ kind: 'sentence', sentenceId: item.id, text: sentence.text, startFrame, endFrame });
      const timedWords = [];
      for (const word of item.words ?? []) {
        if (!Number.isFinite(word.startSeconds) || !Number.isFinite(word.endSeconds) || word.startSeconds < item.startSeconds || word.endSeconds > item.endSeconds || word.endSeconds <= word.startSeconds) {
          throw new Error(`invalid word timing in sentence ${item.id}`);
        }
        const overlaps = word.startSeconds < placement.sourceOutSeconds && word.endSeconds > placement.sourceInSeconds;
        const fullyContained = word.startSeconds >= placement.sourceInSeconds && word.endSeconds <= placement.sourceOutSeconds;
        if (overlaps && !fullyContained) throw new Error(`audio placement cuts spoken word in sentence ${item.id}`);
        if (!fullyContained) continue;
        const cue = {
          kind: 'word', sentenceId: item.id, text: word.text,
          startFrame: placement.timelineStartFrame + secondsToFrame(word.startSeconds - placement.sourceInSeconds, fps),
          endFrame: placement.timelineStartFrame + secondsToFrame(word.endSeconds - placement.sourceInSeconds, fps),
        };
        speechCues.push(cue);
        timedWords.push(cue);
      }
      const subtitles = buildSubtitleCues(alignedSentence, timedWords);
      subtitleCues.push(...subtitles.cues);
      if (subtitles.limitation) subtitleLimitations.push(subtitles.limitation);
    }
  }
  if (placements.length && timing.sentences.length && !sentences.length) throw new Error('no complete sentence falls inside selected audio placements');
  return { fps, width: shots.width ?? 1280, height: shots.height ?? 720, durationInFrames: cursor, shots: renderedShots, placements, subtitles: sentences, subtitleCues, subtitleLimitations, speechCues, source: { scriptSha256: contentDigest(script), deliverySha256: deliveryDigest(script), shotsSha256: sha256(JSON.stringify(shots)), timingSha256: timing ? sha256(JSON.stringify(timing)) : null, videoAssetsSha256: sha256(JSON.stringify(videoHashes)), customSceneSha256, rendererSha256: rendererFingerprint() }, script };
}

export function renderReadingView(timeline, { shots, timing = null }) {
  const { fps, script } = timeline;
  const sentenceById = new Map(script.sentences.map(item => [item.id, item]));
  const deliveryById = new Map(script.deliveries.map(item => [item.sentenceId, item.instruction]));
  const unitById = new Map(shots.units.map(item => [item.id, item]));
  const hasAudio = Boolean(timing && timeline.placements.length);
  const hasAlignedSpeech = hasAudio && timeline.subtitles.length > 0;
  const status = hasAlignedSpeech ? '实测音频＋句级对齐＋最终剪辑' : hasAudio ? '实测音频＋最终剪辑；口播句级位置未对齐' : '估算／约定镜头时长；未接入实测音频';
  const lines = ['# 视听脚本阅读视图', '', `时间状态：${status}。源时间保持独立；分:秒为成片帧位置。`, `正文摘要：${timeline.source.scriptSha256}`, `表达摘要：${timeline.source.deliverySha256}`, `分镜摘要：${timeline.source.shotsSha256}`, `源时间摘要：${timeline.source.timingSha256 ?? '无'}`, '', '| 成片时间 | 单元／口播 | 表达 | 画面开始 → 变化 → 结束 | 同步／依据 |', '|---|---|---|---|---|'];
  if (timeline.subtitleLimitations?.length) lines.splice(8, 0, '字幕时间限制：', ...timeline.subtitleLimitations.map(item => `- ${item.sentenceId}：${item.message}（${item.reason}）`), '');
  for (const shot of timeline.shots) {
    const unit = unitById.get(shot.unitId);
    const spoken = hasAlignedSpeech
      ? timeline.subtitles.filter(item => item.startFrame < shot.endFrame && item.endFrame > shot.startFrame)
      : unit.sentenceIds.map(id => ({ id }));
    const texts = spoken.length ? `${hasAudio && !hasAlignedSpeech ? '（本单元规划，时间未对齐）<br>' : ''}${spoken.map(item => `${item.id} ${sentenceById.get(item.id).text}`).join('<br>')}` : '（无口播）';
    const delivery = spoken.map(item => deliveryById.has(item.id) ? `${item.id} ${deliveryById.get(item.id)}` : '').filter(Boolean).join('<br>') || '—';
    const visuals = [shot.startState, shot.change, shot.endState].map(value => value ?? '—').join(' → ');
    const sync = [shot.syncIntent, shot.sourceRef, shot.scene.type === 'battle' ? `地图：${shot.scene.data.evidenceStatus}` : null, shot.scene.type === 'video' ? `片段音轨：${shot.scene.data.audioMode}` : null, shot.scene.type === 'custom' ? `本期场景：${shot.scene.data.key}` : null].filter(Boolean).join('；') || '—';
    const safe = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
    lines.push(`| ${mmss(shot.startFrame, fps)}–${mmss(shot.endFrame, fps)} | ${safe(`${shot.unitId}<br>${texts}`)} | ${safe(delivery)} | ${safe(visuals)} | ${safe(sync)} |`);
  }
  return `${lines.join('\n')}\n`;
}

export async function loadEpisodeInputs(episodeDir) {
  const read = relative => readFile(resolve(episodeDir, relative), 'utf8');
  const [scriptMarkdown, shotsText] = await Promise.all([read('script.md'), read('visual/shots.json')]);
  const shots = JSON.parse(shotsText);
  let timing = null;
  try { timing = JSON.parse(await read('audio/timing.json')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { scriptMarkdown, shots, timing };
}
