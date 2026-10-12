import React from 'react';
import { useCurrentFrame } from 'remotion';

const clamp = value => Math.max(0, Math.min(1, value));
const rise = (frame, from, length = 16) => clamp((frame - from) / length);

function CinemaSatire({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const phase = shot.scene.data.phase;
  const fallback = ratio => Math.round(durationFrames * ratio);
  const cue = (id, phrase, ratio) => cueFrame(id, phrase) ?? fallback(ratio);
  const promiseAt = cue('s002', '告别映前广告', .48);
  const commercialAt = cue('s003', '商业宣传片', .4);
  const twelveAt = cue('s003', '十二分钟', .67);
  const filmAt = cue('s004', '电影才开始', .78);
  const renameAt = cue('s006', '品牌合作内容', .45);
  const remainsAt = cue('s008', '十二分钟还在', .58);
  const priceAt = cue('s009', '票价没变', .35);
  const timeAt = cue('s010', '十二分钟也不会少一分钟', .57);
  const commercial = phase === 'clock' || phase === 'rename';
  const showFilm = phase === 'clock' && frame >= filmAt;
  const fill = phase === 'clock' ? rise(frame, commercialAt, Math.max(1, twelveAt - commercialAt)) : 1;
  const rename = phase === 'rename' && frame >= renameAt;
  const minute = phase === 'clock' ? Math.round(12 * fill) : 12;
  const markerX = 352 + 650 * fill;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ fontFamily: 'Noto Sans CJK SC, PingFang SC, sans-serif' }}>
    <rect width="1280" height="720" fill="#171e2b" />
    <path d="M0 520L220 440H1060L1280 520V720H0Z" fill="#242938" />
    <rect x="230" y="105" width="820" height="350" rx="15" fill="#e8dfc8" stroke="#8e8066" strokeWidth="7" />
    <rect x="256" y="130" width="768" height="300" rx="7" fill={showFilm ? '#384f62' : '#28455a'} />
    {phase === 'promise' && <g opacity={rise(frame, promiseAt)}>
      <rect x="340" y="190" width="600" height="180" rx="12" fill="#f3e7c9" stroke="#c39c69" strokeWidth="3" />
      <path d="M340 245H940M340 310H940" stroke="#cfbea2" strokeDasharray="8 8" />
      <text x="640" y="228" textAnchor="middle" fill="#39445a" fontSize="28">青禾影城 · 虚构票面</text>
      <text x="640" y="298" textAnchor="middle" fill="#2b3442" fontSize="43" fontWeight="700">告别映前广告</text>
      <text x="640" y="353" textAnchor="middle" fill="#795c4a" fontSize="24">周六 19:00 开场</text>
    </g>}
    {commercial && !showFilm && <g>
      <circle cx="490" cy="275" r="68" fill="#d7ab80" opacity=".85" />
      <rect x="560" y="205" width="175" height="145" rx="15" fill="#85aaae" />
      <path d="M830 220L780 300L850 345" fill="none" stroke="#d8c497" strokeWidth="24" strokeLinecap="round" />
      <text x="640" y="398" textAnchor="middle" fill="#fff4d6" fontSize="33">商业宣传片</text>
    </g>}
    {showFilm && <g opacity={rise(frame, filmAt)}><path d="M390 354L560 195L680 310L810 220L920 355Z" fill="#99b5aa" /><circle cx="782" cy="203" r="38" fill="#e8ca83" /><text x="640" y="404" textAnchor="middle" fill="#f9edcf" fontSize="32">正片开始</text></g>}
    {phase === 'clock' && <g>
      <circle cx="1130" cy="265" r="87" fill="#f3ead7" stroke="#c3a475" strokeWidth="5" />
      <path d="M1130 265V208" stroke="#34465b" strokeWidth="7" strokeLinecap="round" transform={`rotate(${minute * 6} 1130 265)`} />
      <text x="1130" y="390" textAnchor="middle" fill="#fff0ce" fontSize="36">19:{String(minute).padStart(2, '0')}</text>
    </g>}
    {phase === 'rename' && <g>
      <rect x="420" y="148" width="440" height="60" rx="6" fill="#f2e7ce" />
      <text x="640" y="191" textAnchor="middle" fill="#33445d" fontSize="32">{rename ? '品牌合作内容' : '广告'}</text>
      {rename && <path d="M770 204L905 155" stroke="#d0876e" strokeWidth="4" />}
      <text x="640" y="475" textAnchor="middle" fill="#fae5ba" fontSize="31" opacity={rise(frame, remainsAt)}>占时仍是 12 分钟</text>
    </g>}
    {phase === 'comparison' && <g>
      <path d="M300 235H980M300 395H980" stroke="#5f6c7c" strokeWidth="6" />
      <circle cx="420" cy="235" r="26" fill="#d6b67f" /><circle cx="420" cy="395" r="26" fill="#9cb2b8" />
      <text x="300" y="202" fill="#f0e7d1" fontSize="30">票价</text><text x="300" y="362" fill="#f0e7d1" fontSize="30">映前占时</text>
      <g opacity={rise(frame, priceAt)}><path d="M420 235H760" stroke="#d6b67f" strokeWidth="18" /><text x="900" y="245" textAnchor="middle" fill="#f5e8c8" fontSize="30">未变</text></g>
      <g opacity={rise(frame, timeAt)}><path d="M420 395H760" stroke="#9cb2b8" strokeWidth="18" /><text x="900" y="405" textAnchor="middle" fill="#f5e8c8" fontSize="30">仍 12 分钟</text></g>
    </g>}
    {(phase === 'clock' || phase === 'rename') && <g>
      <path d="M352 523H1002" stroke="#5e6777" strokeWidth="17" strokeLinecap="round" />
      <path d={`M352 523H${markerX}`} stroke="#d2a36f" strokeWidth="17" strokeLinecap="round" />
      <circle cx={markerX} cy="523" r="17" fill="#fae6bd" />
      <text x="352" y="574" textAnchor="middle" fill="#efdfc6" fontSize="27">19:00</text>
      <text x="1002" y="574" textAnchor="middle" fill="#efdfc6" fontSize="27">19:12</text>
    </g>}
    <rect x="54" y="39" width="185" height="42" rx="8" fill="#764d4c" />
    <text x="146" y="68" textAnchor="middle" fill="#fff3d8" fontSize="25">完全虚构</text>
  </svg>;
}

export default { CinemaSatire };
