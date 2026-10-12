import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from, to, t) => from + (to - from) * t;
const reveal = (frame, start, end) => ease((frame - start) / Math.max(1, end - start));

function Ground() {
  return <>
    <defs>
      <radialGradient id="wash-lilac" cx="47%" cy="43%" r="65%">
        <stop offset="0" stopColor="#a18b93" stopOpacity=".31" />
        <stop offset=".72" stopColor="#b8a6a3" stopOpacity=".12" />
        <stop offset="1" stopColor="#b8a6a3" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="wash-ochre" cx="45%" cy="55%" r="65%">
        <stop offset="0" stopColor="#b8834e" stopOpacity=".22" />
        <stop offset="1" stopColor="#b8834e" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mist-wash" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#ddd5cf" stopOpacity=".06" />
        <stop offset=".47" stopColor="#f5f0e9" stopOpacity=".8" />
        <stop offset="1" stopColor="#c8d0cd" stopOpacity=".22" />
      </linearGradient>
      <linearGradient id="onion-flesh" x1="0" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor="#f3d9c5" />
        <stop offset=".5" stopColor="#d9bdb3" />
        <stop offset="1" stopColor="#a9888b" />
      </linearGradient>
      <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5b5551" />
        <stop offset=".42" stopColor="#d8d2ca" />
        <stop offset=".7" stopColor="#f7eee0" />
        <stop offset="1" stopColor="#716962" />
      </linearGradient>
      <filter id="soft-ink" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="13" />
      </filter>
      <filter id="mist-blur" x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
    <rect width="1280" height="720" fill="#f1e9dc" />
    <path d="M-50 35C198 75 273 5 510 78S839 45 1033 80 1235 42 1340 4v270c-210 38-310-18-506 29S503 262 318 313 69 290-52 355z" fill="url(#wash-lilac)" />
    <path d="M-32 558c179-95 303-30 441 8s193 73 363 16 301-84 537 15v167H-20z" fill="url(#wash-ochre)" />
    <path d="M53 118c120-41 221-22 318 7M976 598c96-27 170-19 242 3" fill="none" stroke="#796e68" strokeWidth="2" opacity=".18" strokeLinecap="round" />
    <g opacity=".13" fill="#6c605b">
      <circle cx="106" cy="402" r="1.3" /><circle cx="199" cy="647" r="1.5" /><circle cx="427" cy="93" r="1.2" />
      <circle cx="714" cy="621" r="1.2" /><circle cx="1106" cy="184" r="1.6" /><circle cx="1184" cy="493" r="1.1" />
      <circle cx="827" cy="103" r="1.4" /><circle cx="304" cy="476" r="1" /><circle cx="968" cy="384" r="1.2" />
    </g>
  </>;
}

