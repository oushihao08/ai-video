import React from 'react';
import { useCurrentFrame } from 'remotion';

const C = {
  wall: '#e9e1d1', paper: '#fff3d8', paper2: '#f5ddb0', table: '#bd6249',
  ink: '#202b31', muted: '#59656a', red: '#ee5941', yellow: '#f0b83f',
  teal: '#317980', shadow: '#26353b', white: '#fffaf0',
};
const clamp = value => Math.max(0, Math.min(1, value));
const ease = (frame, start, duration = 14) => {
  const t = clamp((frame - start) / Math.max(1, duration));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function cueAt(cueFrame, phrase, id) {
  const frame = cueFrame(id, phrase, 'start');
  if (frame === null) throw new Error(`缺少真实词时间：${id}「${phrase}」`);
  return frame;
}

function Backdrop({ label }) {
  return <>
    <rect width="1280" height="720" fill={C.wall} />
    <path d="M0 506H1280V720H0Z" fill={C.table} />
    <path d="M0 510H1280" stroke={C.ink} strokeWidth="9" />
    <path d="M0 524H1280" stroke="#d78a62" strokeWidth="3" opacity=".6" />
    <g transform="translate(1050 42) rotate(2)">
      <path d="M0 0h170v50H0z" fill={C.ink} />
      <text x="85" y="34" textAnchor="middle" fill={C.white} fontSize="22" fontWeight="700" letterSpacing="2">{label}</text>
    </g>
  </>;
}

function PaperSpine({ frame, cues }) {
  const reveal = ease(frame, cues.spine, 7);
  const crush = ease(frame, cues.crush, 9);
  const shrink = ease(frame, cues.specific, 18);
  const isPart = frame >= cues.part;
  const x = mix(530, 650, shrink);
  const y = mix(285, 278, shrink);
  const scale = mix(1.18, 0.3, shrink);
  const vertebrae = Array.from({ length: 8 }, (_, index) => {
    const offset = (index - 3.5) * 51;
    const splay = crush * (index % 2 ? 1 : -1) * 12;
    return <g key={index} transform={`translate(${splay} ${offset})`}>
      <path d="M-55-15Q-34-32 0-24Q36-32 55-15L46 9Q0 22-46 9Z" fill={index % 2 ? C.paper2 : C.paper} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-23-8H23" stroke={C.red} strokeWidth="4" opacity=".72" />
    </g>;
  });
  const pressure = ease(frame, cues.crush, 8);
  const broken = ease(frame, cues.crush + 3, 5);
  const partScale = ease(frame, cues.part, 11);
  return <>
    <g opacity={reveal} transform={`translate(${x} ${y}) scale(${scale}) rotate(${mix(-5, 0, shrink)})`}>
      {!isPart && <>
        <path d="M0-222V207" stroke={C.red} strokeWidth="13" strokeDasharray="18 18" opacity=".8" />
        {vertebrae}
      </>}
      {isPart && <g transform={`translate(-10 -14) scale(${partScale})`}>
        <Bracket x={0} y={0} scale={1.25} cracked />
      </g>}
    </g>
    <g transform={`translate(550 ${mix(-155, 20, pressure)}) rotate(${mix(-9, -2, pressure)})`} opacity={reveal}>
      <path d="M-160-4Q-142-62-66-58L-25-84Q-4-97 42-81L108-52L157-44Q179-34 177-3L150 16H-139Z" fill={C.ink} stroke={C.white} strokeWidth="9" strokeLinejoin="round" />
      <path d="M-15-77L2-18" stroke={C.red} strokeWidth="13" />
      <path d="M-124 15H139" stroke={C.yellow} strokeWidth="8" />
    </g>
    {broken > 0.02 && <g opacity={broken} transform={`translate(530 284)`}>
      <path d="M-104-18l29 13-24 17 27 13-26 20" fill="none" stroke={C.red} strokeWidth="13" strokeLinejoin="bevel" />
      <path d="M74-26l-22 20 24 14-24 15 21 20" fill="none" stroke={C.red} strokeWidth="13" strokeLinejoin="bevel" />
      <path d="M-25-105l11 35-28-5" fill="none" stroke={C.yellow} strokeWidth="10" />
    </g>}
  </>;
}

function Car({ x, y, index, progress }) {
  const rise = (1 - ease(progress, index * 3, 12)) * 36;
  return <g transform={`translate(${x} ${y + rise})`}>
    <path d="M-76 4l17-37q7-12 24-13h44q20 0 32 16l27 34v21H-76Z" fill={index === 1 ? C.teal : C.ink} stroke={C.white} strokeWidth="7" strokeLinejoin="round" />
    <path d="M-40-35h41v27h-55zM12-34h22l20 26H12z" fill={C.wall} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
    <circle cx="-44" cy="25" r="15" fill={C.ink} stroke={C.white} strokeWidth="6" />
    <circle cx="43" cy="25" r="15" fill={C.ink} stroke={C.white} strokeWidth="6" />
    <circle cx="66" cy="-4" r="6" fill={C.yellow} />
  </g>;
}

function Bracket({ x, y, scale = 1, cracked = false }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={C.red} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
    {cracked
      ? <><path d="M-26-21V13Q-26 26-13 26H-7M7 26H14Q27 26 27 13V-21" /><path d="M-5 19L1 24L-2 28L5 34" stroke={C.ink} strokeWidth="4" /></>
      : <path d="M-26-21V13Q-26 26-13 26H14Q27 26 27 13V-21" />}
    <path d="M-39-21H-17M17-21H39" />
    <circle cx="-27" cy="-26" r="5" fill={C.yellow} stroke="none" />
    <circle cx="27" cy="-26" r="5" fill={C.yellow} stroke="none" />
  </g>;
}

function ThreeCars({ frame, cues }) {
  const reveal = ease(frame, cues.threeCars, 14);
  const partReveal = ease(frame, cues.part, 10);
  const inspect = ease(frame, cues.part, 12);
  return <g opacity={reveal}>
    <path d="M750 145h448v300H750z" fill={C.paper} stroke={C.ink} strokeWidth="8" />
    <path d="M780 185H1168" stroke={C.ink} strokeWidth="4" strokeDasharray="8 12" />
    <g fontFamily="PingFang SC, sans-serif" fill={C.ink} fontWeight="700" fontSize="24">
      <text x="835" y="177" textAnchor="middle">测试车 1</text>
      <text x="974" y="177" textAnchor="middle">测试车 2</text>
      <text x="1113" y="177" textAnchor="middle">测试车 3</text>
    </g>
    {[835, 974, 1113].map((x, i) => <g key={i} opacity={reveal}>
      <Car x={x} y={250} index={i} progress={Math.max(0, frame - cues.threeCars)} />
      <g opacity={partReveal} transform={`translate(${x} 340)`}><Bracket x={0} y={0} scale={0.72} cracked /></g>
    </g>)}
    <g opacity={inspect} transform="translate(970 420)">
      <path d="M-202 18Q-188-8-156-8H156Q188-8 202 18V62H-202Z" fill={C.paper2} stroke={C.ink} strokeWidth="6" />
      <Bracket x={-135} y={36} scale={0.9} cracked />
      <text x="-90" y="46" fill={C.ink} fontFamily="PingFang SC, sans-serif" fontSize="24" fontWeight="700">制动踏板支架底座</text>
      <path d="M154 18v44" stroke={C.red} strokeWidth="5" />
    </g>
  </g>;
}

function SpineStage({ frame, cueFrame }) {
  const cues = {
    spine: cueAt(cueFrame, '脊梁骨', 's001'),
    crush: cueAt(cueFrame, '踩断', 's001'),
    specific: cueAt(cueFrame, '实际断的是', 's001'),
    threeCars: cueAt(cueFrame, '三辆', 's001'),
    part: cueAt(cueFrame, '制动踏板支架底座', 's001'),
  };
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'PingFang SC, sans-serif' }}>
    <defs>
      <filter id="paperShadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="8" dy="11" stdDeviation="0" floodColor={C.shadow} floodOpacity=".28" /></filter>
      <pattern id="cutMarks" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M3 23l4-2M18 6l5-2" stroke={C.ink} strokeWidth="2" opacity=".08" /></pattern>
    </defs>
    <Backdrop label="结构示意" />
    <rect width="1280" height="506" fill="url(#cutMarks)" />
    <g filter="url(#paperShadow)"><PaperSpine frame={frame} cues={cues} /></g>
    <ThreeCars frame={frame} cues={cues} />
  </svg>;
}

