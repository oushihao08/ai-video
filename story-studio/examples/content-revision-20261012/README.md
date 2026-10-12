# 内容生成改造验收材料

本目录保留实际规则基线、同材料首稿、独立判断和声画样片，不作为默认题材、优秀范文或固定结构。影院和排队为明确虚构材料；历史正文限于材料包中呈现的原文摘录。

当前状态：用户已实际观看并否定影院与食店样片。按最新要求重写通用故事构思，研究迪士尼/皮克斯等的一手方法；新规则、同材料改稿和实际审查见[reboot](reboot/README.md)。下表原有首稿比较与通过审核均为前次记录，不再放行当前规则下的正式配音。

| 证据 | 作用与边界 |
|---|---|
| `baseline/snapshot.json`、`baseline/rules/` | 改造前八份规则及两个历史样本的文件快照；可恢复规则，不包含密钥、媒体或依赖 |
| `tasks.md`、`materials.md` | 对照前固定任务与材料；任务是本次实施定义，不冒充用户题材原话 |
| `baseline/cases/`、`new/cases/*/first-draft.md` | 六组旧/新首稿；新版当前 `script.md` 是编辑真源，首稿仅留档 |
| [evaluation-summary.md](evaluation-summary.md)、`blind/`、`blind-mapping.json` | 隐去新旧身份后形成判断，再揭示映射；不是观众反馈或统计实验 |
| [rule-review.md](rule-review.md) | 独立核对规则边界、条件替换、职责与现有运行接口 |
| [production-review.md](production-review.md)、`new/cases/*/review.json` | 前次正文及两期声画设计的历史独立审核；用户否定后不能维持效果通过，现行规则变化使旧依据失效 |
| `compatibility.json`、`current-authority.json` | 协议检查历史与当前文件状态；状态检查不判断作品质量，不能让过期审核通过 |
| `first-draft-integrity.json` | 十二份匿名包与原首稿匹配映射摘要；食店修订没有覆盖首稿 |
| `new/cases/01-cinema-satire/output/`、`new/cases/04-song-restaurant/output/` | 已被用户否定的旧样片及其真实制作证据；旧媒体原样保留，当前改造见计划第15节 |

首稿比较结果：新版在鸿门嘲讽一组更好，旧版在食店一组更好，三组无明显差异，鸿门历史各有优劣。食店随后修订了材料不足的表述并独立审核通过；修订不改变首稿比较结论。模型标识、采样条件和真实观众评价未获得独立核验，不声称跨题材稳定优势。

恢复旧规则时按快照逐文件核对，只恢复需要的规则；保留随后用户修改。安装入口是指向项目的软链，恢复后入口同时改变。旧审核不因恢复动作自动适用于新稿；需核对其实际依据。
