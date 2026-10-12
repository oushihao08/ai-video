import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function IronFrame({ x, y, width, height, children, accent = '#283748' }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 18l30-20h${width - 50}l20 20v${height - 20}H0z`} fill="#182330" />
    <path d={`M0 18l30-20h${width - 50}l20 20H20z`} fill="#526172" />
    <path d={`M20 18h${width - 20}v${height - 18}H20z`} fill={accent} />
    <path d={`M0 18h20v${height - 18}H0z`} fill="#111a25" />
    <path d={`M28 9h${width - 48}v${height - 34}H28z`} fill="#1e2936" stroke="#91a0aa" strokeWidth="4" />
    {children}
  </g>;
}

function PaperPress({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const stage = shot.scene.data.stage;
  const handoffStart = cueFrame('s001', '刚印完', 'start') ?? 20;
  const handoffEnd = cueFrame('s001', '已经排好字', 'end') ?? durationFrames - 8;
  const handoff = ease((frame - handoffStart) / Math.max(1, handoffEnd - handoffStart));
  const typeStart = cueFrame('s002', '每个字', 'start') ?? 28;
  const typeEnd = cueFrame('s002', '放进铁框', 'end') ?? durationFrames - 10;
  const typeProgress = clamp((frame - typeStart) / Math.max(1, typeEnd - typeStart));
  const harden = clamp((frame - (cueFrame('s002', '烧硬', 'start') ?? typeStart + 70)) / 12);
  const printStart = cueFrame('s003', '印得多', 'start') ?? 78;
  const printProgress = clamp((frame - printStart) / Math.max(1, durationFrames - printStart));
  const blocks = [[712, 476], [769, 476], [826, 476], [883, 476], [940, 476], [997, 476]];
  const paperFrames = [0, 1, 2, 3, 4, 5, 6];

  const camera = stage === 2
    ? `translate(-90 -42) scale(1.16)`
    : stage === 1
      ? `translate(${interpolate(handoff, [0, 1], [10, -22])} 0)`
      : `translate(${interpolate(printProgress, [0, 1], [6, -8])} 0)`;
  const boardShift = stage === 1 ? interpolate(handoff, [0, 1], [0, 82]) : 0;
  const platenLift = stage === 1 ? interpolate(handoff, [0, 1], [0, -20]) : 0;

  return <AbsoluteFill style={{ backgroundColor: '#e8ddc7', overflow: 'hidden' }}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="cut-shadow" x="-30%" y="-30%" width="170%" height="190%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" />
          <feOffset dx="5" dy="11" />
          <feComponentTransfer><feFuncA type="linear" slope="0.42" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="paper-grain" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="7" r="1" fill="#9f8b6b" opacity="0.20" />
          <circle cx="17" cy="18" r="1.2" fill="#9f8b6b" opacity="0.14" />
        </pattern>
      </defs>
      <rect width="1280" height="720" fill="#e7d9bc" />
      <path d="M0 0h1280v174L0 252z" fill="#c7b48f" />
      <path d="M0 224L1188 112l150 542L98 746z" fill="#344150" />
      <path d="M0 224L1188 112l150 542L98 746z" fill="url(#paper-grain)" />
      <path d="M120 641L1145 544" stroke="#243140" strokeWidth="20" opacity="0.46" />

      <g transform={camera}>
        {/* Left press: paper leaves the plate after the final impression. */}
        <g transform={`translate(${boardShift} 0)`}>
          <IronFrame x={90} y={310} width={466} height={248} accent="#394959">
            <path d="M58 63l327-13 56 122-341 28z" fill="#eee2c8" filter="url(#cut-shadow)" />
            <path d="M58 63l327-13 56 122-341 28z" fill="url(#paper-grain)" />
            <g transform={`translate(0 ${platenLift})`} filter="url(#cut-shadow)">
              <path d="M42 42l341-28 53 30-340 33z" fill="#72808b" />
              <path d="M42 42l54 30v102l-54-28z" fill="#273441" />
              <path d="M96 72l340-28v101l-340 29z" fill="#475666" />
              <path d="M139 31l20-16h180l12 16z" fill="#202d3b" />
            </g>
          </IronFrame>
        </g>

        {/* Right frame, with a row of hard type pieces already set. */}
        <g transform={`translate(${-boardShift * 0.3} 0)`}>
          <IronFrame x={665} y={243} width={526} height={338} accent="#394959">
            {Array.from({ length: 24 }, (_, index) => {
              const column = index % 6;
              const row = Math.floor(index / 6);
              const x = 47 + column * 57;
              const y = 50 + row * 61;
              return <g key={`set-${index}`} transform={`translate(${x} ${y})`}>
                <path d="M0 0l8-6h33l-8 6z" fill="#d38b52" />
                <path d="M33 0l8-6v38l-8 6z" fill="#833f31" />
                <rect width="33" height="38" rx="2" fill="#bd6842" stroke="#733e34" strokeWidth="2" />
                <path d="M8 9h15M8 17h11M8 25h14" stroke="#f0bf82" strokeWidth="2" opacity="0.8" />
              </g>;
            })}
          </IronFrame>
        </g>

        {/* Cut-paper hand, pushing the frame; it leads the exchange. */}
        <g transform={`translate(${interpolate(handoff, [0, 1], [300, 356])} ${interpolate(handoff, [0, 1], [214, 198])}) rotate(${interpolate(handoff, [0, 1], [-7, 4])})`} filter="url(#cut-shadow)">
          <path d="M0 74L68 32l52-14 44 22-18 22 30 17-18 22 23 18-25 31-62-8-45 37-38-11z" fill="#bf6445" />
          <path d="M58 38l39-40q12-9 19 1l-19 48M91 45l39-48q13-7 18 3l-21 57M120 51l35-37q12-4 15 7l-20 47" fill="#d98560" stroke="#8d483a" strokeWidth="5" strokeLinejoin="round" />
          <path d="M5 84l39 10 17 40-30 10z" fill="#9a4a3c" />
          <path d="M0 136l-40 28v40l73-5 25-20-17-40z" fill="#283748" />
        </g>

        {/* New type pieces compress from soft clay orange into fired blocks. */}
        {stage === 2 && blocks.map(([x, y], index) => {
          const local = ease(typeProgress * 2.5 - index * 0.105);
          const incomingX = interpolate(local, [0, 1], [x - 260 + (index % 2) * 12, x]);
          const incomingY = interpolate(local, [0, 1], [y - 110, y]);
          const tilt = interpolate(local, [0, 1], [index % 2 ? 17 : -13, 0]);
          const fired = harden > 0.85;
          return <g key={`new-${index}`} transform={`translate(${incomingX} ${incomingY}) rotate(${tilt} 18 18) scale(${interpolate(local, [0, 0.72, 1], [0.68, 1.08, 1])})`} opacity={local} filter="url(#cut-shadow)">
            <path d="M0 0l10-8h40l-10 8z" fill={fired ? '#748392' : '#ed9a61'} />
            <path d="M40 0l10-8v40l-10 10z" fill={fired ? '#3d4b59' : '#a84f3c'} />
            <rect width="40" height="40" rx={fired ? 1 : 9} fill={fired ? '#9ca8ae' : '#d86d49'} stroke="#523b39" strokeWidth="3" />
            <path d="M9 11h19M9 20h15M9 29h18" stroke={fired ? '#364451' : '#f5bc83'} strokeWidth="2.2" opacity="0.92" />
          </g>;
        })}

        {/* After “印得多”, sheets emerge in a faster, visible succession. */}
        {stage === 3 && paperFrames.map(index => {
          const local = ease((frame - printStart - index * 7) / 18);
          const x = 230 + index * 19 + (1 - local) * 76;
          const y = 430 + index * 4 + (1 - local) * 66;
          return <g key={`sheet-${index}`} transform={`translate(${x} ${y}) rotate(-8)`} opacity={local} filter="url(#cut-shadow)">
            <path d="M0 0l405-35 104 116-412 38z" fill={index % 2 ? '#d9c9a7' : '#f4e8cb'} stroke="#907e63" strokeWidth="2" />
            <path d="M0 0l405-35 104 116-412 38z" fill="url(#paper-grain)" />
          </g>;
        })}
      </g>
    </svg>
  </AbsoluteFill>;
}

export default { PaperPress };
