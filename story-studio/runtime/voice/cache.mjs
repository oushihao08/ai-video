// 片段身份只包含实际 TTS 输入。音频指纹防止文件被替换后误命中。
import fs from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { sha256 } from '../shared/content-contract.mjs';

export function fileSha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
export const inputDigest = input => sha256(JSON.stringify(input));
export function readCached(file, inputSha256) {
  try {
    const entry = JSON.parse(fs.readFileSync(`${file}.cache.json`, 'utf8'));
    if (entry.version !== 1 || entry.inputSha256 !== inputSha256 || entry.audioSha256 !== fileSha256(file)
      || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0 || !Array.isArray(entry.words)) return null;
    return entry;
  } catch { return null; }
}
export function writeCached(file, inputSha256, audio) {
  const entry = { version: 1, inputSha256, audioSha256: fileSha256(file), durationSeconds: audio.durationSeconds, words: audio.words };
  const target = `${file}.cache.json`, temp = `${target}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(entry, null, 2)); fs.renameSync(temp, target); }
  finally { fs.rmSync(temp, { force: true }); }
  return entry;
}