function PromiseRow({ y, title, detail, reveal }) {
  return <g opacity={reveal} transform={`translate(0 ${(1 - reveal) * 18})`}>
    <path d={`M138 ${y}h440v61H138z`} fill={C.paper2} stroke={C.ink} strokeWidth="5" />
    <circle cx="178" cy={y + 30} r="13" fill={C.paper} stroke={C.teal} strokeWidth="5" />
    <text x="214" y={y + 39} fill={C.ink} fontSize="25" fontWeight="800">{title}</text>
    <text x="560" y={y + 39} textAnchor="end" fill={C.muted} fontSize="19">{detail}</text>
  </g>;
}

function StatementCard({ frame, cues }) {
  const quote = ease(frame, cues.quote, 12);
  const optimize = ease(frame, cues.optimize, 10);
  const upgrade = ease(frame, cues.upgrade, 10);
  const imagine = ease(frame, cues.imagine, 12);
  return <>
    <g opacity={1 - imagine * 0.78} transform={`translate(0 ${-imagine * 40})`}>
      <g transform="rotate(-2 352 278)">
        <path d="M118 128h488v305H118z" fill={C.paper} stroke={C.ink} strokeWidth="8" />
        <path d="M118 128h488v65H118z" fill={C.teal} stroke={C.ink} strokeWidth="8" />
        <text x="150" y="172" fill={C.white} fontSize="30" fontWeight="800">品牌声明</text>
        <g opacity={quote}>
          <path d="M151 220h422v87H151z" fill={C.paper2} />
          <text x="174" y="255" fill={C.ink} fontSize="23" fontWeight="700">“非标准的极端</text>
          <text x="174" y="287" fill={C.ink} fontSize="23" fontWeight="700">测试工况”</text>
          <path d="M151 316H573" stroke={C.ink} strokeWidth="2" opacity=".25" />
        </g>
      </g>
      <PromiseRow y={365} title="优化部件" detail="承诺" reveal={optimize} />
      <PromiseRow y={438} title="已交付用户免费升级" detail="承诺" reveal={upgrade} />
    </g>
  </>;
}

