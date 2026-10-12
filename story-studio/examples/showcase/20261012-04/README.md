# 2026-10-12 · 第四组探索：刀口起雾

**状态：三支动画与三版短配音已生成，等待用户观看、试听和选择。** 这一组用同一段约 25 秒口播比较三种动作/美术表达；动画统一使用“朋友间解释”的第一版配音，尽量只比较画面。三种声音读法另附，均未人工听查。

| 方向 | 画面方法 | 样片 | 导演意图与场景 |
|---|---|---|---|
| 01 · 微缩物件 | 洋葱剖面、刀和喷滴按物理因果演示 | [播放动画](stories/01-miniature/output/story-studio.mp4) | [方向](stories/01-miniature/visual/direction.md) · [分镜](stories/01-miniature/visual/shots.json) · [场景源码](stories/01-miniature/visual/scenes/index.jsx) |
| 02 · 科学剖面 | 组织受压、雾滴和刺激物分层呈现 | [播放动画](stories/02-cutaway/output/story-studio.mp4) | [方向](stories/02-cutaway/visual/direction.md) · [分镜](stories/02-cutaway/visual/shots.json) · [场景源码](stories/02-cutaway/visual/scenes/index.jsx) |
| 03 · 墨线水彩 | 刀口动作先行，用墨线表现雾滴和传播 | [播放动画](stories/03-ink-flow/output/story-studio.mp4) | [方向](stories/03-ink-flow/visual/direction.md) · [分镜](stories/03-ink-flow/visual/shots.json) · [场景源码](stories/03-ink-flow/visual/scenes/index.jsx) |

这三种是本批试验方向，不是已经通过用户验收的风格。01 的微缩质感目前较弱，更接近平面插画；02 信息关系清楚但偏图解；03 墨线风格清晰，雾的词级出点已按实际配音调整。用户可直接看上方成片判断是否值得继续发展。

## 三种短配音

三版使用同一正文、同一声线与相近时长，分别尝试熟人解释、边操作边讲、轻微发现感。文件名描述制作指令，不保证听感已经实现；动画使用第一版，便于只比较画面。

- [01 · 熟人解释，24.47 秒](stories/01-miniature/audio/auditions/01-friend/full-preview.wav)
- [02 · 边切边讲，24.44 秒](stories/01-miniature/audio/auditions/02-cutting/full-preview.wav)
- [03 · 轻微发现感，24.25 秒](stories/01-miniature/audio/auditions/03-curious/full-preview.wav)

音频文件内含四句口播与句间留白。词级时间保存在各版本的 `preview-timing.json`；第一版正式时间在 `timing.json`。听感仍待用户确认。

## 内容与来源

三种画面共用[口播稿](stories/01-miniature/script.md)、[创作要求](stories/01-miniature/requirements.md)、[故事骨架](stories/01-miniature/outline.md)和[材料/事实边界](stories/01-miniature/research/materials.md)。正文经独立文字审阅；这只表示稿件按材料和要求完成文字检查，不表示配音、动画或内容效果已获用户认可。

题材来自一项 2025 年高速摄影研究。[PNAS 论文](https://pmc.ncbi.nlm.nih.gov/articles/PMC12557780/)记录切洋葱后先出现雾状喷出、随后出现较大液滴，并报告实验条件下切得更快、刀刃更钝时喷出的液滴更多。[Cornell 对研究的说明](https://news.cornell.edu/stories/2025/10/mist-opportunity-reveals-how-onions-make-cooks-cry)与[早期硫化学研究](https://pubmed.ncbi.nlm.nih.gov/19463015/)用于解释刺激性物质；论文没有直接测量每个液滴中的含硫物质，因此画面把可见水滴与刺激物扩散分开处理。赭色墨线和气流均为原理演绎，不是实拍、真实分子结构或论文中的粒子轨迹。

动画制作方法记录在[本批 X 参考与证据边界](research/x-animation-methods.md)。[Twitter Ads / Lowe’s Vine 制作说明](https://blog.x.com/en_us/a/2015/creativefavorites-bbdony-brings-lowes-popular-lowesfixinsix-series-to-life)提供微缩布景、模型和运动因果的制作线索；原帖视频没有逐帧核验。其他 X 样例的访问限制也列在研究记录中，不据作者自述推断画面效果。

## 检查范围

三条动画均为 H.264、1280×720、30 fps、755 帧，带 48 kHz 双声道 AAC；视频帧时长约 25.167 秒，容器时长约 25.216 秒。三片均完成全片解码和阶段关键帧抽查。第三支的“先喷细雾”“再／甩出液滴”对应词级时间；脚本与镜头同步说明见[第三支视听脚本](stories/03-ink-flow/output/视听脚本.md)。

关键帧： [微缩物件](stories/01-miniature/output/check-frame-03-airborne.png) · [科学剖面](stories/02-cutaway/output/qa-cutaway-03-droplets.png) · [墨线水彩](stories/03-ink-flow/output/qa-mist.png)。[雾/液滴词级落点对照帧](stories/03-ink-flow/output/qa-cue-comparison-final.png)

抽帧和解码不能代替连续观看；本批配音尚未由我或用户人工听查，三种动画与语气均待用户判断。样片已进入[日期展示区](../README.md)，无人回复则保持待选，继续追加不同题材和表达方向。
