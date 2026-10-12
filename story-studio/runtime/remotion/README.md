# Remotion 视频运行层

2026-10-12 衔接更新：合成ID可以包含多句话，`timeline.subtitles` 保留整单元供阅读视图，实际画面读取 `timeline.subtitleCues`。短字幕按原稿标点、可读长度和真实词时间生成；无可靠词文对应则保留句级回退，并在 `subtitleLimitations`、恢复状态和视听脚本中报告，不能宣称关键揭示已同步。字幕跨镜头使用同一成片时间，不因换镜重启。源声音为火山生成时，表达摘要也必须匹配当前稿件。

渲染清单新增 `rendererSha256`，绑定当前运行源码及依赖锁文件；修改渲染程序后，旧MP4会标为过期。过期不删除旧媒体，但不得作为新程序已经生效的证据。

依赖版本、唯一安装位置及浏览器/FFmpeg 配置见[依赖与配置](dependencies.md)。

同一期使用 `script.md`、`visual/shots.json` 和可选 `audio/timing.json`。`visual/shots.json` 的 `fps`、`width`、`height` 属于本片设置；`units[]` 持有 `id`、`sentenceIds`、`newInformation`、`visualRole`；`shots[]` 持有 `id`、`unitId`、`startState`、`change`、`endState`、`estimatedSeconds` 或最终 `startFrame`/`durationFrames`，以及 `scene: {type: "story" | "battle" | "video" | "custom", data: {...}}`。首镜从第0帧开始，下一镜从上一镜结束帧开始。所有源音频由 `audioPlacements[]` 放置：`audioId`、`sourceInSeconds`、`sourceOutSeconds`、`timelineStartFrame`。每次声音留白由下个 `timelineStartFrame` 与上一段终点的间距表达。字幕用真实词级时间切分短语，再映射到相同成片帧；没有可靠词级对应则明确降为完整单元字幕，不生成均分的伪逐字时间。另将真实词级时间转换成 `timeline.speechCues`，自定义场景收到镜头内 `speech` 与 `cueFrame(sentenceId, phrase, edge)`，可将画面揭示对齐到实际说出的词；无真实逐词时间时 cue 缺失，场景须采用并标明估算落点，不得声称实测同步。

`battle` 的 `scene.data` 只消费本期数据：`title`、`evidenceStatus` (`verified` 或 `demonstration`)、`factions: [{id,name,color}]`、`terrain: [{kind,points,width}]`、`routes: [{id,points}]`、`armies: [{id,name,factionId,routeId,startFrame,endFrame}]`、`places: [{id,name,x,y}]`。画面采用 1280×720 局部坐标，路线已走部分和军团标记使用同一次路径插值。`verified` 是制作者对来源的记录，不由程序认证；正式历史任务还须在 `direction.md` / `research/` 留下可回查的依据。演示数据必须用 `demonstration`。

已有视频片段可写为 `scene: {"type":"video","data":{"sourceFile":"assets/clip.mp4","sourceInSeconds":2,"audioMode":"muted"}}`，镜头自身的 `durationFrames` 或 `estimatedSeconds` 决定选入长度。`sourceFile` 必须在本期目录内；`prepare` 用 FFprobe 核对源时长并复制到本期公开资源目录。`audioMode` 必须明确为 `muted` 或 `keep`；保留片段原音轨时，不允许它与旁白放置区间重叠，防止无意叠声。片段画面按比例完整放入画幅，规格与听感仍须实际媒体检查。

本期自定义 React/SVG 场景写在 `<episode>/visual/scenes/index.jsx`，默认导出 `{场景名: 组件}`；镜头写 `scene: {"type":"custom","data":{"key":"场景名", ...}}`。组件收 `shot`、`durationFrames`，在镜头局部帧中调用 Remotion `useCurrentFrame()`。参照[单文件示例](../../examples/custom-scene.jsx)。`prepare` 按源码摘要复制本期场景到共享运行目录的忽略区，再生成该版本的 Remotion 入口；这样自定义 JSX 能从同一处依赖加载，源文件仍留在本期。第一版仅支持单文件场景模块，不支持其相对导入；画面可使用内联 SVG 与镜头数据。改场景源码会改变来源摘要，旧 MP4 随之标为过期。

命令（从任意 cwd 传绝对本期目录）：

```sh
node /Users/jack/Documents/codes/lvgou/ai-video/story-studio/runtime/remotion/cli.mjs prepare /absolute/episode
node /Users/jack/Documents/codes/lvgou/ai-video/story-studio/runtime/remotion/cli.mjs render /absolute/episode --browser-executable=/absolute/chromium --remotion-bin=/absolute/remotion
node /Users/jack/Documents/codes/lvgou/ai-video/story-studio/runtime/remotion/cli.mjs still /absolute/episode --frame=120 --browser-executable=/absolute/chromium --remotion-bin=/absolute/remotion
node /Users/jack/Documents/codes/lvgou/ai-video/story-studio/runtime/remotion/cli.mjs extract /absolute/episode --frame=120 --ffmpeg-bin=/absolute/ffmpeg
```

`prepare` 写入本期 `output/remotion-props.json`、`output/视听脚本.md`，有声时将选用的音频复制到 `output/remotion-public/` 并核对可用的音频摘要。阅读视图显示每镜实际重叠的口播句与表达要求；缺句级对齐时只列本单元规划句并标出未知，不能冒充实测位置。`render` 用 Remotion CLI 的 `--props` 与 `--public-dir`，输出 `output/story-studio.mp4`；成功后才写 `output/render-manifest.json`，记录当前输入摘要与 MP4 指纹。`still` 输出指定帧 PNG；`extract` 先核对 manifest，再从当前 MP4 用 FFmpeg 抽帧。manifest 只证明来源版本匹配，连续播放和听查仍须单独记录。准备阶段会拒绝声称模拟 timing 为真实音频。没有安装的 CLI、Remotion/React 模块或浏览器时，渲染会报缺项；本目录不自动下载或安装依赖。

系统找不到 `ffprobe` 时，可在 `prepare` 命令末尾追加 `--ffprobe-bin=/absolute/ffprobe`。准备阶段会核对音频、视频和本期 JSX 的复制副本与原始摘要一致；若制作时源文件正在变更，入口会失败并要求重新准备。

15秒无声虚构示例已实际渲染成功。首次运行暴露入口未在指定文件显式调用 `registerRoot()` 的构建错误；现已修复为示例/生成入口各自注册，并成功渲染450帧。正式一期82.261秒/2466帧已使用11句真实词级时间渲染为H.264/AAC；全片解码成功。一次按秒抽样发现早期距离数字揭示过早，现已改为由实际说出的日期、零件名和距离词触发，并重渲染；关键语音落点画面已复查。QuickTime已连续播放正式片至片尾，核验记录绑定当前MP4；真人听查仍待完成。真实MP4片段与真实配音已在一次临时副本中 prepare/render 成功，并验证源时长越界和保留原音轨叠旁白的拒绝规则；临时合成产物未保留。另有 `examples/episode-chain-demo/` 的85.248秒虚构联合示例：真实旁白、故事场景与战场地图同片渲染；H.264/AAC全片解码、地图中段/结尾关键帧及QuickTime片头至片尾播放均通过，当前MP4摘要已记录。关键帧检查发现底部阵营图例被字幕遮挡，已将图例移入标题栏并重渲染。真人听查仍未完成。