function RepairOrder({ frame, cues }) {
  const slide = ease(frame, cues.imagine, 16);
  const fault = ease(frame, cues.fault, 10);
  const blank = ease(frame, cues.blank, 6);
  const support = ease(frame, cues.service, 10);
  const month = ease(frame, cues.month, 10);
  const y = mix(594, 115, slide);
  const x = mix(420, 658, slide);
  return <g transform={`translate(${x} ${y}) rotate(-1.2)`} opacity={slide}>
    <g filter="url(#paperShadow)">
      <path d="M-276-35H276V471H-276Z" fill={C.paper} stroke={C.ink} strokeWidth="8" />
      <path d="M-276-35H276V45H-276Z" fill={C.yellow} stroke={C.ink} strokeWidth="8" />
      <text x="-241" y="15" fill={C.ink} fontSize="27" fontWeight="900">想象 · 示意</text>
      <text x="239" y="12" textAnchor="end" fill={C.ink} fontSize="20" fontWeight="700">维修单</text>
      <path d="M-238 87H238M-238 250H238" stroke={C.ink} strokeWidth="4" />
      <text x="-235" y="126" fill={C.muted} fontSize="21" fontWeight="700">故障栏</text>
      <path d="M-240 146H240" stroke={C.ink} strokeWidth="3" strokeDasharray="7 7" opacity=".45" />
      <g opacity={fault}>
        <path d="M-218 159l4-8 25 14 29-25" fill="none" stroke={C.red} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <text x="-151" y="187" fill={C.ink} fontSize="22" fontWeight="800">制动踏板支架底座</text>
      </g>
      <text x="-235" y="291" fill={C.muted} fontSize="21" fontWeight="700">换件方案</text>
      <path d="M-240 316H240" stroke={C.ink} strokeWidth="4" />
      <g opacity={blank}>
        <path d="M212 275v46" stroke={C.red} strokeWidth="7" />
        <circle cx="212" cy="344" r="7" fill={C.red} />
      </g>
      <path d="M-238 366H238" stroke={C.ink} strokeWidth="3" opacity=".28" />
      <text x="-235" y="407" fill={C.muted} fontSize="20">办理进度</text>
      <path d="M-115 402H192" stroke={C.ink} strokeWidth="3" strokeDasharray="6 8" opacity=".33" />
      <g opacity={support} transform={`translate(0 ${mix(35, 0, support)})`}>
        <path d="M-235 428h330v55h-330z" fill={C.teal} stroke={C.ink} strokeWidth="5" />
        <text x="-218" y="464" fill={C.white} fontSize="19" fontWeight="800">客服：</text>
        <g transform={`translate(168 413) rotate(7) scale(${month})`}>
          <path d="M0 0h104v72H0z" fill={C.paper2} stroke={C.ink} strokeWidth="5" />
          <path d="M0 20h104" stroke={C.ink} strokeWidth="4" />
          <text x="52" y="16" textAnchor="middle" fill={C.ink} fontSize="12" fontWeight="800">预计</text>
          <path d="M16 40h72" stroke={C.red} strokeWidth="7" strokeDasharray="5 5" />
          <text x="52" y="64" textAnchor="middle" fill={C.ink} fontSize="16" fontWeight="900">月底确认</text>
        </g>
      </g>
    </g>
  </g>;
}

