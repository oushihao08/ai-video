import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const ease = (frame, start, length = 14) => {
  const t = clamp((frame - start) / length);
  return t * t * (3 - 2 * t);
};
function RisoComic({ cueFrame }) {
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
  const answer = cue('排我什么班', 'end');
  const voiceFlash = ease(frame, bell, 7);
  const facing = ease(frame, welcome, 11);
  const splash = frame >= turn;
  const roster = ease(frame, answer, 11);
  const bounce = frame >= turn ? Math.sin((frame - turn) * 2.2) * 10 : 0;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily:'PingFang SC, sans-serif'}}>
    <defs>
      <pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.3" fill="#142b59" opacity=".28"/></pattern>
      <pattern id="stripes" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><path d="M0 0v18" stroke="#e54f3d" strokeWidth="6" opacity=".25"/></pattern>
    </defs>
    <rect width="1280" height="720" fill="#f5e8c9"/>
    <path d="M0 0h1280v520q-234-20-449 15-360 52-831-3z" fill="#f0d5a1"/>
    <path d="M0 0h1280v520q-234-20-449 15-360 52-831-3z" fill="url(#dots)"/>
    <path d="M0 531q290-22 571 9 346 37 709-9v189H0z" fill="#193462"/>
    <path d="M0 531q290-22 571 9 346 37 709-9v189H0z" fill="url(#stripes)"/>
    <path d="M59 93h423v104H59z" fill="#e54f3d" stroke="#172d59" strokeWidth="9"/>
    <text x="87" y="163" fill="#fff4d8" fontSize="48" fontWeight="900">自助更快</text>
    <path d="M490 205h294v275H490z" fill="#f0bd4f" stroke="#172d59" strokeWidth="10"/>
    <path d="M516 236h240v80H516z" fill="#172d59" stroke="#fdf0cf" strokeWidth="6"/>
    <text x="636" y="286" textAnchor="middle" fill="#fff1cf" fontSize="23" fontWeight="800">{frame >= welcome ? '欢迎下次光临' : '自助制作'}</text>
    <path d="M463 486h347v37H463z" fill="#e54f3d" stroke="#172d59" strokeWidth="8"/>
    <path d="M924 120h283v403H924z" fill="#e54f3d" stroke="#172d59" strokeWidth="11"/>
    <path d="M955 155h219v302H955z" fill="#ffdf90" stroke="#172d59" strokeWidth="8"/>
    <path d="M955 155h219v302H955z" fill="url(#dots)"/>
    <path d="M956 471h219" stroke="#172d59" strokeWidth="13"/>
    {frame >= wash && <g fill="#2195a4" stroke="#f8ebcd" strokeWidth="4"><path d="M540 500q20 28 0 43-18-14 0-43"/><path d="M720 492q17 24 0 37-15-13 0-37"/></g>}
    <g transform={`translate(${780 + facing*30} ${425 + bounce})`}>
      <path d="M-67 20q66-35 128 2l26 147h-190z" fill="#e54f3d" stroke="#172d59" strokeWidth="12" strokeLinejoin="round"/>
      <path d="M-57-3q-4-80 50-86 65-3 67 82" fill="#f2a87d" stroke="#172d59" strokeWidth="11" strokeLinejoin="round"/>
      <path d="M-54-31q19-86 96-54l15 39-15-18-49-3-24 26z" fill="#172d59"/>
      <circle cx="-23" cy="-13" r="5" fill="#172d59"/><circle cx="24" cy="-13" r="5" fill="#172d59"/>
      <path d="M-6 8q18 12 35-2" fill="none" stroke="#172d59" strokeWidth="5"/>
      <g transform={`rotate(${splash ? bounce*2.5 : -16} -41 42)`}>
        <path d="M-41 42l-78 33" stroke="#e54f3d" strokeWidth="24" strokeLinecap="round"/>
        <path d="M-41 42l-78 33" stroke="#172d59" strokeWidth="10" strokeLinecap="round"/>
      </g>
    </g>
    {voiceFlash > 0 && <g fill="none" stroke="#e54f3d" strokeWidth="8" opacity={voiceFlash}>
      <path d={`M768 251q${35+voiceFlash*65} -54 ${75+voiceFlash*145} -43`}/><path d={`M780 296q${52+voiceFlash*60} 18 ${95+voiceFlash*125} 67`}/>
    </g>}
    {splash && <g fill="#2195a4" stroke="#172d59" strokeWidth="5">
      <path d={`M${693+Math.sin(frame)*18} ${366-Math.abs(Math.sin((frame-turn)/3))*57}q17 23 0 34-16-13 0-34`}/>
      <path d={`M${660+Math.cos(frame/2)*16} ${397-Math.abs(Math.cos((frame-turn)/3))*39}q14 20 0 29-13-10 0-29`}/>
      <path d={`M${726+Math.sin(frame/3)*13} ${387-Math.abs(Math.sin((frame-turn)/3))*27}q11 16 0 23-10-9 0-23`}/>
    </g>}
    <g transform={`translate(96 ${217 + (1-roster)*155}) rotate(-2)`} opacity={roster}>
      <path d="M0 0h183v179H0z" fill="#fdf0ce" stroke="#172d59" strokeWidth="9"/>
      <path d="M0 46h183M0 91h183M0 136h183M61 46v133M122 46v133" stroke="#e54f3d" strokeWidth="6"/>
      <path d="M20 23h143" stroke="#172d59" strokeWidth="8"/>
      <path d="M20 67h18M81 112h18M141 158h18" stroke="#2195a4" strokeWidth="13" strokeLinecap="round"/>
    </g>
    <path d="M0 670q216-21 430 0 400 35 850-2" fill="none" stroke="#fff1d1" strokeWidth="3" opacity=".5"/>
  </svg>;
}
export default { TeaShop: RisoComic };
