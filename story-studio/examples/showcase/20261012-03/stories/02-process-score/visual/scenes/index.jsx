import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));

function GestureInk({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const progress = clamp(frame / Math.max(1, durationFrames - 1));
  const stage = shot.scene.data.stage;
  const handoffStart = cueFrame('s001', '刚印完', 'start') ?? 0;
  const handoffEnd = cueFrame('s001', '已经排好字', 'end') ?? durationFrames - 1;
  const handoffProgress = clamp((frame - handoffStart) / Math.max(1, handoffEnd - handoffStart));
  const scale = stage === 1
    ? interpolate(progress, [0, 1], [1.02, 1.12])
    : stage === 2
      ? interpolate(progress, [0, 1], [1.04, 1.17])
      : interpolate(progress, [0, 1], [1.05, 1.13]);
  const x = stage === 1
    ? interpolate(progress, [0, 1], [1, -2])
    : stage === 2
      ? interpolate(progress, [0, 1], [0, -3])
      : interpolate(progress, [0, 1], [-1, -4]);
  const inkStart = stage === 2
    ? cueFrame('s002', '每个字', 'start') ?? Math.round(durationFrames * 0.2)
    : cueFrame('s003', '印得多', 'start') ?? Math.round(durationFrames * 0.4);
  const inkEnd = stage === 2
    ? cueFrame('s002', '放进铁框', 'end') ?? durationFrames - 8
    : durationFrames - 1;
  const inkProgress = clamp((frame - inkStart) / Math.max(1, inkEnd - inkStart));

  return <AbsoluteFill style={{ backgroundColor: '#eee8dc', overflow: 'hidden' }}>
    <Img
      src={staticFile('gesture-drawing-keyframe.png')}
      style={{
        position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
        transform: `translateX(${x}%) scale(${scale})`, transformOrigin: stage === 1 ? '50% 50%' : '43% 57%',
      }}
    />
    <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {stage === 1 && <g opacity={0.72}>
        <path d="M100 620C270 565 340 520 420 454" fill="none" stroke="#17202b" strokeWidth="4" strokeLinecap="round" strokeDasharray="620" strokeDashoffset={620 * (1 - handoffProgress)} />
        <path d="M110 634C265 589 342 544 424 476" fill="none" stroke="#17202b" strokeWidth="2" strokeLinecap="round" strokeDasharray="590" strokeDashoffset={590 * (1 - handoffProgress)} />
      </g>}
      {stage === 2 && <g>
        <path d="M420 438C470 418 520 453 574 522" fill="none" stroke="#17202b" strokeWidth="6" strokeLinecap="round" strokeDasharray="360" strokeDashoffset={360 * (1 - inkProgress)} opacity="0.72" />
        <path d="M424 446C476 430 521 465 568 531" fill="none" stroke="#17202b" strokeWidth="2" strokeLinecap="round" strokeDasharray="342" strokeDashoffset={342 * (1 - inkProgress)} opacity="0.54" />
        {(() => {
          const arc = Math.sin(inkProgress * Math.PI) * -42;
          const px = interpolate(inkProgress, [0, 1], [420, 574]);
          const py = interpolate(inkProgress, [0, 1], [438, 522]) + arc;
          const turn = interpolate(inkProgress, [0, 1], [-18, 0]);
          return <g transform={`translate(${px} ${py}) rotate(${turn})`} opacity={clamp(inkProgress * 8)}>
            <ellipse cx="2" cy="31" rx="27" ry="8" fill="#101722" opacity={inkProgress * 0.32} />
            <path d="M-18-15L11-19L19-11L-10-7Z" fill="#b7ad9e" stroke="#17202b" strokeWidth="3" strokeLinejoin="round" />
            <path d="M-10-7L19-11L22 17L-7 22Z" fill="#e1d7c7" stroke="#17202b" strokeWidth="3" strokeLinejoin="round" />
            <path d="M19-11L27-3L30 23L22 17Z" fill="#8e877e" stroke="#17202b" strokeWidth="3" strokeLinejoin="round" />
            <path d="M-5-1L13-4M-4 5L14 2M-3 11L15 8M-2 17L16 14" stroke="#17202b" strokeWidth="1.5" opacity="0.68" />
            <path d="M-18-15l29-4 8 8-29 4z" fill="none" stroke="#17202b" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.72" />
          </g>;
        })()}
      </g>}
      {stage === 3 && <g>
        <path d="M160 510C342 462 511 490 671 428S975 341 1128 389" fill="none" stroke="#aa3f2e" strokeWidth="13" strokeLinecap="round" strokeDasharray="1120" strokeDashoffset={1120 * (1 - inkProgress)} opacity="0.8" />
        <path d="M179 535C390 491 504 518 688 455S948 383 1108 424" fill="none" stroke="#17202b" strokeWidth="3" strokeLinecap="round" strokeDasharray="1030" strokeDashoffset={1030 * (1 - inkProgress)} opacity="0.72" />
        <path d="M745 236Q907 203 1093 258" fill="none" stroke="#aa3f2e" strokeWidth="5" strokeLinecap="round" strokeDasharray="370" strokeDashoffset={370 * (1 - inkProgress)} opacity="0.72" />
      </g>}
    </svg>
    <div style={{ position: 'absolute', top: 20, left: 24, padding: '7px 12px', background: '#f8f3e7df', color: '#17202b', font: '16px PingFang SC, sans-serif', letterSpacing: '0.04em' }}>动作示意 · 炭笔跟拍</div>
  </AbsoluteFill>;
}

export default { GestureInk };
