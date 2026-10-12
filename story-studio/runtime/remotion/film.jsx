import React from 'react';
import { AbsoluteFill, Audio, Composition, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BattleScene, StoryScene } from './scenes.jsx';
import { localSpeechCuesForShot, phraseCueFrame } from './speech-cues.mjs';

function Subtitles({ items }) {
  const frame = useCurrentFrame();
  const current = items.find(item => frame >= item.startFrame && frame < item.endFrame);
  if (!current) return null;
  return <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: 14, padding: '8px 22px', background: '#111b20e8', color: '#fffdf1', fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif', fontSize: 30, textAlign: 'center', lineHeight: 1.2, borderRadius: 8 }}>{current.text}</div>;
}

export function createStoryRoot(customScenes = {}) {
  function Film({ timeline }) {
    return <AbsoluteFill style={{ background: '#151d22' }}>
      {timeline.shots.map(shot => <Sequence key={shot.id} from={shot.startFrame} durationInFrames={shot.durationFrames}>
        {shot.scene.type === 'battle'
          ? <BattleScene shot={shot} durationFrames={shot.durationFrames} />
          : shot.scene.type === 'video'
            ? <OffthreadVideo src={staticFile(shot.scene.data.publicFile)} trimBefore={shot.scene.data.sourceInFrame} muted={shot.scene.data.audioMode === 'muted'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : shot.scene.type === 'custom'
              ? renderCustomScene(customScenes, shot, timeline.speechCues)
              : <StoryScene shot={shot} durationFrames={shot.durationFrames} />}
      </Sequence>)}
      {timeline.placements.map((placement, index) => <Sequence key={`audio-${index}`} from={placement.timelineStartFrame} durationInFrames={placement.durationFrames}>
        <Audio src={staticFile(placement.publicFile)} trimBefore={placement.sourceInFrame} />
      </Sequence>)}
      <Subtitles items={timeline.subtitleCues ?? timeline.subtitles} />
    </AbsoluteFill>;
  }

  const Root = () => <Composition id="StoryStudio" component={Film} width={1280} height={720} fps={30} durationInFrames={30} defaultProps={{ timeline: { fps: 30, width: 1280, height: 720, durationInFrames: 30, shots: [], placements: [], subtitles: [] } }} calculateMetadata={({ props }) => ({ width: props.timeline.width, height: props.timeline.height, fps: props.timeline.fps, durationInFrames: props.timeline.durationInFrames })} />;
  return Root;
}

function renderCustomScene(customScenes, shot, speechCues) {
  const CustomScene = customScenes[shot.scene.data.key];
  if (typeof CustomScene !== 'function') throw new Error(`custom scene ${shot.scene.data.key} is not exported`);
  const speech = localSpeechCuesForShot(speechCues, shot);
  const cueFrame = (sentenceId, phrase, edge = 'start') => phraseCueFrame(speech, sentenceId, phrase, edge);
  return <CustomScene shot={shot} durationFrames={shot.durationFrames} speech={speech} cueFrame={cueFrame} />;
}
