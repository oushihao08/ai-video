import React from 'react';
import { useCurrentFrame } from 'remotion';

const K = {
  dark: '#111820',
  dark2: '#1b2630',
  paper: '#f0f1ed',
  white: '#fbfcf9',
  ink: '#15212b',
  muted: '#78848d',
  line: '#53616b',
  pale: '#ccd2d4',
  orange: '#f05a28',
  orangePale: '#ffd0bf',
  font: 'PingFang SC, Noto Sans CJK SC, sans-serif',
};

const clamp = value => Math.max(0, Math.min(1, value));
const ease = (frame, start, length = 16) => {
  const t = clamp((frame - start) / Math.max(1, length));
  return t * t * (3 - 2 * t);
};

function measuredCue(cueFrame, id, phrase, edge = 'start') {
  const frame = cueFrame(id, phrase, edge);
  if (frame === null) throw new Error(`缺少实测词级时间：${id}「${phrase}」`);
  return frame;
}

function Tag({ x, y, text, accent = false, dark = true }) {
  const fill = accent ? K.orange : dark ? '#35434e' : '#e0e4e1';
  const color = accent || dark ? K.white : K.ink;
  const width = Math.max(94, Array.from(text).length * 21 + 30);
  return <g>
    <rect x={x} y={y - 24} width={width} height="34" rx="3" fill={fill} />
    <text x={x + 14} y={y} fill={color} fontSize="18" fontWeight="700">{text}</text>
  </g>;
}

