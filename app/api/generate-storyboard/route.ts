import {
  buildModelMessages,
  createFallbackStoryboard,
  normalizeStoryboardResponse,
  type StoryboardRequest
} from "@/lib/storyboard";

export const runtime = "nodejs";

const DEFAULT_MODEL_TIMEOUT_MS = 180000;
const DEFAULT_MAX_TOKENS = 12000;

export async function POST(request: Request) {
  let payload: StoryboardRequest;

  try {
    payload = (await request.json()) as StoryboardRequest;
  } catch {
    return Response.json(
      createFallbackStoryboard(
        {
          inputText: "",
          brandTone: "auto",
          platform: "douyin",
          duration: "30s",
          visualStyle: "auto"
        },
        "请求内容不是有效 JSON，已使用本地规则生成。"
      )
    );
  }

  const inputText = payload.inputText?.trim();
  const requestContext = {
    inputText: inputText || "请先粘贴产品文案、脚本或逐字稿。",
    brandTone: payload.brandTone ?? "auto",
    platform: payload.platform ?? "douyin",
    duration: payload.duration ?? "30s",
    visualStyle: payload.visualStyle ?? "auto"
  };

  if (!inputText) {
    return Response.json(createFallbackStoryboard(requestContext, "输入为空，已生成一套示例结构。"));
  }

  const baseUrl = payload.apiConfig?.baseUrl?.trim().replace(/\/+$/, "");
  const apiKey = payload.apiConfig?.apiKey?.trim();
  const model = payload.apiConfig?.model?.trim();
  const maxTokens = clampNumber(payload.apiConfig?.maxTokens, 2000, 16000, DEFAULT_MAX_TOKENS);
  const timeoutMs = clampNumber(payload.apiConfig?.timeoutSeconds, 30, 300, DEFAULT_MODEL_TIMEOUT_MS / 1000) * 1000;

  if (!baseUrl || !apiKey || !model) {
    return Response.json(createFallbackStoryboard(requestContext, "API 配置不完整，已使用本地规则生成。"));
  }

  const isDeepSeek = isDeepSeekConfig(baseUrl, model);
  const endpoint = createChatCompletionEndpoint(baseUrl, model);
  const requestBody = createChatCompletionBody(model, requestContext, isDeepSeek, maxTokens);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const modelResponse = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!modelResponse.ok) {
      const errorText = await modelResponse.text();
      throw new Error(`模型接口失败：${modelResponse.status} ${errorText.slice(0, 160)}`);
    }

    const completion = await modelResponse.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("模型没有返回 message.content");

    const parsed = JSON.parse(content);
    return Response.json(normalizeStoryboardResponse(parsed, requestContext));
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `模型接口 ${Math.round(timeoutMs / 1000)} 秒内没有响应`
        : error instanceof Error
          ? error.message
          : "模型调用失败";
    return Response.json(createFallbackStoryboard(requestContext, `${message}，已自动回退本地规则。`));
  } finally {
    clearTimeout(timeout);
  }
}

function createChatCompletionEndpoint(baseUrl: string, model: string) {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  if (normalizedBaseUrl.endsWith("/chat/completions")) return normalizedBaseUrl;
  if (isDeepSeekConfig(normalizedBaseUrl, model)) return `${normalizedBaseUrl.replace(/\/v1$/, "")}/chat/completions`;
  if (normalizedBaseUrl.endsWith("/v1")) return `${normalizedBaseUrl}/chat/completions`;
  return `${normalizedBaseUrl}/v1/chat/completions`;
}

function createChatCompletionBody(
  model: string,
  requestContext: Pick<StoryboardRequest, "inputText" | "brandTone" | "platform" | "duration" | "visualStyle">,
  isDeepSeek: boolean,
  maxTokens: number
) {
  const body: Record<string, unknown> = {
    model,
    messages: buildModelMessages(requestContext),
    temperature: 0.72,
    max_tokens: maxTokens,
    stream: false,
    response_format: { type: "json_object" }
  };

  if (isDeepSeek) {
    body.thinking = { type: "enabled" };
    body.reasoning_effort = "max";
  }

  return body;
}

function isDeepSeekConfig(baseUrl: string, model: string) {
  return baseUrl.includes("api.deepseek.com") || model.toLowerCase().startsWith("deepseek-");
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numberValue)));
}
