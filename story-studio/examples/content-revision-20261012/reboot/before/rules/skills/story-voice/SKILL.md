---
name: story-voice
description: 为 Story Studio 的有效播讲稿生成火山配音和源时间，或接入已有音频；在正式合成前核对当前审核依据。
---

# Story Voice

读取 [交接约定](../../references/handoff.md)、当前要求与实际声音标注，承接本期创作意图。`script.md` 的正文和表达标注分别由共享解析器提取；不要朗读标注、标题和来源。用实际稿件、当前规则及来源文件重算 `review.json` 依据。缺失、过期、有未解决问题时停止正式合成；用户冻结分支需要当前可信对话核实，本 CLI 不提供自报放行开关。

## 生成

`node story-studio/runtime/voice/generate.mjs --episode <本期目录>`。可选 `--script`、`--review`、`--out` 指定本期内相对路径；发音映射用 `--pronunciations` 指向 JSON 对象，必要时用 `--basis-path 字段=相对文件` 指定审核依据文件。`review.basis.contentPrinciples` 的路径相对 `story-studio/` 根，其他依据路径相对本期根。配音环境变量为 `VOLC_TTS_API_KEY`，或 `VOLC_TTS_APP_ID` 与 `VOLC_TTS_ACCESS_TOKEN`；可设 `VOLC_TTS_VOICE`、`VOLC_TTS_RESOURCE_ID`、`VOLC_TTS_SPEED` 和 `VOLC_TTS_STYLE`。默认渊博小叔音色、原速。不要把凭据写入日志。

表达标注作为火山 `context_texts` 意图输入。它是否实现所需语气、停顿或强调，须在实际音频中听查。修改正文需重新审核；只改表达或发音映射则重算受影响句子的缓存。发音映射改变语义时先退回内容审核。失败后保留已生成的有效片段；再次运行前仍先重核审核依据。

新审核的 `contentPrinciples` 可以是按路径排序的内容规则列表，覆盖共同原则、实际采用专项及影响判断的参考；旧单对象读取方式保留。要求已在 `requirementsSha256` 绑定。软件重算清单，不自动确认清单没有漏项，也不能判断反讽或叙事表演成立。

优先实听最依赖声音效果的关键表达与衔接。参数无法实现时返回写作/视听设计调整，不仅换情绪标签；平读不能自动证明嘲讽、悲伤或其他风格成立，声线与语速仍按本期要求和现有可执行配置处理。

每个句段独立 WAV。`audio/timing.json` 中 `audio[].audioId` 是句 ID，`sourceFile` 相对本期根目录，`sentences[].startSeconds/endSeconds` 是各源文件的秒数；词时间仅在响应范围有效时输出。`status: complete` 只表示片段及时间文件齐备；`listening.status: not-checked` 表示尚未听查，不能报告自然度通过。

## 已有音频

`node story-studio/runtime/voice/import-audio.mjs --episode <本期目录> --audio <已有文件>` 按内容摘要复制原文件到本期 `audio/` 并测量时长；再次导入不会覆盖旧副本，旧时间记录保留为 `timing.previous.json`。可加 `--script` 和 `--alignment`，对齐 JSON 需记录真实 `source`、`method` 与按正文顺序覆盖全部句子的 `sentences:[{id,startSeconds,endSeconds}]`，每段须有正时长。没有可靠对齐时只输出音频级精度；需要精确同步的镜头应另做实际对齐或调整设计。

## 听查

用播放器实际听关键片段、句间衔接及完整音轨；在本期 `audio/listening.md` 记录所听文件及其 SHA-256、问题音频 ID、源时间、具体听感、修正与复听结果。生成器仅写 `not-checked`，人工听查记录不得由生成器自动伪造。播放器不可用或尚未试听，就向 story-video 交代精度与表现缺口。
