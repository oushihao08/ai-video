---
name: story-video
description: 为故事稿或已有声音设计视听脚本，并用单一 Remotion 运行层制作叙事动画、战场地图、字幕和视频。
---

# Story Video

先读集合 `references/handoff.md` 与本期 `script.md`。完整视频任务在正文定稿前读取 `outline.md`，与 story-write 核对关键单元的声画分工；已有稿、已有音频、无声任务按实际输入进入，不补造缺失的骨架、审核或逐词时间。

## 设计

1. 以信息或行动变化划分 `visual/shots.json` 的单元与镜头。每个单元引用真实句子 ID，写清观众新增的信息、声音承担什么、画面承担什么；镜头写开始、变化、完成状态与同步意图。稿件只在 `script.md` 编辑。
2. 配音前写估算时长。已有可靠 `audio/timing.json` 后，记录每段音频的源入/出秒数和成片起始帧；新增留白只占成片帧，不改源时间。需要词级同步时先确认有词级数据；仅有句级时间只能实现句级同步。
3. 每期 `visual/direction.md` 只记本期会影响辨认的角色、阵营颜色、空间方向与示意标识。路线、部署、兵力、地形与关键动作若影响结论，关联 `research/` 中具体来源；依据不足时标示示意，避免精确复原暗示。
4. 用 `runtime/remotion/cli.mjs prepare <episode>` 生成 `output/视听脚本.md`，直接核对声画对应关系。该视图是派生文件，源文件修改后重新生成。

## 制作与检查

- `visual/shots.json` 消费方式和实际命令见 `runtime/remotion/README.md`。内置 `story` 场景表现“障碍出现→改道→抵达”的完整动作，`battle` 场景消费本期阵营、地形、路线与军团数据，`video` 场景接入本期已有视频并明确源音轨取舍。需要本期专属画面时，在 `visual/scenes/index.jsx` 默认导出单文件 React/SVG 场景，用 `scene.type: "custom"` 与 `scene.data.key` 引用；组件可用实测词级时间映射出的 `speech` / `cueFrame(sentenceId, phrase, edge)` 对齐关键揭示；没有逐词时间时不可宣称精确同步。实际渲染前核对组件出口和连续动作。按本期内容改 `scene.data`，不要把默认示意文案或地图当历史事实。
- 地图任务同时读 `/Users/jack/Documents/codes/lvgou/ai-videoxxx/map-demo/skills/historical-war-map-video/SKILL.md`。它提供地图叙事、证据和绘制约束；本期场景在新 runtime 绘制，不调用旧 `map-demo/render.sh`。
- 精细制作前先看关键片段的实际动作完成状态；有声片同时听句子、停顿和留白。渲染、抽帧、连续播放与主观接受分别记录，不能互相替代。修正构图可复用音频；修改正文、声音或剪辑位置时重核对受影响的审核、源时间与字幕。
- 发现读不懂或动作时间不足，先调整镜头/留白；需要改变正文时返回 story-write 和 story-review，需要改变声音时返回 story-voice。不要通过拉伸旁白掩盖设计问题。

## 交付边界

无声片可用约定时长单独交付。已有音频必须有真实文件与足够的源时间；缺句级对齐时不生成伪字幕。有声成片验收必须实际听查和连续播放，并说明正式历史地图的资料依据。当前 runtime 的依赖、浏览器和工具须由执行环境明确提供；命令存在不表示已渲染成功。
