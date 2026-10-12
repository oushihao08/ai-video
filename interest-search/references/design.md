# 兴趣搜索 Skill：可行方案与代码设计

日期：2026-10-12。交付范围：Skill、配置、Node 采集脚本及其使用和验收依据。X/B站小批量真实采集已验证；小红书登录认证未通过；推荐价值仍待用户反馈。本文记录设计边界与已实现状态。

## 1. 目标与本次验收

把用户关注作者的内容作为主要来源，围绕“AI 提升生产力、AI 技术、AI 工具、AI 制作视频、AI 内容生成”发现值得阅读的内容。保留原链接、推荐原因、互动数据和阅读边界；减少重复，不把热门直接当成可靠或有用。

本次任务清单：

- [x] 核对仓库约定、现有故事 Skill 的接入边界与本机 OpenCLI 能力。
- [x] 定义采集范围、筛选方式、配置及统一数据契约。
- [x] 保存 Skill 草案、配置和含代码职责的可行方案。
- [x] 实现 OpenCLI 只读采集、统一候选、去重、预算和请求收据。
- [x] 实现正文/评论/字幕补读、推荐清单和明确反馈记录。
- [x] 对照验收标准静态核对，以受限真实采集检查端到端结果，并为证据链接/视频预览要求新增回归检查。

本次验收标准：

| 标准 | 检查事实 |
|---|---|
| Skill 入口、配置和方案可关联 | 本地引用存在；入口调用已实现的只读脚本 |
| 配置表达实际兴趣与可调整预算 | JSON 可解析；五个方向齐全；用户可编辑来源开关和预算 |
| 代码已可执行 | Node CLI 的 collect/detail/record 分支实现，语法检查成功；支持平台命令与当前 OpenCLI 说明一致 |
| 数据完整性 | 失败收据先持久化、预算计数包含失败、原始输出受限保存、未知值保留 null、历史状态可见、推荐依据必须指向采集材料 |
| 采集方式有依据 | 2026-10-12 本机 OpenCLI 1.8.8 的 registry 和帮助输出 |
| 状态准确 | 将文件/语法检查、真实采集、覆盖范围和用户价值反馈分开 |

本次不验收：全量覆盖、筛选命中率、自动调度及长期稳定性。小红书真实读取待登录后核对。本次不运行 lint 或服务，不安装依赖，不修改 package.json。

## 2. 最小实现边界

**OpenCLI 采集 → 单个 Node 脚本归一化与去重 → agent 阅读筛选 → 本地阅读清单与明确反馈。**

规则归 Skill；来源、主题和预算归配置；确定性处理归脚本；语义相关性、价值与评论解读归 agent。不在脚本里另做 LLM 客户端，沿用调用 Skill 的 agent，不增加供应商密钥。

当前版本实现三个已核对平台的只读入口；配置可以按账号可用性启停。统一行为可检查，实际字段映射仍要由登录后的真实返回校准。

不建设数据库、网页、队列、插件框架、复杂评分系统或自动偏好模型。定时运行属于后续明确需求；本次不创建 automation。所需 Node 内置模块足够，不挂接 Remotion package.json。

## 3. 当前能力与采集路线

本机核对依据：`opencli --version` 为 1.8.8；读取 `opencli list -f yaml/json` 与下面命令的实时帮助作为能力核对；后续账号读取结果见验收记录。以下是已存在的采集入口示例，实际参数以运行时帮助为准。

