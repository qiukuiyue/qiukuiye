"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createFallbackStoryboard,
  getPlatformLabel,
  getVisualStyleLabel,
  type BrandTone,
  type Duration,
  type Platform,
  type StoryboardAnalysis,
  type StoryboardResponse,
  type StoryboardScene,
  type VisualStyle
} from "@/lib/storyboard";

const sampleText =
  "产品名：云感修护精华。主打熬夜后暗沉、干燥、上妆卡粉。添加三重植萃和微囊包裹技术，质地清爽不黏，早晚都能用。适合通勤、约会前、熬夜后急救，想让皮肤看起来更稳定、更透亮的人。";

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

const visualStyleOptions: { value: VisualStyle; label: string }[] = [
  { value: "auto", label: "自动匹配" },
  { value: "feminine", label: "女性化" },
  { value: "tech", label: "科技风" },
  { value: "luxury", label: "高奢质感" },
  { value: "minimal", label: "极简干净" },
  { value: "fresh", label: "清新自然" },
  { value: "cute", label: "可爱活泼" },
  { value: "dramatic", label: "强冲击种草" },
  { value: "oriental", label: "东方审美" }
];

const editableFields: { key: keyof StoryboardScene; label: string; wide?: boolean }[] = [
  { key: "visualDescription", label: "画面描述", wide: true },
  { key: "cameraMovement", label: "镜头运动" },
  { key: "aiEffect", label: "AI 视频效果", wide: true },
  { key: "subtitle", label: "字幕" },
  { key: "voiceover", label: "旁白" },
  { key: "promptZh", label: "中文 Prompt", wide: true },
  { key: "promptEn", label: "English Prompt", wide: true },
  { key: "negativePrompt", label: "负面 Prompt" },
  { key: "transitionFromPrevious", label: "衔接说明" }
];

const deepSeekPreset = {
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-pro",
  maxTokens: 12000,
  timeoutSeconds: 180
};

