#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentDigest, deliveryDigest, parseScriptMarkdown, sha256, validateReviewAuthority, visualContentDigest } from '../shared/content-contract.mjs';
import { fileSha256, inputDigest, readCached, writeCached } from './cache.mjs';
import { DEFAULT_VOICE, RESOURCE_ID, synthesize } from './audio.mjs';

const skillFile = fileURLToPath(new URL('../../skills/story-review/SKILL.md', import.meta.url));
const studioRoot = fileURLToPath(new URL('../../', import.meta.url));
const ownFile = fileURLToPath(import.meta.url);
const usage = 'node story-studio/runtime/voice/generate.mjs --episode <本期目录> [--script script.md] [--review review.json] [--out audio] [--ids s001,s003] [--pronunciations 发音映射.json] [--basis-path 字段=相对文件]';

function options(argv) {
  const result = { basisPaths: {} };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i], value = argv[i + 1];
    if (!key?.startsWith('--') || !value) throw new Error(usage);
    if (key === '--basis-path') {
      const split = value.indexOf('=');
      if (split < 1) throw new Error('--basis-path 格式为 字段=相对文件');
      result.basisPaths[value.slice(0, split)] = value.slice(split + 1);
    } else if (['--episode', '--script', '--review', '--out', '--ids', '--pronunciations'].includes(key)) result[key.slice(2)] = value;
    else throw new Error(`未知参数 ${key}\n${usage}`);
  }
  if (!result.episode) throw new Error(usage);
  return result;
}