function CarMark({ x, y, opacity = 1, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <path d="M-42 3l8-17q4-9 14-9h34q9 0 15 10l10 16 8 3v15h-92V6z" fill={K.white} stroke={K.ink} strokeWidth="3" strokeLinejoin="round" />
    <path d="M-22-18h34q6 0 10 8h-51l3-6q1-2 4-2z" fill="#9eabb1" />
    <circle cx="-24" cy="21" r="7" fill={K.dark} stroke={K.white} strokeWidth="3" />
    <circle cx="26" cy="21" r="7" fill={K.dark} stroke={K.white} strokeWidth="3" />
  </g>;
}

function BracketMark({ x, y, reveal = 0, fail = 0, compact = false }) {
  const scale = compact ? 0.54 : 1;
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={reveal}>
    <path d="M0-27v36 M0 20v21 M0 41h46" fill="none" stroke={K.pale} strokeWidth="11" strokeLinecap="square" />
    <path d="M-14-31h28v10h-28z" fill={K.muted} />
    <path d="M-10 7l9 7-7 8 10 8" fill="none" stroke={K.orange} strokeWidth="4" opacity={fail} />
    <path d="M-2 10l4 3" stroke={K.dark} strokeWidth="13" opacity={fail} />
    <path d="M-7 13l5 4-4 5" fill="none" stroke={K.orange} strokeWidth="4" opacity={fail} />
  </g>;
}

function FullTestBoard({ frame, cueFrame, cues }) {
  const carsAt = cues.cars;
  const brakeAt = cues.brake;
  const baseAt = cues.base;
  const failAt = cues.fail;
  const stop = ease(frame, brakeAt, 23);
  const part = ease(frame, baseAt, 16);
  const failed = ease(frame, failAt + 3, 12);

  return <g>
    <Tag x={76} y={66} text="来源｜测试报道" />
    <text x="1198" y="66" textAnchor="end" fill="#84919a" fontSize="16" letterSpacing="2">动态记录 / 01</text>
    <path d="M76 101H1204" stroke="#34414a" strokeWidth="1" />
    <g opacity={ease(frame, carsAt, 12)}>
      <text x="94" y="151" fill={K.white} fontSize="24" fontWeight="700">三辆测试车</text>
      <text x="1176" y="151" textAnchor="end" fill="#9ba7ad" fontSize="17">车辆与部件符号均为示意</text>
    </g>
    <rect x="76" y="178" width="650" height="326" rx="3" fill={K.dark2} stroke="#3a4650" strokeWidth="1" />
    <rect x="752" y="178" width="452" height="326" rx="3" fill={K.dark2} stroke="#3a4650" strokeWidth="1" />
    {[0, 1, 2].map(i => {
      const y = 250 + i * 83;
      const appeared = ease(frame, carsAt + i * 2, 9);
      const drive = ease(frame, brakeAt + i * 5, 24);
      const x = 166 + drive * 360;
      const brakeMark = ease(frame, brakeAt + i * 5 + 18, 6);
      return <g key={i}>
        <text x="101" y={y + 5} fill="#93a0a7" fontSize="17">0{i + 1}</text>
        <path d={`M145 ${y + 25}H650`} stroke="#58656d" strokeWidth="2" />
        <path d={`M145 ${y + 25}H${510 + 140 * brakeMark}`} stroke={K.orange} strokeWidth="2" opacity={brakeMark} />
        <CarMark x={x} y={y} opacity={appeared} />
        <path d={`M${523 + i * 4} ${y - 18}v35`} stroke={K.orange} strokeWidth="4" opacity={brakeMark} />
        <text x="670" y={y + 6} textAnchor="end" fill={K.orange} fontSize="16" opacity={brakeMark}>停</text>
      </g>;
    })}
    <g opacity={part}>
      <text x="786" y="217" fill={K.white} fontSize="21" fontWeight="700">踏板支架底座</text>
      <text x="1174" y="217" textAnchor="end" fill="#9ba7ad" fontSize="15">符号化部件</text>
      {[0, 1, 2].map(i => <g key={i}>
        <BracketMark x={830} y={282 + i * 66} reveal={part} fail={failed} />
        <path d={`M884 ${282 + i * 66}h270`} stroke="#3c4852" strokeWidth="1" />
        <text x="1167" y={288 + i * 66} textAnchor="end" fill={K.orange} fontSize="17" opacity={failed}>断开</text>
      </g>)}
      <g opacity={failed}>
        <text x="786" y="475" fill={K.orange} fontSize="43" fontWeight="800">3 / 3</text>
        <text x="928" y="468" fill={K.white} fontSize="19">报道所述测试车</text>
        <text x="928" y="493" fill="#9ba7ad" fontSize="16">同一部件现象</text>
      </g>
    </g>
    <text x="78" y="544" fill="#9ba7ad" fontSize="15">测试报道复述的测试结果；不代表实物结构或监管鉴定。</text>
  </g>;
}

function SourceComparison({ frame, cues }) {
  const quote = ease(frame, cues.quote, 14);
  const promise = ease(frame, cues.promise, 10);
  const optimize = ease(frame, cues.optimize, 12);
  const scope = ease(frame, cues.scope, 8);
  const free = ease(frame, cues.free, 10);
  return <g>
    <Tag x={76} y={66} text="来源｜测试报道" />
    <path d="M76 101H1204" stroke="#34414a" strokeWidth="1" />
    <rect x="76" y="178" width="476" height="326" rx="3" fill={K.dark2} stroke="#3a4650" />
    <rect x="578" y="178" width="626" height="326" rx="3" fill={K.dark2} stroke="#3a4650" />
    <text x="108" y="226" fill="#aeb9bf" fontSize="16">测试报道</text>
    <text x="108" y="282" fill={K.white} fontSize="26" fontWeight="700">三辆测试车</text>
    {[0, 1, 2].map(i => <g key={i}>
      <CarMark x={158 + i * 104} y={346} scale={0.66} />
      <circle cx={158 + i * 104} cy="398" r="6" fill={K.orange} />
    </g>)}
    <path d="M108 429H520" stroke="#3c4852" />
    <text x="108" y="467" fill={K.orange} fontSize="19" fontWeight="700">踏板支架底座断裂</text>
    <text x="108" y="490" fill="#89969e" fontSize="14">测试报道所述结果</text>

    <g opacity={ease(frame, cues.statement, 16)}>
      <Tag x={612} y={226} text="尊界声明" />
      <text x="1170" y="226" textAnchor="end" fill="#89969e" fontSize="14">品牌公开说法</text>
      <text x="614" y="291" fill={K.orangePale} fontSize="31" fontWeight="700" opacity={quote}>“非标准的极端测试工况”</text>
      <path d="M614 316H1168" stroke="#46535d" />
      <g opacity={promise}>
        <text x="614" y="356" fill="#aeb9bf" fontSize="15">后续安排</text>
      </g>
      <g opacity={optimize}>
        <circle cx="630" cy="398" r="5" fill={K.orange} />
        <text x="650" y="406" fill={K.white} fontSize="21">优化部件</text>
      </g>
      <g opacity={scope}>
        <text x="650" y="459" fill="#aeb9bf" fontSize="17">已交付用户</text>
      </g>
      <g opacity={free}>
        <path d="M812 452h18" stroke={K.orange} strokeWidth="3" />
        <text x="842" y="459" fill={K.orangePale} fontSize="21" fontWeight="700">免费升级</text>
      </g>
    </g>
    <text x="78" y="544" fill="#9ba7ad" fontSize="15">两栏分别保留原始来源，不推断测试原因或声明动机。</text>
  </g>;
}

function BrakeReport({ cueFrame }) {
  const frame = useCurrentFrame();
  const statement = measuredCue(cueFrame, 's001', '尊界当天称');
  const compact = ease(frame, statement, 18);
  const cues = {
    cars: measuredCue(cueFrame, 's001', '三辆'),
    brake: measuredCue(cueFrame, 's001', '连续急刹'),
    base: measuredCue(cueFrame, 's001', '踏板支架底座'),
    fail: measuredCue(cueFrame, 's001', '都断了'),
    statement,
    quote: measuredCue(cueFrame, 's001', '非标准的极端测试工况'),
    promise: measuredCue(cueFrame, 's001', '承诺'),
    optimize: measuredCue(cueFrame, 's001', '优化部件'),
    scope: measuredCue(cueFrame, 's001', '已交付用户'),
    free: measuredCue(cueFrame, 's001', '免费升级'),
  };
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ background: K.dark, fontFamily: K.font }}>
    <rect width="1280" height="720" fill={K.dark} />
    <path d="M0 0H1280V8H0Z" fill={K.orange} />
    <g opacity={1 - compact}><FullTestBoard frame={frame} cueFrame={cueFrame} cues={cues} /></g>
    <g opacity={compact}><SourceComparison frame={frame} cues={cues} /></g>
  </svg>;
}

