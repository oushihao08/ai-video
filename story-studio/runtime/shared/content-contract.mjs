import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const hashJson = value => sha256(JSON.stringify(canonical(value)));

export function parseScriptMarkdown(markdown) {
  if (typeof markdown !== 'string') throw new TypeError('script must be Markdown text');
  const segments = [];
  const sentences = [];
  const deliveries = [];
  const segmentIds = new Set();
  const sentenceIds = new Set();
  let currentSegment;
  for (const [index, raw] of markdown.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || /^#(?!#)\s+/.test(line)) continue;
    const segment = /^##\s+\[([a-z][\w-]*)\]\s+(.+)$/.exec(line);
    if (segment) {
      if (segmentIds.has(segment[1])) throw new Error(`duplicate segment ID ${segment[1]} at line ${index + 1}`);
      currentSegment = { id: segment[1], title: segment[2] };
      segments.push(currentSegment);
      segmentIds.add(segment[1]);
      continue;
    }
    const sentence = /^\[([a-z][\w-]*)\]\s+(.+)$/.exec(line);
    if (sentence) {
      if (!currentSegment) throw new Error(`sentence before segment at line ${index + 1}`);
      if (sentenceIds.has(sentence[1])) throw new Error(`duplicate sentence ID ${sentence[1]} at line ${index + 1}`);
      sentences.push({ id: sentence[1], segmentId: currentSegment.id, text: sentence[2] });
      sentenceIds.add(sentence[1]);
      continue;
    }
    const delivery = /^>\s*表达\s+\[([a-z][\w-]*)\]：\s*(.+)$/.exec(line);
    if (delivery) {
      if (!sentenceIds.has(delivery[1])) throw new Error(`delivery references missing or later sentence ${delivery[1]} at line ${index + 1}`);
      if (deliveries.some(item => item.sentenceId === delivery[1])) throw new Error(`duplicate delivery for ${delivery[1]} at line ${index + 1}`);
      deliveries.push({ sentenceId: delivery[1], instruction: delivery[2] });
      continue;
    }
    throw new Error(`unrecognized script content at line ${index + 1}: ${line.slice(0, 80)}`);
  }
  if (!sentences.length) throw new Error('script has no spoken sentences');
  return { segments, sentences, deliveries };
}

export function contentDigest(parsed) {
  return hashJson({ segments: parsed.segments.map(({ id }) => id), sentences: parsed.sentences.map(({ id, segmentId, text }) => ({ id, segmentId, text })) });
}

export function deliveryDigest(parsed) {
  return hashJson(parsed.deliveries.map(({ sentenceId, instruction }) => ({ sentenceId, instruction })));
}

// Content review follows the meaning assigned to shots, not editorially neutral timing or canvas fields.
export function visualContentDigest(shots) {
  const unitFields = ['id', 'sentenceIds', 'newInformation', 'visualRole', 'sourceRef', 'sourceRefs', 'claimRefs'];
  const shotFields = ['id', 'unitId', 'startState', 'change', 'endState', 'syncIntent', 'sourceRef', 'sourceRefs', 'claimRefs'];
  const pick = (value, fields) => Object.fromEntries(fields.filter(key => value?.[key] !== undefined).map(key => [key, value[key]]));
  const sceneData = scene => {
    if (!scene) return null;
    if (scene.type === 'custom') return { type: scene.type, key: scene.data?.key };
    if (scene.type === 'video') return pick(scene.data, ['sourceFile', 'sourceInSeconds', 'sourceOutSeconds']);
    // Story and battle scene inputs describe narrative or spatial evidence, so keep their data in the review basis.
    return { type: scene.type, data: scene.data ?? {} };
  };
  return hashJson({
    units: (shots.units ?? []).map(unit => pick(unit, unitFields)),
    shots: (shots.shots ?? []).map(shot => ({ ...pick(shot, shotFields), scene: sceneData(shot.scene) })),
  });
}

export function validateReviewAuthority(record, currentBasis, { trustedUserFreeze = false } = {}) {
  if (!record || !currentBasis?.scriptSha256) return { valid: false, reason: 'missing record or current script digest' };
  if (record.type === 'user_frozen') {
    if (!trustedUserFreeze) return { valid: false, reason: 'user freeze has not been verified from trusted conversation' };
    if (!record.decisionRecord || record.scriptSha256 !== currentBasis.scriptSha256) return { valid: false, reason: 'user freeze is missing a decision record or matches an old script' };
    return { valid: true, kind: 'user_frozen' };
  }
  if (record.type !== 'independent_review' || record.status !== 'passed' || !Array.isArray(record.unresolved) || record.unresolved.length) {
    return { valid: false, reason: 'independent review is not passed with no unresolved issues' };
  }
  const basis = record.basis;
  if (!basis?.scriptSha256 || !basis.rulesSha256 || !currentBasis.rulesSha256) return { valid: false, reason: 'review basis is incomplete' };
  if (hashJson(basis) !== hashJson(currentBasis)) return { valid: false, reason: 'review basis does not match current inputs' };
  return { valid: true, kind: 'independent_review' };
}
