#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUPPORTED = new Set(['twitter', 'bilibili', 'xiaohongshu']);
const TOPIC_LABELS = new Map([
  ['productivity', 'AI 提升生产力'], ['technology', 'AI 技术'], ['tools', 'AI 工具'],
  ['video', 'AI 制作视频'], ['content', 'AI 内容生成'],
]);

function usage() {
  return `兴趣搜索（OpenCLI 只读采集）

用法：
  node interest-search/scripts/search.mjs collect [--config <path>]
  node interest-search/scripts/search.mjs detail --run <run-id> --id <platform:item-id> --kind <post|comments|subtitle|all> [--config <path>]
  node interest-search/scripts/search.mjs record --run <run-id> --input <json-path> [--config <path>]

配置默认读取 interest-search/config.local.json；本地配置应从 config.example.json 复制并启用已登录的平台。
每个来源子进程计入采集预算；detail 的每个只读命令计入深读预算。`;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key.startsWith('--')) throw new Error(`无法识别的位置参数：${key}`);
    const name = key.slice(2);
    if (name === 'help') { options.help = true; continue; }
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${key} 缺少参数值`);
    options[name] = value;
    index += 1;
  }
  return { command, options };
}

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`缺少必填参数 --${name}`);
  return value.trim();
}

async function loadConfig(configArg) {
  const configPath = path.resolve(configArg ?? path.join(ROOT, 'config.local.json'));
  let config;
  try {
    config = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`找不到配置 ${configPath}。请复制 config.example.json 为 config.local.json 并启用目标平台。`);
    }
    throw new Error(`无法读取 JSON 配置：${error.message}`);
  }
  validateConfig(config);
  const dataDir = path.resolve(path.dirname(configPath), config.output.dataDir);
  return { config, configPath, dataDir };
}

function validateConfig(config) {
  if (!config || config.version !== 1 || !Array.isArray(config.topics) || !Array.isArray(config.sources)) {
    throw new Error('配置需要包含 version: 1、topics 数组和 sources 数组');
  }
  if (!config.budget || !config.window || !config.output || !config.discovery) {
    throw new Error('配置缺少 budget、window、discovery 或 output');
  }
  for (const [name, value] of Object.entries(config.budget)) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`budget.${name} 必须为正整数`);
  }
  if (!Number.isInteger(config.window.lookbackHours) || config.window.lookbackHours < 1) {
    throw new Error('window.lookbackHours 必须为正整数');
  }
  if (!Number.isInteger(config.output.maxRecommendations) || config.output.maxRecommendations < 0 || typeof config.output.dataDir !== 'string') {
    throw new Error('output.maxRecommendations 或 output.dataDir 无效');
  }
  if (!Array.isArray(config.discovery.platforms) || config.discovery.platforms.some(site => !SUPPORTED.has(site))) {
    throw new Error('discovery.platforms 必须是受支持的平台名称数组');
  }
  if (typeof config.discovery.outsideFollowing !== 'boolean') throw new Error('discovery.outsideFollowing 必须是布尔值');
  if (!config.topics.length) throw new Error('至少配置一个兴趣主题');
  for (const topic of config.topics) {
    if (!topic.id || !topic.label || !Array.isArray(topic.queries)) throw new Error('每个主题需要 id、label 和 queries');
    if (topic.queries.some(query => typeof query !== 'string')) throw new Error(`主题 ${topic.id} 的 queries 必须是字符串数组`);
  }
  for (const source of config.sources) {
    if (!SUPPORTED.has(source.site)) throw new Error(`尚不支持来源：${source.site}`);
    if (typeof source.enabled !== 'boolean' || !['following_feed', 'following_search', 'authors'].includes(source.mode)) {
      throw new Error(`${source.site} 来源需要 enabled 布尔值和有效 mode`);
    }
    if (!Array.isArray(source.authors)) throw new Error(`${source.site}.authors 必须是数组`);
    if (source.enabled && source.mode === 'authors' && !source.authors.length) {
      throw new Error(`${source.site} 使用 authors 模式时至少填写一个作者`);
    }
    if (source.enabled && source.site === 'xiaohongshu' && source.mode === 'following_feed') {
      throw new Error('小红书没有已确认的关注动态入口；使用 following_search 或 authors');
    }
    if (source.enabled && source.site !== 'xiaohongshu' && source.mode === 'following_search') {
      throw new Error(`${source.site} 尚未配置 following_search 命令；使用 following_feed 或 authors`);
    }
  }
  if (!config.sources.some(source => source.enabled) && config.discovery.outsideFollowing !== true) {
    throw new Error('没有启用采集来源；在 config.local.json 启用平台，或显式允许关注外搜索');
  }
  if (!config.sources.some(source => source.enabled) && config.discovery.outsideFollowing === true && !config.discovery.platforms.length) {
    throw new Error('关注外搜索需要在 discovery.platforms 中明确指定平台');
  }
}

async function ensureDir(directory) { await mkdir(directory, { recursive: true }); }

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw new Error(`无法解析 ${file}: ${error.message}`);
  }
}

async function atomicJson(file, value) {
  await ensureDir(path.dirname(file));
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function withLock(dataDir, action) {
  await ensureDir(dataDir);
  const lockPath = path.join(dataDir, '.lock');
  let lock;
  try {
    lock = await open(lockPath, 'wx', 0o600);
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    return await action();
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error(`已有采集操作持有锁 ${lockPath}；确认没有正在运行的采集后再清理遗留锁。`);
    throw error;
  } finally {
    if (lock) {
      await lock.close();
      await rm(lockPath, { force: true });
    }
  }
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['items', 'results', 'posts', 'tweets', 'dynamics', 'feed', 'notes', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = extractRows(payload[key]);
      if (nested.length) return nested;
    }
  }
  if (Object.keys(payload).length && Object.values(payload).every(value => value && typeof value === 'object' && !Array.isArray(value))) {
    return Object.values(payload);
  }
  return [];
}

function scalar(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function numeric(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') continue;
    const raw = value.trim().replaceAll(',', '');
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*([万wWkK])?$/);
    if (!match) continue;
    const multiplier = { 万: 10000, w: 10000, W: 10000, k: 1000, K: 1000 }[match[2]] ?? 1;
    return { value: Number(match[1]) * multiplier, approximate: multiplier !== 1, raw: value };
  }
  return null;
}

function asMetric(value) {
  if (value === null) return null;
  return typeof value === 'object' ? value : { value, approximate: false, raw: String(value) };
}

function authorFields(row, context) {
  const author = row.author ?? row.user ?? row.owner ?? row;
  if (author && typeof author === 'object') {
    return {
      id: scalar(author.id, author.uid, author.mid, author.userId, author.user_id, context.requestedAuthor),
      name: scalar(author.name, author.screen_name, author.username, author.uname, author.nickname, author.author, typeof row.author === 'string' ? row.author : null),
    };
  }
  return { id: scalar(context.requestedAuthor), name: scalar(author) };
}

function idFromUrl(site, url) {
  if (!url) return null;
  if (site === 'bilibili') return url.match(/(?:\/video\/)?(BV[a-zA-Z0-9]+)|t\.bilibili\.com\/(\d+)/)?.slice(1).find(Boolean) ?? null;
  if (site === 'xiaohongshu') return url.match(/\/explore\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
  return url.match(/status\/(\d+)/)?.[1] ?? null;
}

function parsePublishedAt(value, now = Date.now()) {
  if (value === null) return null;
  const raw = String(value).trim();
  const relative = raw.match(/^(刚刚|\d+\s*(?:秒|分钟|小时|天|周)前)$/);
  if (relative) {
    const amount = Number(relative[0].match(/\d+/)?.[0] ?? 0);
    const unit = relative[0].match(/秒|分钟|小时|天|周/)?.[0];
    const factor = { 秒: 1000, 分钟: 60_000, 小时: 3_600_000, 天: 86_400_000, 周: 604_800_000 }[unit] ?? 0;
    return { milliseconds: now - amount * factor, precision: 'approximate' };
  }
  if (typeof value === 'number') return { milliseconds: value < 1e12 ? value * 1000 : value, precision: 'exact' };
  if (/^\d{10}(?:\.\d+)?$/.test(raw)) return { milliseconds: Number(raw) * 1000, precision: 'exact' };
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? { milliseconds: date.getTime(), precision: 'exact' } : null;
}

export function extractLinks(payload) {
  const links = new Set();
  function visit(value) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/https?:\/\/[^\s<>"'\[\]]+/g)) {
        const url = match[0].replace(/[.,;，。；）)]+$/, '');
        try { links.add(new URL(url).href); } catch { continue; }
      }
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  visit(payload);
  return [...links];
}

function normalizeItem(site, row, context) {
  const url = scalar(row.url, row.link, row.permalink, row.note_url);
  const id = scalar(row.id, row.tweet_id, row.tweetId, row.aweme_id, row.bvid, row.bv_id, row.note_id, row.noteId, row.dynamic_id, row.id_str, idFromUrl(site, url));
  if (id === null) return null;
  const author = authorFields(row, context);
  const published = scalar(row.created_at, row.createdAt, row.published_at, row.publish_time, row.time, row.date);
  const parsedPublished = parsePublishedAt(published);
  const publishedDate = parsedPublished ? new Date(parsedPublished.milliseconds) : null;
  const validPublished = publishedDate ? publishedDate.toISOString() : null;
  const text = scalar(row.text, row.content, row.description, row.desc, row.title, row.excerpt);
  return {
    key: `${site}:${id}`, platform: site, id: String(id), url,
    author, sources: [{ mode: context.mode, query: context.query, topicId: context.topicId ?? null, requestedAuthor: context.requestedAuthor }],
    title: scalar(row.title, row.name), text, links: extractLinks(row),
    publishedAt: validPublished, publishedAtPrecision: parsedPublished?.precision ?? 'unknown',
    collectedAt: new Date().toISOString(),
    metrics: {
      likes: asMetric(numeric(row.likes, row.like_count, row.digg_count, row.voteup_count)),
      saves: asMetric(numeric(row.saves, row.collects, row.collect_count, row.favorite_count, row.bookmark_count)),
      comments: asMetric(numeric(row.comments, row.comment_count, row.replies)),
      shares: asMetric(numeric(row.shares, row.share_count, row.reposts, row.retweets)),
      views: asMetric(numeric(row.views, row.view_count, row.play_count, row.plays)),
    },
    evidence: [{ kind: 'post', path: '', completeness: row.text || row.content || row.description || row.desc ? 'full_text' : 'metadata_only' }],
    windowMatch: validPublished === null ? null : Date.now() >= publishedDate.getTime() && Date.now() - publishedDate.getTime() <= context.lookbackMs,
  };
}

function mergeCandidate(previous, incoming, runId) {
  const merged = previous ? { ...previous, ...incoming, metrics: { ...previous.metrics, ...incoming.metrics }, evidence: [...previous.evidence], sources: [...previous.sources] } : { ...incoming, firstSeenAt: incoming.collectedAt, evidence: [...incoming.evidence], sources: [...incoming.sources] };
  if (previous) {
    merged.firstSeenAt = previous.firstSeenAt;
    merged.sources = [...previous.sources];
    for (const source of incoming.sources) if (!merged.sources.some(existing => JSON.stringify(existing) === JSON.stringify(source))) merged.sources.push(source);
    merged.evidence = [...previous.evidence];
    for (const item of incoming.evidence) if (!merged.evidence.some(existing => existing.path === item.path && existing.kind === item.kind)) merged.evidence.push(item);
  }
  merged.links = [...new Set([...(previous?.links ?? []), ...(incoming.links ?? [])])];
  merged.lastSeenAt = incoming.collectedAt;
  merged.runIds = [...new Set([...(previous?.runIds ?? []), runId])];
  return merged;
}

function candidateForRun(item, state) {
  return {
    ...item,
    history: {
      delivered: state.delivered[item.key] ?? null,
      read: state.read[item.key] ?? null,
      feedback: state.feedback.filter(row => row.itemKey === item.key),
    },
  };
}

export function buildRequests(config) {
  const requests = [];
  const searchPlatforms = new Set(config.sources.filter(item => item.enabled).map(item => item.site));
  if (config.discovery.outsideFollowing === true) {
    for (const site of config.discovery.platforms) searchPlatforms.add(site);
  }
  const topicTasks = [];
  const maxQueries = Math.max(0, ...config.topics.map(topic => topic.queries.length));
  for (let queryIndex = 0; queryIndex < maxQueries; queryIndex += 1) {
    for (const topic of config.topics) {
      const query = topic.queries.filter(Boolean)[queryIndex];
      if (query) topicTasks.push({ query, topicId: topic.id });
    }
  }
  for (const source of config.sources.filter(item => item.enabled)) {
    if (source.site === 'twitter' && source.mode === 'following_feed') {
      requests.push({ site: 'twitter', args: ['twitter', 'timeline', '--type', 'following', '--limit', String(config.budget.itemsPerCall), '-f', 'json'], context: { mode: source.mode, query: null, requestedAuthor: null } });
    } else if (source.site === 'bilibili' && source.mode === 'following_feed') {
      requests.push({ site: 'bilibili', args: ['bilibili', 'feed', '--limit', String(config.budget.itemsPerCall), '--pages', '1', '-f', 'json'], context: { mode: source.mode, query: null, requestedAuthor: null } });
    } else if (source.site === 'xiaohongshu' && source.mode === 'following_search') {
      for (const task of topicTasks) requests.push({ site: 'xiaohongshu', args: ['xiaohongshu', 'search', task.query, '--scope', 'following', '--sort', 'latest', '--publish-time', 'week', '--limit', String(config.budget.itemsPerCall), '-f', 'json'], context: { mode: source.mode, query: task.query, topicId: task.topicId, requestedAuthor: null } });
    } else {
      const command = source.site === 'twitter' ? 'tweets' : source.site === 'bilibili' ? 'feed' : 'user';
      for (const author of source.authors) {
        const args = source.site === 'twitter'
          ? ['twitter', command, author, '--limit', String(config.budget.itemsPerCall), '-f', 'json']
          : source.site === 'bilibili'
            ? ['bilibili', command, author, '--limit', String(config.budget.itemsPerCall), '-f', 'json']
            : ['xiaohongshu', command, author, '--limit', String(config.budget.itemsPerCall), '-f', 'json'];
        requests.push({ site: source.site, args, context: { mode: source.mode, query: null, requestedAuthor: author } });
      }
    }
  }
  if (config.discovery.outsideFollowing === true) {
    for (const site of searchPlatforms) {
      for (const task of topicTasks) {
        const args = site === 'twitter'
          ? ['twitter', 'search', task.query, '--product', 'live', '--limit', String(config.budget.itemsPerCall), '-f', 'json']
          : site === 'bilibili'
            ? ['bilibili', 'search', task.query, '--type', 'video', '--limit', String(config.budget.itemsPerCall), '-f', 'json']
            : ['xiaohongshu', 'search', task.query, '--scope', 'all', '--sort', 'latest', '--publish-time', 'week', '--limit', String(config.budget.itemsPerCall), '-f', 'json'];
        requests.push({ site, args, context: { mode: 'search', query: task.query, topicId: task.topicId, requestedAuthor: null } });
      }
    }
  }
  // 关注发现优先；同一阶段按平台交错，避免一个平台耗尽预算。
  const ordered = [];
  for (const outside of [false, true]) {
    const queues = new Map();
    for (const request of requests.filter(row => (row.context.mode === 'search') === outside)) {
      if (!queues.has(request.site)) queues.set(request.site, []);
      queues.get(request.site).push(request);
    }
    while ([...queues.values()].some(queue => queue.length)) {
      for (const queue of queues.values()) if (queue.length) ordered.push(queue.shift());
    }
  }
  return ordered;
}

function runOpenCLI(args, timeoutSeconds) {
  return new Promise((resolve, reject) => {
    const child = spawn('opencli', args, { shell: false, stdio: ['ignore', 'pipe', 'ignore'] });
    let stdout = '';
    let exceeded = null;
    const timer = setTimeout(() => { exceeded = '超时'; child.kill('SIGTERM'); }, timeoutSeconds * 1000);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if (stdout.length > 20 * 1024 * 1024) { exceeded = '输出超过 20 MiB'; child.kill('SIGTERM'); }
    });
    child.once('error', error => {
      clearTimeout(timer);
      const failure = new Error(`无法启动 OpenCLI: ${error.message}`);
      failure.category = 'opencli_unavailable';
      reject(failure);
    });
    child.once('close', code => {
      clearTimeout(timer);
      if (exceeded) {
        const failure = new Error(`OpenCLI ${exceeded}（退出码 ${code}）`);
        failure.category = exceeded === '超时' ? 'timeout' : 'output_limit';
        return reject(failure);
      }
      if (code === 66) return resolve({ stdout: '', payload: [] });
      if (code === 77) {
        const failure = new Error('OpenCLI 需要登录认证，请在对应平台登录后再运行');
        failure.category = 'authentication_required';
        return reject(failure);
      }
      if (code === 69) {
        const failure = new Error('OpenCLI Browser Bridge 未连接，请先运行 opencli doctor');
        failure.category = 'bridge_unavailable';
        return reject(failure);
      }
      if (code !== 0) {
        const failure = new Error(`OpenCLI 退出码 ${code}`);
        failure.category = 'command_failed';
        return reject(failure);
      }
      try { resolve({ stdout, payload: JSON.parse(stdout) }); }
      catch (error) {
        const failure = new Error(`OpenCLI 返回内容不是有效 JSON: ${error.message}`);
        failure.category = 'invalid_json';
        reject(failure);
      }
    });
  });
}

function safePath(base, candidate) {
  const target = path.resolve(base, candidate);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error('输入路径必须位于对应 run 目录内');
  return target;
}

function newRunId() { return `${new Date().toISOString().replaceAll(':', '').replaceAll('.', '-')}-${randomUUID().slice(0, 8)}`; }

async function collect(config, configPath, dataDir) {
  const requests = buildRequests(config);
  if (!requests.length) throw new Error('当前配置没有可执行的采集请求；为相关主题填写关键词或指定作者');
  const runId = newRunId();
  const runDir = path.join(dataDir, 'runs', runId);
  await ensureDir(path.join(runDir, 'raw'));
  const statePath = path.join(dataDir, 'state.json');
  const state = await readJson(statePath, { version: 1, items: {}, delivered: {}, read: {}, feedback: [] });
  const scheduled = requests.slice(0, config.budget.maxSourceCalls);
  const report = {
    version: 1, runId, startedAt: new Date().toISOString(), configPath,
    status: requests.length > scheduled.length ? 'partial' : 'success',
    requested: requests.length, attempted: 0, successful: 0, failed: [], omittedRequests: Math.max(0, requests.length - scheduled.length),
    candidateRows: 0, normalized: 0, missingIds: 0, duplicatesInRun: 0, existingItemsUpdated: 0,
    outsideWindow: 0, unknownWindow: 0, approximateWindowCandidates: 0, currentWindowCandidates: 0, skippedUnavailable: 0, budget: { sourceLimit: config.budget.maxSourceCalls, sourceCallsUsed: 0, detailLimit: config.budget.maxDetailCalls, detailCallsUsed: 0 },
    notes: [],
  };
  const runItems = {};
  const runSeen = new Set();
  const blockedSites = new Map();
  let bridgeBlocked = false;
  const lookbackMs = config.window.lookbackHours * 60 * 60 * 1000;
  for (let index = 0; index < scheduled.length; index += 1) {
    const request = scheduled[index];
    const blockedReason = bridgeBlocked ? 'bridge_unavailable' : blockedSites.get(request.site);
    if (blockedReason) {
      report.omittedRequests += 1;
      report.skippedUnavailable += 1;
      report.notes.push({ site: request.site, command: request.args.slice(1, 3).join(' '), query: request.context.query, topicId: request.context.topicId ?? null, requestedAuthor: request.context.requestedAuthor, result: 'skipped', reason: blockedReason });
      await atomicJson(path.join(runDir, 'report.json'), report);
      continue;
    }
    report.attempted += 1;
    report.budget.sourceCallsUsed += 1;
    const receipt = { site: request.site, command: request.args.slice(1, 3).join(' '), query: request.context.query, topicId: request.context.topicId ?? null, requestedAuthor: request.context.requestedAuthor, requestedAt: new Date().toISOString(), result: 'running' };
    report.notes.push(receipt);
    await atomicJson(path.join(runDir, 'report.json'), report);
    try {
      const result = await runOpenCLI(request.args, config.budget.timeoutSeconds);
      const rawPath = `raw/${String(index + 1).padStart(3, '0')}-${request.site}.json`;
      await writeFile(safePath(runDir, rawPath), `${JSON.stringify(result.payload, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
      const rows = extractRows(result.payload);
      report.candidateRows += rows.length;
      let requestNormalized = 0;
      for (const row of rows) {
        const context = { ...request.context, lookbackMs };
        const item = normalizeItem(request.site, row, context);
        if (!item) { report.missingIds += 1; continue; }
        const evidencePath = rawPath;
        item.evidence[0].path = evidencePath;
        item.evidence[0].runId = runId;
        if (item.windowMatch === false) report.outsideWindow += 1;
        else if (item.windowMatch === null) report.unknownWindow += 1;
        else {
          report.currentWindowCandidates += 1;
          if (item.publishedAtPrecision === 'approximate') report.approximateWindowCandidates += 1;
        }
        if (runSeen.has(item.key)) report.duplicatesInRun += 1;
        runSeen.add(item.key);
        const prior = state.items[item.key];
        if (prior) report.existingItemsUpdated += 1;
        state.items[item.key] = mergeCandidate(prior, item, runId);
        if (item.windowMatch !== false) runItems[item.key] = state.items[item.key];
        requestNormalized += 1;
        report.normalized += 1;
      }
      receipt.result = rows.length === 0 ? 'empty' : 'success';
      receipt.rows = rows.length;
      receipt.normalized = requestNormalized;
      report.successful += 1;
      receipt.result = receipt.result === 'empty' ? 'empty' : 'success';
    } catch (error) {
      receipt.result = 'failed';
      receipt.error = error.message;
      receipt.category = error.category ?? 'unknown';
      report.failed.push({ site: request.site, command: receipt.command, category: receipt.category, error: error.message });
      if (receipt.category === 'authentication_required' || receipt.category === 'bridge_unavailable') blockedSites.set(request.site, receipt.category);
      if (receipt.category === 'bridge_unavailable' || receipt.category === 'opencli_unavailable') bridgeBlocked = true;
    }
    await atomicJson(path.join(runDir, 'report.json'), report);
    await atomicJson(path.join(runDir, 'items.json'), Object.values(runItems).map(item => candidateForRun(item, state)));
    await atomicJson(statePath, state);
  }
  if (report.failed.length && report.successful) report.status = 'partial';
  else if (!report.successful && scheduled.length) report.status = 'failed';
  report.finishedAt = new Date().toISOString();
  report.uniqueInRun = runSeen.size;
  await atomicJson(path.join(runDir, 'report.json'), report);
  return { runId, runDir, report };
}

