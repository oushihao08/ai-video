import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = (frame, start, length = 16) => {
  const t = clamp((frame - start) / length);
  return t * t * (3 - 2 * t);
};
function PaperTheatre({ cueFrame }) {
  const frame = useCurrentFrame();
  const cue = (phrase, edge = 'start') => {
    const value = cueFrame('s003', phrase, edge);
    if (value === null) throw new Error(`本期关键动作缺真实词时间：s003 ${phrase}`);
    return value;
  };
  const wash = cue('洗完', 'end');
  const bell = cue('喇叭响了');
  const welcome = cue('欢迎下次光临');
  const turn = cue('甩甩');
  const joke = cue('排我什么班', 'end');
  const door = ease(frame, welcome, 14);
  const hand = ease(frame, turn, 10);
  const schedule = ease(frame, joke, 12);
  const drops = frame >= wash;
  const armAngle = hand < 0.1 ? -16 : Math.sin((frame - turn) * 1.9) * 39;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily:'PingFang SC, sans-serif'}}>
    <defs>
      <filter id="paperShadow" x="-30%" y="-30%" width="170%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="7" dy="9" result="offset"/><feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id="speckle" width="46" height="42" patternUnits="userSpaceOnUse"><circle cx="6" cy="9" r="1.3" fill="#5b5362" opacity=".17"/><path d="M22 31l5-1" stroke="#5b5362" opacity=".12"/></pattern>
    </defs>
    <rect width="1280" height="720" fill="#d9e1c8"/>
    <path d="M0 0h1280v522q-175 30-326 0-213 26-418 0-248 29-536-2z" fill="#a8bfaa"/>
    <rect width="1280" height="720" fill="url(#speckle)"/>
    <path d="M78 110q-5-48 48-49h180q54 1 50 49v395H80z" fill="#f3dfac" stroke="#675b58" strokeWidth="8" filter="url(#paperShadow)"/>
    <path d="M84 180h267M84 470h267" stroke="#8d715f" strokeWidth="11"/>
    <g filter="url(#paperShadow)">
      <path d="M91 125q-2-10 10-10h174q12 1 12 12v174q0 10-11 10H102q-11 0-11-10z" fill="#9c704f" stroke="#675b58" strokeWidth="6"/>
      <path d="M103 138h170v148H103z" fill="#c7a979" stroke="#f3dfac" strokeWidth="5"/>
      <circle cx="188" cy="132" r="7" fill="#bd6654" stroke="#675b58" strokeWidth="3"/>
    </g>
    <path d="M154 425v-72q0-20 24-20h90q25 0 25 20v72" fill="#769b8c" stroke="#675b58" strokeWidth="7"/>
    <path d="M168 354q48 35 99 0v62h-99z" fill="#bfd1bd"/>
    <path d="M203 287v57" stroke="#675b58" strokeWidth="8"/>
    <path d="M186 291q17 15 34 0" fill="none" stroke="#675b58" strokeWidth="7"/>
    {drops && <g fill="#6da8bf" stroke="#f3dfac" strokeWidth="3"><path d="M183 447q13 17 0 27-13-10 0-27"/><path d="M236 445q12 16 0 25-12-10 0-25"/></g>}
    <path d="M412 527V187q0-87 92-87h281q91 0 91 87v340z" fill="#e9c96f" stroke="#675b58" strokeWidth="9" filter="url(#paperShadow)"/>
    <path d="M448 161q0-27 30-27h336q30 0 30 27v67H448z" fill="#6f977f" stroke="#675b58" strokeWidth="7"/>
    <text x="646" y="207" textAnchor="middle" fill="#fff2d1" fontSize="42" fontWeight="700">自助更快</text>
    <path d="M466 469h360v34H466z" fill="#bd905e" stroke="#675b58" strokeWidth="7"/>
    <path d="M510 461v-143q0-15 17-15h247q17 0 17 15v143" fill="#bfd1bd" stroke="#675b58" strokeWidth="8"/>
    <rect x="540" y="334" width="216" height="68" rx="4" fill="#3a5255" stroke="#f3dfac" strokeWidth="8"/>
    <text x="648" y="377" textAnchor="middle" fill="#fff1ce" fontSize="23">{frame >= bell ? '欢迎下次光临' : '自助制作'}</text>
    <path d="M955 125q-8-36 26-36h207q34 0 29 36v393H954z" fill="#f1e0b4" stroke="#675b58" strokeWidth="9" filter="url(#paperShadow)"/>
    <path d="M985 168h201v238H985z" fill="#9db7a9" stroke="#675b58" strokeWidth="7"/>
    <path d="M1003 190h163v199h-163z" fill="#dce7d1" stroke="#675b58" strokeWidth="5"/>
    <circle cx="1144" cy="296" r="7" fill="#675b58"/>
    <path d="M1020 421h126" stroke="#8d715f" strokeWidth="9"/>
    <g opacity={clamp(ease(frame, bell, 5))} stroke="#675b58" strokeWidth="8" fill="#f3b94e" transform={`translate(878 255) rotate(${Math.sin((frame - bell) / 3) * 4})`}>
      <path d="M0 0h30l39-28v84L30 28H0z"/><path d="M82-16q25 18 0 36M96-31q44 33 0 66" fill="none"/>
    </g>
    <g transform={`translate(${door ? 1044 : 982} ${420 + Math.sin(frame/8)*2})`} filter="url(#paperShadow)">
      <path d="M-61 5q62-26 120 2l28 154h-174z" fill="#ba705b" stroke="#fff0ce" strokeWidth="15" strokeLinejoin="round"/>
      <path d="M-44 30q44-67 89-2v-48q-5-54-46-56-43 7-43 55z" fill="#d99b75" stroke="#fff0ce" strokeWidth="13" strokeLinejoin="round"/>
      <path d="M-34-21q2-40 36-44 38 3 42 43" fill="none" stroke="#594b4d" strokeWidth="13"/>
      <circle cx="-13" cy="-18" r="4" fill="#473f44"/><circle cx="18" cy="-18" r="4" fill="#473f44"/>
      <path d="M-10 2q13 11 27 0" fill="none" stroke="#473f44" strokeWidth="4"/>
      <g transform={`rotate(${armAngle} -5 26)`}>
        <path d="M-43 35l-63 57" fill="none" stroke="#ba705b" strokeWidth="20" strokeLinecap="round"/>
        <path d="M-43 35l-63 57" fill="none" stroke="#fff0ce" strokeWidth="27" strokeLinecap="round" strokeDasharray="1 200"/>
      </g>
    </g>
    {hand > 0.1 && <g fill="#6da8bf" stroke="#fff0ce" strokeWidth="4"><path d={`M${934+Math.sin(frame)*19} ${367-Math.abs(Math.sin((frame-turn)/3))*50}q13 19 0 29-13-10 0-29`}/><path d={`M${914+Math.cos(frame/2)*15} ${390-Math.abs(Math.cos((frame-turn)/3))*35}q11 16 0 24-11-8 0-24`}/></g>}
    <g transform={`translate(105 ${139 + (1-schedule)*18}) scale(.9) rotate(-1)`} opacity={schedule} filter="url(#paperShadow)">
      <path d="M0 0h183v158H0z" fill="#fff1ce" stroke="#675b58" strokeWidth="6"/>
      <path d="M0 42h183M0 81h183M0 120h183M61 42v116M122 42v116" stroke="#a76258" strokeWidth="4"/>
      <path d="M17 18h148" stroke="#675b58" strokeWidth="6"/>
      <circle cx="30" cy="61" r="7" fill="#718f77"/><circle cx="92" cy="100" r="7" fill="#718f77"/><circle cx="152" cy="139" r="7" fill="#718f77"/>
    </g>
  </svg>;
}
export default { TeaShop: PaperTheatre };