function Onion({ x, y, scale = 1, squash = 0, rotate = 0, broken = false }) {
  const sy = 1 - squash * 0.15;
  const sx = 1 + squash * 0.09;
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale * sx} ${scale * sy})`}>
    <path d="M-8-159C-34-187-20-212-4-226c4 18 9 30 20 42 6-14 19-27 38-35-4 21-12 37-25 52 96 3 160 61 164 144 5 91-75 167-170 167-104 0-184-73-180-165 4-87 64-144 149-148z" fill="#726056" opacity=".12" transform="translate(10 16)" />
    <path d="M-8-159C-34-187-20-212-4-226c4 18 9 30 20 42 6-14 19-27 38-35-4 21-12 37-25 52 96 3 160 61 164 144 5 91-75 167-170 167-104 0-184-73-180-165 4-87 64-144 149-148z" fill="url(#onion-flesh)" stroke="#493a35" strokeWidth="5" strokeLinejoin="round" />
    <path d="M-8-159C-34-187-20-212-4-226c4 18 9 30 20 42 6-14 19-27 38-35-4 21-12 37-25 52 96 3 160 61 164 144 5 91-75 167-170 167-104 0-184-73-180-165 4-87 64-144 149-148z" fill="none" stroke="#f7e8d6" strokeWidth="2" opacity=".6" transform="translate(-4 -3)" />
    <path d="M-11-134C-88-138-144-90-144-23c0 72 65 126 139 121 83-5 139-66 131-138-7-63-60-108-137-111-38 0-63 11-78 28-15 16-19 35-5 47 14 12 37 7 51-6 17-16 23-31 39-34" fill="none" stroke="#80666a" strokeWidth="17" opacity=".45" strokeLinecap="round" />
    <path d="M-4-112C-63-116-112-75-112-21c0 57 52 97 109 94 63-4 106-49 100-105-5-48-46-81-104-84-28 0-48 7-61 20-11 11-13 25-3 33 10 8 26 4 37-5 13-12 19-24 31-27" fill="none" stroke="#f5e5d2" strokeWidth="15" opacity=".82" strokeLinecap="round" />
    <path d="M-7-87C-51-86-79-56-78-21c2 36 34 61 72 59 40-3 69-32 64-69-4-31-30-51-67-51-22 0-38 6-47 17-8 9-8 19-1 24 8 5 19 2 27-5 8-7 11-14 19-17" fill="none" stroke="#9e7875" strokeWidth="14" opacity=".58" strokeLinecap="round" />
    <path d="M-6-61C-37-59-53-38-50-14c3 24 22 40 49 37 27-3 43-22 39-46-3-21-19-33-43-33-13 0-24 4-29 12-5 6-4 13 1 16 5 3 12 0 17-4 5-5 8-10 13-11" fill="none" stroke="#f8ead5" strokeWidth="12" opacity=".8" strokeLinecap="round" />
    <path d="M-2-34C-21-34-31-21-29-7c2 14 14 22 28 19 14-3 23-12 20-25-2-12-11-18-24-17-8 1-14 4-17 9-2 4-1 8 2 9 4 2 8 0 11-3 3-3 5-6 8-6" fill="none" stroke="#97736f" strokeWidth="9" strokeLinecap="round" />
    <path d="M-146 27c36 9 56 6 78-2" fill="none" stroke="#4b3b36" strokeWidth="4" strokeLinecap="round" opacity=".8" />
    {broken && <g fill="none" stroke="#413430" strokeLinecap="round">
      <path d="M-41-3l-25-24 4-20M8 7l19-24-4-19M-18 23l-4 25" strokeWidth="4" />
      <path d="M-70-30l-12-11m103 27 14-10" strokeWidth="2.4" opacity=".8" />
    </g>}
  </g>;
}

function Knife({ x, y, scale = 1, blunt = false, angle = 0, alpha = 1 }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={alpha}>
    <path d="M0 0 104-244 134-231 25 15Q13 26 0 0Z" fill="url(#steel)" stroke="#4b4541" strokeWidth="4" strokeLinejoin="round" />
    <path d="M10 7 109-218" fill="none" stroke="#fff5e8" strokeWidth="5" opacity=".76" strokeLinecap="round" />
    <path d="M105-244 186-378Q195-393 212-383L149-220Z" fill="#40352f" stroke="#302925" strokeWidth="5" strokeLinejoin="round" />
    <path d="M129-239 176-339" stroke="#c29c78" strokeWidth="5" opacity=".74" strokeLinecap="round" />
    {blunt
      ? <path d="M-5 0q11-8 24 2" fill="none" stroke="#40352f" strokeWidth="9" strokeLinecap="round" />
      : <path d="M0 0l20 14" fill="none" stroke="#fbf1e5" strokeWidth="2" strokeLinecap="round" />}
  </g>;
}

function OnionMist({ frame, later = false, dropAt = 8 }) {
  const appear = later ? 1 : reveal(frame, 0, 8);
  const drift = later ? clamp(.93 + frame / 600) : clamp(frame / 112);
  const cloud = `M0 20C20-9 49 6 64-22c15-27 48-21 57 2 28-33 68-6 61 22 28-4 41 26 23 47-19 23-61 22-88 16-31 19-76 11-93-3-29 5-49-18-24-42z`;
  return <g opacity={appear}>
    <g transform={`translate(${lerp(600, 831, drift)} ${lerp(360, 220, drift)}) scale(${lerp(.8, 1.26, drift)})`}>
      <path d={cloud} fill="url(#mist-wash)" filter="url(#soft-ink)" opacity=".82" />
      <path d="M-39 19C16-27 54 35 109-17S197 11 220-17" fill="none" stroke="#8c7771" strokeWidth="8" opacity=".68" strokeLinecap="round" />
      <path d="M-23 45C28 4 53 63 103 25s82-22 112-43" fill="none" stroke="#a49389" strokeWidth="5" opacity=".58" strokeLinecap="round" />
      <path d="M-5-5c27-30 44 4 67-11 18-12 27-1 35 7" fill="none" stroke="#fff8ef" strokeWidth="3" opacity=".78" strokeLinecap="round" />
    </g>
    {later && Array.from({ length: 8 }, (_, index) => {
      const phase = clamp((frame - dropAt - index * 2) / 26);
      const travel = ease(phase);
      const x = 612 + index * 17 + travel * (150 + index * 7);
      const y = 368 - travel * (105 + index % 3 * 17) + travel * travel * 42;
      const radius = 4 + index % 3 * 2;
      return <g key={`drop-${index}`} transform={`translate(${x} ${y}) rotate(${24 + index * 5})`} opacity={phase}>
        <path d={`M0 ${-radius * 1.8}C${radius * .7} ${-radius * .5} ${radius * 1.4} ${radius * .2} ${radius} ${radius * .9}C${radius * .2} ${radius * 2} ${-radius} ${radius * 1.3} ${-radius} ${radius * .4}C${-radius * 1.1} ${-radius * .4} ${-radius * .4} ${-radius * 1.3} 0 ${-radius * 1.8}Z`} fill="#c3d0cc" fillOpacity=".8" stroke="#fff9ed" strokeWidth="1.6" />
        <path d={`M${-radius * .3} ${-radius * .6}q${-radius * .5} ${radius * .5} ${-radius * .2} ${radius}`} fill="none" stroke="#fffdf7" strokeWidth="1.5" opacity=".9" strokeLinecap="round" />
      </g>;
    })}
  </g>;
}

function Pressure({ frame, durationFrames }) {
  const p = reveal(frame, 8, durationFrames - 15);
  const x = lerp(785, 614, p);
  const y = lerp(146, 303, p);
  const press = reveal(frame, 49, durationFrames - 12);
  return <>
    <path d="M202 559c127-64 208-30 312 7s230 37 369-34" fill="none" stroke="#6f6260" strokeWidth="7" opacity=".21" strokeLinecap="round" />
    <Onion x={580} y={489} scale={1.08} squash={press} rotate={-2} />
    <path d="M418 335c62-48 144-59 219-31" fill="none" stroke="#453a36" strokeWidth="5" opacity={.2 + press * .63} strokeLinecap="round" />
    <path d="M492 310c45-21 86-20 121-6" fill="none" stroke="#f5ece0" strokeWidth="3" opacity={.38 + press * .52} strokeLinecap="round" />
    {Array.from({ length: 4 }, (_, i) => <path key={`stress-${i}`} d={`M${x - 74 - i * 10} ${y + 14 + i * 7}q-29 8-45 28`} fill="none" stroke="#473a34" strokeWidth={2 + i * .45} opacity={press * (.46 - i * .065)} strokeLinecap="round" />)}
    <Knife x={x} y={y} angle={-7} scale={1.14} />
    <path d={`M${x + 24} ${y - 17}q18-16 31-33`} fill="none" stroke="#4a3835" strokeWidth="3" opacity={press * .8} strokeLinecap="round" />
    <path d="M935 567c75-6 137-33 184-79" fill="none" stroke="#a67b59" strokeWidth="3" opacity=".36" strokeLinecap="round" />
  </>;
}

function CutAndMist({ frame, durationFrames, later = false, cueFrame }) {
  const p = reveal(frame, 5, durationFrames - 8);
  const x = later ? lerp(610, 560, p) : lerp(805, 610, p);
  const y = later ? lerp(390, 420, p) : lerp(170, 390, p);
  const mistAt = later ? 0 : cueFrame?.('s002', '先喷细雾', 'start') ?? 20;
  const mistFrame = later ? frame : frame - mistAt;
  const dropAt = later ? cueFrame?.('s002', '甩出液滴', 'start') ?? 8 : 8;
  return <>
    <path d="M195 601c179-61 281-20 415 1" fill="none" stroke="#8c7465" strokeWidth="5" opacity=".18" />
    <Onion x={528} y={494} scale={1.02} squash={.1} rotate={-1} broken={later} />
    <path d="M390 465c93-32 172-30 263-4" fill="none" stroke="#493b36" strokeWidth="4" strokeLinecap="round" opacity={.36 + p * .45} />
    <Knife x={x} y={y} angle={-14} scale={1.03} />
    <OnionMist frame={Math.max(0, mistFrame)} later={later} dropAt={dropAt} />
    {later && <path d="M568 389c67-53 133-87 207-103" fill="none" stroke="#d7d0c5" strokeWidth="2" opacity=".45" strokeDasharray="2 10" strokeLinecap="round" />}
  </>;
}

function Carry({ frame, durationFrames, cueFrame }) {
  const irritantAt = cueFrame?.('s003', '含硫刺激物', 'start') ?? 22;
  const carrierAt = cueFrame?.('s003', '雾滴把它带到空气里', 'start') ?? irritantAt + 45;
  const eyeAt = cueFrame?.('s003', '眼睛就发酸', 'start') ?? durationFrames - 30;
  const travel = reveal(frame, irritantAt, durationFrames - 16);
  const plumeOpacity = reveal(frame, carrierAt, carrierAt + 18);
  const eyeReveal = reveal(frame, eyeAt, eyeAt + 14);
  return <>
    <path d="M83 559c92-70 202-54 315-9" fill="none" stroke="#86766d" strokeWidth="3" opacity=".18" />
    <Onion x={280} y={517} scale={.7} rotate={-6} broken />
    <path d="M363 450c127-89 238-100 326-82s188-8 298-91" fill="none" stroke="#f4eee6" strokeWidth="71" opacity={plumeOpacity * .44} filter="url(#soft-ink)" strokeLinecap="round" />
    <path d="M371 450c117-77 211-90 316-68s185-8 288-81" fill="none" stroke="url(#mist-wash)" strokeWidth="44" opacity={plumeOpacity * .87} strokeLinecap="round" />
    <path d="M382 451c95-71 180-82 277-57s191-9 284-82" fill="none" stroke="#fff9ef" strokeWidth="5" opacity={plumeOpacity * .78} strokeLinecap="round" />
    <path d="M399 473c105-60 184-54 273-31s176-25 264-93" fill="none" stroke="#9a8f86" strokeWidth="3" opacity={plumeOpacity * .3} strokeLinecap="round" />
    <g fill="none" stroke="#a86e43" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M355 436C${lerp(398, 451, travel)} 405 ${lerp(493, 575, travel)} 474 ${lerp(596, 717, travel)} 426S${lerp(699, 815, travel)} 375 ${lerp(876, 1041, travel)} 296`} strokeWidth="4.5" opacity={travel * .88} />
      <path d={`M359 463C${lerp(427, 472, travel)} 483 ${lerp(510, 646, travel)} 453 ${lerp(641, 733, travel)} 389S${lerp(775, 872, travel)} 405 ${lerp(901, 1060, travel)} 334`} strokeWidth="2.8" opacity={travel * .74} />
      <path d={`M369 445C${lerp(412, 472, travel)} 421 ${lerp(540, 643, travel)} 386 ${lerp(674, 776, travel)} 424S${lerp(841, 906, travel)} 332 ${lerp(951, 1094, travel)} 319`} strokeWidth="2" opacity={travel * .63} />
    </g>
    <g transform={`translate(1070 317) scale(${lerp(1, .94, travel)})`}>
      <path d="M-114 0Q0-96 114 0Q0 101-114 0Z" fill="#eee2d4" fillOpacity=".42" stroke="#52423d" strokeWidth="5" strokeLinejoin="round" opacity={.16 + eyeReveal * .8} />
      <path d="M-87 0Q0-66 87 0Q0 68-87 0Z" fill="#a99092" fillOpacity=".23" stroke="#534541" strokeWidth="3" opacity={.14 + eyeReveal * .78} />
      <ellipse cx="0" cy="0" rx="27" ry="32" fill="#554540" opacity={.18 + eyeReveal * .72} />
      <path d="M-107 0q49-37 95-21" fill="none" stroke="#6d5248" strokeWidth="3" opacity={eyeReveal * .72} strokeLinecap="round" />
    </g>
    {travel > .24 && <text x="1195" y="652" textAnchor="end" fill="#68564b" fontSize="19" fontFamily="Noto Sans CJK SC, PingFang SC, sans-serif" opacity=".72">原理演绎</text>}
  </>;
}

