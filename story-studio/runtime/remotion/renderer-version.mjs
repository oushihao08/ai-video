import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// A rendered file belongs to both its episode inputs and the renderer that interpreted them.
export function rendererFingerprint() {
  const files = ['cli.mjs', 'index.jsx', 'film.jsx', 'scenes.jsx', 'timeline.mjs', 'speech-cues.mjs', 'subtitle-cues.mjs', 'renderer-version.mjs', 'package-lock.json', '../shared/content-contract.mjs'];
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file).update('\0').update(readFileSync(new URL(file, import.meta.url))).update('\0');
  }
  return hash.digest('hex');
}