function TimeNode({ x, frame, at, label, detail }) {
  const p = ease(frame, at, 15);
  return <g opacity={p}>
    <circle cx={x} cy="343" r="17" fill={K.paper} stroke={K.orange} strokeWidth="4" strokeDasharray="5 4" />
    <path d={`M${x} 319v-70`} stroke={K.orange} strokeWidth="2" strokeDasharray="5 5" />
    <rect x={x - 122} y="174" width="244" height="100" fill={K.white} stroke={K.ink} strokeWidth="2" strokeDasharray="7 5" />
    <text x={x} y="211" textAnchor="middle" fill={K.ink} fontSize="20" fontWeight="700">{label}</text>
    <text x={x} y="247" textAnchor="middle" fill={K.orange} fontSize="24" fontWeight="800">{detail}</text>
  </g>;
}

function ScheduleGraphic({ frame, cues }) {
  const source = ease(frame, cues.source, 10);
  const first = ease(frame, cues.expected, 15);
  const second = ease(frame, cues.november, 15);
  const rollout = ease(frame, cues.rollout, 12);
  return <g>
    <text x="82" y="115" fill={K.ink} fontSize="32" fontWeight="800">后续时间</text>
    <g opacity={source}>
      <Tag x={82} y={163} text="来源｜客服转述 · 预计" dark={false} />
    </g>
    <path d="M175 343H1096" stroke="#c1c8c7" strokeWidth="3" strokeDasharray="10 9" />
    <TimeNode x={405} frame={frame} at={cues.expected} label="方案确认" detail="预计月底" />
    <TimeNode x={900} frame={frame} at={cues.november} label="时间节点" detail="十一月起" />
    <g opacity={rollout}>
      <path d="M905 375h168" stroke={K.orange} strokeWidth="3" strokeDasharray="6 7" />
      {[0, 1, 2].map(i => <rect key={i} x={925 + i * 49} y="402" width="34" height="10" fill={K.orange} opacity={i < 2 ? 0.42 : 0.18} />)}
      <text x="900" y="451" textAnchor="middle" fill={K.ink} fontSize="19">陆续升级</text>
      <text x="900" y="483" textAnchor="middle" fill={K.muted} fontSize="15">转述中的预计安排</text>
    </g>
    <text x="82" y="544" fill={K.muted} fontSize="15">虚线表示转述的预计进度，不表示方案已确认或升级已开始。</text>
  </g>;
}