| 平台/范围 | 已存在命令示例 | 限制 |
|---|---|---|
| X 关注动态 | `opencli twitter timeline --type following --limit 30 -f json` | 默认是推荐流，必须明确 following；限量结果不能说明已读取全部动态 |
| X 关注列表 | `opencli twitter following --limit 50 -f json` | 默认读取当前登录用户；不得把首批结果当完整名单 |
| X 指定作者 | `opencli twitter tweets <handle> --limit 30 -f json` | 用于作者范围或补漏；同次不必重复遍历全部关注作者 |
| X 正文/讨论 | timeline/tweets 返回正文；`opencli twitter thread <id> --limit 10 -f json` | 讨论返回有上限，不等于全部回复；不保证收藏数字段可得 |
| B站关注动态 | `opencli bilibili feed --limit 30 --pages 2 -f json` | 无 uid 时是关注动态；限制页数可能漏掉较早内容 |
| B站指定作者 | `opencli bilibili feed <uid> --limit 30 -f json`；`user-videos` 查投稿 | 动态与投稿是不同入口；补充入口参数执行前核对 |
| B站深读 | `opencli bilibili video <bvid> -f json`；`subtitle`、`comments` | 深读命令逐项占预算；字幕可能不存在；field/value 详情需实测字段 |
| 小红书关注内搜索 | `opencli xiaohongshu search "AI 视频" --scope following --sort latest --publish-time week --limit 30 -f json` | 是关注范围的关键词结果，不是完整关注动态；平台实际筛选效果待验证 |
| 小红书指定作者 | `opencli xiaohongshu user <profile-url> --limit 30 -f json` | 当前未发现读取关注列表的只读命令，可使用用户指定的作者列表 |
| 小红书深读 | `opencli xiaohongshu note <full-note-url> -f json`；`comments` | note 帮助要求含 xsec_token 的完整链接，不能只存裸笔记 ID 后假定可读 |

小红书 `feed` 是首页推荐流，不当成关注流。小红书/抖音 creator 命令面向登录者的创作后台，不当成其他作者公开数据入口。不要为了补缺失字段扩大到个人后台数据。

这些浏览器命令依赖 OpenCLI Browser Bridge、Chrome/Chromium 和对应平台登录态；运行前用 `opencli doctor` 检查桥接，再确认目标平台账号。工具就绪不证明平台读取成功。

