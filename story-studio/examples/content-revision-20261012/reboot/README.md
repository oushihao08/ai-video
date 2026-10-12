# 通用故事构思重写

日期：2026-10-12。起点是用户实际观看后否定影院、食店两份样片，并要求从通用讲故事结构及迪士尼等电影创作者的方法重新构思。研究与改造依据见[主计划第15节](../../../../内容生成Skill-通用底座与创作专项改造计划.md#15-按用户实际反馈重新构思通用故事结构)、[电影故事方法](../../../skills/story-plan/references/storytelling-foundation.md)。

| 文件 | 实际含义 |
|---|---|
| `before/rules/`、`before/snapshot.json` | 本轮改动前10份规则快照；不含私有配置、媒体或依赖 |
| `before/rejected-cases/` | 用户否定时的两份正文、要求、骨架和审核副本；旧媒体原地保留 |
| [影院正文](cases/01-cinema-satire/script.md)、[食店正文](cases/04-song-restaurant/script.md) | 新规则下对同材料的直接改稿；作者已读旧稿，不称独立首稿实验 |
| `cases/*/first-draft.md` | 本轮第一次改稿留档；后续修订不得覆盖 |
| `cases/*/requirements.md`、`research/`、`outline.md` | 真实反馈、固定材料、事实关联与作者选择分别保留身份 |
| [independent-review.md](independent-review.md)、`cases/*/review.json` | 与作者隔离的实际正文及规则审查；先正文后作者说明，限于文字效果与来源比对 |
| [static-check.json](static-check.json)、`current-authority.json` | 实际快照、材料副本、旧媒体保留、入口和审核依据状态核对；不判断作品审美效果 |

当前仅有正文与读法，没有新声音或视频。两篇独立文本审查通过，当前依据重算有效；审查还发现“阻力必选”会使日常过程造困难，修订后已复核。两份旧正文、历史审核及MP4原样保留；8个安装入口仍指向项目。没有运行测试、lint、服务、安装、配音或渲染，不以这些文字和静态结果证明新版成片好笑、自然或获用户认可。
