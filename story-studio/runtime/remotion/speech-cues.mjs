const ignored = /[\s，。！？；：、“”‘’"'（）()《》〈〉,.!?;:…—\-]/u;

function normalizedCharacters(text, cue) {
  return Array.from(String(text)).filter(character => !ignored.test(character)).map(character => ({ character, cue }));
}

export function localSpeechCuesForShot(cues, shot) {
  return (cues ?? [])
    .filter(cue => cue.endFrame > shot.startFrame && cue.startFrame < shot.endFrame)
    .map(cue => ({
      ...cue,
      startFrame: Math.max(0, cue.startFrame - shot.startFrame),
      endFrame: Math.min(shot.endFrame, cue.endFrame) - shot.startFrame,
    }));
}

export function phraseCueFrame(cues, sentenceId, phrase, edge = 'start') {
  if (!['start', 'end'].includes(edge)) throw new Error(`unsupported phrase cue edge: ${edge}`);
  const target = Array.from(String(phrase)).filter(character => !ignored.test(character));
  if (!target.length) return null;
  const characters = (cues ?? [])
    .filter(cue => cue.kind === 'word' && cue.sentenceId === sentenceId)
    .flatMap(cue => normalizedCharacters(cue.text, cue));
  const at = characters.findIndex((item, index) => target.every((character, offset) => characters[index + offset]?.character === character));
  if (at < 0) return null;
  const matched = characters.slice(at, at + target.length);
  return edge === 'start' ? matched[0].cue.startFrame : matched.at(-1).cue.endFrame;
}