function valueMap(payload) {
  if (Array.isArray(payload)) {
    return Object.fromEntries(payload.filter(row => row && typeof row === 'object').map(row => [row.field ?? row.key ?? row.name, row.value ?? row.text]).filter(([key]) => key));
  }
  return payload && typeof payload === 'object' ? payload : { text: payload };
}

async function detail(config, dataDir, runId, itemKey, kind) {
  const runDir = safePath(path.join(dataDir, 'runs'), runId);
  const runBase = path.join(dataDir, 'runs');
  if (!runDir.startsWith(`${runBase}${path.sep}`)) throw new Error('无效 run ID');
  const statePath = path.join(dataDir, 'state.json');
  const state = await readJson(statePath, { version: 1, items: {}, delivered: {}, read: {}, feedback: [] });
  const item = state.items[itemKey];
  if (!item) throw new Error(`找不到候选 ${itemKey}`);
  if (!item.runIds?.includes(runId)) throw new Error(`候选 ${itemKey} 不属于 run ${runId}`);
  if (!['post', 'comments', 'subtitle', 'all'].includes(kind)) throw new Error('kind 必须是 post、comments、subtitle 或 all');
  if (!item.url) throw new Error('候选没有可用于深读的原始 URL');
  const [site, id] = itemKey.split(':', 2);
  const commands = [];
  if (['post', 'comments', 'all'].includes(kind) && site === 'twitter') commands.push({ kind: 'thread', args: ['twitter', 'thread', id, '--limit', String(config.budget.commentsPerItem), '-f', 'json'] });
  if ((kind === 'post' || kind === 'all') && site === 'bilibili') {
    const videoId = id.match(/BV[a-zA-Z0-9]+/)?.[0] ?? item.url.match(/BV[a-zA-Z0-9]+/)?.[0];
    commands.push({ kind: 'post', args: videoId ? ['bilibili', 'video', videoId, '-f', 'json'] : ['bilibili', 'feed-detail', id, '-f', 'json'] });
  }
  if ((kind === 'post' || kind === 'all') && site === 'xiaohongshu') commands.push({ kind: 'post', args: ['xiaohongshu', 'note', item.url, '-f', 'json'] });
  if ((kind === 'comments' || kind === 'all') && site === 'bilibili') {
    const videoId = id.match(/BV[a-zA-Z0-9]+/)?.[0] ?? item.url.match(/BV[a-zA-Z0-9]+/)?.[0];
    if (videoId) commands.push({ kind: 'comments', args: ['bilibili', 'comments', videoId, '--limit', String(Math.min(50, config.budget.commentsPerItem)), '-f', 'json'] });
    else if (kind === 'comments') throw new Error('该 B 站动态没有视频 BV 号，当前 OpenCLI 不支持读取它的评论');
  }
  if ((kind === 'comments' || kind === 'all') && site === 'xiaohongshu') commands.push({ kind: 'comments', args: ['xiaohongshu', 'comments', item.url, '--limit', String(Math.min(50, config.budget.commentsPerItem)), '-f', 'json'] });
  if ((kind === 'subtitle' || kind === 'all') && site === 'bilibili') {
    const videoId = id.match(/BV[a-zA-Z0-9]+/)?.[0] ?? item.url.match(/BV[a-zA-Z0-9]+/)?.[0];
    if (videoId) commands.push({ kind: 'subtitle', args: ['bilibili', 'subtitle', videoId, '-f', 'json'] });
    else if (kind === 'subtitle') throw new Error('该动态不是视频，不能读取视频字幕');
  }
  if (!commands.length) throw new Error(`来源 ${site} 不支持深读类型 ${kind}`);
  const notAvailable = kind === 'all' && site === 'xiaohongshu' ? ['subtitle']
    : kind === 'all' && site === 'bilibili' && !id.match(/BV[a-zA-Z0-9]+/) && !item.url.match(/BV[a-zA-Z0-9]+/) ? ['comments', 'subtitle']
      : kind === 'subtitle' && site !== 'bilibili' ? ['subtitle'] : [];
  const existingRun = await readJson(path.join(runDir, 'report.json'), null);
  if (!existingRun) throw new Error(`run ${runId} 不存在`);
  const used = existingRun.budget?.detailCallsUsed ?? 0;
  if (used + commands.length > config.budget.maxDetailCalls) throw new Error(`深读预算不足：已用 ${used}，本次需要 ${commands.length}，上限 ${config.budget.maxDetailCalls}`);
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    existingRun.budget.detailCallsUsed = (existingRun.budget.detailCallsUsed ?? 0) + 1;
    await atomicJson(path.join(runDir, 'report.json'), existingRun);
    const evidencePath = `raw/detail-${item.id}-${command.kind}-${Date.now()}.json`;
    try {
      const result = await runOpenCLI(command.args, config.budget.timeoutSeconds);
      await writeFile(safePath(runDir, evidencePath), `${JSON.stringify(result.payload, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
      item.links = [...new Set([...(item.links ?? []), ...extractLinks(result.payload)])];
      const threadPost = command.kind === 'thread' && Array.isArray(result.payload)
        ? result.payload.find(row => String(row.id ?? row.tweet_id ?? row.tweetId) === id) : null;
      const details = threadPost ?? valueMap(result.payload);
      if (command.kind === 'post' || command.kind === 'thread') {
        item.text = scalar(details.text, details.content, details.desc, details.description, item.text);
        item.title = scalar(details.title, item.title);
        item.metrics.likes = asMetric(numeric(details.likes, details.like_count, details.digg_count, details.voteup_count)) ?? item.metrics.likes;
        item.metrics.saves = asMetric(numeric(details.saves, details.collects, details.collect_count, details.favorite_count)) ?? item.metrics.saves;
        item.metrics.comments = asMetric(numeric(details.comments, details.comment_count)) ?? item.metrics.comments;
        item.metrics.views = asMetric(numeric(details.views, details.view_count, details.play_count)) ?? item.metrics.views;
      }
      item.evidence.push({ kind: command.kind, path: evidencePath, runId, completeness: command.kind === 'comments' || command.kind === 'subtitle' || command.kind === 'thread' ? 'partial' : 'full_text' });
      await atomicJson(path.join(runDir, 'detail.json'), { itemKey, addedAt: new Date().toISOString(), kind: command.kind, data: result.payload });
    } catch (error) {
      existingRun.failed.push({ site, command: command.args.slice(1, 3).join(' '), error: error.message });
      existingRun.status = existingRun.successful ? 'partial' : 'failed';
      await atomicJson(path.join(runDir, 'report.json'), existingRun);
      await atomicJson(statePath, state);
      throw new Error(`${command.kind} 深读失败（已计入预算）：${error.message}`);
    }
    await atomicJson(path.join(runDir, 'report.json'), existingRun);
    await atomicJson(statePath, state);
  }
  await atomicJson(path.join(runDir, 'items.json'), Object.values(Object.fromEntries(Object.entries(state.items).filter(([, value]) => value.runIds?.includes(runId)))).map(item => candidateForRun(item, state)));
  return { itemKey, details: commands.map(command => command.kind), notAvailable, budgetUsed: existingRun.budget.detailCallsUsed };
}

const SUPPORT_LINK_KINDS = new Set(['github', 'official_site', 'docs', 'demo', 'video', 'source']);

function validHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'https:'; }
  catch { return false; }
}

function markdownLabel(value) { return value.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]'); }
function markdownLink(label, url) { return `[${markdownLabel(label)}](<${url}>)`; }

async function record(config, dataDir, runId, inputArg) {
  const runDir = safePath(path.join(dataDir, 'runs'), runId);
  if (!await readJson(path.join(runDir, 'report.json'), null)) throw new Error(`run ${runId} 不存在`);
  const statePath = path.join(dataDir, 'state.json');
  const state = await readJson(statePath, { version: 1, items: {}, delivered: {}, read: {}, feedback: [] });
  const inputPath = path.resolve(inputArg);
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  if (!input || typeof input !== 'object' || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('输入 JSON 需要非空 items 数组');
  }
  const recommendationRows = input.items.filter(row => row?.kind === 'recommendation');
  if (recommendationRows.length > config.output.maxRecommendations) {
    throw new Error(`本次推荐 ${recommendationRows.length} 条，超过配置上限 ${config.output.maxRecommendations}`);
  }
  const recordedAt = new Date().toISOString();
  const recorded = [];
  const acceptedTopics = new Set(config.topics.map(topic => topic.id));
  for (const row of input.items) {
    if (!row || typeof row !== 'object' || typeof row.itemKey !== 'string' || !state.items[row.itemKey]) {
      throw new Error(`itemKey 缺失或候选不存在：${row?.itemKey ?? '(missing)'}`);
    }
    if (!state.items[row.itemKey].runIds?.includes(runId)) throw new Error(`候选 ${row.itemKey} 不属于 run ${runId}`);
    if (row.kind === 'recommendation') {
      if (!Array.isArray(row.topicIds) || typeof row.reason !== 'string' || !Array.isArray(row.evidencePaths) || !Array.isArray(row.limitations)) {
        throw new Error(`推荐 ${row.itemKey} 需要 topicIds、reason、evidencePaths 和 limitations`);
      }
      const decision = row.decision ?? 'recommendation';
      if (!['recommendation', 'pending', 'skip'].includes(decision)) throw new Error(`推荐 ${row.itemKey} 的 decision 无效`);
      if (row.topicIds.some(topicId => !acceptedTopics.has(topicId))) throw new Error(`推荐 ${row.itemKey} 引用了未配置的 topicId`);
      if (row.decision !== 'skip' && row.evidencePaths.length === 0) throw new Error(`推荐 ${row.itemKey} 缺少材料依据`);
      for (const reference of row.evidencePaths) {
        if (typeof reference !== 'string') throw new Error(`推荐 ${row.itemKey} 的依据路径无效`);
        await readFile(safePath(runDir, reference));
      }
      const supportingLinks = row.supportingLinks ?? [];
      if (!Array.isArray(supportingLinks)) throw new Error(`推荐 ${row.itemKey} 的 supportingLinks 必须是数组`);
      for (const link of supportingLinks) {
        if (!link || !SUPPORT_LINK_KINDS.has(link.kind) || typeof link.label !== 'string' || !link.label.trim() || !validHttpsUrl(link.url)) {
          throw new Error(`推荐 ${row.itemKey} 的支持链接需要有效类型、名称和 HTTPS URL`);
        }
        if (link.kind === 'github' && new URL(link.url).hostname.toLowerCase() !== 'github.com') {
          throw new Error(`推荐 ${row.itemKey} 标记为 GitHub 的链接必须指向 github.com`);
        }
        if (link.previewUrl !== undefined && !validHttpsUrl(link.previewUrl)) {
          throw new Error(`推荐 ${row.itemKey} 的预览需要有效 HTTPS URL`);
        }
      }
      if (decision === 'recommendation' && supportingLinks.length === 0) {
        throw new Error(`推荐 ${row.itemKey} 缺少可打开的具体内容支持链接`);
      }
      if (decision === 'recommendation' && row.contentType === 'technical' &&
          !supportingLinks.some(link => ['github', 'official_site', 'docs', 'demo'].includes(link.kind))) {
        throw new Error(`技术类推荐 ${row.itemKey} 必须提供 GitHub、官网、文档或演示链接`);
      }
      if (decision === 'recommendation' && (row.contentType === 'video' || /\/video\//.test(state.items[row.itemKey].url ?? '')) &&
          !supportingLinks.some(link => link.kind === 'video')) {
        throw new Error(`视频推荐 ${row.itemKey} 必须提供视频播放链接`);
      }
      if (decision === 'recommendation') {
        if (!['technical', 'video', 'workflow', 'article'].includes(row.contentType)) throw new Error(`推荐 ${row.itemKey} 需要明确 contentType`);
        for (const link of supportingLinks) {
          const reading = link.reading;
          if (!reading || !['page', 'playback', 'frames', 'subtitle'].includes(reading.method) ||
              ['evidencePath', 'observed', 'identityBasis', 'boundary', 'reviewedAt'].some(key => typeof reading[key] !== 'string' || !reading[key].trim()) ||
              !Number.isFinite(Date.parse(reading.reviewedAt))) {
            throw new Error(`推荐 ${row.itemKey} 的支持链接缺少完整阅读记录`);
          }
          const material = await readFile(safePath(runDir, reading.evidencePath), 'utf8');
          if (!material.trim() || material.trim() === '{}') throw new Error('阅读记录引用的材料为空');
          if (link.kind === 'video' && reading.playable !== true) throw new Error('视频推荐需要实际播放确认；封面或字幕不能代替');
        }
      }
      if (decision === 'recommendation') {
        const assessment = row.assessment;
        if (!assessment || !['ready', 'research', 'not_applicable', 'unknown'].includes(assessment.applicability) ||
            !['source_read', 'tried'].includes(assessment.verification) ||
            ['task', 'takeaway', 'novelty'].some(key => typeof assessment[key] !== 'string' || !assessment[key].trim())) {
          throw new Error(`推荐 ${row.itemKey} 缺少完整个人价值判断 assessment`);
        }
        if (assessment.verification === 'tried') {
          const usage = assessment.usage;
          if (!usage || ['evidencePath', 'scope', 'result', 'checkedAt'].some(key => typeof usage[key] !== 'string' || !usage[key].trim()) || !Number.isFinite(Date.parse(usage.checkedAt))) {
            throw new Error('实际使用验证需要独立使用记录 usage');
          }
          if (supportingLinks.some(link => link.reading.evidencePath === usage.evidencePath)) throw new Error('使用记录不能复用页面阅读材料');
          const material = await readFile(safePath(runDir, usage.evidencePath), 'utf8');
          if (!material.trim() || material.trim() === '{}') throw new Error('使用记录材料为空');
        }
      }
      state.delivered[row.itemKey] = { recordedAt, runId, topicIds: row.topicIds, contentType: row.contentType ?? null, assessment: row.assessment ?? null, decision, reason: row.reason, evidencePaths: row.evidencePaths, supportingLinks, limitations: row.limitations };
    } else if (row.kind === 'feedback') {
      if (!['read', 'saved_intent', 'used', 'skip'].includes(row.action) || typeof row.note !== 'string') {
        throw new Error(`反馈 ${row.itemKey} 需要有效 action 和 note`);
      }
      const feedback = { itemKey: row.itemKey, action: row.action, note: row.note, recordedAt, runId };
      state.feedback.push(feedback);
      if (row.action === 'read') state.read[row.itemKey] = { recordedAt, runId };
    } else throw new Error(`不支持记录类型：${row.kind}`);
    recorded.push(row.itemKey);
  }
  const existingRecommendations = await readJson(path.join(runDir, 'recommendations.json'), { items: [] });
  const recommendations = new Map((existingRecommendations.items ?? []).map(row => [row.itemKey, row]));
  for (const row of recommendationRows) recommendations.set(row.itemKey, row);
  if (recommendationRows.length) {
    const allRecommendations = [...recommendations.values()];
    await atomicJson(path.join(runDir, 'recommendations.json'), { version: 1, runId, items: allRecommendations, recordedAt });
    const lines = ['# 兴趣搜索推荐', '', `采集批次：${runId}`, ''];
    const effective = allRecommendations.filter(row => (row.decision ?? 'recommendation') === 'recommendation');
    const counts = config.topics.map(topic => ({ ...topic, count: effective.filter(row => row.topicIds.includes(topic.id)).length }));
    const report = await readJson(path.join(runDir, 'report.json'), {});
    lines.push(`- 有效推荐：${effective.length}；待核实：${allRecommendations.filter(row => row.decision === 'pending').length}`);
    lines.push(`- 兴趣覆盖：${counts.map(topic => `${topic.label}：${topic.count}`).join('；')}（多主题条目可重复计入）`);
    lines.push(`- 无有效推荐主题：${counts.filter(topic => !topic.count).map(topic => topic.label).join('、') || '无'}；这不代表没有采集或没有相关候选。`);
    lines.push(`- 采集覆盖：${report.successful ?? '未知'}次成功／${report.attempted ?? '未知'}次请求；候选${report.uniqueInRun ?? '未知'}条；失败${report.failed?.length ?? '未知'}次；省略${report.omittedRequests ?? '未知'}项。`, '');

    for (const row of allRecommendations) {
      const item = state.items[row.itemKey];
      const title = (item.title ?? item.text ?? row.itemKey).replace(/\s+/g, ' ').slice(0, 100);
      const metrics = Object.entries(item.metrics ?? {}).map(([name, metric]) => `${name}: ${metric === null ? '未知' : `${metric.raw}${metric.approximate ? '（约）' : ''}`}`).join('；');
      const decision = row.decision ?? 'recommendation';
      const section = decision === 'pending' ? '待核实' : decision === 'skip' ? '本次不推荐'
        : ({ ready: '现在可用', research: '值得研究', not_applicable: '暂不适用', unknown: '适用性未知' }[row.assessment?.applicability] ?? '推荐阅读');
      lines.push(`## ${section}：${title}`, '');
      for (const link of row.supportingLinks ?? []) {
        if (link.kind === 'video') {
          if (link.previewUrl) lines.push(`[![${markdownLabel(link.label)}](<${link.previewUrl}>)](<${link.url}>)`);
          lines.push(`- 视频播放：${markdownLink(link.label, link.url)}`, '');
        }
        else lines.push(`- 内容支持（${link.kind}）：${markdownLink(link.label, link.url)}`);
        if (link.reading) lines.push(`- 内容观察：${link.reading.observed}`, `- 对象对应：${link.reading.identityBasis}`, `- 阅读范围：${link.reading.method}；${link.reading.boundary}；${link.reading.reviewedAt}`, `- 内容材料：${markdownLink(link.reading.evidencePath, safePath(runDir, link.reading.evidencePath))}`);
      }
      const assessment = row.assessment;
      if (assessment) {
        const applicability = { ready: '现在可用', research: '值得研究', not_applicable: '暂不适用', unknown: '适用性未知' };
        lines.push(`- 适用性：${applicability[assessment.applicability] ?? '未记录'}`, `- 对应任务：${assessment.task}`, `- 点入所得：${assessment.takeaway}`, `- 信息增量：${assessment.novelty}`,
          `- 验证程度：${assessment.verification === 'tried' ? '有实际使用记录（仅限所述范围，不代表整体效果）' : '资料已阅读，未实际使用验证'}`);
        if (assessment.usage) lines.push(`- 使用范围与结果：${assessment.usage.scope}；${assessment.usage.result}；${assessment.usage.checkedAt}`, `- 使用记录：${markdownLink(assessment.usage.evidencePath, safePath(runDir, assessment.usage.evidencePath))}`);
      } else lines.push('- 个人价值与验证程度：未记录（历史条目不补推断）');
      const evidence = row.evidencePaths.map(reference => `\`${reference}\``).join('、') || '无';
      const topics = row.topicIds.map(topicId => config.topics.find(topic => topic.id === topicId)?.label ?? topicId).join('、') || '未标注';
      lines.push(`- 原内容：${item.url ?? '无'}`, `- 作者：${item.author?.name ?? item.author?.id ?? '未知'}`, `- 发布时间：${item.publishedAt ?? '未知'}`, `- 主题：${topics}`, `- 互动：${metrics || '未知'}`, `- 推荐理由：${row.reason}`, `- 依据：${evidence}`, `- 未确认：${row.limitations.join('；') || '未注明'}`, '');
    }
    await writeFile(path.join(runDir, 'digest.md'), `${lines.join('\n')}\n`, { mode: 0o600 });
  }
  const feedbackRows = state.feedback.filter(row => row.runId === runId);
  if (feedbackRows.length) await atomicJson(path.join(runDir, 'feedback.json'), { version: 1, runId, items: feedbackRows, recordedAt });
  const runItems = Object.values(Object.fromEntries(Object.entries(state.items).filter(([, item]) => item.runIds?.includes(runId))));
  await atomicJson(path.join(runDir, 'items.json'), runItems.map(item => candidateForRun(item, state)));
  await atomicJson(path.join(dataDir, 'state.json'), state);
  return { recorded, recordedAt };
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help || !command || command === 'help' || command === '--help' || command === '-h') { console.log(usage()); return; }
  if (!['collect', 'detail', 'record'].includes(command)) throw new Error(`未知操作 ${command}\n\n${usage()}`);
  const { config, configPath, dataDir } = await loadConfig(options.config);
  const result = await withLock(dataDir, async () => {
    if (command === 'collect') return collect(config, configPath, dataDir);
    const runId = requireString(options.run, 'run');
    if (command === 'detail') {
      const itemKey = requireString(options.id, 'id');
      const kind = requireString(options.kind, 'kind');
      return detail(config, dataDir, runId, itemKey, kind);
    }
    return record(config, dataDir, runId, requireString(options.input, 'input'));
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  console.error(`兴趣搜索失败：${error.message}`);
  process.exitCode = 1;
});