export default function Home() {
  const [inputText, setInputText] = useState(sampleText);
  const [brandTone, setBrandTone] = useState<BrandTone>("auto");
  const [platform, setPlatform] = useState<Platform>("douyin");
  const [duration, setDuration] = useState<Duration>("30s");
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("auto");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(deepSeekPreset.baseUrl);
  const [model, setModel] = useState(deepSeekPreset.model);
  const [maxTokens, setMaxTokens] = useState(deepSeekPreset.maxTokens);
  const [timeoutSeconds, setTimeoutSeconds] = useState(deepSeekPreset.timeoutSeconds);
  const [analysis, setAnalysis] = useState<StoryboardAnalysis | null>(null);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [source, setSource] = useState<StoryboardResponse["source"]>("fallback");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("prompt-director-api-config");
    if (!saved) return;
    try {
      const config = JSON.parse(saved) as Partial<{
        apiKey: string;
        baseUrl: string;
        model: string;
        maxTokens: number;
        timeoutSeconds: number;
      }>;
      if (config.apiKey) setApiKey(config.apiKey);
      if (config.baseUrl) setBaseUrl(config.baseUrl);
      if (config.model) setModel(config.model);
      if (config.maxTokens) setMaxTokens(clampNumber(config.maxTokens, 2000, 16000));
      if (config.timeoutSeconds) setTimeoutSeconds(clampNumber(config.timeoutSeconds, 30, 300));
    } catch {
      window.localStorage.removeItem("prompt-director-api-config");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "prompt-director-api-config",
      JSON.stringify({ apiKey, baseUrl, model, maxTokens, timeoutSeconds })
    );
  }, [apiKey, baseUrl, model, maxTokens, timeoutSeconds]);

  const promptPackage = useMemo(
    () => buildPromptPackage(analysis, scenes, platform, duration, visualStyle),
    [analysis, scenes, platform, duration, visualStyle]
  );

  async function handleGenerate() {
    setIsGenerating(true);
    setWarnings([]);
    setCopyStatus("");

    try {
      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText,
          brandTone,
          platform,
          duration,
          visualStyle,
          apiConfig: { apiKey, baseUrl, model, maxTokens, timeoutSeconds }
        })
      });

      if (!response.ok) throw new Error(`请求失败：${response.status}`);
      const data = (await response.json()) as StoryboardResponse;
      setAnalysis(data.analysis);
      setScenes(data.scenes);
      setWarnings(data.warnings ?? []);
      setSource(data.source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "网页请求失败";
      const fallback = createFallbackStoryboard(
        { inputText, brandTone, platform, duration, visualStyle },
        `${message}，已在浏览器内使用本地规则生成。`
      );
      setAnalysis(fallback.analysis);
      setScenes(fallback.scenes);
      setWarnings(fallback.warnings);
      setSource("fallback");
    } finally {
      setIsGenerating(false);
    }
  }

  function updateScene(index: number, key: keyof StoryboardScene, value: string) {
    setScenes((current) => current.map((scene, sceneIndex) => (sceneIndex === index ? { ...scene, [key]: value } : scene)));
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label}已复制`);
      window.setTimeout(() => setCopyStatus(""), 1600);
    } catch {
      setCopyStatus("复制失败，请手动选中文本复制");
    }
  }

  function exportFile(content: string, type: "md" | "json") {
    const blob = new Blob([content], { type: type === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8" });
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
        <div>
          <h1>产品种草视频 Prompt 导演</h1>
          <p>把产品文案、脚本或逐字稿拆成可编辑、可复制、可导出的 AI 视频分镜 Prompt 包。</p>
        </div>
        <div className="status-chip">{source === "model" ? "模型生成" : "本地规则可用"}{copyStatus ? ` · ${copyStatus}` : ""}</div>
      </header>

      <section className="workspace">
        <aside className="panel">
          <div className="panel-header"><h2>输入与配置</h2></div>
          <div className="panel-body">
            <label className="field">
              <span>产品文案 / 脚本 / 逐字稿</span>
              <textarea className="textarea script-input" value={inputText} onChange={(event) => setInputText(event.target.value)} />
            </label>

            <div className="field-row">
              <SelectField label="平台" value={platform} options={platformOptions} onChange={(value) => setPlatform(value as Platform)} />
              <SelectField label="时长" value={duration} options={durationOptions} onChange={(value) => setDuration(value as Duration)} />
            </div>

            <Segmented label="品牌调性" value={brandTone} options={toneOptions} onChange={(value) => setBrandTone(value as BrandTone)} />
            <Segmented label="画面风格" value={visualStyle} options={visualStyleOptions} onChange={(value) => setVisualStyle(value as VisualStyle)} />

            <label className="field"><span>API Key</span><input className="input" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." /></label>
            <label className="field"><span>Base URL</span><input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label>
            <label className="field"><span>模型名</span><input className="input" value={model} onChange={(event) => setModel(event.target.value)} /></label>

            <div className="field-row">
              <label className="field"><span>最大输出 tokens</span><input className="input" type="number" min={2000} max={16000} step={500} value={maxTokens} onChange={(event) => setMaxTokens(clampNumber(event.target.value, 2000, 16000))} /></label>
              <label className="field"><span>超时回退秒数</span><input className="input" type="number" min={30} max={300} step={10} value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(clampNumber(event.target.value, 30, 300))} /></label>
            </div>

            <div className="button-row">
              <button className="ghost-button" type="button" onClick={() => {
                setBaseUrl(deepSeekPreset.baseUrl);
                setModel(deepSeekPreset.model);
                setMaxTokens(deepSeekPreset.maxTokens);
                setTimeoutSeconds(deepSeekPreset.timeoutSeconds);
              }}>DeepSeek 快速配置</button>
              <button className="primary-button" type="button" disabled={!inputText.trim() || isGenerating} onClick={handleGenerate}>{isGenerating ? "生成中..." : "生成分镜 Prompt 包"}</button>
            </div>

            <p className="helper-text">API 配置仅保存在当前浏览器本地存储。接口失败或未配置 API 时会自动回退本地规则。</p>
            {warnings.map((warning) => <div className="notice" key={warning}>{warning}</div>)}
            <AnalysisPanel analysis={analysis} />
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header"><h2>分镜编辑</h2><span>{scenes.length ? `${scenes.length} 个镜头` : "待生成"}</span></div>
          <div className="panel-body">
            {scenes.length ? scenes.map((scene, index) => (
              <article className="scene-card" key={scene.id}>
                <div className="scene-card-header">
                  <strong>{index + 1}</strong>
                  <div><h3>{scene.sceneTitle}</h3><p>{scene.sellingPoint}</p></div>
                  <button className="copy-button" type="button" onClick={() => copyText(formatScene(scene, index), `镜头 ${index + 1}`)}>复制镜头</button>
                </div>
                <div className="scene-fields">
                  <label className="field"><span>镜头标题</span><input className="input" value={scene.sceneTitle} onChange={(event) => updateScene(index, "sceneTitle", event.target.value)} /></label>
                  <label className="field"><span>对应卖点</span><input className="input" value={scene.sellingPoint} onChange={(event) => updateScene(index, "sellingPoint", event.target.value)} /></label>
                  <label className="field wide"><span>痛点 / 场景</span><textarea className="textarea compact" value={scene.painPoint} onChange={(event) => updateScene(index, "painPoint", event.target.value)} /></label>
                  {editableFields.map((field) => (
                    <label className={`field ${field.wide ? "wide" : ""}`} key={field.key}>
                      <span>{field.label}</span>
                      <textarea className="textarea compact" value={String(scene[field.key])} onChange={(event) => updateScene(index, field.key, event.target.value)} />
                    </label>
                  ))}
                </div>
              </article>
            )) : <Empty title="先粘贴文案，再生成分镜" text="生成后这里会出现可编辑镜头卡片。" />}
          </div>
        </section>

        <aside className="panel preview-panel">
          <div className="panel-header"><h2>Prompt 包</h2></div>
          <div className="panel-body">
            <div className="button-row">
              <button className="secondary-button" type="button" disabled={!scenes.length} onClick={() => copyText(promptPackage.markdown, "全部内容")}>复制全部</button>
              <button className="ghost-button" type="button" disabled={!scenes.length} onClick={() => exportFile(promptPackage.markdown, "md")}>导出 Markdown</button>
              <button className="ghost-button" type="button" disabled={!scenes.length} onClick={() => exportFile(promptPackage.json, "json")}>导出 JSON</button>
            </div>
            {scenes.length ? <pre className="prompt-preview">{promptPackage.markdown}</pre> : <Empty title="实时预览区" text="当前编辑状态会同步整理成完整 Prompt 包。" />}
          </div>
        </aside>
      </section>
    </main>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select className="select" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="field"><span>{label}</span><div className="pill-tabs">{options.map((option) => <button className={`pill-tab ${value === option.value ? "active" : ""}`} key={option.value} type="button" onClick={() => onChange(option.value)}>{option.label}</button>)}</div></div>;
}

function AnalysisPanel({ analysis }: { analysis: StoryboardAnalysis | null }) {
  if (!analysis) return <div className="analysis-block"><h3>分析结果</h3><p>生成后会显示产品名、卖点、痛点、场景和结果价值。</p></div>;
  return <div className="analysis-block"><h3>{analysis.productName} · {analysis.brandTone}</h3>{[analysis.sellingPoints, analysis.painPoints, analysis.useCases, analysis.resultValues].map((items, index) => <div className="tag-list" key={index}>{items.map((item) => <span className="tag" key={item}>{item}</span>)}</div>)}</div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><h2>{title}</h2><p>{text}</p></div>;
}

function clampNumber(value: number | string, min: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return min;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}

function buildPromptPackage(analysis: StoryboardAnalysis | null, scenes: StoryboardScene[], platform: Platform, duration: Duration, visualStyle: VisualStyle) {
  const markdown = [
    "# 产品种草视频分镜 Prompt 包",
    "",
    `平台：${getPlatformLabel(platform)}`,
    `时长：${duration}`,
    `画面风格：${getVisualStyleLabel(visualStyle)}`,
    analysis ? `产品：${analysis.productName}` : "",
    analysis ? `品牌调性：${analysis.brandTone}` : "",
    "",
    "## 分镜",
    "",
    scenes.map((scene, index) => formatScene(scene, index)).join("\n\n---\n\n")
  ].filter(Boolean).join("\n");

  return {
    markdown,
    json: JSON.stringify({ meta: { platform: getPlatformLabel(platform), duration, visualStyle: getVisualStyleLabel(visualStyle) }, analysis, scenes }, null, 2)
  };
}

function formatScene(scene: StoryboardScene, index: number) {
  return [
    `## 镜头 ${index + 1}：${scene.sceneTitle}`,
    `对应卖点：${scene.sellingPoint}`,
    `痛点/场景：${scene.painPoint}`,
    "",
    `画面描述：${scene.visualDescription}`,
    `镜头运动：${scene.cameraMovement}`,
    `AI 视频效果：${scene.aiEffect}`,
    `字幕：${scene.subtitle}`,
    `旁白：${scene.voiceover}`,
    "",
    `中文 AI 视频 Prompt：${scene.promptZh}`,
    "",
    `English AI Video Prompt：${scene.promptEn}`,
    "",
    `负面 Prompt：${scene.negativePrompt}`,
    `上一段衔接说明：${scene.transitionFromPrevious}`
  ].join("\n");
}