function WorkOrder({ frame, cues }) {
  const imagine = ease(frame, cues.workOrder, 18);
  const fault = ease(frame, cues.fault, 10);
  const fill = ease(frame, cues.fault + 7, 18);
  const field = ease(frame, cues.part, 12);
  const emphasis = ease(frame, cues.empty, 9);
  const caretOn = emphasis > 0.3 && Math.floor(frame / 13) % 2 === 0;
  return <g opacity={imagine} transform={`translate(${0} ${18 * (1 - imagine)})`}>
    <rect x="168" y="161" width="944" height="385" rx="3" fill={K.white} stroke={K.ink} strokeWidth="2" />
    <path d="M168 161H1112V171H168Z" fill={K.orange} />
    <text x="214" y="224" fill={K.ink} fontSize="31" fontWeight="800">维修单</text>
    <text x="1068" y="220" textAnchor="end" fill={K.orange} fontSize="17" fontWeight="700">想象 / 画面示意</text>
    <path d="M214 246H1066" stroke="#cbd0cf" strokeWidth="2" />
    <g opacity={fault}>
      <text x="222" y="310" fill={K.muted} fontSize="18">故障现象</text>
      <text x="1060" y="310" textAnchor="end" fill={K.orange} fontSize="14">测试报道所述</text>
      <rect x="214" y="326" width="852" height="62" fill="#f2f3ef" />
      <path d="M214 388H1066" stroke="#cbd0cf" strokeWidth="1" />
      <g clipPath="url(#fault-field-reveal)">
        <text x="242" y="367" fill={K.ink} fontSize="25" fontWeight="700">踏板支架底座断裂</text>
      </g>
    </g>
    <g opacity={field}>
      <text x="222" y="450" fill={K.ink} fontSize="19" fontWeight="700">更换部件</text>
      <rect x="414" y="411" width="652" height="64" fill="#fff" stroke={emphasis > 0.1 ? K.orange : '#9ea8a8'} strokeWidth={emphasis > 0.1 ? 3 : 2} strokeDasharray="8 6" />
      <path d="M430 422h10v42h-10M1050 422h10v42h-10" fill="none" stroke={K.orange} strokeWidth="3" opacity={emphasis} />
      <path d="M442 424v38" stroke={K.orange} strokeWidth="2" opacity={caretOn ? 1 : 0} />
    </g>
    <text x="214" y="515" fill={K.muted} fontSize="14">此为创作示意单，不是实际售后记录。</text>
    <defs>
      <clipPath id="fault-field-reveal"><rect x="236" y="326" width={830 * fill} height="62" /></clipPath>
    </defs>
  </g>;
}

function ServiceSchedule({ cueFrame }) {
  const frame = useCurrentFrame();
  const cues = {
    source: measuredCue(cueFrame, 's002', '客服后来给了时间'),
    expected: measuredCue(cueFrame, 's002', '方案预计月底确认'),
    november: measuredCue(cueFrame, 's002', '十一月起'),
    rollout: measuredCue(cueFrame, 's002', '陆续升级'),
    workOrder: measuredCue(cueFrame, 's002', '想象一张维修单'),
    fault: measuredCue(cueFrame, 's002', '故障栏写清楚了'),
    part: measuredCue(cueFrame, 's002', '换什么件'),
    empty: measuredCue(cueFrame, 's002', '那格还空着'),
  };
  const form = ease(frame, cues.workOrder, 18);
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ background: K.paper, fontFamily: K.font }}>
    <rect width="1280" height="720" fill={K.paper} />
    <path d="M0 0H1280V8H0Z" fill={K.ink} />
    <g opacity={1 - form}><ScheduleGraphic frame={frame} cues={cues} /></g>
    <WorkOrder frame={frame} cues={cues} />
  </svg>;
}

export default { BrakeReport, ServiceSchedule };
