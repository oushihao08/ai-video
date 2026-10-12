const ignored = /[\p{P}\s]/u;
const boundary = /[，。！？；：,.!?;:]/u;
const opening = /[“‘「『（(《〈【\[]/u;

// Keep the script as the text source; alignment supplies boundaries, never text replacements.
export function buildSubtitleCues(sentence, timedWords) {
  const fallback = reason => ({
    cues: [{ ...sentence, precision: sentence.precision === 'word' ? 'sentence' : (sentence.precision ?? 'sentence') }],
    limitation: { sentenceId: sentence.id, reason, message: '仅有完整口播单元可用的字幕时间，不能保证段内揭示时机；需补可靠对齐。' },
  });
  if (!timedWords.length) return fallback('missing-word-alignment');
  const characters = Array.from(sentence.text);
  const spoken = characters.flatMap((character, index) => ignored.test(character) ? [] : [{ character, index }]);
  const words = timedWords.map(word => ({ ...word, characters: Array.from(String(word.text ?? '')).filter(character => !ignored.test(character)) })).filter(word => word.characters.length);
  if (!words.length || words.flatMap(word => word.characters).join('') !== spoken.map(item => item.character).join('')) return fallback('word-text-mismatch');
  if (words.some((word, index) => !Number.isFinite(word.startFrame) || !Number.isFinite(word.endFrame) || word.startFrame < 0 || word.endFrame < word.startFrame || (index > 0 && word.startFrame < words[index - 1].endFrame))) return fallback('word-timing-not-separable');

  let characterCursor = 0;
  let textCursor = 0;
  const pieces = words.map(word => {
    characterCursor += word.characters.length;
    let end = spoken[characterCursor - 1].index + 1;
    // Closing punctuation stays with the preceding phrase; opening quotes stay with the next.
    while (end < characters.length && ignored.test(characters[end]) && !opening.test(characters[end])) end += 1;
    const text = characters.slice(textCursor, end).join('');
    textCursor = end;
    return { text, startFrame: word.startFrame, endFrame: word.endFrame };
  });
  pieces.at(-1).text += characters.slice(textCursor).join('');
  const cues = [];
  let current = null;
  for (const piece of pieces) {
    if (current && current.endFrame > current.startFrame && Array.from(current.text + piece.text).length > 24) {
      cues.push(current);
      current = null;
    }
    current = current
      ? { ...current, text: current.text + piece.text, endFrame: piece.endFrame }
      : { id: sentence.id, sentenceId: sentence.id, text: piece.text, startFrame: piece.startFrame, endFrame: piece.endFrame, precision: 'word' };
    // A genuine sub-frame word can round to zero frames. Keep it in its phrase
    // until real neighbouring boundaries provide a displayable interval.
    if (boundary.test(piece.text) && current.endFrame > current.startFrame) {
      cues.push(current);
      current = null;
    }
  }
  if (current) {
    if (current.endFrame > current.startFrame) cues.push(current);
    else if (cues.length) {
      const previous = cues.at(-1);
      previous.text += current.text;
      previous.endFrame = current.endFrame;
    } else return fallback('phrase-timing-not-separable');
  }
  const limitation = cues.some(cue => Array.from(cue.text).length > 24)
    ? { sentenceId: sentence.id, reason: 'long-indivisible-word', message: '对齐返回的单词块超过字幕长度，未伪造块内时间；需补更细对齐。' }
    : null;
  return { cues, limitation };
}