function Comparison({ frame, durationFrames }) {
  const p = clamp(frame / Math.max(1, durationFrames - 1));
  const leftImpact = reveal(frame, 18, 38);
  const rightProgress = reveal(frame, 35, durationFrames - 8);
  const settle = reveal(frame, durationFrames * .72, durationFrames * .95);
  const rightAlpha = lerp(1, 1.14, settle);
  return <>
    <path d="M640 156c-12 110 22 186-3 275s12 137 1 205" fill="none" stroke="#554740" strokeWidth="2" strokeDasharray="3 12" opacity=".28" />
    <g opacity={1 - settle * .8}>
      <Onion x={342} y={515} scale={.72} squash={leftImpact * .54} rotate={3} />
      <Knife x={lerp(447, 337, reveal(frame, 7, 28))} y={lerp(264, 438, reveal(frame, 7, 28))} angle={-5} scale={.78} blunt />
      {Array.from({ length: 11 }, (_, i) => {
        const d = reveal(frame, 28 + i * 1.2, 47 + i * 1.4);
        const theta = (-152 + i * 24) * Math.PI / 180;
        const x = 342 + Math.cos(theta) * (76 + d * (60 + (i % 4) * 10));
        const y = 407 + Math.sin(theta) * (42 + d * (45 + (i % 3) * 18));
        return <circle key={`left-drop-${i}`} cx={x} cy={y} r={3.6 + i % 3 * 1.1} fill="#b8c6c2" fillOpacity={.72 * d} stroke="#fbf4e8" strokeWidth="1" />;
      })}
      <path d="M203 310c38-32 65-28 91-20M202 329c29-19 54-18 75-13" fill="none" stroke="#6a5144" strokeWidth="4" opacity={leftImpact * .68} strokeLinecap="round" />
    </g>
    <g transform={`translate(640 0) scale(${rightAlpha}) translate(-640 0)`}>
      <Onion x={942} y={515} scale={.72} squash={rightProgress * .18} rotate={-2} />
      <Knife x={lerp(1057, 898, rightProgress)} y={lerp(279, 434, rightProgress)} angle={-12} scale={.78} />
      {Array.from({ length: 3 }, (_, i) => {
        const d = reveal(frame, 83 + i * 9, 111 + i * 8);
        return <circle key={`right-drop-${i}`} cx={905 + i * 21 + d * (22 + i * 8)} cy={400 - d * (39 + i * 8)} r={3.6 + i} fill="#c5d0cb" fillOpacity={d * .67} stroke="#fff8ed" strokeWidth="1" />;
      })}
      <path d="M826 335c33-26 56-21 78-11" fill="none" stroke="#776056" strokeWidth="3" opacity={.25 + rightProgress * .38} strokeLinecap="round" />
    </g>
    <path d="M785 636c89 20 175 17 258-16" fill="none" stroke="#b2815d" strokeWidth="4" opacity={.2 + settle * .3} strokeLinecap="round" />
    <path d={`M${lerp(555, 585, p)} ${570 - settle * 18}c65 12 111 10 159-5`} fill="none" stroke="#4a3a35" strokeWidth="3" opacity={settle * .58} strokeLinecap="round" />
  </>;
}

export function InkFlow({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const stage = shot.scene.data.stage;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif' }}>
    <Ground />
    {stage === 'pressure' && <Pressure frame={frame} durationFrames={durationFrames} />}
    {stage === 'first-mist' && <CutAndMist frame={frame} durationFrames={durationFrames} cueFrame={cueFrame} />}
    {stage === 'later-drops' && <CutAndMist frame={frame} durationFrames={durationFrames} later />}
    {stage === 'carry' && <Carry frame={frame} durationFrames={durationFrames} cueFrame={cueFrame} />}
    {stage === 'comparison' && <Comparison frame={frame} durationFrames={durationFrames} />}
  </svg>;
}

export default { InkFlow };
