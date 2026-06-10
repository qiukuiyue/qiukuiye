# 产品种草视频 Prompt 导演

一个 Next.js 全栈网页应用，把产品文案、脚本或逐字稿转换成可编辑、可复制、可导出的 AI 视频 Prompt 包。重点不是普通分镜，而是说明 AI 如何把实拍难以展示的卖点、触感、效率、微观机制和结果价值变成可见画面。

## 功能

- 粘贴产品文案、脚本或逐字稿。
- 自动提取产品卖点、痛点、使用场景和结果价值。
- 生成 15-60 秒产品种草短视频 AI 效果分镜。
- 每个镜头包含画面描述、镜头运动、AI 不可拍效果、为什么必须用 AI、字幕、旁白、中文/英文 Prompt、负面 Prompt 和衔接说明。
- 支持 OpenAI-compatible API 配置：API Key、Base URL、模型名。
- 内置 DeepSeek 适配：推荐 Base URL `https://api.deepseek.com`，模型 `deepseek-v4-pro`。
- 支持调整最大输出 tokens 和超时回退秒数，默认适配 V4 Pro 深度思考长输出。
- 生成中显示任务阶段进度，不展示模型原始隐式思维链。
- 模型调用失败或未配置 API 时自动回退本地规则。
- 分镜卡片可手动编辑，右侧 Prompt 包实时同步。
- 支持复制全部、复制单镜头、导出 Markdown、导出 JSON。

## 运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 说明

首版只做网页端产品，不直接生成视频，不包含画布节点或视频生成流程。

DeepSeek 会自动使用 `/chat/completions`、开启 thinking、设置 `reasoning_effort: "max"`，默认 `max_tokens` 为 12000，并在 180 秒内没有完整返回时回退本地规则；其他 OpenAI 兼容服务默认使用 `/v1/chat/completions`。
