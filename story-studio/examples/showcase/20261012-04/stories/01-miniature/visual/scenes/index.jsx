import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const step = value => Math.floor(value / 3) * 3;

function Knife({ progress, sharpened = false }) {
  const y = interpolate(progress, [0, 1], [0, 88]);
  const rotate = interpolate(progress, [0, 1], [-8, -1]);
  return <g transform={`translate(468 ${160 + y}) rotate(${rotate})`} filter="url(#soft-shadow)">
    <path d="M0 14L290 2l-7 32L12 53z" fill="#68727a" stroke="#34383d" strokeWidth="5" />
    <path d="M12 47L283 34l-15 18L22 69z" fill="#d8d6ce" />
    <path d="M-115 19L8 13L22 53L-103 66Q-123 59-115 19" fill="#7b4637" stroke="#4b302c" strokeWidth="5" />
    <path d="M-98 28L-10 23" stroke="#b97c5e" strokeWidth="7" strokeLinecap="round" />
    {sharpened && <path d="M20 64L267 49" stroke="#fff5d9" strokeWidth="4" opacity="0.85" />}
  </g>;
}

function OnionSlice({ compression = 0, cut = 0 }) {
  const rx = amount => 248 - compression * amount;
  const pinch = interpolate(cut, [0, 1], [0, 22]);
  return <g transform={`translate(632 456)`} filter="url(#soft-shadow)">
    <ellipse rx="268" ry="166" fill="#493b2e" opacity="0.16" transform="translate(5 17)" />
    <ellipse rx="264" ry="160" fill="#6e4734" stroke="#3d312c" strokeWidth="8" />
    <ellipse rx="248" ry="148" fill="#d8b47b" stroke="#a6794c" strokeWidth="6" />
    <g transform={`scale(${1 - compression * 0.11} ${1 + compression * 0.055})`}>
      <ellipse rx={rx(4)} ry="136" fill="#f3d7a2" stroke="#b18b60" strokeWidth="5" />
      <ellipse rx={rx(26)} ry="113" fill="#fff0ce" stroke="#d0a574" strokeWidth="5" />
      <ellipse rx={rx(48)} ry="91" fill="#edc895" stroke="#c58d5f" strokeWidth="5" />
      <ellipse rx={rx(69)} ry="69" fill="#fff0ce" stroke="#d7a674" strokeWidth="5" />
      <ellipse rx={rx(88)} ry="46" fill="#ebc18f" stroke="#c58d5f" strokeWidth="5" />
      <path d={`M-16 ${-pinch}Q0 -${40 + pinch} 17 -${pinch}L15 4Q0 17-15 5z`} fill="#d48e5c" opacity={0.55 + compression * 0.3} />
    </g>
    {Array.from({ length: 12 }, (_, i) => {
      const angle = i * Math.PI / 6;
      const x = Math.cos(angle) * 213;
      const y = Math.sin(angle) * 105;
      return <circle key={`cell-${i}`} cx={x} cy={y} r="5" fill="#f8e6c2" opacity="0.75" />;
    })}
    <path d="M-260 -7Q-268 6-257 21" fill="none" stroke="#fbf0d9" strokeWidth="11" strokeLinecap="round" opacity={1 - cut} />
  </g>;
}

function Mist({ progress, sparse = false, warm = false }) {
  const count = sparse ? 9 : 28;
  return <g>
    {Array.from({ length: count }, (_, i) => {
      const startX = 638 + (i % 7) * 12 - 36;
      const startY = 400 + Math.floor(i / 7) * 6;
      const drift = progress * (35 + (i % 5) * 11);
      const x = startX + Math.sin(i * 1.9) * drift * 0.75;
      const y = startY - drift - (i % 4) * 10;
      const opacity = clamp(progress * 1.35) * (0.75 - (i % 3) * 0.12);
      return <circle key={`mist-${i}`} cx={x} cy={y} r={2 + (i % 3)} fill={warm ? '#da995e' : '#eff4eb'} opacity={opacity} />;
    })}
  </g>;
}

function Droplets({ progress, sparse = false }) {
  const count = sparse ? 5 : 13;
  return <g>
    {Array.from({ length: count }, (_, i) => {
      const x = 646 + (i % 5) * 21 - 38 + Math.sin(i * 2.7) * progress * 22;
      const y = 393 - progress * (65 + (i % 4) * 20) + Math.floor(i / 5) * 9;
      const opacity = clamp(progress * 1.6) * (0.86 - (i % 3) * 0.12);
      const radius = 4 + (i % 4) * 1.5;
      return <g key={`drop-${i}`} opacity={opacity}>
        <circle cx={x} cy={y} r={radius} fill="#c8d9d1" stroke="#fff4dc" strokeWidth="1.5" />
        <ellipse cx={x - 1} cy={y - 2} rx={radius * 0.32} ry={radius * 0.19} fill="#fff9ec" opacity="0.8" />
      </g>;
    })}
  </g>;
}

