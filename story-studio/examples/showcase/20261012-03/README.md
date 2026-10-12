# 2026-10-12 · 第三组探索：活字印刷，三种动作画法

**状态：3 条短动画和 3 版音频已生成，待用户试听、观看和选择。** 三条动画使用同一版正文和“朋友聊天”音轨；另两版旁白供听感比较。当前只做素材、时长、帧和完整解码检查，真人听感及用户偏好尚未确认。

主题取自沈括《梦溪笔谈》对毕昇活字印刷工序的记载。正文从“两块板轮换”进入，补来源与泥字步骤，再落在少量/大量印刷的效率差异；没有替人物虚构动机、现场冲突或后世影响。见[史料边界](stories/01-paper-relay/research/materials.md)、[当前正文](stories/01-paper-relay/script.md)和[本组 X / 电影动画方法记录](research/x-animation-methods.md)。

## 三条动画

| 样片 | 动作与美术 | MP4 | 导演意图 / 可复做源码 |
|---|---|---|---|
| [01 · 微缩片场接力](stories/01-paper-relay/episode.md) | 照片质感工作台；镜头跟随两板，字块落入铁框、纸页叠起。测试“真实材质 + 合成动作”。 | [播放样片](stories/01-paper-relay/output/story-studio.mp4) | [方向](stories/01-paper-relay/visual/direction.md) · [场景](stories/01-paper-relay/visual/scenes/index.jsx) · [分镜](stories/01-paper-relay/visual/shots.json) · [原始关键帧和提示词](stories/01-paper-relay/assets/prompts.md) |
| [02 · 炭笔跟拍](stories/02-process-score/episode.md) | 手绘炭笔静帧上画一条运笔轨迹，让一块字印从手边移动并落位；结尾以朱红线牵出数量感。测试“线条带视线”。 | [播放样片](stories/02-process-score/output/story-studio.mp4) | [方向](stories/02-process-score/visual/direction.md) · [场景](stories/02-process-score/visual/scenes/index.jsx) · [分镜](stories/02-process-score/visual/shots.json) · [原始关键帧和提示词](stories/02-process-score/assets/prompts.md) |
| [03 · 套色剪纸戏台](stories/03-cut-paper-theatre/episode.md) | 全 SVG 纸偶舞台；手推板、字块落位、纸页连续出现。动作直接由物件形状完成。 | [播放样片](stories/03-cut-paper-theatre/output/story-studio.mp4) | [方向](stories/03-cut-paper-theatre/visual/direction.md) · [场景](stories/03-cut-paper-theatre/visual/scenes/index.jsx) · [分镜](stories/03-cut-paper-theatre/visual/shots.json) |

三条都为 1280×720、30fps、548 帧，编码为 H.264/AAC；画面对应的工程稿见各自 `output/视听脚本.md`。同稿对照能看清媒材差别，但不表示其中任何一个已获用户选定。01、02 的底图静止，动作靠合成元素和镜头完成；03 是 SVG 图层动画，仍是短样片，不是逐格手绘成片。

## 三版短音频

同一正文、同一火山音色配置，各试一种说话方式。当前音频是机器生成的试听候选，**没有人工听查**；下面的名称只是制作读法，不代表实际听感评价。

| 读法候选 | 音频 / 时长 | 比较重点 |
|---|---|---|
| 01 · 熟人当面讲 | [试听 WAV · 17.11 秒](stories/01-paper-relay/audio/auditions/01-friend/full-preview.wav) | 句子是否像在直接讲给人听 |
| 02 · 桌前边做边讲 | [试听 WAV · 17.09 秒](stories/01-paper-relay/audio/auditions/02-desk-demo/full-preview.wav) | 动作词是否自然、解释是否清楚 |
| 03 · 慢一点留余地 | [试听 WAV · 16.32 秒](stories/01-paper-relay/audio/auditions/03-unhurried/full-preview.wav) | 停顿是否有用，节奏是否显拖 |

三条动画为便于横向比较，都使用 01 音轨；每条保留词级真实时间、脚本摘要与 SHA-256。原始分句、合并试听与时间文件都在 `audio/auditions/`。

## X 与电影动画方法

[本组研究记录](research/x-animation-methods.md)列出 X 上 Ryan Woodward 的相机/手绘分层与动作路线迭代、Toniko Pantoja 的分镜/成片对照，以及 Disney Animation 的 staging、强姿势、timing 等公开制作说明。它们帮助提出“先看动作是否读得懂，再磨细节”的问题；没有复制参考作者的画面，也没有把任何方法变成固定风格模板。X 片段只抽样，不声称完整观看。

## 检查范围与复现

- [x] 当前正文版本经两轮独立文字审读后修订；[审核摘要](stories/01-paper-relay/review.json)与三份正文、要求和共同材料一致。
- [x] 三版 WAV 存在；三条 MP4 均为 548 帧 H.264/AAC。FFprobe 元数据检查通过，FFmpeg 对三条 MP4 全片解码通过。
- [x] 01、02、03 每条都从全片抽取关键帧并检查构图、字幕和动作出现位置；范围只覆盖这些抽样帧。
- [ ] 真人试听、连续看片与用户选择仍待完成。

复现时对对应目录运行 Story Studio Remotion 的 `prepare` / `render` 命令；安装位置、参数方式和限制见 [`runtime/remotion/README.md`](../../../runtime/remotion/README.md)。01、02 的底图需在 prepare 后复制到各自 `output/remotion-public/`；03 无外置图像资源。

## 后续判断

下一轮先按你的选择改动作读法、声音节奏或构图；不把三条强行合成一个固定答案。若暂时没有反馈，这批保持“待看 / 待选”，样品区继续追加不同题材和明确不同的动画语法。完成当前样片不等于内容创作 Skill 已完成。
