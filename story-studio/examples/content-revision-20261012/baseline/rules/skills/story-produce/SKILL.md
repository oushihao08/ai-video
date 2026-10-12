---
name: story-produce
description: Use when the user asks to produce or resume a knowledge or history story video across research, spoken script, review, voice, animation, and final delivery, or asks to stop at a specified stage.
---

# 故事与动画总控

按本轮目标执行需要的阶段，读取本期 `episode.md` 或从用户提供的产物确定当前入口。共享文件含义见 `../../references/handoff.md`。仅调用已有 Skill 的真实能力；没有实现的命令或缺失的产物应明确指出，不能写成已经完成。

## 选择入口

| 用户已有内容/目标 | 下一步 |
|---|---|
| 只有主题或材料 | 交 `story-plan`；只要研究/骨架则在此交付 |
| 有骨架，要写稿 | 交 `story-write`；只要稿件则在此交付 |
| 有稿要审核 | 交 `story-review`；审核对象要写明是骨架还是实际正文 |
| 有有效稿要音频 | 核对独立审核或可信用户冻结依据，交 `story-voice`；只要音频则交付音频与真实时间 |
| 有稿、音频、分镜或场景要画面 | 交 `story-video` 接入现有产物，按实际时间精度设计 |
| 要完整视频 | 依次组织内容与视听设计、独立审核、配音、预演、动画与交付 |

完整视频的关键声画分工在正文定稿前由 `story-write` 与 `story-video` 按同一稿件对齐。需要战场空间表达时，`story-video` 按本期资料调用旧 `historical-war-map-video` 专项；其他镜头不调用它。最终镜头、声音放置与字幕读取同一成片时间轴。正式历史地图不得把旧演示数据当成本期事实。

## 恢复与失效

先读 `<episode>/episode.md`，再用 `node story-studio/runtime/produce/status.mjs <episode>` 获取只读恢复快照。它重算正文、审核依据、源音频文件和视听时间轴的静态状态，检查已准备的 props 是否属于当前输入；`current-independent-record` 仅表示记录与当前依据相符，不替代人工内容审核。`user_frozen` 必须另从可信对话核实，快照不会自动放行。媒体文件存在也不能证明听查或连续播放通过。人工连续播放后，可在 `<episode>/output/playback-check.json` 记录播放器、当前 MP4 摘要、从片头至片尾的进度样本和结束状态；快照只在该记录绑定当前 MP4 且进度覆盖全片时报告已连续播放。它不代表真人听感评价或用户接受。

缺文件或依据失效时返回负责阶段；能复用的未变音频/场景不重做。改正文使旧审核与受影响音频过期；只改表达时重新生成受影响声音并核对时长；只改构图时复用声音；增减留白时更新成片映射与字幕。具体摘要与时间语义以 handoff 为准，不在本入口重写实现。

审核没有独立依据、用户冻结未经可信对话核实、时间粒度不足或必要资源缺失时，指出具体缺口并继续可独立完成的部分。不要用文件中的 `passed` 字符串、格式示例或模拟 timing 放行正式配音与有声渲染。

## 交付

在用户要求的位置停止，更新 `episode.md` 的有效版本、已完成阶段、未完成项和下一步。完整成片分别记录静态检查、真实配音听查、抽帧、连续播放和用户反馈；只报告实际执行过的证据。制作授权不包含公开发布。
