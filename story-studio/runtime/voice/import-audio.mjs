#!/usr/bin/env node
// 接入已有音频。已有对齐须由调用方提供真实来源；本入口不猜测逐词位置。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentDigest, parseScriptMarkdown } from '../shared/content-contract.mjs';
import { durationSeconds } from './audio.mjs';
import { fileSha256 } from './cache.mjs';

const ownFile = fileURLToPath(import.meta.url);
function option(argv, key) {
  const index = argv.indexOf(key);
  return index < 0 ? undefined : argv[index + 1];
}
function within(root, file) {
  const target = path.resolve(root, file);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error(`路径须在本期目录内: ${file}`);
  return target;
}
export function importAudio(argv = process.argv.slice(2)) {
  const rootArg = option(argv, '--episode'), sourceArg = option(argv, '--audio');
  if (!rootArg || !sourceArg) throw new Error('用法: node story-studio/runtime/voice/import-audio.mjs --episode <本期目录> --audio <已有文件> [--script script.md] [--alignment 对齐.json] [--out audio]');
  const root = path.resolve(rootArg), source = path.resolve(sourceArg);
  const out = within(root, option(argv, '--out') || 'audio');
  const duration = durationSeconds(source);
  const parsed = option(argv, '--script') ? parseScriptMarkdown(fs.readFileSync(within(root, option(argv, '--script')), 'utf8')) : null;
  const alignmentFile = option(argv, '--alignment');
  const alignment = alignmentFile ? JSON.parse(fs.readFileSync(within(root, alignmentFile), 'utf8')) : null;
  if (alignment && !parsed) throw new Error('对齐文件需要 --script 校验句段 ID');
  const ids = new Map((parsed?.sentences || []).map(item => [item.id, item.segmentId]));
  const sentences = [];
  if (alignment) {
    if (!Array.isArray(alignment.sentences) || !alignment.method || !alignment.source) throw new Error('对齐文件需有 sentences、method 和 source');
    let previous = -1;
    const seen = new Set();
    for (const [index, item] of alignment.sentences.entries()) {
      if (!ids.has(item.id)) throw new Error(`对齐句子不在正文中: ${item.id}`);
      if (item.id !== parsed.sentences[index]?.id) throw new Error(`对齐句序与正文不一致: ${item.id}`);
      if (seen.has(item.id)) throw new Error(`对齐句子 ID 重复: ${item.id}`);
      seen.add(item.id);
      const start = Number(item.startSeconds), end = Number(item.endSeconds);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < previous || start < 0 || start >= duration || end <= start || end > duration + 0.05) throw new Error(`对齐时间越界或乱序: ${item.id}`);
      sentences.push({ id: item.id, segmentId: ids.get(item.id), audioId: 'external-voice', startSeconds: start, endSeconds: Math.min(end, duration), precision: 'sentence' });
      previous = end;
    }
    if (seen.size !== ids.size) throw new Error('对齐文件没有覆盖正文所有句子');
  }
  fs.mkdirSync(out, { recursive: true });
  const audioSha256 = fileSha256(source);
  const target = within(out, `external-voice-${audioSha256}${path.extname(source).toLowerCase()}`);
  if (source !== target && !fs.existsSync(target)) fs.copyFileSync(source, target);
  if (fileSha256(target) !== audioSha256) throw new Error('已有音频副本的摘要与源文件不符');
  const timing = { version: 1, status: 'complete', sourceTimeUnit: 'seconds', scriptSha256: parsed ? contentDigest(parsed) : null, precision: sentences.length ? 'sentence' : 'audio-only', alignment: alignment ? { source: alignment.source, method: alignment.method } : null, audio: [{ audioId: 'external-voice', sourceFile: path.relative(root, target), audioSha256, durationSeconds: duration, source: 'external' }], sentences, listening: { status: 'not-checked' } };
  const timingFile = within(out, 'timing.json');
  if (fs.existsSync(timingFile)) fs.renameSync(timingFile, within(out, 'timing.previous.json'));
  const temp = `${timingFile}.${process.pid}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(timing, null, 2)); fs.renameSync(temp, timingFile); }
  finally { fs.rmSync(temp, { force: true }); }
  return { timing: timingFile, precision: timing.precision };
}
if (process.argv[1] && path.resolve(process.argv[1]) === ownFile) {
  try { console.log(JSON.stringify(importAudio(), null, 2)); }
  catch (error) { console.error(`[story-voice] ${error.message}`); process.exitCode = 1; }
}
