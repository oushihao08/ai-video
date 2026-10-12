import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

const ink = '#18242d';
const muted = '#677780';
const red = '#dc5a4d';
const green = '#2a8b78';
const paper = '#f2eee5';
const font = 'PingFang SC, Noto Sans CJK SC, sans-serif';

function Canvas({ eyebrow, title, children, footer = '示意动画｜不代表实物比例或监管结论' }) {
  return <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{ background: paper, fontFamily: font }}>
    <rect width="1280" height="720" fill={paper} />
    <path d="M0 0H1280V14H0Z" fill={ink} />
    <text x="78" y="82" fill={muted} fontSize="20" letterSpacing="3">{eyebrow}</text>
    <text x="78" y="148" fill={ink} fontSize="44" fontWeight="700">{title}</text>
    {children}
    <text x="78" y="42" fill={muted} fontSize="14">{footer}</text>
    <text x="1202" y="42" fill={muted} fontSize="14" textAnchor="end">STORY STUDIO / 2026.10</text>
  </svg>;
}

function Pedal({ x, y, scale = 1, broken = false }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-4 -95 L-4 -14" stroke={ink} strokeWidth="14" strokeLinecap="round" />
    <path d={broken ? 'M-4 -17 L-4 5 M-4 22 L-4 56' : 'M-4 -14 L-4 56'} stroke={ink} strokeWidth="14" strokeLinecap="round" />
    <path d="M-58 58 Q0 40 58 58 L47 90 Q0 103 -47 90Z" fill={red} />
    <rect x="-42" y="-120" width="76" height="22" rx="8" fill={ink} />
    {broken && <path d="M-25 7l13 10-10 7 15 11" fill="none" stroke={red} strokeWidth="6" />}
  </g>;
}

