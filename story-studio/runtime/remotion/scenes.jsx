import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const progress = (frame, start, end) => clamp((frame - start) / Math.max(1, end - start));
const routeAt = (points, t) => {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let distance = total * clamp(t);
  for (let index = 0; index < lengths.length; index++) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const ratio = lengths[index] ? distance / lengths[index] : 0;
      const point = points[index].map((value, axis) => value + (points[index + 1][axis] - value) * ratio);
      return { point, trace: [...points.slice(0, index + 1), point] };
    }
    distance -= lengths[index];
  }
  return { point: points[0], trace: [points[0]] };
};
const pathOf = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');

// A complete, deliberately simple action: a party reaches a closed crossing,
// then follows a new route and arrives at its destination.
export function StoryScene({ shot, durationFrames }) {
  const frame = useCurrentFrame();
  const data = shot.scene.data ?? {};
  const reveal = progress(frame, durationFrames * 0.28, durationFrames * 0.58);
  const travel = progress(frame, durationFrames * 0.55, durationFrames * 0.88);
  const x = 230 + 740 * travel;
  const palette = data.palette ?? { background: '#e8e3d7', ink: '#27343a', route: '#ac673e' };
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif' }}>
    <rect width="1280" height="720" fill={palette.background} />
    <path d="M0 565Q300 510 620 570T1280 545V720H0Z" fill="#c8c8ae" />
    <path d="M180 500H1080" fill="none" stroke={palette.ink} strokeWidth="13" opacity=".65" />
    <path d="M685 495V320" fill="none" stroke="#638fa0" strokeWidth="105" opacity=".78" />
    <path d="M630 488H740" fill="none" stroke="#514b3f" strokeWidth="19" />
    <g opacity={reveal}><path d="M610 440L760 305" fill="none" stroke="#aa493f" strokeWidth="13" /><path d="M610 305L760 440" fill="none" stroke="#aa493f" strokeWidth="13" /></g>
    <path d={`M230 490 Q590 ${425 - 90 * reveal} 970 490`} fill="none" stroke={palette.route} strokeWidth="7" strokeDasharray="10 10" opacity={reveal} />
    <g transform={`translate(${x} ${490 - 80 * Math.sin(Math.PI * travel)})`}>
      <circle cy="-55" r="25" fill={palette.ink} /><path d="M0 -28V28M0 -3L-31 15M0 -3L31 15M0 27L-25 64M0 27L25 64" fill="none" stroke={palette.ink} strokeWidth="12" strokeLinecap="round" />
    </g>
    <g opacity={progress(frame, durationFrames * .86, durationFrames * .96)}><circle cx="970" cy="490" r="47" fill="none" stroke={palette.route} strokeWidth="6" /><text x="970" y="405" textAnchor="middle" fontSize="36" fill={palette.ink}>{data.arrivalLabel ?? '已抵达'}</text></g>
    <text x="72" y="112" fontSize="42" fontWeight="700" fill={palette.ink}>{data.title ?? '改道'}</text>
    <text x="76" y="163" fontSize="25" fill={palette.ink}>{data.context ?? '渡口封闭，队伍改走上游'}</text>
    {data.demonstration && <text x="1190" y="65" textAnchor="end" fontSize="22" fill="#7b5743">示意动画</text>}
  </svg>;
}

// Every geometry, label and faction comes from the current shot. Historical
// claims remain the episode author's responsibility and are marked on screen.
export function BattleScene({ shot, durationFrames }) {
  const frame = useCurrentFrame();
  const data = shot.scene.data;
  const factions = new Map((data.factions ?? []).map(item => [item.id, item]));
  const terrain = data.terrain ?? [];
  const routes = data.routes ?? [];
  const armies = data.armies ?? [];
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif' }}>
    <rect width="1280" height="720" fill="#d7ddcb" />
    {terrain.map((item, index) => item.kind === 'river'
      ? <path key={index} d={pathOf(item.points)} fill="none" stroke="#6a9fae" strokeWidth={item.width ?? 32} />
      : <path key={index} d={pathOf(item.points)} fill="none" stroke={item.kind === 'ridge' ? '#758b69' : '#c3ad83'} strokeWidth={item.width ?? 24} opacity=".82" />)}
    {routes.map(route => <path key={route.id} d={pathOf(route.points)} fill="none" stroke="#594d3b" strokeWidth="5" strokeDasharray="12 8" opacity=".7" />)}
    {(data.places ?? []).map(place => <g key={place.id} transform={`translate(${place.x} ${place.y})`}><circle r="12" fill="#352d25" /><text y="-23" textAnchor="middle" fontSize="24" fill="#1d282b" style={{ paintOrder: 'stroke', stroke: '#f5f0dc', strokeWidth: 5 }}>{place.name}</text></g>)}
    {armies.map(army => {
      const route = routes.find(item => item.id === army.routeId);
      if (!route || route.points.length < 2) return null;
      const faction = factions.get(army.factionId);
      const start = army.startFrame ?? Math.round(durationFrames * .15);
      const end = army.endFrame ?? Math.round(durationFrames * .85);
      const { point, trace } = routeAt(route.points, progress(frame, start, end));
      const color = faction?.color ?? '#656565';
      return <g key={army.id}>
        <path d={pathOf(trace)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
        <g transform={`translate(${point[0]} ${point[1]})`}><circle r="23" fill={color} stroke="#f7e8bb" strokeWidth="3" /><text y="-33" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1d282b" style={{ paintOrder: 'stroke', stroke: '#f5f0dc', strokeWidth: 5 }}>{army.name}</text></g>
      </g>;
    })}
    <rect x="0" y="0" width="1280" height="100" fill="#f3eedc" opacity=".94" />
    <text x="45" y="60" fontSize="39" fontWeight="700" fill="#26343a">{data.title ?? '战场态势'}</text>
    <text x="1235" y="53" textAnchor="end" fontSize="22" fill="#784e38">{data.evidenceStatus === 'verified' ? '依据本期资料绘制' : '示意地图 · 非历史复原'}</text>
    {(data.factions ?? []).map((faction, index, all) => {
      const groupWidth = 170;
      const gap = 20;
      const startX = (1280 - (all.length * groupWidth + Math.max(0, all.length - 1) * gap)) / 2;
      return <g key={faction.id} transform={`translate(${startX + index * (groupWidth + gap)} 86)`}>
        <rect width="22" height="22" y="-17" fill={faction.color} />
        <text x="32" y="0" fontSize="21" fill="#26343a">{faction.name}</text>
      </g>;
    })}
  </svg>;
}