function inside(root, relative) {
  const base = path.resolve(root);
  const absolute = path.resolve(base, relative);
  if (absolute !== base && !absolute.startsWith(`${base}${path.sep}`)) throw new Error(`文件必须位于本期目录内: ${relative}`);
  return absolute;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
const defaultPaths = { outlineSha256: 'outline.md', episodeSha256: 'episode.md', requirementsSha256: 'requirements.md', visualSha256: 'visual/direction.md' };

export function currentReviewBasis(expected, root, scriptSha256, basisPaths = {}) {
  const result = { scriptSha256, rulesSha256: sha256(fs.readFileSync(skillFile)) };
  if (!expected.contentPrinciples) throw new Error('审核依据缺少本集合共同内容原则 contentPrinciples');
  for (const [key, value] of Object.entries(expected)) {
    if (key === 'scriptSha256' || key === 'rulesSha256') continue;
    if (Array.isArray(value)) {
      result[key] = value.map(entry => {
        if (!entry || typeof entry.path !== 'string' || typeof entry.sha256 !== 'string') throw new Error(`无法重算审核依据 ${key}`);
        const base = key === 'contentPrinciples' ? studioRoot : root;
        const file = inside(base, entry.path);
        if (entry.digest && !(key === 'visualSources' && entry.path === 'visual/shots.json' && entry.digest === 'visual-content-v1')) {
          throw new Error(`不支持的审核摘要方式 ${entry.digest}: ${entry.path}`);
        }
        const digest = entry.digest === 'visual-content-v1'
          ? visualContentDigest(readJson(file))
          : fileSha256(file);
        return { ...entry, sha256: digest };
      });
    } else if (value && typeof value === 'object' && typeof value.path === 'string' && typeof value.sha256 === 'string') {
      result[key] = { ...value, sha256: fileSha256(inside(key === 'contentPrinciples' ? studioRoot : root, value.path)) };
    } else if (typeof value === 'string' && key.endsWith('Sha256')) {
      const relative = basisPaths[key] || defaultPaths[key];
      if (!relative) throw new Error(`缺少 ${key} 的文件路径，请用 --basis-path ${key}=相对文件 指定`);
      result[key] = fileSha256(inside(root, relative));
    } else throw new Error(`无法重算审核依据 ${key}`);
  }
  return result;
}

function normalizeWords(words, duration) {
  if (!Array.isArray(words) || !words.length) return { precision: 'sentence', words: [] };
  const normalized = [];
  let previous = -1;
  for (const word of words) {
    const start = Number(word.startTime), end = Number(word.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || Math.min(end, duration) <= start || start < previous || end > duration + 0.05) {
      return { precision: 'sentence', words: [] };
    }
    normalized.push({ text: String(word.word ?? ''), startSeconds: start, endSeconds: Math.min(end, duration), ...(word.confidence == null ? {} : { confidence: word.confidence }) });
    previous = start;
  }
  return { precision: 'word', words: normalized };
}

function pronunciationText(text, replacements) {
  let spoken = text;
  for (const [from, to] of Object.entries(replacements)) {
    if (!from || !to || typeof to !== 'string') throw new Error('发音映射必须是非空文本到非空文本');
    spoken = spoken.split(from).join(to);
  }
  return spoken;
}

// 局部动作只优先解决冲突，不丢掉全篇的讲述关系和声音意图。
export function composeDeliveryStyle(overall, local) {
  const base = overall.trim(), action = (local || '').trim();
  if (!base) return action;
  if (!action || action === base) return base;
  return `整体讲述意图：${base}\n本单元表达：${action}\n两者冲突时以本单元表达为准，其余保持整体讲述意图。`;
}

export async function generate(argv = process.argv.slice(2)) {
  const args = options(argv), root = path.resolve(args.episode);
  const scriptFile = inside(root, args.script || 'script.md');
  const reviewFile = inside(root, args.review || 'review.json');
  const outDir = inside(root, args.out || 'audio');
  const parsed = parseScriptMarkdown(fs.readFileSync(scriptFile, 'utf8'));
  const review = readJson(reviewFile);
  if (review.type === 'user_frozen') throw new Error('用户冻结决定须由当前可信对话核实；此 CLI 不提供自报冻结开关');
  const basis = currentReviewBasis(review.basis || {}, root, contentDigest(parsed), args.basisPaths);
  const authority = validateReviewAuthority(review, basis);
  if (!authority.valid) throw new Error(`配音前审核依据无效: ${authority.reason}`);
  const preview = args.ids !== undefined;
  let selected = parsed.sentences;
  if (preview) {
    const ids = args.ids.split(',').map(id => id.trim());
    if (ids.some(id => !id) || new Set(ids).size !== ids.length) throw new Error('--ids 必须是逗号分隔、不重复的非空正文 ID');
    const known = new Set(parsed.sentences.map(item => item.id));
    const missing = ids.filter(id => !known.has(id));
    if (missing.length) throw new Error(`--ids 包含稿件中不存在的 ID: ${missing.join(', ')}`);
    const requested = new Set(ids);
    selected = parsed.sentences.filter(item => requested.has(item.id));
  }
  const replacements = args.pronunciations ? readJson(inside(root, args.pronunciations)) : {};
  if (!replacements || Array.isArray(replacements) || typeof replacements !== 'object') throw new Error('发音映射必须是 JSON 对象');
  const voice = process.env.VOLC_TTS_VOICE || DEFAULT_VOICE;
  const speed = Number(process.env.VOLC_TTS_SPEED ?? 0);
  if (!Number.isFinite(speed) || speed < -50 || speed > 100) throw new Error('VOLC_TTS_SPEED 必须在 -50 到 100 之间');
  const styleDefault = process.env.VOLC_TTS_STYLE || '';
  const resource = process.env.VOLC_TTS_RESOURCE_ID || RESOURCE_ID;
  const deliveries = new Map(parsed.deliveries.map(item => [item.sentenceId, item.instruction]));
  fs.mkdirSync(outDir, { recursive: true });
  // 保留上次完整记录，但从当前入口移走，避免本次失败后误认旧 timing 为当前完成状态。
  const activeTiming = inside(outDir, 'timing.json');
  // 预演无论成功失败均不得改变完整声音的入口或历史记录。
  if (!preview && fs.existsSync(activeTiming)) fs.renameSync(activeTiming, inside(outDir, 'timing.previous.json'));
  const sentences = [];
  const resources = [];
  let reused = 0, generated = 0;
  for (const item of selected) {
    const spokenText = pronunciationText(item.text, replacements);
    const style = composeDeliveryStyle(styleDefault, deliveries.get(item.id));
    const input = { version: 1, text: spokenText, voice, speed, style, resource, format: 'mp3', sampleRate: 24000, bitRate: 128000, timestamp: true, subtitle: true, wav: '44100-stereo' };
    const digest = inputDigest(input);
    // 输入版本进入文件名；失败重试或局部修稿不能覆盖上次 timing 引用的音频。
    const file = inside(outDir, `${item.id}-${digest}.wav`);
    let audio = readCached(file, digest);
    const wasCached = !!audio;
    if (!audio) {
      const result = await synthesize(spokenText, file, { voice, speed, style });
      audio = writeCached(file, digest, result);
      generated++;
    } else reused++;
    const aligned = normalizeWords(audio.words, audio.durationSeconds);
    const sourceFile = path.relative(root, file);
    resources.push({ audioId: item.id, sourceFile, audioSha256: audio.audioSha256, durationSeconds: audio.durationSeconds, inputSha256: digest, source: wasCached ? 'verified-cache' : 'volc-tts' });
    sentences.push({ id: item.id, segmentId: item.segmentId, audioId: item.id, startSeconds: 0, endSeconds: audio.durationSeconds, precision: aligned.precision, ...(aligned.words.length ? { words: aligned.words } : {}) });
  }
  const timing = { version: 1, status: preview ? 'preview' : 'complete', ...(preview ? { selectedIds: selected.map(item => item.id) } : {}), sourceTimeUnit: 'seconds', scriptSha256: basis.scriptSha256, deliverySha256: deliveryDigest(parsed), voiceInputSha256: inputDigest(resources.map(item => item.inputSha256)), voice: { engine: 'volc', speaker: voice, speed, resource }, audio: resources, sentences, precision: sentences.every(item => item.precision === 'word') ? 'word' : 'sentence', listening: { status: 'not-checked' } };
  const target = preview ? inside(outDir, 'preview-timing.json') : activeTiming, temp = `${target}.${process.pid}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(timing, null, 2)); fs.renameSync(temp, target); }
  finally { fs.rmSync(temp, { force: true }); }
  return { timing: target, status: timing.status, generated, reused, sentences: sentences.length, ...(preview ? { selectedIds: timing.selectedIds } : {}) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === ownFile) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') console.log(`${usage}\n--ids 只预演指定单元，仍验证完整稿件审核；输出 preview-timing.json，不更新完整 timing.json。`);
    else console.log(JSON.stringify(await generate(), null, 2));
  }
  catch (error) { console.error(`[story-voice] ${error.message}`); process.exitCode = 1; }
}
