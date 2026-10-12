import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));

function MiniatureRelay({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const progress = clamp(frame / Math.max(1, durationFrames - 1));
  const stage = shot.scene.data.stage;
  const handoffStart = cueFrame('s001', '刚印完', 'start') ?? 0;
  const handoffEnd = cueFrame('s001', '已经排好字', 'end') ?? durationFrames - 1;
  const handoffProgress = clamp((frame - handoffStart) / Math.max(1, handoffEnd - handoffStart));
  const focus = stage === 1 ? '58% 52%' : stage === 2 ? '79% 45%' : '83% 18%';
  const scale = stage === 1
    ? interpolate(progress, [0, 1], [1.02, 1.14])
    : stage === 2
      ? interpolate(progress, [0, 1], [1.08, 1.2])
      : interpolate(progress, [0, 1], [1.1, 1.18]);
  const shift = stage === 1
    ? interpolate(handoffProgress, [0, 1], [2, -1])
    : stage === 2
      ? interpolate(progress, [0, 1], [0, -3])
      : interpolate(progress, [0, 1], [-1, -4]);

  const typeStart = cueFrame('s002', '每个字', 'start') ?? Math.round(durationFrames * 0.18);
  const typeEnd = cueFrame('s002', '放进铁框', 'end') ?? Math.round(durationFrames * 0.75);
  const typeProgress = clamp((frame - typeStart) / Math.max(1, typeEnd - typeStart));
  const stackStart = cueFrame('s003', '印得多', 'start') ?? Math.round(durationFrames * 0.45);
  const stackProgress = clamp((frame - stackStart) / Math.max(1, durationFrames - stackStart));
  // Place the added type inside the existing iron frame, so the action reads
  // as pieces landing on the work surface rather than floating UI markers.
  const tiles = [[826, 299], [873, 284], [920, 270], [844, 342], [891, 327], [938, 312]];

  return <AbsoluteFill style={{ backgroundColor: '#201810', overflow: 'hidden' }}>
    <Img
      src={staticFile('miniature-workbench-keyframe.png')}
      style={{
        position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
        objectPosition: focus, transform: `translateX(${shift}%) scale(${scale})`,
      }}
    />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #130f0a66, transparent 45%, #130f0a33)' }} />
    {stage === 2 && <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <filter id="block-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="5" />
          <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {tiles.map(([x, y], index) => {
        const local = clamp(typeProgress * 2.8 - index * 0.12);
        const offsetX = interpolate(local, [0, 1], [64 + (index % 2) * 12, 0]);
        const offsetY = interpolate(local, [0, 1], [-68, 0]);
        const rotate = interpolate(local, [0, 1], [index % 2 ? 14 : -12, 0]);
        const settle = interpolate(local, [0, 0.72, 1], [0.82, 1.08, 1]);
        return <g key={index} transform={`translate(${x + offsetX} ${y + offsetY}) rotate(${rotate} 18 18) scale(${settle})`} opacity={0.98 * local} filter="url(#block-shadow)">
          <path d="M0 0l11-8h36l-11 8z" fill="#d4a475" />
          <path d="M36 0l11-8v36l-11 11z" fill="#674732" />
          <rect x="0" y="0" width="36" height="36" rx="2" fill="#ae754c" stroke="#39291e" strokeWidth="2" />
        </g>;
      })}
    </svg>}
    {stage === 3 && <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <filter id="paper-shadow" x="-20%" y="-30%" width="150%" height="170%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dy="7" />
          <feComponentTransfer><feFuncA type="linear" slope="0.46" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0, 1, 2, 3, 4, 5].map(index => {
        const local = clamp(stackProgress * 1.55 - index * 0.13);
        const x = 1050 + index * 7 + (1 - local) * 42;
        const y = 35 - index * 4 + (1 - local) * 10;
        return <g key={index} opacity={local} transform={`translate(${x - 1050} ${y - 35})`} filter="url(#paper-shadow)">
          <path d="M1050 35l176-24 112 55-174 39z" fill={index % 2 ? '#d8ccb6' : '#eee4d1'} stroke="#ad9b7e" strokeWidth="1.5" />
        </g>;
      })}
    </svg>}
    <div style={{ position: 'absolute', top: 20, left: 24, padding: '7px 12px', background: '#17110dcc', color: '#f4ead8', font: '16px PingFang SC, sans-serif', letterSpacing: '0.04em' }}>工序示意 · 微缩片场</div>
  </AbsoluteFill>;
}

export default { MiniatureRelay };