function StatementStage({ frame, cueFrame }) {
  const cues = {
    quote: cueAt(cueFrame, '非标准的极端测试工况', 's002'),
    optimize: cueAt(cueFrame, '优化部件', 's002'),
    upgrade: cueAt(cueFrame, '已交付用户', 's002'),
    imagine: cueAt(cueFrame, '想象一张维修单', 's002'),
    fault: cueAt(cueFrame, '故障栏已经填上', 's002'),
    blank: cueAt(cueFrame, '换件方案还空着', 's002'),
    service: cueAt(cueFrame, '客服说', 's002'),
    month: cueAt(cueFrame, '预计月底确认', 's002'),
  };
  const imagine = ease(frame, cues.imagine, 16);
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'PingFang SC, sans-serif' }}>
    <defs>
      <filter id="paperShadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="8" dy="11" stdDeviation="0" floodColor={C.shadow} floodOpacity=".28" /></filter>
      <pattern id="deskGrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M33 0H0V33" fill="none" stroke={C.ink} strokeWidth="1" opacity=".055" /></pattern>
    </defs>
    <Backdrop label="纸面示意" />
    <rect width="1280" height="506" fill="url(#deskGrid)" />
    <StatementCard frame={frame} cues={cues} />
    <g opacity={1 - imagine}>
      <path d="M668 116v354" stroke={C.ink} strokeWidth="4" strokeDasharray="9 11" opacity=".42" />
      <path d="M644 278l24 22 24-22" fill="none" stroke={C.red} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <RepairOrder frame={frame} cues={cues} />
  </svg>;
}

function SpineDesk({ shot, cueFrame }) {
  const frame = useCurrentFrame();
  return shot.scene.data.stage === 1
    ? <SpineStage frame={frame} cueFrame={cueFrame} />
    : <StatementStage frame={frame} cueFrame={cueFrame} />;
}

export default { SpineDesk };