官方来源：[OpenCLI](https://github.com/jackwener/opencli)、[X](https://github.com/jackwener/opencli/blob/main/docs/adapters/browser/twitter.md)、[B站](https://github.com/jackwener/opencli/blob/main/docs/adapters/browser/bilibili.md)、[小红书](https://github.com/jackwener/opencli/blob/main/docs/adapters/browser/xiaohongshu.md)。本机帮助提供本次命令依据；上游文档可能先于或晚于本机版本。

## 4. 配置语义

配置示例见 [config.example.json](../config.example.json)。当前五个主题来自本次用户要求；queries 是启动搜索的可编辑示例，不是相关性的硬限制。

| 字段 | 含义 |
|---|---|
| `sources[].enabled` | 明确启用的来源；示例配置全部 false，本机 `config.local.json` 启用了 X、B站、小红书 |
| `sources[].mode` | `following_feed` / `following_search` / `authors`，不支持的组合明确报错 |
| `sources[].authors` | 指定 handle、UID 或主页 URL；authors 模式必须非空，不填虚构作者 |
| `window.lookbackHours` | 本地按发布时间过滤的目标窗口；无可靠发布时间记录为未知，不伪称窗口内 |
| `budget.maxSourceCalls` | 来源请求总上限，分页和每个搜索词均计数；达到预算记录未覆盖任务 |
| `budget.itemsPerCall` | 每次候选数量上限，适配平台限制，不等于采集总量 |
| `budget.maxDetailCalls` | 所有正文/详情、评论、字幕补读请求的总上限，不是深读条目数 |
| `budget.commentsPerItem` | 评论样本请求上限，不是帖子评论总数 |
| `budget.timeoutSeconds` | 每个子进程超时；超时终止并记录失败，避免长期等待 |
| `discovery.outsideFollowing` | 默认 false；true 才允许按当前主题补充关注外搜索，仍共用来源预算 |
| `discovery.platforms` | 关注外搜索的平台白名单；未启用关注来源时必须明确指定 |
| `output.maxRecommendations` | 推荐上限，不保证填满 |
| `output.dataDir` | 相对于实际配置文件所在目录解析，避免 cwd 变化写错目录 |

72小时、30条、12次和10条等数字只是初始运行预算，尚无效果实证。来源任务轮流分配预算，避免一个平台或主题先耗尽全部预算。实际平台筛选时间不足以精确表达目标窗口时，用较宽的平台时间范围并本地过滤。

正式使用配置放在本地 `config.local.json`；不保存 Cookie、登录令牌或 API 密钥。实施时新增本目录的 `.gitignore` 忽略 `config.local.json` 与 `data/`，不修改仓库现有忽略规则。

## 5. 文件与代码职责

```text
interest-search/
  SKILL.md                    已交付：agent 搜索与判断规则
  config.example.json         已交付：可编辑配置示例
  references/design.md        已交付：本方案
  scripts/search.mjs          已实现：唯一脚本入口
  tests/record.test.mjs       已实现：内容支持、阅读契约、预算与线索回归检查
  .gitignore                  已实现：忽略本地配置和采集记录
  config.local.json           本地运行配置：可按登录态调整
  data/                       运行时创建：原始材料、清单与状态
```

只需一个脚本，不先建 SourceAdapter 基类或插件 registry。最先实现的平台用局部函数处理；第二个平台确实接入时再增加必要分支。

脚本的必要操作：

| 操作 | 输入 | 输出/职责 |
|---|---|---|
| `collect` | 配置 | 执行来源只读命令，原始结果、统一候选、覆盖记录 |
| `detail` | run ID、item ID、所需正文/评论/字幕类型 | 在剩余深读预算内补读并保存，失败保留候选 |
| `record` | agent 推荐清单或用户明确反馈文件 | 校验 item ID 和引用，保存推荐/反馈，更新对应状态 |

可执行入口：

```sh
node interest-search/scripts/search.mjs collect --config interest-search/config.local.json
node interest-search/scripts/search.mjs detail --config interest-search/config.local.json --run <run-id> --id <platform:item-id> --kind comments
node interest-search/scripts/search.mjs record --config interest-search/config.local.json --run <run-id> --input <recommendations-or-feedback.json>
```

推荐输入除原帖 `evidencePaths` 外还要列 `supportingLinks`：技术类链接到对应 GitHub/官网/文档/演示；视频类链接到已确认可播放页面，预览图 URL 可选。digest 把项目链接展示在推荐理由前，把视频封面做成直达播放器的可点击卡片。短链未解析或目标不符时只能记录为待核实。

```json
{
  "kind": "recommendation",
  "itemKey": "bilibili:BV...",
  "topicIds": ["video"],
  "decision": "recommendation",
  "contentType": "video",
  "reason": "已查看片段演示了工作流中的导出步骤",
  "evidencePaths": ["raw/detail.json"],
  "supportingLinks": [{
    "kind": "video",
    "label": "观看视频",
    "url": "https://www.bilibili.com/video/BV...",
    "reading": {
      "evidencePath": "raw/video-observation.json",
      "method": "playback",
      "observed": "实际片段中的输入与导出步骤；示意，需替换为真实观察",
      "identityBasis": "原帖作品链接与播放器作品一致",
      "boundary": "填写实际观看时间范围，不代表看完整片",
      "reviewedAt": "2026-10-12T10:00:00Z",
      "playable": true
    }
  }],
  "limitations": []
}
```

脚本中的对应职责依次为 `runOpenCLI`、`buildRequests`、`normalizeItem`、`mergeCandidate`、`collect`、`detail` 和 `record`。平台命令使用参数数组及 `shell:false`；只有固定的只读 OpenCLI 命令可被构造。

用参数数组调用子进程，不能拼接 shell 字符串；关键词和作者输入不能成为命令。每个 async 有 try/catch，顶层输出可定位错误，内部失败记覆盖记录；不留空 catch，不打印可能含认证信息的 stderr。计数包含失败请求，失败不无限重试，不自动编写新适配器修复工具。

为同一 dataDir 加简单排他锁，防止两个本地运行同时覆写状态；完成或失败释放锁，遗留锁显示占用信息。单次不并发操作浏览器；每次已成功的读取先保存，不等全部结束。状态文件用同目录临时文件加 rename 原子替换，失败不覆盖旧状态。

## 6. 数据与字段映射

每条候选的最小结构如下。仅示意类型与缺项语义，不是模拟采集结果：

```ts
type Item = {
  key: string; // platform + ':' + 平台内容 ID
  platform: string;
  id: string;
  url: string; // 保留深读需要的原始完整链接
  author: { id: string | null; name: string | null };
  sources: Array<{
    mode: 'following_feed' | 'following_search' | 'authors' | 'search';
    requestedAuthor: string | null;
    query: string | null;
    sharedBy: string | null;
  }>;
  title: string | null;
  text: string | null;
  publishedAt: string | null; // 带时区的 ISO 时间；相对时间换算后为估算值
  publishedAtPrecision: 'exact' | 'approximate' | 'unknown';
  collectedAt: string;
  metrics: {
    likes: number | null; saves: number | null; comments: number | null;
    shares: number | null; views: number | null;
  };
  evidence: Array<{
    kind: 'post' | 'detail' | 'comments' | 'subtitle';
    path: string; // run 目录内的真实材料路径
    completeness: 'full_text' | 'partial' | 'metadata_only';
  }>;
};
```

| 来源 | 第一阶段已知字段 | 归一化边界 |
|---|---|---|
| X timeline/tweets | id、author、text、likes、retweets、replies、views、created_at、url | retweets→shares，replies→comments；saves 默认 null，除非实际返回可确认数字；带转发/引用时保留来源关系 |
| B站 feed | author、title、type、likes、time、url | 从可验证的平台 URL 提取 ID；“19分钟前”类时间近似换算并标精度；不能假设动态与视频共享 ID |
| 小红书 search/user | title、author（search）、likes、url；search 可返回 published_at | 保留完整 URL；user 缺少 author/time 时从请求上下文补作者标识，时间仍未知 |
| 小红书 note / B站 video | field/value 详情 | 先用一条真实返回确认字段；未知字段保留原始材料，不猜数字 |

显示为“1万”“1.2k”的指标可换算为数量，但保留原值与近似性质；解析不了设 null。缺平台 ID 的条目保留在原始材料和覆盖记录，不用标题生成不稳定身份。

来源属于关注流不证明原作者被用户关注：转发原文可能来自关注外。保留 sharedBy、实际作者及来源方式，不伪造关注关系。

持久化最少四类文件：

- `runs/<run-id>/raw/`：按实际调用保存原始输出，包括补读；不保存认证信息。
- `runs/<run-id>/items.json`：统一候选及引用，增量补读后原子更新。每项带 `history.delivered`、`history.read`、`history.feedback` 的状态快照，供筛选时区分旧推荐、明确已读与用户反馈；未知记录用 null/空数组。
- `runs/<run-id>/report.json`：每次请求的 site、command、query/author、时间、数量、结果状态、预算、截断与已知遗漏。
- `runs/<run-id>/recommendations.json` 与 `digest.md`：agent 的具体判断和人可读清单；`state.json` 记录已推荐、明确已读和明确反馈，语义分开。
- `runs/<run-id>/feedback.json`：当前 run 的全部反馈；重复执行 `record` 时从持久化状态重建，避免覆盖先前反馈。

seen 表示已经采集，delivered 表示已经推荐，read 只来自用户明确反馈；不能把 seen 自动变成 read。已推荐条目一般不重复交付，但新增重要方法、版本或纠错时允许更新推荐并说明变化。

收藏数量和用户反馈“想收藏/已收藏”分开；本地记录反馈不执行平台收藏。report.status 使用 success/partial/failed；仅当实际执行的范围与配置预算一致时可报告 success，success 仍不代表全平台完整覆盖。

## 7. 判断与排序

先判断相关性，再判断具体价值；互动帮助确定深读顺序，不建立固定权重质量分。

| 判定 | 依据 | 处理 |
|---|---|---|
| 推荐阅读 | 与当前方向有关，有可打开的原始内容支撑具体价值；技术/工具须直达 GitHub、官网、文档或演示；视频须确认可播放并记录阅读范围；封面可选 | 将支持链接放在理由前；视频渲染为可点击封面卡片，注明证据与未验证项 |
| 待核实/待观察 | 有值得核验的具体对象，但资源链接尚未解析、宣传主张未查证或视频播放/内容尚未读取 | 单独列出缺口，不混入有效推荐；补到目标内容前不晋升推荐 |
| 本次不推荐 | 无关、重复且无新增信息、只有感想没有可查对象/内容支持 | 简记理由，允许以后随任务改变重新判断 |

评论关注具体使用反馈、操作疑问、纠错与补充。少量热评不代表全部评论或用户共识；争议不直接等于低质量。技术帖子中的短链必须解析并确认跳转目标；帖文自身的转述和社交互动数不能替代项目或产品入口。视频优先读取实际视频/字幕并展示可播放来源；平台限制内嵌时提供平台播放器；可得封面仅作导航。用户后续改变兴趣或标准时使用新要求，不固化这次示例。

同平台、相近发布时间内比较可得互动；有可比的同作者历史时再辅助比较。无历史或浏览量就不计算不存在的基准或互动率。新内容可以凭具体价值进入候选，不用热度门槛全部淘汰。收藏数据缺失的平台不因此整体降级。

agent 输出的 recommendation 含 `itemKey`、`topicIds`、`decision`、`contentType`、`reason`、`evidencePaths`、`limitations` 和 `supportingLinks`。链接项为 `{kind,label,url,previewUrl?,reading}`，有效推荐必须附实际阅读记录。technical 内容至少有 GitHub、官网、文档或演示；video 内容及视频原帖必须有 video 支持链接，视频链接须记录实际播放确认。封面可选。缺少对象依据或播放确认先待核实。record 检查结构与材料文件，不能代替联网和内容核查。digest 展示实际观察、身份依据、阅读范围、原链接、互动与未确认项。

## 8. 实施验收状态

1. **实现三个已确认平台命令。** 已完成实现并按本机 OpenCLI 1.8.8 帮助静态核对。一次有界真实采集中，X 与 B站各返回 5 条；小红书返回 OpenCLI exit 77，确认需要认证。转发覆盖及更多详情字段仍待后续样本确认。
2. **实现唯一脚本和本地记录。** 已完成 collect/detail/record、去重、窗口筛选标记、相对时间精度、认证/桥接失败后跳过同站请求、请求预算先计数、逐请求原始材料、并发锁和状态分离。后续增加了推荐资源/视频预览校验与 digest 展示。
3. **真实材料和推荐价值验收。** 已对一条 X 帖运行 thread 深读并读取到1条回复；record 成功生成一条带原始依据的“待核实”清单。此流程证明采集材料可接入 agent 判断并保存结果，不证明推荐已符合用户口味。真实发现命中率仍需用户反馈；小红书还需登录后核对。

此前版本的历史检查：运行 `node --test interest-search/tests/record.test.mjs` 验证技术推荐缺少直达资源时拒绝、GitHub 链接显示在推荐理由前、视频缺少预览时拒绝、视频封面可链接至播放源；四项通过；本轮已更新该契约，当前结果见第11节。未运行 lint 或 dev server。

## 9. 与现有项目的关系

仓库现有 story-studio 面向研究、构思、写作与视频生产，handoff 中 research 是创作依据。本 Skill 放在独立目录，不修改 story-studio 的共享契约、现有 Skill 或运行层。

用户随后指定某条发现作为视频题材时，将原链接、实际读取的文本与未确认项交给 story-plan，按现有本期交接约定进入 research。没有创作请求时停止在阅读清单，不自动写稿、下载视频、配音或出片。仓库内的 SKILL.md 可通过路径读取；自动发现安装须另行实施，不能仅凭文件存在宣称已注册。

## 10. 本次实现检查记录

2026-10-12 当前执行证据：

- Node 24.11.1、OpenCLI 1.8.8；`opencli doctor` 确认 Browser Bridge 已连接。
- 隔离配置的首次真实采集限制每来源最多5条、调用总预算3。X、B站各返回5条；小红书返回 exit 77，需要登录认证，未重试；另有4项因样本预算省略。批次状态 partial。
- 后续读取一页B站动态确认相对时间解析：5条全部正确标记为近似时间，进入168小时窗口；5条均更新已有候选。本次效果验证又各读取X/B站一页，每来源限5条，共10条，均成功归一化；另花1次深读预算读取一条X thread。未再次请求小红书。
- 效果样本中，人工初筛为2条明显相关、1条外围相关、7条无关；X可见点赞/评论/浏览，B站样本除点赞外互动数据多数缺失。中文TTS语音数据集线索目前仅有作者声称的官网/样例 t.co 短链，目标未解析确认，因此保留在“待核实”，不算有效推荐；数据许可、录音同意和质量指标也未证实。该批次digest位于 `data/effect-test-output/runs/2026-10-12T144646-969Z-67175237/digest.md`，隔离于常规采集状态。
- 本次端到端核对还发现并修复 record 后批次 `items.json` 历史快照未刷新的问题；重记后 `history.delivered` 显示为 pending，read 仍为 null。用户原始材料仅存在 `interest-search/data/` 本机忽略目录，不进入 Git 变更。
- `node --check`、CLI `--help`、配置 JSON 解析和 4 项回归测试通过；`git check-ignore` 确认本地配置和效果样本不进入 Git。未运行 lint 或 dev server。小样本不能证明关注流覆盖完整或未来推荐命中率。

Skill 与采集 runtime 已实施。小红书需登录后继续验证；推荐是否符合兴趣仍待实际使用反馈。


## 11. 本轮改良计划与验收（2026-10-12）

目标：把关注动态当发现入口，追到具体项目或作品并阅读；清单展示内容依据与阅读边界，不把链接存在当成内容验证。

- [x] 保留候选与讨论中的链接线索，修复 X thread 数组正文丢失及非视频动态字幕请求；来源预算按平台轮流，关注发现优先。
- [x] record 使用内容类型而非主题 ID 判断技术/视频要求；有效推荐每个支持链接附阅读说明及真实材料路径。视频区分播放确认、片段/字幕阅读和封面，封面可选。
- [x] 更新 Skill 的对象追踪、受限查找、去重、内容阅读及展示流程；沿用现有配置与单脚本，不增加服务或评分器。
- [x] 定向回归测试验证无阅读依据拒绝、主题改名仍受内容类型约束、无封面视频可保留、展示阅读边界；用已有真实采集材料检查线索提取，明确网络/播放未验证边界。

验收：技术推荐含对应项目材料与身份关联说明；视频推荐含实际播放确认和阅读范围；pending 兼容旧记录；缓存材料可复用但不能伪称本次新读；回归测试只证明契约，不证明外部网页真实或视频播放。网络读取由调用 Skill 的 agent 使用可用搜索/浏览器工具完成，脚本负责提取、保存和检查材料引用。


### 阅读记录契约

有效推荐必须显式选择 `contentType: technical | video | workflow | article`，不根据主题名称推断。每个支持链接附 `reading`，字段见上例。`method` 支持 page/playback/frames/subtitle；视频的 playable=true 必须来自实际播放检查，其他阅读方法需在原始记录中保留单独播放检查。材料可以是文本、JSON 或观察记录，必须非空；静态校验无法判断是否伪造、链接目标是否对应，agent 必须完成原始读取与核对。pending/skip 保留旧输入兼容。

将实际工具返回或观察存入 run/raw 后直接 record，无需新增网络客户端、密钥或后台。相同对象依据最终 URL 由 agent 归组；脚本只按平台 ID 去重，不宣称已自动完成对象语义合并。


### 本轮验收结果

- `node --test interest-search/tests/record.test.mjs`：10项通过。新增行为先运行时4项失败，修改后通过；测试包含材料契约、主题改名、视频无封面、播放未确认、pending兼容、链接提取和来源交错。
- 读取已保存的真实 X thread 原始返回：提取7个 URL，其中包含作者官网和样例两条短链；原帖、补充回复与图片线索均保留，未把这些 URL 自动认定为有效项目依据。
- 本轮没有新增联网读取或视频播放验收；两条短链目标、真实项目内容、播放器展示仍需按新 Skill 在下次搜索执行。已实现流程与契约不代表已完成真实推荐效果验收。
- 未运行 lint/dev server、未安装依赖或改 package.json；修改限定在 interest-search 的 Skill、既有方案、脚本和定向测试。既有配置无需迁移。


## 12. 本轮个人价值改良计划（2026-10-12）

已证实：上一批五条有原始内容，但 Windows 工具不适用当前 macOS，安全测试项目偏外围，视频/内容生成没有覆盖。未知：用户偏爱哪条、工具实用效果、长期命中率。

任务清单：
- [x] Skill 按具体任务、点入所得、信息增量判断价值；区分现在可用、值得研究、暂不适用和适用性未知，互动只影响补读顺序。重复对象由 agent 合并并保留新信息，不建设评分器。
- [x] record 保存 assessment 并在 digest 展示适用性、用途、内容所得、增量与验证程度；实际使用声明必须引用独立使用记录。pending/skip 与历史记录保持可读取。
- [x] digest 按当前配置显示有效推荐的主题计数、无推荐主题与采集覆盖；不将没有推荐说成没有采集或没有相关内容，不强制均分/填满。
- [x] 针对新增契约与历史兼容运行单元测试；用已读五条真实材料重新生成清单核对展示，不重新采集或安装工具。

验收：新增有效推荐包含完整个人价值判断；资料阅读不自动升级为实际使用；暂不适用有明确标识；覆盖统计仅计算有效推荐并识别缺口；历史缺字段标未记录，不编造。测试和五条本地清单均检查。本轮不验收真实使用效果、视频播放、长期去重及新兴趣发现，不改变配置/来源授权，不自动从总体认可推断偏好。


### 个人价值输入契约

新增有效推荐的 `assessment` 示例：
```json
{"applicability":"research","task":"了解内容采集工具如何接入 agent","takeaway":"对应项目 README、接入步骤和限制","novelty":"本次发现的具体接入方式；未假定用户之前不知道","verification":"source_read"}
```
applicability 为 ready/research/not_applicable/unknown；verification 为 source_read/tried。tried 额外要求 usage={evidencePath,scope,result,checkedAt}，引用非空独立使用材料，不复用页面阅读文件；脚本仅校验契约，agent 核对真实性与成功/失败。历史条目未提供 assessment 时显示未记录；新增 recommendation 必须提供，pending/skip 无此要求。现有配置无需迁移。


本轮验收：新增4条行为测试先失败，实施后16项定向测试通过（含实际使用结果记录及历史条目兼容）。重用上一批已读原始材料重新生成五条清单，4条值得研究、1条当前不适用，全部明确为资料阅读未实测；覆盖显示视频制作/内容生成无有效推荐。没有重新联网采集、安装或运行项目；用户既有原始输入保留，补充判断写到独立本地运行输入，未改变已读状态或兴趣权重。配置和其他目录未修改。
