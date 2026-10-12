import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { extractLinks, buildRequests } from '../scripts/search.mjs';

const scriptPath = fileURLToPath(new URL('../scripts/search.mjs', import.meta.url));

async function fixture({ platform = 'twitter', id = 'post-1', url = 'https://x.com/user/status/1', topicId = 'tools' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'interest-search-'));
  const runId = 'run-test';
  const dataDir = path.join(root, 'data');
  const runDir = path.join(dataDir, 'runs', runId);
  await mkdir(path.join(runDir, 'raw'), { recursive: true });
  await writeFile(path.join(runDir, 'report.json'), JSON.stringify({ runId }));
  await writeFile(path.join(runDir, 'raw', 'source.json'), JSON.stringify({ text: 'Fixture material, not a live web verification' }));
  const itemKey = `${platform}:${id}`;
  await writeFile(path.join(dataDir, 'state.json'), JSON.stringify({
    version: 1,
    items: { [itemKey]: { key: itemKey, platform, id, url, title: 'Test item', text: 'Test content', author: {}, metrics: {}, evidence: [], runIds: [runId] } },
    delivered: {}, read: {}, feedback: [],
  }));
  const configPath = path.join(root, 'config.json');
  await writeFile(configPath, JSON.stringify({
    version: 1,
    topics: [{ id: topicId, label: 'Test topic', queries: [] }],
    sources: [{ site: 'twitter', enabled: true, mode: 'following_feed', authors: [] }],
    window: { lookbackHours: 24 },
    budget: { maxSourceCalls: 1, itemsPerCall: 1, maxDetailCalls: 1, commentsPerItem: 1, timeoutSeconds: 5 },
    discovery: { outsideFollowing: false, platforms: [] },
    output: { maxRecommendations: 5, dataDir: './data' },
  }));
  const inputPath = path.join(root, 'recommendations.json');
  const baseRow = { kind: 'recommendation', itemKey, topicIds: [topicId], decision: 'recommendation', contentType: 'technical', assessment: assessment(), reason: 'Concrete value', evidencePaths: ['raw/source.json'], limitations: [] };
  async function record(row) {
    await writeFile(inputPath, JSON.stringify({ version: 1, items: [row] }));
    return spawnSync(process.execPath, [scriptPath, 'record', '--config', configPath, '--run', runId, '--input', inputPath], { encoding: 'utf8' });
  }
  return {
    root, runId, runDir, itemKey, baseRow, record,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test('rejects technical recommendations without a direct project or official resource link', async () => {
  const fx = await fixture();
  try {
    const row = { ...fx.baseRow, supportingLinks: [{ kind: 'source', label: 'Social post', url: 'https://example.com/post' }] };
    delete row.decision;
    const result = await fx.record(row);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /GitHub、官网、文档或演示链接/);
  } finally {
    await fx.cleanup();
  }
});

test('shows a direct GitHub project link before the recommendation reason', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, supportingLinks: [{ reading: reading(), kind: 'github', label: 'Project repository', url: 'https://github.com/example/project' }] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.ok(digest.indexOf('[Project repository](<https://github.com/example/project>)') < digest.indexOf('- 推荐理由：'));
  } finally {
    await fx.cleanup();
  }
});

test('accepts a reviewed playable video without a cover', async () => {
  const fx = await fixture({ platform: 'bilibili', id: 'BV1234567890', url: 'https://www.bilibili.com/video/BV1234567890', topicId: 'video' });
  try {
    const result = await fx.record({ ...fx.baseRow, contentType: 'video', supportingLinks: [{ reading: reading(true), kind: 'video', label: 'Watch', url: 'https://www.bilibili.com/video/BV1234567890' }] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.ok(!digest.includes('undefined'));
    assert.match(digest, /阅读范围/);
  } finally {
    await fx.cleanup();
  }
});

test('renders a video preview linked to its playable source', async () => {
  const fx = await fixture({ platform: 'bilibili', id: 'BV1234567890', url: 'https://www.bilibili.com/video/BV1234567890', topicId: 'video' });
  try {
    const result = await fx.record({ ...fx.baseRow, contentType: 'video', supportingLinks: [{ reading: reading(true), kind: 'video', label: 'Watch the AI video workflow', url: 'https://www.bilibili.com/video/BV1234567890', previewUrl: 'https://example.com/cover.jpg' }] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.match(digest, /\[!\[Watch the AI video workflow\]\(<https:\/\/example\.com\/cover\.jpg>\)\]\(<https:\/\/www\.bilibili\.com\/video\/BV1234567890>\)/);
  } finally {
    await fx.cleanup();
  }
});

function reading(video = false) {
  return { evidencePath: 'raw/source.json', method: video ? 'playback' : 'page', observed: 'Fixture describes a concrete capability', identityBasis: 'Fixture names the same object', boundary: video ? '00:10–00:20 only' : 'README capability section only', reviewedAt: '2026-10-12T10:00:00Z', ...(video ? { playable: true } : {}) };
}

test('rejects a syntactically valid project URL without reading evidence', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, supportingLinks: [{ kind: 'github', label: 'Project', url: 'https://github.com/example/project' }] });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /阅读记录/);
  } finally { await fx.cleanup(); }
});

test('content type controls evidence even when the configured topic is renamed', async () => {
  const fx = await fixture({ topicId: 'custom-topic' });
  try {
    const result = await fx.record({ ...fx.baseRow, supportingLinks: [{ reading: reading(), kind: 'source', label: 'Post', url: 'https://example.com/post' }] });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /GitHub、官网、文档或演示链接/);
  } finally { await fx.cleanup(); }
});

