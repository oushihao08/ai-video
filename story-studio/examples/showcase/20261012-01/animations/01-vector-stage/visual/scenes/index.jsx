import React from 'react';
import { useCurrentFrame } from 'remotion';

const C = { ink: '#213831', paper: '#f5edda', green: '#206b55', mint: '#c4ddd1', orange: '#e88742', yellow: '#f3cd62', tea: '#ad7755' };
const ease = (frame, from, length = 22) => {
  const t = Math.max(0, Math.min(1, (frame - from) / length));
  return t * t * (3 - 2 * t);
};
function Person({ x, y = 415, wet = false, turn = false, arm = 0, walk = 0 }) {
  return <g transform={`translate(${x} ${y + Math.sin(walk) * 3})`} stroke={C.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-23 90L-31 162M24 90L37 162" fill="none" />
    <path d="M-39 0Q0 -18 39 0L45 90H-42Z" fill={C.orange} />
    <path d={`M-32 14L-66 ${44 + arm}M34 15L72 ${26 + arm}`} fill="none" />
    <circle cy="-48" r="44" fill="#efc4a0" />
    <path d="M-39 -60Q-32 -111 20 -91Q48 -91 44 -48L26 -65L-3 -65L-16 -48Z" fill={C.ink} />
    <circle cx={turn ? -13 : 5} cy="-48" r="3" fill={C.ink} stroke="none" />
    <circle cx={turn ? 9 : 26} cy="-48" r="3" fill={C.ink} stroke="none" />
    <path d={turn ? 'M-8 -26Q3 -18 17 -28' : 'M3 -25H21'} fill="none" strokeWidth="4" />
    {wet && <g stroke="#549ac4" strokeWidth="4"><path d="M-70 63L-79 77M-62 71L-64 87M78 45L88 59M71 58L77 74" /></g>}
  </g>;
}
function Cup({ x, y, fill = 1, lid = true }) {
  return <g transform={`translate(${x} ${y})`} stroke={C.ink} strokeWidth="4">
    <path d="M-25 -65H25L20 0H-20Z" fill="#fff8e8" />
    <path d={`M-19 ${-53 * fill}H19L16 -5H-16Z`} fill={C.tea} stroke="none" />
    {lid && <path d="M-30 -68H30" strokeWidth="8" />}
    <circle cy="-31" r="9" fill={C.yellow} stroke="none" />
  </g>;
}
function Machine({ prompt = '', flow = 0 }) {
  return <g stroke={C.ink} strokeWidth="5" strokeLinejoin="round">
    <rect x="500" y="192" width="270" height="300" rx="25" fill={C.mint} />
    <rect x="524" y="217" width="222" height="92" rx="12" fill={C.ink} />
    <text x="635" y="257" fill={C.paper} stroke="none" fontSize="22" textAnchor="middle">{prompt || '自助制作'}</text>
    <circle cx="550" cy="284" r="4" fill={C.yellow} stroke="none" />
    <rect x="553" y="335" width="165" height="134" rx="12" fill="#f9f4e7" />
    <path d="M622 318V348H650V318" fill={C.ink} />
    {flow > 0 && <path d={`M636 349V${349 + 77 * flow}`} stroke={C.tea} strokeWidth="9" />}
  </g>;
}
function Filter({ x, y, dirty = true, rotation = 0 }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotation})`} stroke={C.ink} strokeWidth="4">
    <path d="M-26 0H26L15 24H-15Z" fill="#eee9dc" />
    <path d="M-38 -2H38" />
    {dirty && <path d="M-18 3H18L10 13H-10Z" fill={C.tea} stroke="none" />}
  </g>;
}
function TeaShop({ shot, cueFrame }) {
  const frame = useCurrentFrame();
  const stage = shot.scene.data.stage;
  const sentenceId = `s00${stage}`;
  const cue = (phrase, edge = 'start') => {
    const value = cueFrame(sentenceId, phrase, edge);
    if (value === null) throw new Error(`本期关键动作缺真实词时间：${sentenceId} ${phrase}`);
    return value;
  };
  const tea = stage === 1 ? ease(frame, cue('接茶'), 25) : 1;
  const sealed = stage !== 1 || frame >= cue('封口');
  const extra = stage === 2 ? frame >= cue('茶渣') : false;
  const wash = stage === 2 ? frame >= cue('冲洗滤网') : false;
  const toSink = stage === 2 ? ease(frame, cue('水池') - 12, 30) : 0;
  const welcome = stage === 3 && frame >= cue('欢迎下次光临');
  const reply = stage === 3 && frame >= cue('排我什么班', 'end');
  const turn = stage === 3 && frame >= cue('甩甩');
  const personX = stage === 1 ? 330 + ease(frame, 0, 28) * 30 : stage === 2 ? 360 + toSink * 440 : 1030 - ease(frame, cue('欢迎下次光临'), 25) * 90;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'PingFang SC, sans-serif' }}>
    <rect width="1280" height="720" fill={C.paper} />
    <rect x="0" y="534" width="1280" height="186" fill="#d9ccb0" />
    <path d="M0 534H1280" stroke={C.ink} strokeWidth="6" />
    <rect x="57" y="50" width="398" height="98" rx="10" fill={C.green} />
    <text x="86" y="115" fill={C.paper} fontSize="48" fontWeight="700">自助更快</text>
    <text x="1220" y="59" textAnchor="end" fill={C.green} fontSize="21">虚构小剧场 · AI 配音 / 动画</text>
    <g stroke={C.ink} strokeWidth="5">
      <rect x="1110" y="169" width="128" height="363" rx="6" fill="#b9d8c9" />
      <rect x="1132" y="191" width="83" height="235" fill="#e8f2e3" />
      <circle cx="1128" cy="447" r="5" fill={C.ink} />
    </g>
    <text x="1174" y="150" fontSize="22" fill={C.ink} textAnchor="middle">出口</text>
    <rect x="463" y="492" width="351" height="40" rx="6" fill={C.green} stroke={C.ink} strokeWidth="5" />
    <Machine prompt={stage === 2 && extra ? (wash ? '请冲洗滤网' : '请倒掉茶渣') : ''} flow={stage === 1 && !sealed ? tea : 0} />
    {(stage === 1 || stage === 2) && <Cup x={636} y={475} fill={tea} lid={sealed} />}
    <g stroke={C.ink} strokeWidth="5" fill="none">
      <rect x="870" y="434" width="204" height="98" rx="12" fill={C.mint} />
      <path d="M895 436Q970 501 1050 436" fill="#a0b8ae" />
      <path d="M1007 429V364Q1007 340 980 340H954V363" />
      {toSink > .8 && <path d={`M954 365V420`} stroke="#569ec3" strokeWidth="8" strokeDasharray={`${9 + frame % 4} 5`} />}
    </g>
    {stage === 2 && extra && <Filter x={820 + toSink * 100} y={415 - toSink * 5} dirty={!wash} rotation={wash ? 0 : Math.sin(frame / 9) * 20} />}
    <Person x={personX} turn={turn} wet={turn} arm={toSink > .8 ? -20 : turn ? Math.sin(frame / 3) * 9 : 0} walk={toSink > 0 && toSink < 1 ? frame / 3 : 0} />
    {stage === 3 && <Cup x={personX - 71} y={464} />}
    {welcome && <g stroke={C.ink} strokeWidth="4">
      <path d="M779 102H815L845 80V157L815 138H779Z" fill={C.yellow} />
      <path d="M859 96Q880 116 859 140M874 85Q905 117 874 152" fill="none" />
    </g>}
    {reply && <g transform={`translate(95 ${239 + (1 - ease(frame, cue('排我什么班', 'end'), 13)) * 35})`}>
      <rect width="233" height="190" rx="14" fill="#fff9e7" stroke={C.ink} strokeWidth="5" />
      <path d="M0 52H233" stroke={C.ink} strokeWidth="5" />
      <text x="116" y="36" textAnchor="middle" fontSize="25" fill={C.ink}>明天</text>
      <text x="116" y="132" textAnchor="middle" fontSize="60" fontWeight="700" fill={C.green}>排班？</text>
    </g>}
  </svg>;
}

export default { TeaShop };
