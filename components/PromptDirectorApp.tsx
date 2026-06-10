"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getCustomPersonaStyleSummary,
  getCustomPersonaTitle,
  getPersonaPromptFromPreset,
  getPlatformLabel,
  type BrandTone,
  type Duration,
  type Persona,
  type PublicReasoningStep,
  type Platform,
  type StoryboardAnalysis,
  type StoryboardResponse,
  type StoryboardScene
} from "@/lib/storyboard";

const toneOptions: { value: BrandTone; label: string }[] = [
  { value: "auto", label: "自动判断" },
  { value: "professional", label: "专业可信" },
  { value: "minimal", label: "高级极简" },
  { value: "warm", label: "生活温暖" },
  { value: "dramatic", label: "夸张娱乐" },
  { value: "tech", label: "科技产品" },
  { value: "oriental", label: "东方审美" },
  { value: "youth", label: "年轻潮流" }
];

const platformOptions: { value: Platform; label: string }[] = [
  { value: "douyin", label: "抖音" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "kuaishou", label: "快手" },
  { value: "bilibili", label: "B站" }
];

const durationOptions: { value: Duration; label: string }[] = [
  { value: "15s", label: "15 秒" },
  { value: "30s", label: "30 秒" },
  { value: "45s", label: "45 秒" },
  { value: "60s", label: "60 秒" }
];

const sampleText =
  "产品名：云感修护精华。主打熬夜后暗沉、干燥、上妆卡粉。添加三重植萃和微囊包裹技术，质地清爽不黏，早晚都能用。适合通勤、约会前、熬夜后急救，想让皮肤看起来更稳定、更透亮的人。";

const defaultPersonaPrompt =
  "科技数码测评人：理性、懂参数和真实使用场景，擅长用结构剖面、数据轨迹、性能对比讲清楚产品价值。";

const deepSeekPreset = {
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-pro",
  maxTokens: 12000,
  timeoutSeconds: 180
};

const reasoningSteps = [
  "读取产品文案与品牌调性",
  "按原脚本顺序拆分镜头依据",
  "根据目标人设推导画面风格",
  "深度思考卖点、痛点和使用场景",
  "设计 AI 视频效果和镜头语言",
  "生成镜头画面和中英 Prompt",
  "校验结构化 JSON 并写入编辑区"
];

const sceneFields: {
  key: keyof StoryboardScene;
  label: string;
  className?: string;
  rows?: number;
}[] = [
  { key: "scriptAnchor", label: "对应脚本原文", className: "compact-textarea" },
  { key: "visualDescription", label: "画面描述", className: "prompt-textarea" },
  { key: "cameraMovement", label: "镜头运动", className: "compact-textarea" },
  { key: "aiEffect", label: "AI 视频效果", className: "prompt-textarea" },
  { key: "promptZh", label: "中文 AI 视频 Prompt", className: "prompt-textarea" },
  { key: "promptEn", label: "English AI Video Prompt", className: "prompt-textarea" },
  { key: "negativePrompt", label: "负面 Prompt", className: "compact-textarea" },
  { key: "transitionFromPrevious", label: "上一段衔接说明", className: "compact-textarea" }
];

