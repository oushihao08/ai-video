# 视频运行层依赖与配置

当前状态：Remotion 4.0.508 与 React 19.2.8 已在本目录安装，manifest 和 lockfile 已生成。虚构15秒示例与尊界 V800 正式82.261秒有声一期均已渲染；正式片为H.264/AAC，完整解码成功。正式片已由QuickTime从片头连续播放至片尾，记录绑定当前MP4摘要；真人听查尚未完成。

## 唯一依赖位置

依赖位于本目录 `story-studio/runtime/remotion/`，由 `index.jsx` 和 `cli.mjs` 使用。`package.json` 与 lockfile 固定 `@remotion/cli`/`remotion` 4.0.508、`react`/`react-dom` 19.2.8；安装及 `npm ls --depth=0` 版本核对已成功。未沿用旧模板个人浏览器绝对路径。

`cli.mjs` 默认从本目录 `node_modules/.bin/remotion` 查找命令；也可用 `--remotion-bin=/absolute/path` 显式指定。`render`/`still` 需 `--browser-executable=/absolute/chromium` 或 `STORY_STUDIO_BROWSER_EXECUTABLE`。`extract` 需 FFmpeg；接入已有视频片段的 `prepare` 需 FFprobe，可分别用 `--ffmpeg-bin`、`--ffprobe-bin` 或同名 `STORY_STUDIO_FFMPEG`、`STORY_STUDIO_FFPROBE` 指定。浏览器、字体、编码器与片段格式均以实际预演和输出为准。

## 与配音层的界限

配音入口是 Node 脚本，使用系统 `ffmpeg`/`ffprobe` 和火山 TTS 环境变量；它不从 Remotion 的 `node_modules` 加载。正式请求需有效审核依据及凭据；本文件不保存或展示密钥。

## 实际核对顺序

每次改输入后运行 `prepare` 并检查派生视听脚本；对关键帧执行 `still`、对短链路执行 `render`，检查 MP4 指纹与来源 manifest。最终实际听查、抽帧和连续播放，记录时间码与问题。格式示例和虚构演示不能充当正式一期的内容审核或用户认可。
