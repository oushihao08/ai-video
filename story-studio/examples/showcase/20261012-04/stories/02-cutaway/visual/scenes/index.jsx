import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function OnionSection({ cx, cy, rx, ry, compression = 0, scale = 1, incision = false }) {
  const rings = [
    [0.88, 0.78, '#f6d9a2'],
    [0.75, 0.64, '#f3cc91'],
    [0.62, 0.51, '#f8e7c2'],
    [0.48, 0.39, '#d9e9dc'],
    [0.34, 0.28, '#ecdfb4'],
    [0.21, 0.17, '#b7d4ce'],
  ];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale} ${scale}) translate(${-cx} ${-cy})`}>
      <ellipse cx={cx + 8} cy={cy + 16} rx={rx} ry={ry} fill="#020c17" opacity=".52" filter="url(#softBlur)" />
      <ellipse cx={cx} cy={cy + 9} rx={rx} ry={ry} fill="#7b492e" opacity=".75" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#skinGradient)" stroke="#f2c78b" strokeWidth="5" />
      <g transform={`translate(${cx} ${cy}) scale(1 ${1 - compression * 0.085}) translate(${-cx} ${-cy})`}>
        <ellipse cx={cx} cy={cy} rx={rx * 0.94} ry={ry * 0.9} fill="url(#fleshGradient)" />
        {rings.map(([rxFactor, ryFactor, color], index) => (
          <ellipse
            key={`ring-${index}`}
            cx={cx - compression * (index % 2 ? 8 : 3)}
            cy={cy + compression * 8}
            rx={rx * rxFactor}
            ry={ry * ryFactor}
            fill={color}
            fillOpacity={index % 2 ? '.37' : '.55'}
            stroke="#fff1d2"
            strokeOpacity=".58"
            strokeWidth={Math.max(1.2, rx * 0.009)}
          />
        ))}
        <ellipse cx={cx - 12} cy={cy + 8} rx={rx * 0.105} ry={ry * 0.09} fill="#f3dba9" stroke="#fff1d7" strokeWidth="2" />
        <path d={`M${cx - rx * 0.78} ${cy - ry * 0.05} Q${cx - rx * 0.3} ${cy - ry * 0.53} ${cx + rx * 0.42} ${cy - ry * 0.24}`} fill="none" stroke="#fff8e8" strokeOpacity=".55" strokeWidth={Math.max(3, rx * 0.018)} />
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#ffd9a6" strokeWidth="4" />
      <path d={`M${cx - rx * 0.82} ${cy - ry * 0.39} Q${cx - rx * 0.43} ${cy - ry * 0.95} ${cx + rx * 0.22} ${cy - ry * 0.84}`} fill="none" stroke="#fff0d4" strokeOpacity=".52" strokeWidth="5" strokeLinecap="round" />
      {incision && <path d={`M${cx + rx * 0.69} ${cy - ry * 0.76} Q${cx + rx * 0.58} ${cy - ry * 0.08} ${cx + rx * 0.48} ${cy + ry * 0.64}`} fill="none" stroke="#132b3a" strokeWidth={Math.max(3, rx * 0.025)} />}
    </g>
  );
}

function Knife({ x, tipY, dull = false, scale = 1, angle = 8 }) {
  return (
    <g transform={`translate(${x} ${tipY}) scale(${scale}) rotate(${angle})`}>
      <path d="M-24 -296 Q0 -305 27 -292 L9 -17 L0 0 L-11 -15 Z" fill="url(#bladeGradient)" stroke="#dbeaf0" strokeWidth="2" />
      <path d="M-16 -283 L-14 -403 Q0 -426 16 -403 L18 -282 Q0 -268 -16 -283 Z" fill="url(#handleGradient)" stroke="#e9c38f" strokeWidth="2" />
      <path d="M-10 -397 Q0 -406 10 -397" fill="none" stroke="#ffe4b7" strokeOpacity=".7" strokeWidth="3" />
      {dull && <path d="M-8 -3 Q0 4 8 -2" fill="none" stroke="#9c795e" strokeWidth="5" strokeLinecap="round" />}
    </g>
  );
}

function FineMist({ time, x = 722, y = 290, count = 44, travel = 150, tint = '#b9f1ff', life = 9 }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const delay = (index % 11) * 0.035 + (Math.floor(index / 11) % 3) * 0.025;
        const age = time - delay;
        if (age < 0 || age > life) return null;
        const angle = -1.15 + ((index * 37) % 100) / 100 * 2.12;
        const distance = travel * Math.sqrt(clamp(age / 1.28));
        const px = x + Math.cos(angle) * distance + age * 10;
        const py = y + Math.sin(angle) * distance - age * 13;
        const opacity = clamp((age + 0.08) / 0.18) * clamp((life - age) / 1.2) * (0.48 + (index % 4) * 0.12);
        const radius = 1.05 + (index % 5) * 0.22;
        return <circle key={`mist-${index}`} cx={px} cy={py} r={radius} fill={tint} opacity={opacity} />;
      })}
    </g>
  );
}

function SlowDroplets({ time, delay = 1.2, x = 722, y = 290, count = 9, travel = 105, life = 9 }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const age = time - delay - index * 0.11;
        if (age < 0 || age > life) return null;
        const p = clamp(age / 2.25);
        const angle = -0.48 + ((index * 29) % 80) / 100 * 1.03;
        const px = x + Math.cos(angle) * travel * p + age * 8;
        const py = y + Math.sin(angle) * travel * p + age * 4;
        const radius = 3.2 + (index % 4) * 1.05;
        return (
          <g key={`drop-${index}`} opacity={clamp((age + 0.05) / 0.16) * clamp((life - age) / 0.9)}>
            <ellipse cx={px} cy={py} rx={radius + 1.5} ry={radius + 2.2} fill="#83cfe2" opacity=".22" />
            <circle cx={px - 1} cy={py - 1} r={radius} fill="url(#dropGradient)" stroke="#effcff" strokeOpacity=".83" strokeWidth="1.2" />
          </g>
        );
      })}
    </g>
  );
}

function EyeSchematic({ x, y, reveal = 0 }) {
  return (
    <g opacity={reveal} transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx="108" ry="58" fill="#dceef0" fillOpacity=".12" stroke="#d3e9e9" strokeWidth="3" />
      <path d="M-107 0 Q0 -87 107 0 Q0 87 -107 0Z" fill="#152a3c" stroke="#f0dfc3" strokeWidth="3" />
      <ellipse cx="2" cy="0" rx="30" ry="34" fill="#75b1b9" />
      <ellipse cx="2" cy="0" rx="13" ry="17" fill="#172a3a" />
      <circle cx="-3" cy="-8" r="5" fill="#fff6e8" opacity=".8" />
      <path d="M-65 -42 Q0 -71 66 -41" fill="none" stroke="#f0c26e" strokeWidth="4" strokeLinecap="round" opacity={0.35 + reveal * 0.6} />
    </g>
  );
}

function Atmosphere({ irritantReveal, carrierTime, eyeReveal }) {
  const drift = clamp(carrierTime / 4.8);
  return (
    <g>
      <path d={`M710 302 C${790 + 45 * drift} 245 ${850 + 55 * drift} 334 965 316 S1075 322 1080 350`} fill="none" stroke="#edb75d" strokeWidth="54" strokeLinecap="round" opacity={irritantReveal * .13} filter="url(#softBlur)" />
      <path d={`M710 302 C${790 + 45 * drift} 245 ${850 + 55 * drift} 334 965 316 S1075 322 1080 350`} fill="none" stroke="#f5c36d" strokeWidth="2" strokeDasharray="2 15" strokeLinecap="round" opacity={irritantReveal * .68} />
      <path d={`M704 312 C805 367 ${900 + 25 * drift} 390 1008 365`} fill="none" stroke="#f6cf88" strokeWidth="22" strokeLinecap="round" opacity={irritantReveal * .1} filter="url(#softBlur)" />
      <FineMist time={carrierTime} x={727} y={300} count={42} travel={115} />
      <SlowDroplets time={carrierTime} delay={.22} x={724} y={301} count={8} travel={95} />
      <EyeSchematic x={1090} y={374} reveal={eyeReveal} />
    </g>
  );
}

function Label({ x, y, children, color = '#d6e6e7', size = 24, anchor = 'start', opacity = 1 }) {
  return <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} opacity={opacity} fontFamily="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" letterSpacing=".4">{children}</text>;
}

function OnionCutaway({ shot, durationFrames, cueFrame }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frames = Math.max(1, durationFrames - 1);
  const progress = smooth(frame / frames);
  const time = frame / fps;
  const phase = shot?.scene?.data?.phase ?? 'pressure';
  const mistStart = cueFrame?.('s002', '先喷细雾', 'start') ?? Math.round(fps * 1.2);
  const dropsStart = cueFrame?.('s002', '再甩出液滴', 'start') ?? mistStart + Math.round(fps * 1.2);
  const irritantStart = cueFrame?.('s003', '含硫刺激物', 'start') ?? Math.round(fps * 2.1);
  const carrierStart = cueFrame?.('s003', '雾滴把它带到空气里', 'start') ?? Math.round(fps * 3.5);
  const eyeStart = cueFrame?.('s003', '眼睛就发酸', 'start') ?? Math.round(fps * 5.1);
  const irritantReveal = smooth((frame - irritantStart) / 14);
  const eyeReveal = smooth((frame - eyeStart) / 18);
  const carrierTime = Math.max(0, frame - carrierStart) / fps;

  return (
    <svg width="100%" height="100%" viewBox="0 0 1280 720" role="img" aria-label="洋葱切割的科学显微剖面示意">
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a1c2d" />
          <stop offset=".58" stopColor="#18344a" />
          <stop offset="1" stopColor="#102230" />
        </linearGradient>
        <radialGradient id="skinGradient" cx="35%" cy="25%" r="78%">
          <stop offset="0" stopColor="#f8d59f" />
          <stop offset=".58" stopColor="#d49a61" />
          <stop offset="1" stopColor="#845334" />
        </radialGradient>
        <radialGradient id="fleshGradient" cx="42%" cy="37%" r="70%">
          <stop offset="0" stopColor="#fff3d7" />
          <stop offset=".72" stopColor="#edcf9e" />
          <stop offset="1" stopColor="#d5ad79" />
        </radialGradient>
        <linearGradient id="bladeGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#526e7c" />
          <stop offset=".35" stopColor="#e9f5f4" />
          <stop offset=".72" stopColor="#a7c3cb" />
          <stop offset="1" stopColor="#455d6d" />
        </linearGradient>
        <linearGradient id="handleGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#59402e" />
          <stop offset=".5" stopColor="#cf9a5f" />
          <stop offset="1" stopColor="#6e472d" />
        </linearGradient>
        <radialGradient id="dropGradient" cx="28%" cy="25%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".98" />
          <stop offset=".25" stopColor="#bdf4ff" stopOpacity=".92" />
          <stop offset="1" stopColor="#5bbed4" stopOpacity=".54" />
        </radialGradient>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="1280" height="720" fill="url(#bgGradient)" />
      <circle cx="720" cy="260" r="420" fill="#75a4b3" opacity=".055" filter="url(#softBlur)" />
      <Label x={60} y={54} size={19} color="#afc7cd" opacity={0.78}>显微剖面 · 原理示意</Label>

      {phase === 'pressure' && (
        <>
          <OnionSection cx={470} cy={442} rx={345} ry={220} compression={progress} />
          <path d="M690 283 Q713 302 738 282" fill="none" stroke="#ffd881" strokeWidth="5" opacity={.55 + progress * .4} />
          <path d={`M680 363 Q${645 - progress * 15} 384 626 412`} fill="none" stroke="#79d3e7" strokeWidth="4" opacity={progress * .85} />
          <path d={`M783 362 Q${815 + progress * 10} 386 842 414`} fill="none" stroke="#79d3e7" strokeWidth="4" opacity={progress * .85} />
          <path d="M618 416 l14 -6 -4 14 M846 416 l-14 -6 4 14" fill="none" stroke="#bcecf2" strokeWidth="3" opacity={progress * .9} />
          <Knife x={711} tipY={95 + 190 * progress} />
          <path d="M206 300 L286 300 L330 331" fill="none" stroke="#eed5ad" strokeOpacity=".8" strokeWidth="2" />
          <Label x={82} y={293}>外皮仍完整</Label>
          <path d="M226 487 L315 487 L385 466" fill="none" stroke="#c8e4dc" strokeOpacity=".8" strokeWidth="2" />
          <Label x={82} y={495} color="#d8e9db">里层先受压</Label>
          <Label x={1010} y={164} color="#f3d29f" size={22}>刀刃下压</Label>
          <path d="M990 173 L906 173 L778 214" fill="none" stroke="#f3d29f" strokeOpacity=".7" strokeWidth="2" />
        </>
      )}

      {phase === 'burst' && (
        <>
          <OnionSection cx={470} cy={442} rx={345} ry={220} compression={0.04 * (1 - progress)} incision />
          <path d="M710 284 Q697 385 681 555" fill="none" stroke="#091722" strokeWidth="13" opacity=".8" />
          <path d="M710 284 Q698 387 682 554" fill="none" stroke="#ffdb96" strokeWidth="3" opacity=".7" />
          <Knife x={711} tipY={292 + 222 * progress} />
          <circle cx="710" cy="294" r={22 + 20 * progress} fill="#9deaff" opacity={.055 + progress * .055} filter="url(#softBlur)" />
          <FineMist time={(frame - mistStart) / fps} />
          <SlowDroplets time={(frame - dropsStart) / fps} delay={0} />
          <g opacity={smooth((frame - mistStart) / 8)}>
            <Label x={886} y={176} color="#bfeeff" size={22}>先 · 高速细雾</Label>
            <path d="M880 187 L822 187 L783 242" fill="none" stroke="#bfeeff" strokeOpacity=".7" strokeWidth="2" />
          </g>
          <g opacity={smooth((frame - dropsStart) / 8)}>
            <Label x={930} y={475} color="#c6edf1" size={22}>后 · 较慢液滴</Label>
            <path d="M925 484 L875 484 L838 428" fill="none" stroke="#c6edf1" strokeOpacity=".7" strokeWidth="2" />
          </g>
        </>
      )}

      {phase === 'chemistry' && (
        <>
          <OnionSection cx={468} cy={446} rx={338} ry={216} incision />
          <path d="M703 289 Q691 388 676 548" fill="none" stroke="#162b3c" strokeWidth="12" />
          <path d="M703 290 Q691 388 676 548" fill="none" stroke="#e6c38a" strokeWidth="3" />
          <Atmosphere irritantReveal={irritantReveal} carrierTime={carrierTime} eyeReveal={eyeReveal} />
          <g opacity={smooth((frame - carrierStart) / 12)}>
            <rect x="814" y="112" width="340" height="55" rx="27" fill="#1b3546" stroke="#80d4e7" strokeOpacity=".55" />
            <circle cx="842" cy="139" r="7" fill="#baf3ff" />
            <Label x={861} y={147} size={21} color="#c7f1f7">可见层：细雾与液滴</Label>
          </g>
          <g opacity={irritantReveal}>
            <rect x="813" y="187" width="405" height="58" rx="29" fill="#3c3428" fillOpacity=".8" stroke="#e9bd70" strokeOpacity=".72" />
            <circle cx="842" cy="216" r="10" fill="#e8b866" opacity=".65" filter="url(#softBlur)" />
            <Label x={863} y={224} size={20} color="#f2d397">含硫刺激物 · 扩散示意</Label>
          </g>
          <Label x={1090} y={485} anchor="middle" size={18} color="#f0c477" opacity={eyeReveal}>刺激感</Label>
          <Label x={865} y={600} size={17} color="#b7cbd0">琥珀色是扩散场，不是分子结构</Label>
        </>
      )}

      {phase === 'comparison' && (
        <>
          <path d="M640 120 L640 646" stroke="#6b8790" strokeOpacity=".35" strokeWidth="2" />
          <Label x={318} y={124} anchor="middle" color="#efc980" size={27}>较快 · 较钝</Label>
          <Label x={935} y={124} anchor="middle" color="#cde8e1" size={27}>轻缓 · 锋利</Label>
          <OnionSection cx={320} cy={456} rx={238} ry={150} compression={progress * .3} scale={1} incision={progress > .56} />
          <OnionSection cx={930} cy={456} rx={238} ry={150} compression={progress * .07} scale={1} incision={progress > .72} />
          <Knife x={394} tipY={187 + 170 * smooth(progress * 1.38)} scale={.63} dull />
          <Knife x={1004} tipY={144 + 185 * smooth(progress * .92)} scale={.63} />
          {progress > .2 && <FineMist time={Math.max(0, time - .25)} x={394} y={345} count={34} travel={96} tint="#f8ddad" life={20} />}
          {progress > .38 && <SlowDroplets time={Math.max(0, time - .5)} x={394} y={345} count={11} travel={88} life={20} />}
          {progress > .55 && <FineMist time={Math.max(0, time - .8)} x={1004} y={345} count={16} travel={54} tint="#b9f1ff" life={20} />}
          {progress > .74 && <SlowDroplets time={Math.max(0, time - 1.5)} x={1004} y={345} count={4} travel={48} life={20} />}
          <Label x={318} y={648} anchor="middle" size={20} color="#efcf96">示意喷滴较多</Label>
          <Label x={935} y={648} anchor="middle" size={20} color="#c7e5e2">示意喷滴较少</Label>
          <Label x={640} y={690} anchor="middle" size={16} color="#afc3c7">定性方向示意 · 非论文计数</Label>
        </>
      )}
    </svg>
  );
}

export default { OnionCutaway };