export default function PromptDirectorApp() {
  const [inputText, setInputText] = useState(sampleText);
  const [brandTone, setBrandTone] = useState<BrandTone>("auto");
  const [personaPrompt, setPersonaPrompt] = useState(defaultPersonaPrompt);
  const [platform, setPlatform] = useState<Platform>("douyin");
  const [duration, setDuration] = useState<Duration>("30s");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(deepSeekPreset.baseUrl);
  const [model, setModel] = useState(deepSeekPreset.model);
  const [maxTokens, setMaxTokens] = useState(deepSeekPreset.maxTokens);
  const [timeoutSeconds, setTimeoutSeconds] = useState(deepSeekPreset.timeoutSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const [analysis, setAnalysis] = useState<StoryboardAnalysis | null>(null);
  const [reasoningSummary, setReasoningSummary] = useState<PublicReasoningStep[]>([]);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("prompt-director-api-config");
    if (!saved) {
      setIsConfigLoaded(true);
      return;
    }

    try {
      const config = JSON.parse(saved) as {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        persona?: Persona;
        personaPrompt?: string;
        maxTokens?: number;
        timeoutSeconds?: number;
      };
      if (config.apiKey) setApiKey(config.apiKey);
      if (config.baseUrl) setBaseUrl(config.baseUrl.trim());
      if (config.model) setModel(config.model.trim());
      if (typeof config.personaPrompt === "string") {
        setPersonaPrompt(config.personaPrompt);
      } else if (config.persona) {
        setPersonaPrompt(getPersonaPromptFromPreset(config.persona) || defaultPersonaPrompt);
      }
      if (config.maxTokens) setMaxTokens(clampClientNumber(config.maxTokens, 2000, 16000));
      if (config.timeoutSeconds)
        setTimeoutSeconds(clampClientNumber(config.timeoutSeconds, 30, 300));
    } catch {
      window.localStorage.removeItem("prompt-director-api-config");
    } finally {
      setIsConfigLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isConfigLoaded) return;

    window.localStorage.setItem(
      "prompt-director-api-config",
      JSON.stringify({ apiKey, baseUrl, model, personaPrompt, maxTokens, timeoutSeconds })
    );
  }, [apiKey, baseUrl, model, personaPrompt, maxTokens, timeoutSeconds, isConfigLoaded]);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const promptPackage = useMemo(
    () => buildPromptPackage(analysis, reasoningSummary, scenes, platform, duration, personaPrompt),
    [analysis, reasoningSummary, scenes, platform, duration, personaPrompt]
  );

  const hasApiConfig = Boolean(apiKey.trim() && baseUrl.trim() && model.trim());
  const canGenerate = inputText.trim().length > 0 && hasApiConfig && !isGenerating;
  const isDeepSeekConfig =
    baseUrl.includes("api.deepseek.com") || model.toLowerCase().startsWith("deepseek-");

  function applyDeepSeekPreset() {
    setBaseUrl(deepSeekPreset.baseUrl);
    setModel(deepSeekPreset.model);
    setMaxTokens(deepSeekPreset.maxTokens);
    setTimeoutSeconds(deepSeekPreset.timeoutSeconds);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setWarnings([]);
    setCopyStatus("");
    setRequestStatus("请求已发送，正在等待模型返回结构化分镜...");
    setAnalysis(null);
    setReasoningSummary([]);
    setScenes([]);

    try {
      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText,
          brandTone,
          personaPrompt,
          platform,
          duration,
          apiConfig: { apiKey, baseUrl, model, maxTokens, timeoutSeconds }
        })
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          warnings?: string[];
        } | null;
        throw new Error(errorPayload?.error ?? `请求失败：${response.status}`);
      }

      const data = (await response.json()) as StoryboardResponse;
      setAnalysis(data.analysis);
      setReasoningSummary(data.reasoningSummary ?? []);
      setScenes(data.scenes);
      setWarnings(data.warnings ?? []);
      setRequestStatus("模型生成完成");
    } catch (error) {
      const message = error instanceof Error ? error.message : "网页请求失败";
      setAnalysis(null);
      setReasoningSummary([]);
      setScenes([]);
      setWarnings([message]);
      setRequestStatus("模型生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  function updateScene(index: number, key: keyof StoryboardScene, value: string) {
    setScenes((current) =>
      current.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, [key]: value } : scene
      )
    );
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label}已复制`);
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("复制失败，请手动选中文本复制");
    }
  }

  function exportFile(content: string, type: "md" | "json") {
    const blob = new Blob([content], {
      type: type === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-video-prompt-package.${type}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Image src="/whale-reference.png" alt="" width={46} height={46} priority />
          </div>
          <div className="brand-copy">
            <h1 className="brand-title">种草视频 AI 导演台</h1>
            <p className="brand-subtitle">
              输入脚本和人设，一键生成贴合产品卖点的 AI 视频分镜 Prompt 包。
            </p>
          </div>
        </div>
        <div className="status-chip" title="当前生成来源">
          <span className="status-dot" />
          API 大模型生成
          {copyStatus ? ` · ${copyStatus}` : ""}
        </div>
      </header>

      <section className="workspace">
        <aside className="panel">
          <div className="panel-header">
            <h2 className="panel-title">输入与配置</h2>
          </div>
          <div className="panel-body">
            <label className="field" htmlFor="source-text">
              <span className="label">产品文案 / 脚本 / 逐字稿</span>
              <textarea
                id="source-text"
                aria-label="产品文案 / 脚本 / 逐字稿"
                className="textarea script-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="粘贴产品介绍、直播逐字稿、卖点清单或短视频脚本..."
              />
            </label>

            <div className="field-row">
              <label className="field" htmlFor="platform">
                <span className="label">平台</span>
                <select
                  id="platform"
                  aria-label="平台"
                  className="select"
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value as Platform)}
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" htmlFor="duration">
                <span className="label">时长</span>
                <select
                  id="duration"
                  aria-label="时长"
                  className="select"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value as Duration)}
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field">
              <span className="label">品牌调性</span>
              <div className="pill-tabs">
                {toneOptions.map((option) => (
                  <button
                    className={`pill-tab ${brandTone === option.value ? "active" : ""}`}
                    key={option.value}
                    type="button"
                    onClick={() => setBrandTone(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="field" htmlFor="persona-prompt">
              <span className="label">目标人设</span>
              <textarea
                id="persona-prompt"
                aria-label="目标人设"
                className="textarea persona-input"
                value={personaPrompt}
                onChange={(event) => setPersonaPrompt(event.target.value)}
                placeholder="例如：30 岁通勤白领女性，理性但有审美，喜欢真实办公室/地铁/下班场景；表达像闺蜜推荐，但画面要干净、有质感。"
              />
            </label>

            <div className="persona-card">
              <div>
                <span className="label">人设推导画面风格</span>
                <strong>{getCustomPersonaTitle(personaPrompt)}</strong>
              </div>
              <p>{getCustomPersonaStyleSummary(personaPrompt)}</p>
              <p className="persona-note">生成时会把这段人设和上方脚本原文一起作为每个镜头的依据。</p>
            </div>

            <label className="field" htmlFor="api-key">
              <span className="label">API Key</span>
              <input
                id="api-key"
                aria-label="API Key"
                className="input"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
              />
            </label>
            <label className="field" htmlFor="base-url">
              <span className="label">Base URL</span>
              <input
                id="base-url"
                aria-label="Base URL"
                className="input"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.deepseek.com"
              />
            </label>
            <label className="field" htmlFor="model">
              <span className="label">模型名</span>
              <input
                id="model"
                aria-label="模型名"
                className="input"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="deepseek-v4-pro"
              />
            </label>

            <div className="field-row">
              <label className="field" htmlFor="max-tokens">
                <span className="label">最大输出 tokens</span>
                <input
                  id="max-tokens"
                  aria-label="最大输出 tokens"
                  className="input"
                  type="number"
                  min={2000}
                  max={16000}
                  step={500}
                  value={maxTokens}
                  onChange={(event) =>
                    setMaxTokens(clampClientNumber(event.target.value, 2000, 16000))
                  }
                />
              </label>
              <label className="field" htmlFor="timeout-seconds">
                <span className="label">请求超时秒数</span>
                <input
                  id="timeout-seconds"
                  aria-label="请求超时秒数"
                  className="input"
                  type="number"
                  min={30}
                  max={300}
                  step={10}
                  value={timeoutSeconds}
                  onChange={(event) =>
                    setTimeoutSeconds(clampClientNumber(event.target.value, 30, 300))
                  }
                />
              </label>
            </div>

            <div className="api-helper">
              <button
                className="ghost-button"
                data-testid="deepseek-preset"
                type="button"
                onClick={applyDeepSeekPreset}
              >
                DeepSeek 快速配置
              </button>
              <span>
                {isDeepSeekConfig
                  ? `已按 DeepSeek V4 Pro 深度思考适配：开启 thinking、reasoning_effort=max、${timeoutSeconds} 秒超时报错。`
                  : "OpenAI 兼容服务会默认走 /v1/chat/completions。"}
              </span>
            </div>

            {!hasApiConfig ? (
              <div className="notice info-notice">
                当前为强 API 模式：请填写 API Key、Base URL 和模型名后生成；不会使用本地规则补结果。
              </div>
            ) : null}

            <button
              className="primary-button"
              data-testid="generate-button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? "生成中..." : "生成分镜 Prompt 包"}
            </button>

            {requestStatus ? (
              <div className="status-panel" aria-live="polite" data-testid="request-status">
                {requestStatus}
              </div>
            ) : null}

            {isGenerating ? (
              <div className="notice info-notice">
                模型处理中。DeepSeek V4 Pro 会开启深度思考和结构化 JSON 输出；{timeoutSeconds} 秒内没有完整返回时会停止并提示错误。
              </div>
            ) : null}

            {isGenerating ? (
              <ReasoningProgress elapsedSeconds={elapsedSeconds} timeoutSeconds={timeoutSeconds} />
            ) : null}

            {warnings.length > 0 ? (
              <div className="notice">
                {warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}

            <AnalysisPanel analysis={analysis} />
            <PublicReasoningPanel reasoningSummary={reasoningSummary} />

            <p className="footer-note">
              API 配置会保存在当前浏览器本地存储。当前只使用大模型生成；接口失败时会显示错误，不使用本地规则补结果。
            </p>
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">分镜编辑</h2>
            <span className="muted">{scenes.length ? `${scenes.length} 个镜头` : "待生成"}</span>
          </div>
          <div className="panel-body">
            {scenes.length ? (
              <div className="scene-list">
                {scenes.map((scene, index) => (
                  <article
                    className="scene-card"
                    data-testid={`scene-card-${index + 1}`}
                    key={scene.id}
                  >
                    <div className="scene-card-header">
                      <span className="scene-index">{index + 1}</span>
                      <div className="scene-heading">
                        <h3>{scene.sceneTitle}</h3>
                        <p>{scene.scriptAnchor}</p>
                      </div>
                      <button
                        className="copy-button"
                        data-testid={`copy-scene-${index + 1}`}
                        type="button"
                        onClick={() => copyText(formatScene(scene, index), `镜头 ${index + 1}`)}
                      >
                        复制镜头
                      </button>
                    </div>
                    <div className="scene-fields">
                      <div className="scene-two-col">
                        <label className="field" htmlFor={`${scene.id}-title`}>
                          <span className="label">镜头标题</span>
                          <input
                            id={`${scene.id}-title`}
                            aria-label={`镜头 ${index + 1} 镜头标题`}
                            className="input"
                            value={scene.sceneTitle}
                            onChange={(event) =>
                              updateScene(index, "sceneTitle", event.target.value)
                            }
                          />
                        </label>
                        <label className="field" htmlFor={`${scene.id}-selling-point`}>
                          <span className="label">对应卖点</span>
                          <input
                            id={`${scene.id}-selling-point`}
                            aria-label={`镜头 ${index + 1} 对应卖点`}
                            className="input"
                            value={scene.sellingPoint}
                            onChange={(event) =>
                              updateScene(index, "sellingPoint", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label className="field" htmlFor={`${scene.id}-pain-point`}>
                        <span className="label">痛点 / 场景</span>
                        <textarea
                          id={`${scene.id}-pain-point`}
                          aria-label={`镜头 ${index + 1} 痛点 / 场景`}
                          className="textarea compact-textarea"
                          value={scene.painPoint}
                          onChange={(event) => updateScene(index, "painPoint", event.target.value)}
                        />
                      </label>
                      {sceneFields.map((field) => (
                        <label className="field" htmlFor={`${scene.id}-${field.key}`} key={field.key}>
                          <span className="label">{field.label}</span>
                          <textarea
                            id={`${scene.id}-${field.key}`}
                            aria-label={`镜头 ${index + 1} ${field.label}`}
                            data-testid={`${scene.id}-${field.key}`}
                            className={`textarea ${field.className ?? ""}`}
                            value={String(scene[field.key])}
                            onChange={(event) => updateScene(index, field.key, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div>
                  <h2>先粘贴文案，再生成分镜</h2>
                  <p>
                    生成后这里会出现可编辑镜头卡片；画面风格会根据目标人设自动进入每条 Prompt。
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="panel preview-panel">
          <div className="panel-header">
            <h2 className="panel-title">Prompt 包</h2>
          </div>
          <div className="panel-body">
            <div className="preview-actions">
              <button
                className="secondary-button"
                data-testid="copy-all"
                type="button"
                disabled={!scenes.length}
                onClick={() => copyText(promptPackage.markdown, "全部内容")}
              >
                复制全部
              </button>
              <button
                className="ghost-button"
                data-testid="export-markdown"
                type="button"
                disabled={!scenes.length}
                onClick={() => exportFile(promptPackage.markdown, "md")}
              >
                导出 Markdown
              </button>
              <button
                className="ghost-button"
                data-testid="export-json"
                type="button"
                disabled={!scenes.length}
                onClick={() => exportFile(promptPackage.json, "json")}
              >
                导出 JSON
              </button>
            </div>

            {scenes.length ? (
              <div className="prompt-preview">
                {scenes.map((scene, index) => (
                  <div
                    className="preview-card"
                    data-testid={`preview-card-${index + 1}`}
                    key={scene.id}
                  >
                    <h3>{scene.sceneTitle}</h3>
                    <pre>{formatScene(scene, index)}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div>
                  <h2>实时预览区</h2>
                  <p>分镜生成后，当前编辑状态会在这里整理成完整 Prompt 包。</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function AnalysisPanel({ analysis }: { analysis: StoryboardAnalysis | null }) {
  if (!analysis) {
    return (
      <div className="analysis-block">
        <h3>分析结果</h3>
        <p className="muted">生成后会显示产品名、卖点、痛点、场景和结果价值。</p>
      </div>
    );
  }

  return (
    <div className="analysis-grid">
      <div className="analysis-block">
        <h3>产品与调性</h3>
        <p className="muted">
          {analysis.productName} · {analysis.brandTone}
        </p>
      </div>
      <TagBlock title="卖点" items={analysis.sellingPoints} />
      <TagBlock title="痛点" items={analysis.painPoints} />
      <TagBlock title="场景" items={analysis.useCases} />
      <TagBlock title="结果价值" items={analysis.resultValues} />
    </div>
  );
}

function PublicReasoningPanel({
  reasoningSummary
}: {
  reasoningSummary: PublicReasoningStep[];
}) {
  if (!reasoningSummary.length) return null;

  return (
    <div className="analysis-block">
      <h3>公开导演分析</h3>
      <div className="reasoning-summary">
        {reasoningSummary.map((step) => (
          <div className="summary-step" key={`${step.title}-${step.detail}`}>
            <strong>{step.title}</strong>
            <p>{step.detail}</p>
          </div>
        ))}
      </div>
      <p className="footer-note">
        这里展示的是模型可公开输出的创作分析摘要，不展示模型隐藏的原始隐式思维链。
      </p>
    </div>
  );
}

function ReasoningProgress({
  elapsedSeconds,
  timeoutSeconds
}: {
  elapsedSeconds: number;
  timeoutSeconds: number;
}) {
  const progress = Math.min(100, Math.round((elapsedSeconds / timeoutSeconds) * 100));
  const activeIndex = Math.min(
    reasoningSteps.length - 1,
    Math.floor((elapsedSeconds / timeoutSeconds) * reasoningSteps.length)
  );

  return (
    <div className="reasoning-panel" data-testid="reasoning-progress">
      <div className="reasoning-header">
        <span>深度思考进度</span>
        <span>
          {elapsedSeconds}s / {timeoutSeconds}s
        </span>
      </div>
      <div className="progress-track" aria-label="深度思考进度">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="reasoning-steps">
        {reasoningSteps.map((step, index) => (
          <div
            className={`reasoning-step ${
              index < activeIndex ? "done" : index === activeIndex ? "active" : ""
            }`}
            key={step}
          >
            <span className="step-dot" />
            <span>{step}</span>
          </div>
        ))}
      </div>
      <p className="footer-note">
        这里展示的是任务阶段可视化，不展示模型原始隐式思维链；最终结果会落到可编辑分镜和 Prompt 包里。
      </p>
    </div>
  );
}

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="analysis-block">
      <h3>{title}</h3>
      <div className="tag-list">
        {items.map((item) => (
          <span className="tag" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function clampClientNumber(value: number | string, min: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return min;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function buildPromptPackage(
  analysis: StoryboardAnalysis | null,
  reasoningSummary: PublicReasoningStep[],
  scenes: StoryboardScene[],
  platform: Platform,
  duration: Duration,
  personaPrompt: string
) {
  const cleanedPersonaPrompt = personaPrompt.trim() || "未填写自定义人设";

  const payload = {
    meta: {
      platform: getPlatformLabel(platform),
      duration,
      persona: getCustomPersonaTitle(personaPrompt),
      personaPrompt: cleanedPersonaPrompt,
      personaDerivedStyle: getCustomPersonaStyleSummary(personaPrompt),
      generatedAt: new Date().toISOString()
    },
    analysis,
    reasoningSummary,
    scenes
  };

  const markdown = [
    "# 产品种草视频分镜 Prompt 包",
    "",
    `平台：${getPlatformLabel(platform)}`,
    `时长：${duration}`,
    `目标人设：${cleanedPersonaPrompt}`,
    `推导风格：${getCustomPersonaStyleSummary(personaPrompt)}`,
    analysis ? `产品：${analysis.productName}` : "",
    analysis ? `品牌调性：${analysis.brandTone}` : "",
    "",
    reasoningSummary.length ? "## 公开导演分析" : "",
    "",
    reasoningSummary
      .map((step) => `### ${step.title}\n${step.detail}`)
      .join("\n\n"),
    "",
    "## 分镜",
    "",
    scenes.map((scene, index) => formatScene(scene, index)).join("\n\n---\n\n")
  ]
    .filter(Boolean)
    .join("\n");

  return {
    markdown,
    json: JSON.stringify(payload, null, 2)
  };
}

function formatScene(scene: StoryboardScene, index: number) {
  return [
    `## 镜头 ${index + 1}：${scene.sceneTitle}`,
    `对应脚本原文：${scene.scriptAnchor}`,
    `对应卖点：${scene.sellingPoint}`,
    `痛点/场景：${scene.painPoint}`,
    "",
    `画面描述：${scene.visualDescription}`,
    `镜头运动：${scene.cameraMovement}`,
    `AI 视频效果：${scene.aiEffect}`,
    "",
    `中文 AI 视频 Prompt：${scene.promptZh}`,
    "",
    `English AI Video Prompt：${scene.promptEn}`,
    "",
    `负面 Prompt：${scene.negativePrompt}`,
    `上一段衔接说明：${scene.transitionFromPrevious}`
  ].join("\n");
}