function Hook({ cueFrame = () => null }) {
  const f = useCurrentFrame();
  const start = cueFrame('s002', '报道') ?? 229;
  const end = cueFrame('s002', '制动踏板支架', 'end') ?? start + 36;
  const progress = interpolate(f, [start, Math.max(start + 1, end)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <Canvas eyebrow="一句话的情绪，落到一个零件" title="“脊梁骨”断了？">
    <g opacity={1 - progress * 0.58}>
      <path d="M270 270 C210 320 330 345 270 392 C210 440 330 466 270 515" fill="none" stroke={red} strokeWidth="16" strokeLinecap="round" strokeDasharray="16 12" />
      <text x="365" y="360" fill={red} fontSize="34" fontWeight="700">品牌脊梁的比喻</text>
      <text x="365" y="410" fill={muted} fontSize="22">听起来很响，仍然只是比喻</text>
    </g>
    <g opacity={progress} transform={`translate(${progress * 100} 0)`}>
      <Pedal x={825} y={470} scale={1.25} broken />
      <text x="945" y="365" fill={ink} fontSize="30" fontWeight="700">实际部件</text>
      <text x="945" y="413" fill={red} fontSize="26">制动踏板支架</text>
    </g>
    <text x="80" y="580" fill={muted} fontSize="23">先把话题从品牌情绪，拉回可检查的结构。</text>
  </Canvas>;
}

function Test({ cueFrame = () => null }) {
  const f = useCurrentFrame();
  const failureStart = cueFrame('s003', '支架先后断裂') ?? 160;
  const failureEnd = cueFrame('s003', '支架先后断裂', 'end') ?? failureStart + 15;
  const firstMetricStart = cueFrame('s004', '三十八点四四米') ?? 248;
  const firstMetricEnd = cueFrame('s004', '三十八点四四米', 'end') ?? firstMetricStart + 30;
  const secondMetricStart = cueFrame('s004', '一百四十米') ?? firstMetricStart + 150;
  const secondMetricEnd = cueFrame('s004', '一百四十米', 'end') ?? secondMetricStart + 20;
  const boundaryStart = cueFrame('s005', '监管鉴定') ?? 570;
  const datePhrases = ['十月一日', '十月三日', '十月四日'];
  const rows = [0, 1, 2];
  return <Canvas eyebrow="懂车帝测试报道｜2026.10.08" title="三辆车，支架都先后断裂">
    {rows.map((i) => {
      const start = cueFrame('s003', datePhrases[i]) ?? 25 + i * 28;
      const end = cueFrame('s003', datePhrases[i], 'end') ?? start + 18;
      const p = interpolate(f, [start, Math.max(start + 1, end + 5)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const result = interpolate(f, [failureStart, Math.max(failureStart + 1, failureEnd)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <g key={i}>
        <rect x="105" y={205 + i * 77} width="390" height="52" rx="8" fill="#e2ddd2" />
        <rect x="123" y={219 + i * 77} width="98" height="24" rx="10" fill={ink} opacity={0.15 + p * 0.85} />
        <circle cx={157 + p * 100} cy={231 + i * 77} r="12" fill={paper} />
        <text x="252" y={241 + i * 77} fill={ink} fontSize="22" opacity={0.15 + p * 0.85}>测试 {['10月1日', '10月3日', '10月4日'][i]}</text>
        <text x="480" y={241 + i * 77} fill={red} fontSize="20" textAnchor="end" opacity={result}>支架断裂</text>
      </g>;
    })}
    <g opacity={interpolate(f, [cueFrame('s004', '第三辆') ?? 248, (cueFrame('s004', '第三辆') ?? 248) + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
      <text x="620" y="230" fill={muted} fontSize="20">第三辆车｜报道所列数据</text>
      <text x="620" y="306" fill={ink} fontSize="25">第一次制动</text>
      <rect x="830" y="279" width="250" height="30" rx="15" fill="#d6d0c4" />
      <rect x="830" y="279" width={250 * interpolate(f, [firstMetricStart, Math.max(firstMetricStart + 1, firstMetricEnd)], [0, 68.6 / 250], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} height="30" rx="15" fill={green} />
      <text x="1100" y="305" fill={green} fontSize="26" fontWeight="700" opacity={interpolate(f, [firstMetricStart, Math.max(firstMetricStart + 1, firstMetricEnd)], [0.25, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>38.44 米</text>
      <text x="620" y="390" fill={ink} fontSize="25" opacity={interpolate(f, [cueFrame('s004', '第二次') ?? secondMetricStart - 140, secondMetricStart], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>支架断裂后</text>
      <rect x="830" y="363" width="250" height="30" rx="15" fill="#d6d0c4" />
      <rect x="830" y="363" width={250 * interpolate(f, [secondMetricStart, Math.max(secondMetricStart + 1, secondMetricEnd)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} height="30" rx="15" fill={red} />
      <text x="1100" y="389" fill={red} fontSize="26" fontWeight="700" opacity={interpolate(f, [secondMetricStart, Math.max(secondMetricStart + 1, secondMetricEnd)], [0.25, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>约 140 米</text>
      <text x="620" y="452" fill={muted} fontSize="19" opacity={interpolate(f, [cueFrame('s004', 'P挡减速') ?? secondMetricStart - 60, (cueFrame('s004', 'P挡减速') ?? secondMetricStart - 60) + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>报道描述：支架断裂后只能靠 P 挡应急减速</text>
    </g>
    <rect x="105" y="535" width="1068" height="58" rx="8" fill={ink} />
    <text x="135" y="572" fill="#fffaf0" fontSize="23">报道列出的测试结果</text>
    <path d="M370 564H570" stroke="#a7b1b5" strokeWidth="2" />
    <text x="620" y="572" fill="#ffd07b" fontSize="23" opacity={interpolate(f, [boundaryStart, boundaryStart + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>不等于监管鉴定</text>
  </Canvas>;
}

function Response({ cueFrame = () => null }) {
  const f = useCurrentFrame();
  const reveal = cueFrame('s007', '承诺') ?? 27;
  const p = interpolate(f, [reveal, reveal + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <Canvas eyebrow="两种陈述，都要标清来源" title="回应给出了边界，也给了动作">
    <rect x="105" y="220" width="500" height="280" rx="16" fill="#e5e0d6" />
    <text x="145" y="274" fill={muted} fontSize="20">尊界官方说明</text>
    <text x="145" y="345" fill={ink} fontSize="30" fontWeight="700">“非标准的极端工况”</text>
    <text x="145" y="402" fill={ink} fontSize="23">称实际用户场景未发生同类故障</text>
    <text x="145" y="457" fill={muted} fontSize="19">品牌对自身产品与使用情况的陈述</text>
    <path d="M650 360H730" stroke="#b2aaa0" strokeWidth="3" strokeDasharray="10 10" />
    <g opacity={p} transform={`translate(0 ${28 - 28 * p})`}>
      <rect x="775" y="220" width="400" height="280" rx="16" fill="#dce8e1" />
      <text x="815" y="274" fill={green} fontSize="20">品牌承诺的后续动作</text>
      <text x="815" y="344" fill={ink} fontSize="29" fontWeight="700" opacity={interpolate(f, [cueFrame('s007', '优化部件') ?? reveal, (cueFrame('s007', '优化部件') ?? reveal) + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>优化部件设计</text>
      <text x="815" y="397" fill={ink} fontSize="25" opacity={interpolate(f, [cueFrame('s007', '免费升级') ?? reveal + 45, (cueFrame('s007', '免费升级') ?? reveal + 45) + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>提供免费升级选择</text>
      <text x="815" y="458" fill={muted} fontSize="19" opacity={interpolate(f, [cueFrame('s007', '复核') ?? reveal + 120, (cueFrame('s007', '复核') ?? reveal + 120) + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>并复核验证与生产管理</text>
    </g>
    <text x="105" y="575" fill={ink} fontSize="23">尚待独立核实：断裂原因、测试复现与改进效果。</text>
  </Canvas>;
}

function Timeline({ cueFrame = () => null }) {
  const f = useCurrentFrame();
  const planReveal = cueFrame('s008', '预计月底确认') ?? 80;
  const launchReveal = cueFrame('s008', '十一月起') ?? 123;
  const detailReveal = cueFrame('s008', '细节仍未公布') ?? 184;
  const planP = interpolate(f, [planReveal, planReveal + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const launchP = interpolate(f, [launchReveal, launchReveal + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const detailP = interpolate(f, [detailReveal, detailReveal + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <Canvas eyebrow="截至 2026.10.11｜客服答复" title="有了时间表，细节仍在路上">
    <path d="M190 380H1080" stroke="#c5beb1" strokeWidth="8" strokeLinecap="round" />
    <circle cx="250" cy="380" r="24" fill={ink} />
    <circle cx="665" cy="380" r="24" fill={green} opacity={planP} />
    <circle cx="1055" cy="380" r="24" fill={paper} stroke={red} strokeWidth="7" strokeDasharray="7 6" opacity={launchP} />
    <text x="250" y="300" fill={ink} fontSize="26" textAnchor="middle" fontWeight="700">10月11日</text>
    <text x="250" y="436" fill={muted} fontSize="20" textAnchor="middle">客服答复</text>
    <text x="665" y="300" fill={green} fontSize="26" textAnchor="middle" fontWeight="700" opacity={planP}>预计10月底</text>
    <text x="665" y="436" fill={muted} fontSize="20" textAnchor="middle" opacity={planP}>方案确认</text>
    <text x="1055" y="300" fill={red} fontSize="26" textAnchor="middle" fontWeight="700" opacity={launchP}>11月起</text>
    <text x="1055" y="436" fill={muted} fontSize="20" textAnchor="middle" opacity={launchP}>陆续启动</text>
    <rect x="335" y="520" width="610" height="56" rx="10" fill="#f0d7d1" opacity={detailP} />
    <text x="640" y="556" textAnchor="middle" fill="#8f3e35" fontSize="23" opacity={detailP}>报道时：技术细节尚未公布</text>
  </Canvas>;
}

function Close({ cueFrame = () => null }) {
  const f = useCurrentFrame();
  const turn = cueFrame('s010', '真正该') ?? 80;
  const evidence = cueFrame('s010', '反复验证') ?? 110;
  const process = cueFrame('s010', '流程') ?? 170;
  const update = cueFrame('s011', '改进结果') ?? 370;
  const p = interpolate(f, [turn, Math.max(turn + 1, evidence)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const records = ['测试条件可复现', '断裂原因可说明', '升级效果可验证'];
  return <Canvas eyebrow="回到观众真正需要的答案" title="安全问题，拿证据说话">
    <g opacity={1 - p * 0.75}>
      <text x="640" y="286" fill={red} fontSize="39" fontWeight="700" textAnchor="middle">品牌不是钢筋</text>
      <text x="640" y="348" fill={muted} fontSize="28" textAnchor="middle">粉丝也不是防滚架</text>
    </g>
    <g opacity={interpolate(f, [evidence, evidence + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
      <rect x="280" y="230" width="720" height="300" rx="18" fill="#e4e0d7" />
      {records.map((item, index) => {
        const y = 300 + index * 68;
        const start = [evidence, process, update][index];
        return <g key={item} opacity={interpolate(f, [start, start + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
          <circle cx="360" cy={y - 8} r="13" fill="none" stroke={red} strokeWidth="3" strokeDasharray="4 4" />
          <text x="400" y={y} fill={ink} fontSize="27">{item}</text>
          <text x="865" y={y} fill={red} fontSize="19">待验证</text>
        </g>;
      })}
    </g>
    <text x="640" y="594" fill={ink} fontSize="24" textAnchor="middle">公开、可复核的验证，比替品牌喊口号更能撑住脊梁。</text>
  </Canvas>;
}

export default { hook: Hook, test: Test, response: Response, timeline: Timeline, close: Close };