test('a cover and subtitle do not prove playback', async () => {
  const fx = await fixture({ topicId: 'custom-topic' });
  try {
    const result = await fx.record({ ...fx.baseRow, contentType: 'video', supportingLinks: [{ kind: 'video', label: 'Watch', url: 'https://example.com/video', previewUrl: 'https://example.com/cover.jpg', reading: { ...reading(), method: 'subtitle' } }] });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /播放确认/);
  } finally { await fx.cleanup(); }
});

test('extracts links from parent text, reply arrays and cards without dropping shortlinks', () => {
  assert.deepEqual(extractLinks([{ text: '官网：https://t.co/test。' }, { card: { url: 'https://github.com/team/project' }, text: 'https://t.co/test' }]), ['https://t.co/test', 'https://github.com/team/project']);
});

test('interleaves platforms and keeps outside discovery after following tasks', () => {
  const tasks = buildRequests({ sources: [
    { enabled: true, site: 'xiaohongshu', mode: 'following_search' },
    { enabled: true, site: 'twitter', mode: 'following_feed' },
  ], topics: [{ id: 'custom', queries: ['first', 'second'] }], budget: { itemsPerCall: 5 }, discovery: { outsideFollowing: true, platforms: [] } });
  assert.deepEqual(tasks.slice(0, 3).map(row => row.site), ['xiaohongshu', 'twitter', 'xiaohongshu']);
  assert.ok(tasks.slice(0, 3).every(row => row.context.mode !== 'search'));
  assert.ok(tasks.slice(3).every(row => row.context.mode === 'search'));
});

test('pending remains usable when the destination is not yet read', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, decision: 'pending', supportingLinks: [] });
    assert.equal(result.status, 0, result.stderr);
  } finally { await fx.cleanup(); }
});

function assessment() {
  return { applicability: 'research', task: 'Understand an agent workflow', takeaway: 'README and setup guidance', novelty: 'A new concrete tool, no prior familiarity assumed', verification: 'source_read' };
}

test('new recommendations need a personal value assessment', async () => {
  const fx = await fixture();
  try {
    const row = { ...fx.baseRow, supportingLinks: [{ reading: reading(), kind: 'github', label: 'Project', url: 'https://github.com/example/project' }] };
    delete row.assessment;
    const result = await fx.record(row);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /个人价值判断/);
  } finally { await fx.cleanup(); }
});

test('shows applicability and source-only verification without implying actual use', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, assessment: { ...assessment(), applicability: 'not_applicable' }, supportingLinks: [{ reading: reading(), kind: 'github', label: 'Project', url: 'https://github.com/example/project' }] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.match(digest, /暂不适用/);
    assert.match(digest, /资料已阅读，未实际使用验证/);
    assert.match(digest, /信息增量/);
    assert.match(digest, /Test topic：1/);
  } finally { await fx.cleanup(); }
});

test('actual-use verification requires a separate execution receipt', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, assessment: { ...assessment(), verification: 'tried' }, supportingLinks: [{ reading: reading(), kind: 'github', label: 'Project', url: 'https://github.com/example/project' }] });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /使用记录/);
  } finally { await fx.cleanup(); }
});

test('pending does not count as topic coverage', async () => {
  const fx = await fixture();
  try {
    const result = await fx.record({ ...fx.baseRow, decision: 'pending', supportingLinks: [] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.match(digest, /Test topic：0/);
    assert.match(digest, /无有效推荐主题：Test topic/);
  } finally { await fx.cleanup(); }
});

test('accepts a scoped usage receipt and displays its actual result', async () => {
  const fx = await fixture();
  try {
    await writeFile(path.join(fx.runDir, 'raw', 'usage.txt'), 'Fixture execution log: operation failed; not a live test');
    const result = await fx.record({ ...fx.baseRow, assessment: { ...assessment(), verification: 'tried', usage: { evidencePath: 'raw/usage.txt', scope: 'One operation', result: 'Failed', checkedAt: '2026-10-12T10:00:00Z' } }, supportingLinks: [{ reading: reading(), kind: 'github', label: 'Project', url: 'https://github.com/example/project' }] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.match(digest, /One operation；Failed/);
    assert.match(digest, /仅限所述范围/);
  } finally { await fx.cleanup(); }
});

test('keeps historical recommendations without inventing their assessment', async () => {
  const fx = await fixture();
  try {
    const statePath = path.join(fx.root, 'data', 'state.json');
    const state = JSON.parse(await readFile(statePath, 'utf8'));
    const pendingKey = 'twitter:pending-2';
    state.items[pendingKey] = { ...state.items[fx.itemKey], key: pendingKey, id: 'pending-2' };
    await writeFile(statePath, JSON.stringify(state));
    const old = { ...fx.baseRow, supportingLinks: [] };
    delete old.assessment;
    await writeFile(path.join(fx.runDir, 'recommendations.json'), JSON.stringify({ items: [old] }));
    const result = await fx.record({ ...fx.baseRow, itemKey: pendingKey, decision: 'pending', supportingLinks: [] });
    assert.equal(result.status, 0, result.stderr);
    const digest = await readFile(path.join(fx.runDir, 'digest.md'), 'utf8');
    assert.match(digest, /历史条目不补推断/);
  } finally { await fx.cleanup(); }
});
