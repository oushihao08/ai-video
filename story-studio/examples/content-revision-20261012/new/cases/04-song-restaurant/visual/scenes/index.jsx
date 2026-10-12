import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const rise = (frame, from, length = 15) => clamp((frame - from) / length);
const colors = ['#a8694f', '#5896a6', '#8b9a54'];
const labels = ['热', '冷', '做法'];
const seats = [[205, 245], [205, 365], [205, 485]];
const Bowl = ({ x, y, color = '#d7c398', scale = 1 }) => <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="-7" rx="20" ry="6" fill="#f6ecd4" stroke={color} strokeWidth="3" /><path d="M-20 -7Q-17 13 0 17Q17 13 20 -7" fill="#f5ead0" stroke={color} strokeWidth="3" /></g>;

function RestaurantFlow({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const phase = shot.scene.data.phase;
  const fallback = ratio => Math.round(durationFrames * ratio);
  const cue = (id, phrase, ratio) => cueFrame(id, phrase) ?? fallback(ratio);
  const askAt = cue('s002', '要求还各不相同', .24);
  const callAt = cue('s004', '从头唱念', .31);
  const leftAt = cue('s006', '左手托着三碗', .21);
  const rightAt = cue('s006', '约二十碗', .47);
  const deliverAt = cue('s007', '送到各人面前', .7);
  const wrongAt = cue('s008', '一旦送错', .18);
  const scoldAt = cue('s008', '挨骂', .44);
  const wageAt = cue('s008', '被扣工钱', .59);
  const dismissAt = cue('s008', '被辞退', .75);
  const showOrders = phase === 'orders' ? rise(frame, askAt) : 1;
  const showCall = phase === 'call' ? rise(frame, callAt) : phase === 'orders' ? rise(frame, fallback(.68), 20) : 1;
  const leftBowls = phase === 'serve' ? rise(frame, leftAt) : phase === 'consequence' ? 1 : 0;
  const rightBowls = phase === 'serve' ? rise(frame, rightAt) : phase === 'consequence' ? 1 : 0;
  const delivered = phase === 'serve' ? rise(frame, deliverAt, 25) : phase === 'consequence' ? 1 : 0;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif' }}>
    <rect width="1280" height="720" fill="#eee4cd" />
    <path d="M0 175H1280M0 580H1280" stroke="#c9b794" strokeWidth="5" />
    <rect x="755" y="185" width="410" height="365" rx="16" fill="#ded0ae" stroke="#8a7050" strokeWidth="5" />
    <text x="955" y="231" textAnchor="middle" fill="#514535" fontSize="29">厨房</text>
    <path d="M710 180V570" stroke="#917c5c" strokeWidth="13" strokeDasharray="23 16" />
    <text x="110" y="210" fill="#514535" fontSize="27">客席</text>
    {seats.map(([x, y], index) => <g key={index}>
      <rect x={x + 70} y={y - 27} width="148" height="55" rx="17" fill="#baab8b" />
      <circle cx={x} cy={y} r="28" fill="#705d4a" /><circle cx={x} cy={y + 47} r="29" fill="#aa8f70" />
      <circle cx={x + 120} cy={y} r="22" fill={colors[index]} opacity={showOrders} />
      <text x={x + 120} y={y + 8} textAnchor="middle" fill="#fff9e9" fontSize="24" opacity={showOrders}>{labels[index]}</text>
    </g>)}
    {(phase === 'orders' || phase === 'call') && <g opacity={showCall}>
      {[0, 1, 2].map(index => <path key={index} d={`M350 ${245 + 120 * index}C520 ${245 + 90 * index} 590 ${280 + 30 * index} 800 345`} fill="none" stroke={colors[index]} strokeWidth="7" strokeDasharray="14 10" />)}
      {phase === 'call' && <g transform="translate(670 333)"><circle r={16 + 15 * showCall} fill="none" stroke="#8e694c" strokeWidth="4" /><circle r={33 + 20 * showCall} fill="none" stroke="#8e694c" strokeWidth="3" /><text x="-86" y="-57" fill="#514535" fontSize="28">唱报</text></g>}
      {phase === 'call' && <g><circle cx="955" cy="346" r="27" fill="#705d4a" /><path d="M955 374V448" stroke="#705d4a" strokeWidth="22" /><text x="955" y="492" textAnchor="middle" fill="#514535" fontSize="26">铛头接到要求</text></g>}
    </g>}
    {(phase === 'serve' || phase === 'consequence') && <g>
      <circle cx="690" cy="305" r="27" fill="#705d4a" />
      <path d="M690 333V469M682 383L580 435M700 383L820 275" fill="none" stroke="#705d4a" strokeWidth="22" strokeLinecap="round" />
      <path d="M690 467L650 535M690 467L733 535" stroke="#705d4a" strokeWidth="20" strokeLinecap="round" />
      {[0, 1, 2].map(index => <Bowl key={`left-${index}`} x={550 + index * 24} y={425 - index * 15} color={colors[index]} scale={.76 * leftBowls} />)}
      {Array.from({ length: 20 }, (_, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        return <Bowl key={`right-${index}`} x={790 + column * 14 - row * 11} y={304 - row * 16 - column * 8} color="#a18b67" scale={.52 * rightBowls} />;
      })}
      <text x="480" y="525" fill="#5c4a3a" fontSize="29" opacity={leftBowls}>左手 3 碗</text>
      <text x="930" y="315" fill="#5c4a3a" fontSize="29" opacity={rightBowls}>右臂约 20 碗</text>
      {[0, 1, 2].map(index => <g key={`delivery-${index}`} opacity={delivered}>
        <path d={`M560 ${407 + 12 * index}Q430 ${330 + 70 * index} 344 ${245 + 120 * index}`} fill="none" stroke={colors[index]} strokeWidth="7" />
        <Bowl x={344} y={245 + 120 * index} color={colors[index]} scale={.76} />
      </g>)}
    </g>}
    {phase === 'consequence' && <g>
      <path d="M410 245Q470 330 410 365" fill="none" stroke="#b74f42" strokeWidth="11" strokeDasharray="13 9" opacity={rise(frame, wrongAt)} />
      <path d="M390 305l42 42m0-42l-42 42" stroke="#b74f42" strokeWidth="8" opacity={rise(frame, wrongAt)} />
      <text x="490" y="278" fill="#8d4039" fontSize="29" opacity={rise(frame, wrongAt)}>错配示意</text>
      <rect x="785" y="366" width="390" height="158" rx="9" fill="#f7eed8" stroke="#a17f5e" strokeWidth="3" opacity={rise(frame, scoldAt)} />
      <text x="815" y="405" fill="#694337" fontSize="24" opacity={rise(frame, scoldAt)}>可能：叱骂</text>
      <text x="815" y="455" fill="#694337" fontSize="24" opacity={rise(frame, wageAt)}>可能：罚工价</text>
      <text x="815" y="505" fill="#694337" fontSize="24" opacity={rise(frame, dismissAt)}>严重时：逐之</text>
    </g>}
    <rect x="0" y="0" width="1280" height="106" fill="#4d5345" />
    <text x="45" y="68" fill="#fff0cf" fontSize="34" fontWeight="700">食店里的要求，怎样回到每个人</text>
    <text x="1240" y="68" textAnchor="end" fill="#f8e7bc" fontSize="23">《东京梦华录》追记 · 流程示意</text>
  </svg>;
}

export default { RestaurantFlow };
