# 样片组 2026-10-12-01

**状态：首组材料已生成，待用户观看与挑选。** 这是开放探索，不是定稿演示。影院和食店两条被用户否定的样片仍在失败对照中；本组不把任何一个结果称为“正确风格”。

## 一、同一段故事的三种画面

三支片使用同一段 `s003` 口播、同一音色与原音频、同一 9 秒时间轴、同一词级字幕和事件顺序，只改场景绘制方式。关键画面联系图：[店内欢迎语时](animations/contact-sheet-welcome.png)、[回话结束后](animations/contact-sheet-payoff.png)。

| 样片 | 方向 | 视频 | 说明 |
|---|---|---|---|
| 1 | 彩色矢量小剧场 | [9 秒 MP4](animations/01-vector-stage/output/story-studio.mp4) | 当前制作基线，空间信息清楚，画面仍偏扁平；不是推荐结论 |
| 2 | 微缩剪纸戏台 | [9 秒 MP4](animations/02-paper-theatre/output/story-studio.mp4) | 叠纸场景和活动纸偶，保留店内空间连续 |
| 3 | 孔版印刷漫画 | [9 秒 MP4](animations/03-risograph-comic/output/story-studio.mp4) | 高对比套色、网点和动作冲击线，人物与店面仍在同一镜头中 |

这组片只回答“同一段内容的画面长什么样”，不能证明正文是不是好笑。排班纸都在“明天排我什么班”说完后才出现。三片均为 H.264/AAC、1280×720、30fps、270帧；FFmpeg 全片解码成功。记录与分镜见各片目录下的 `episode.md`、`visual/direction.md`、`visual/shots.json` 和 `output/视听脚本.md`。

## 二、同一段口播的三种读法

同一位声线、同一句正文、同一处文字标注；三份 WAV 供直接试听。TTS 已生成，未由我伪称人工听感通过；请比较是不是有可听见的表达差异、哪一个像真实人物说话。

| 样片 | 声音方向 | 时长 | 音频 |
|---|---|---:|---|
| 1 | 原本的轻松、带一点无奈 | 7.46 秒 | ![原始读法](audio/01-original-read/sample.wav) |
| 2 | 刚经历完，顺口讲给朋友听 | 7.25 秒 | ![顺口转述](audio/02-as-if-retelling/sample.wav) |
| 3 | 低戏剧性，热情欢迎与疲惫回话形成反差 | 6.84 秒 | ![冷反差回话](audio/03-dry-reaction/sample.wav) |

## 三、不同叙事走法：《两颗桃子》

这是一条不靠冲突、反转或总结的轻日常故事：女儿扫码、爸爸撑袋；她等袋子装好才放桃子，父亲托底、女儿握口，两人一起提走。画面不造险情；“走出了超市”起句切到店外，让离场结果落清。

- [观看 21 秒手绘短动画](stories/01-two-peaches/output/story-studio.mp4)
- [正文](stories/01-two-peaches/script.md) · [构思](stories/01-two-peaches/outline.md) · [声画意图](stories/01-two-peaches/visual/direction.md)
- [抽帧联系图](stories/01-two-peaches/output/contact-sheet.png)
- 声音样片：[s001（6.43 秒）](stories/01-two-peaches/audio/s001-d92946d97d14e5c8f6696e28d8f35c515d5e33bf2ce9f2234ff874c13ffae5a1.wav) · [s002（13.20 秒）](stories/01-two-peaches/audio/s002-c9282bc507faa7fda8771039907c1adcdaebbc75a93413c8497fda2be1fd305c.wav)。`audio/timing.json` 显示两个句段均有词级时间；没有真人听感记录。视频在最后一句结束后留约 1.2 秒停顿。
- 制作路径与验收记录：[episode.md](stories/01-two-peaches/episode.md) · [分镜时间轴](stories/01-two-peaches/visual/shots.json) · [视听脚本](stories/01-two-peaches/output/视听脚本.md)。

这是作者虚构样例，待用户评价是否自然、有没有生活感。文字既有独立审核记录也不代表普遍有效；这条动画是首次声画实现，审美反馈尚未取得。

## 后续展示

下一批按“日常观察、真实历史行动、讽刺评论、机制跟随”挑不同叙事任务，再各自试不同声画语汇。历史内容会先核对来源；不重复食店旧片，也不在用户选择出现前把样例变成模板。最新项目清单见 [展示区首页](../README.md)。
