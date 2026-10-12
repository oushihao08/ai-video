---
name: story-review
description: Use when a story outline or actual spoken script needs independent source-grounded review before delivery or narration.
---

# 内容审核

直接审核指定对象及其实际文本。骨架通过只说明骨架，不能放行正文配音；作者自审也不充当独立审核。

## 输入与独立性

明确本次审骨架、正文还是修订稿。读取当前任务要求、实际待审文件、相关来源原文、可用骨架和 [内容原则](../story-plan/references/content-principles.md)；完整视频另读影响内容理解的视听设计。独立审核者应使用与作者隔离的上下文，先形成自己的判断，再看作者自审；无法提供独立上下文时报告 `review-unavailable`，保留未审状态。用户明确冻结外部稿时只记录实际决定，不伪称 AI 审核通过。

## 审核动作

1. 对事实、因果、人物动机和确定性回查原文位置。标明材料冲突与无法支持的主张；不得拿合理想象代替史料。
2. 检查 `mainNarrative` 与每段职责是否连贯；审正文时逐段读实际 `[s...]`，确认关键前提、选择依据、关系、限制和结果确实说出来。若缺了整段解释，定位相邻句及骨架任务，说明观众会误解什么，不凭审核者已有知识补足。
3. 审听者理解顺序、指代、术语、过密长句、无作用重复和承诺收束。声音标注看具体作用与可信度，不按数量打分。完整视频核查声画分工及视觉额外事实；只凭设计能说明方案，不能证明成片实现。纯音频应独立讲清。
4. 每个问题给句段位置、相关原文/要求、影响和最小修订方向。区分实质缺陷与表达口味。审核结果为 `passed` 或 `needs-revision`，未解决的实质问题不得通过；不默认代作者重写全文。

## 记录与失效

依 [交接约定](../../references/handoff.md) 写 `<episode>/review.json`。正文独立通过记录用 `type: "independent_review"`、`status`、`basis`、`unresolved` 与定位问题。`basis.scriptSha256` 用共享 `contentDigest(parseScriptMarkdown(script.md))`；`basis.rulesSha256` 用本 Skill 文件原始字节的 SHA-256。实际使用的骨架、要求和影响内容判断的视听设计分别记录 `{path, sha256}`；`visual/shots.json` 用 `{path, digest: "visual-content-v1", sha256}`，避免镜头帧数、位置、构图等变化误使正文审核失效；其他视觉文件和来源记录其实际文件摘要。来源记录为按相对路径排序的 `sources: [{path, sha256}]`。路径相对于本期目录，默认 SHA-256 从当前文件原始字节计算，缺文件不能沿用旧摘要。若使用的共同内容原则发生变化，也应作为规则依据计入摘要。摘要必须来自真实文件；不能复制格式示例或由程序生成内容结论。共享 `validateReviewAuthority()` 只检查当前 basis 是否完整匹配记录，不能证实审核判断正确。

正文语义变化、依据变化或影响理解的声画分工变化后，复核受影响项并更新真实记录。只改构图或镜头时长不触发正文重审；只改表达标注且语义未变可保留正文审核，配音输入仍需更新。交付清楚写明所审对象、实际结论、限制及下游可否使用当前稿。