function Irritant({ progress }) {
  return <g>
    {Array.from({ length: 8 }, (_, i) => {
      const travel = progress * (46 + (i % 4) * 13);
      const x = 664 + i * 5 + travel * 1.55;
      const y = 385 - travel * 1.04 + Math.sin(i * 2.2) * 8;
      return <g key={`irritant-${i}`} opacity={clamp(progress * 1.25)}>
        <circle cx={x} cy={y} r={2.2 + (i % 3) * 0.6} fill="#d98e43" />
        <path d={`M${x - 4} ${y + 5}q4 4 8 0`} stroke="#d98e43" strokeWidth="1.3" fill="none" opacity="0.65" />
      </g>;
    })}
  </g>;
}

function OnionMiniature({ shot, durationFrames, cueFrame }) {
  const frame = step(useCurrentFrame());
  const stage = shot.scene.data.stage;
  const pressAt = stage === 1 ? cueFrame?.('s001', '刀压进洋葱', 'start') ?? 8 : 8;
  const cutAt = stage === 2 ? cueFrame?.('s002', '刀刃穿过', 'start') ?? 12 : 18;
  const mistAt = stage === 2 ? cueFrame?.('s002', '先喷细雾', 'start') ?? 24 : 26;
  const dropsAt = stage === 2 ? cueFrame?.('s002', '再甩出液滴', 'start') ?? 48 : 48;
  const warmAt = stage === 3 ? cueFrame?.('s003', '含硫刺激物', 'start') ?? 20 : 26;
  const fastAt = stage === 4 ? cueFrame?.('s004', '切得越快', 'start') ?? 8 : 8;
  const sprayAt = stage === 4 ? cueFrame?.('s004', '喷出的液滴', 'start') ?? 48 : 48;

  const compression = stage === 1
    ? ease((frame - pressAt) / 44)
    : stage === 2
      ? ease((frame - cutAt) / 23)
      : stage === 4
        ? ease((frame - fastAt) / 30)
        : stage === 5
          ? ease((frame - 6) / 34)
        : 0.34;
  const knifeProgress = stage === 1
    ? ease((frame - pressAt) / 55)
    : stage === 2
      ? ease((frame - cutAt) / 34)
      : stage === 4
        ? ease((frame - fastAt) / 38)
        : stage === 5
          ? ease((frame - 6) / 48)
        : 0.82;
  const fineProgress = stage === 2
    ? clamp((frame - mistAt) / 25)
    : stage === 3
      ? clamp((frame - 8) / 24)
      : stage === 4
        ? clamp((frame - sprayAt) / 12)
        : stage === 5
          ? clamp((frame - 14) / 18)
        : 0;
  const dropProgress = stage === 2
    ? clamp((frame - dropsAt) / 23)
    : stage === 3
      ? clamp((frame - 25) / 24)
      : stage === 4
        ? clamp((frame - sprayAt - 5) / 24)
        : stage === 5
          ? clamp((frame - 32) / 22)
        : 0;

  return <AbsoluteFill style={{ backgroundColor: '#e8dfcf', overflow: 'hidden' }}>
    <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="soft-shadow" x="-35%" y="-35%" width="180%" height="190%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" />
          <feOffset dx="5" dy="9" />
          <feComponentTransfer><feFuncA type="linear" slope="0.28" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="board-grain" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M0 12Q13 7 36 13M-4 29Q17 22 39 28" stroke="#98794f" strokeWidth="1" opacity="0.18" fill="none" />
          <circle cx="26" cy="5" r="1.2" fill="#8c6b45" opacity="0.25" />
        </pattern>
        <radialGradient id="studio-light" cx="45%" cy="38%" r="68%">
          <stop offset="0" stopColor="#fff8e9" />
          <stop offset="1" stopColor="#c7b79f" />
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#studio-light)" />
      <path d="M0 594Q273 568 548 590T1280 576V720H0Z" fill="#8f7554" />
      <path d="M0 594Q273 568 548 590T1280 576V720H0Z" fill="url(#board-grain)" />
      <ellipse cx="640" cy="598" rx="370" ry="50" fill="#493c2e" opacity="0.18" />
      <g>
        <OnionSlice compression={compression} cut={knifeProgress} />
        <Knife progress={knifeProgress} sharpened={stage === 5} />
        <Mist progress={fineProgress} sparse={stage === 5} />
        <Droplets progress={dropProgress} sparse={stage === 5} />
        {stage === 3 && frame > warmAt && <>
          <path d="M670 377C746 326 806 292 885 261" stroke="#e2a35e" strokeWidth="2" strokeDasharray="5 12" opacity="0.65" fill="none" />
          <Irritant progress={clamp((frame - warmAt) / 30)} />
        </>}
      </g>
      <path d="M0 0h1280v18H0z" fill="#423931" opacity="0.08" />
    </svg>
  </AbsoluteFill>;
}

export default { OnionMiniature };
