// 火山 TTS 请求和源音频测量；移植自 ai-videoxxx/skills/investigation-video/scripts/tts.mjs。
// 不选择本机 say 作为正式配音的回退引擎。
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';
export const DEFAULT_VOICE = 'zh_male_yuanboxiaoshu_uranus_bigtts';
export const RESOURCE_ID = 'seed-tts-2.0';

export function durationSeconds(file) {
  const value = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim());
  if (!Number.isFinite(value) || value <= 0) throw new Error(`无法测量音频时长: ${file}`);
  return value;
}

export function jsonObjects(text) {
  const values = [];
  let depth = 0, start = -1, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') { if (depth++ === 0) start = i; }
    else if (c === '}' && depth > 0 && --depth === 0 && start >= 0) { values.push(text.slice(start, i + 1)); start = -1; }
  }
  return values;
}

function collect(node, chunks, words) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.words)) words.push(...node.words);
  for (const [key, value] of Object.entries(node)) {
    if ((key === 'data' || key === 'audio') && typeof value === 'string' && value) chunks.push(Buffer.from(value, 'base64'));
    else if (value && typeof value === 'object' && key !== 'words') collect(value, chunks, words);
  }
}

export async function synthesize(text, destination, { voice = DEFAULT_VOICE, speed = 0, style = '' } = {}) {
  const apiKey = process.env.VOLC_TTS_API_KEY;
  const appId = process.env.VOLC_TTS_APP_ID;
  const token = process.env.VOLC_TTS_ACCESS_TOKEN;
  if (!apiKey && !(appId && token)) throw new Error('缺少火山凭证：VOLC_TTS_API_KEY 或 VOLC_TTS_APP_ID 与 VOLC_TTS_ACCESS_TOKEN');
  const headers = { 'Content-Type': 'application/json', 'X-Api-Resource-Id': process.env.VOLC_TTS_RESOURCE_ID || RESOURCE_ID, 'X-Api-Connect-Id': randomUUID() };
  if (apiKey) headers['X-Api-Key'] = apiKey;
  else { headers['X-Api-App-Id'] = appId; headers['X-Api-Access-Key'] = token; }
  const audioParams = { format: 'mp3', sample_rate: 24000, bit_rate: 128000, enable_timestamp: true, enable_subtitle: true };
  if (speed) audioParams.speech_rate = speed;
  const reqParams = { text, speaker: voice, audio_params: audioParams };
  if (style) reqParams.additions = JSON.stringify({ context_texts: [style] });
  const response = await fetch(URL, { method: 'POST', headers, body: JSON.stringify({ user: { uid: 'story-studio' }, req_params: reqParams }) });
  const raw = await response.text();
  if (!response.ok) throw new Error(`火山 TTS HTTP ${response.status}`);
  const chunks = [], words = [];
  for (const value of jsonObjects(raw)) {
    try { collect(JSON.parse(value), chunks, words); } catch { /* 非 JSON 分片忽略 */ }
  }
  if (!chunks.length) throw new Error('火山 TTS 未返回音频分片');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'story-voice-'));
  const mp3 = path.join(temp, 'audio.mp3');
  const wav = path.join(temp, 'audio.wav');
  try {
    fs.writeFileSync(mp3, Buffer.concat(chunks));
    execFileSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', mp3, '-ar', '44100', '-ac', '2', wav]);
    const duration = durationSeconds(wav);
    fs.copyFileSync(wav, destination);
    return { durationSeconds: duration, words };
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
