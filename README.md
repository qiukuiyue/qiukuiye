# 种草视频 AI 导演台

一个 Next.js 全栈网页应用，输入脚本和人设，一键生成贴合产品卖点的 AI 视频分镜 Prompt 包。

## 功能

- 粘贴产品文案、脚本或逐字稿。
- 默认按脚本/逐字稿原文顺序拆镜，每个镜头保留“对应脚本原文”，避免跑成通用种草模板。
- 自动提取产品卖点、痛点、使用场景和结果价值。
- 生成 15-60 秒产品种草短视频 AI 效果分镜。
- 支持自由输入目标人设，并根据人设文字自动推导画面风格。
- 大模型会把目标人设与脚本/逐字稿原文一起作为生成依据，避免跑成通用种草模板。
- 每个镜头包含对应脚本原文、画面描述、镜头运动、AI 视频效果、中文/英文 Prompt、负面 Prompt 和衔接说明。
- 支持 OpenAI-compatible API 配置：API Key、Base URL、模型名。
- 内置 DeepSeek 适配：推荐 Base URL `https://api.deepseek.com`，模型 `deepseek-v4-pro`。
- 支持调整最大输出 tokens 和请求超时秒数，默认适配 V4 Pro 深度思考长输出。
- 生成中显示任务阶段进度，不展示模型原始隐式思维链。
- 强 API 模式：模型调用失败、未配置 API 或返回 JSON 不合格时只显示错误，不使用本地规则补结果。
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

DeepSeek 会自动使用 `/chat/completions`、开启 thinking、设置 `reasoning_effort: "max"`，默认 `max_tokens` 为 12000，并在 180 秒内没有完整返回时显示错误；其他 OpenAI 兼容服务默认使用 `/v1/chat/completions`。
