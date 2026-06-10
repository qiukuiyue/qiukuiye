export type BrandTone =
  | "auto"
  | "professional"
  | "minimal"
  | "warm"
  | "dramatic"
  | "tech"
  | "oriental"
  | "youth";

export type Platform = "douyin" | "xiaohongshu" | "kuaishou" | "bilibili";
export type Duration = "15s" | "30s" | "45s" | "60s";

export type VisualStyle =
  | "auto"
  | "feminine"
  | "tech"
  | "luxury"
  | "minimal"
  | "fresh"
  | "cute"
  | "dramatic"
  | "oriental";

export type ApiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  timeoutSeconds?: number;
};

export type StoryboardRequest = {
  inputText: string;
  apiConfig?: Partial<ApiConfig>;
  brandTone: BrandTone;
  platform: Platform;
  duration: Duration;
  visualStyle: VisualStyle;
};

export type StoryboardAnalysis = {
  productName: string;
  brandTone: string;
  sellingPoints: string[];
  painPoints: string[];
  useCases: string[];
  resultValues: string[];
};

export type StoryboardScene = {
  id: string;
  sceneTitle: string;
  sellingPoint: string;
  painPoint: string;
  visualDescription: string;
  cameraMovement: string;
  aiEffect: string;
  subtitle: string;
  voiceover: string;
  promptZh: string;
  promptEn: string;
  negativePrompt: string;
  transitionFromPrevious: string;
};

export type StoryboardResponse = {
  source: "model" | "fallback";
  analysis: StoryboardAnalysis;
  scenes: StoryboardScene[];
  warnings: string[];
};

const toneLabels: Record<BrandTone, string> = {
  auto: "自动判断",
  professional: "专业可信",
  minimal: "高级极简",
  warm: "生活温暖",
  dramatic: "夸张娱乐",
  tech: "科技产品",
  oriental: "东方审美",
  youth: "年轻潮流"
};

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  kuaishou: "快手",
  bilibili: "B站"
};

const visualStyleLabels: Record<VisualStyle, string> = {
  auto: "自动匹配",
  feminine: "女性化",
  tech: "科技风",
  luxury: "高奢质感",
  minimal: "极简干净",
  fresh: "清新自然",
  cute: "可爱活泼",
  dramatic: "强冲击种草",
  oriental: "东方审美"
};

const styleHints: Record<VisualStyle, string> = {
  auto: "根据产品品类、品牌调性和使用人群自动选择视觉风格。",
  feminine: "柔和肤色、奶油白、玫瑰粉、香槟金、细腻皮肤质感、闺蜜分享感。",
  tech: "清晰结构、微观剖面、数据轨迹、冷暖对比光、透明材质和精密运动。",
  luxury: "低饱和高级色、克制光影、金属、玻璃、丝绸质感和精品广告构图。",
  minimal: "大面积留白、干净背景、单一主体、慢速稳定镜头和清晰信息。",
  fresh: "自然日光、植物、水感、通透空气、浅色背景和轻盈结果变化。",
  cute: "明快色块、圆润道具、轻快节奏、弹跳字幕和更强的情绪反馈。",
  dramatic: "强前后对比、快速节奏、冲击字幕、夸张但可理解的视觉转化。",
  oriental: "木、纸、瓷、水墨、茶色、柔和侧光、节制构图和自然材质。"
};

const durationSceneCount: Record<Duration, number> = {
  "15s": 5,
  "30s": 6,
  "45s": 7,
  "60s": 7
};

const genericNegativePrompt =
  "低清晰度、错误文字、水印、畸形手指、产品变形、品牌 logo 错误、过曝、脏污背景、画面抖动、字幕遮挡主体、空泛科技特效、无关赛博城市";

export function getPlatformLabel(platform: Platform) {
  return platformLabels[platform] ?? platformLabels.douyin;
}

export function getVisualStyleLabel(style: VisualStyle) {
  return visualStyleLabels[style] ?? visualStyleLabels.auto;
}

export function createFallbackStoryboard(
  request: Pick<StoryboardRequest, "inputText" | "brandTone" | "platform" | "duration"> & {
    visualStyle?: VisualStyle;
  },
  warning?: string
): StoryboardResponse {
  const analysis = analyzeInput(request.inputText, request.brandTone);
  const scenes = buildScenes(
    analysis,
    request.platform,
    request.duration,
    request.visualStyle ?? "auto",
    durationSceneCount[request.duration] ?? 6
  );

  return {
    source: "fallback",
    analysis,
    scenes,
    warnings: warning ? [warning] : []
  };
}

export function normalizeStoryboardResponse(
  data: unknown,
  request: Pick<StoryboardRequest, "inputText" | "brandTone" | "platform" | "duration"> & {
    visualStyle?: VisualStyle;
  }
): StoryboardResponse {
  if (!isRecord(data)) throw new Error("模型返回不是对象");

  const fallback = createFallbackStoryboard(request);
  const rawAnalysis = isRecord(data.analysis) ? data.analysis : {};
  const analysis: StoryboardAnalysis = {
    productName: readString(rawAnalysis.productName, fallback.analysis.productName),
    brandTone: readString(rawAnalysis.brandTone, fallback.analysis.brandTone),
    sellingPoints: readStringArray(rawAnalysis.sellingPoints, fallback.analysis.sellingPoints),
    painPoints: readStringArray(rawAnalysis.painPoints, fallback.analysis.painPoints),
    useCases: readStringArray(rawAnalysis.useCases, fallback.analysis.useCases),
    resultValues: readStringArray(rawAnalysis.resultValues, fallback.analysis.resultValues)
  };

  const sceneInput = Array.isArray(data.scenes) ? data.scenes : [];
  const scenes = sceneInput
    .map((scene, index) => normalizeScene(scene, index, fallback.scenes[index], analysis))
    .filter(Boolean) as StoryboardScene[];

  if (scenes.length < 3) throw new Error("模型返回分镜数量不足");

  return {
    source: "model",
    analysis,
    scenes,
    warnings: readStringArray(data.warnings, [])
  };
}

export function buildModelMessages(
  request: Pick<StoryboardRequest, "inputText" | "brandTone" | "platform" | "duration"> & {
    visualStyle?: VisualStyle;
  }
) {
  const visualStyle = request.visualStyle ?? "auto";
  const fallbackAnalysis = analyzeInput(request.inputText, request.brandTone);

  return [
    {
      role: "system",
      content:
        "你是一个 AI 视频提示词导演，负责把产品卖点、品牌调性和画面风格转译成可直接用于 AI 视频工具的分镜 Prompt 包。必须只输出合法 JSON，不要 Markdown，不要解释。"
    },
    {
      role: "user",
      content: [
        "请根据以下产品文案生成产品种草短视频分镜。",
        `平台：${getPlatformLabel(request.platform)}`,
        `时长：${request.duration}`,
        `品牌调性：${toneLabels[request.brandTone]}`,
        `画面风格：${getVisualStyleLabel(visualStyle)}`,
        `风格执行说明：${styleHints[visualStyle]}`,
        "要求：",
        "1. 生成 5-7 个镜头，适配 15-60 秒短视频。",
        "2. 每个 AI 视频效果必须绑定具体卖点、痛点、使用场景或结果价值。",
        "3. 中文 prompt 和英文 prompt 都要包含主体、场景、动作、镜头、光线、质感、画面风格和夸张效果。",
        "4. 负面 prompt 要包含画面错误、文字错误、产品变形、手部错误、水印等。",
        "5. 所有镜头必须统一画面风格。",
        "6. 输出 JSON 结构必须严格匹配：",
        JSON.stringify(
          {
            analysis: {
              productName: "产品名",
              brandTone: "实际采用调性",
              sellingPoints: ["卖点"],
              painPoints: ["痛点"],
              useCases: ["场景"],
              resultValues: ["结果价值"]
            },
            scenes: [
              {
                sceneTitle: "镜头标题",
                sellingPoint: "对应卖点",
                painPoint: "痛点/场景",
                visualDescription: "画面描述",
                cameraMovement: "镜头运动",
                aiEffect: "绑定卖点的夸张 AI 视觉效果",
                subtitle: "字幕",
                voiceover: "旁白",
                promptZh: "中文 AI 视频 prompt",
                promptEn: "English AI video prompt",
                negativePrompt: "负面 prompt",
                transitionFromPrevious: "上一段衔接说明"
              }
            ],
            warnings: ["可选提醒"]
          },
          null,
          2
        ),
        "本地初步分析，可参考但不要机械照抄：",
        JSON.stringify(fallbackAnalysis, null, 2),
        "原始文案：",
        request.inputText
      ].join("\n")
    }
  ];
}

function analyzeInput(inputText: string, brandTone: BrandTone): StoryboardAnalysis {
  const text = inputText.replace(/\s+/g, " ").trim();
  const sentences = text.split(/[。！？!?；;\n]/).map((item) => item.trim()).filter(Boolean);
  const keywords = extractKeywords(text);
  const productName = guessProductName(text, keywords);

  return {
    productName,
    brandTone: brandTone === "auto" ? inferTone(text) : toneLabels[brandTone],
    sellingPoints: fillList(findByPatterns(sentences, ["卖点", "添加", "采用", "搭载", "支持", "提升", "温和", "快速", "高效", "专利"]), keywords, [
      `${productName}的核心体验被快速放大`,
      "使用门槛低，能在日常场景里立刻看到变化",
      "把复杂问题压缩成一个简单动作"
    ]),
    painPoints: fillList(findByPatterns(sentences, ["痛点", "烦", "怕", "担心", "麻烦", "油腻", "干燥", "熬夜", "费时", "卡顿"]), keywords, [
      "用户原本需要忍受低效、凌乱或不确定的体验",
      "传统方案反馈慢，难以在短视频里一眼看懂",
      "购买前担心真实效果和宣传不一致"
    ]),
    useCases: fillList(findByPatterns(sentences, ["场景", "通勤", "办公室", "宿舍", "旅行", "约会", "睡前", "出门", "直播", "拍照"]), keywords, [
      "早晨出门前的高频使用场景",
      "办公室或居家桌面的真实决策场景",
      "朋友分享和社交平台种草场景"
    ]),
    resultValues: fillList(findByPatterns(sentences, ["变得", "让你", "改善", "省下", "看起来", "更", "安心", "舒服", "清爽", "稳定"]), keywords, [
      "让用户在几秒内看见前后差异",
      "把产品价值转化成可感知的生活改善",
      "降低尝试成本，强化立即购买理由"
    ])
  };
}

function buildScenes(
  analysis: StoryboardAnalysis,
  platform: Platform,
  duration: Duration,
  visualStyle: VisualStyle,
  count: number
): StoryboardScene[] {
  const beats = ["痛点钩子", "卖点放大", "使用场景", "效果对比", "信任证据", "情绪结果", "行动引导"].slice(0, count);
  const platformName = getPlatformLabel(platform);
  const styleLabel = getVisualStyleLabel(visualStyle);
  const styleHint = styleHints[visualStyle];

  return beats.map((beat, index) => {
    const sellingPoint = pick(analysis.sellingPoints, index);
    const painPoint = index === 2 ? pick(analysis.useCases, index) : pick(analysis.painPoints, index);
    const resultValue = pick(analysis.resultValues, index);
    const aiEffect = `以${styleLabel}视觉把“${painPoint}”具象化，再让“${sellingPoint}”变成可见粒子、光线、结构剖面或时间压缩变化，最终聚合成“${resultValue}”。`;
    const visualDescription = `${beat}镜头：真实生活桌面或使用现场中，用户正被“${painPoint}”打断，${analysis.productName}从手边进入画面，围绕“${sellingPoint}”完成一个明确动作。画面保持${analysis.brandTone}和${styleLabel}，${styleHint}`;
    const cameraMovement = index % 2 === 0 ? "从场景细节快速推近到产品动作，再稳定停在变化结果。" : "微距跟拍产品动作，随后拉开到使用前后对比。";

    return {
      id: `scene-${index + 1}`,
      sceneTitle: `${index + 1}. ${beat}`,
      sellingPoint,
      painPoint,
      visualDescription,
      cameraMovement,
      aiEffect,
      subtitle: index === 0 ? "别再忍了，问题其实可以这样解决" : `${sellingPoint}，一眼看见差别`,
      voiceover: `${analysis.productName}通过${sellingPoint}解决${painPoint}，带来${resultValue}。`,
      promptZh: `${platformName}${duration}产品种草短视频镜头，产品：${analysis.productName}。画面风格：${styleLabel}，${styleHint}画面：${visualDescription} 镜头：${cameraMovement} AI视频效果：${aiEffect} 主体清晰、产品不变形、字幕留在安全区。`,
      promptEn: `${platformName} product recommendation short video shot, product: ${analysis.productName}. Visual style: ${styleLabel}. Scene: ${visualDescription}. Camera: ${cameraMovement}. AI visual effect: ${aiEffect}. Keep it realistic, product-accurate, clean lighting, safe subtitle area.`,
      negativePrompt: genericNegativePrompt,
      transitionFromPrevious: index === 0 ? "开场直接进入用户最熟悉的痛点。" : "承接上一镜头的动作，把卖点继续推进到可见结果。"
    };
  });
}

function extractKeywords(text: string) {
  const stopWords = new Set(["这个", "一个", "我们", "你们", "他们", "就是", "可以", "不是", "没有", "非常", "真的", "产品", "使用", "效果"]);
  const matches = text.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,12}/g) ?? [];
  const counts = new Map<string, number>();
  for (const word of matches) {
    if (stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word).slice(0, 8);
}

function findByPatterns(sentences: string[], patterns: string[]) {
  return sentences.filter((sentence) => patterns.some((pattern) => sentence.includes(pattern))).map((sentence) => sentence.slice(0, 42)).slice(0, 4);
}

function fillList(primary: string[], keywords: string[], fallback: string[]) {
  const keywordItems = keywords.slice(0, 3).map((keyword) => `围绕“${keyword}”形成可视化记忆点`);
  return [...new Set([...primary, ...fallback, ...keywordItems].map((item) => item.trim()).filter(Boolean))].slice(0, 5);
}

function guessProductName(text: string, keywords: string[]) {
  const explicit = text.match(/(?:产品名|品牌|品名|名称)[:：]\s*([\u4e00-\u9fa5A-Za-z0-9\-\s]{2,24})/);
  if (explicit?.[1]) return explicit[1].trim();
  const productLike = text.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,18}(?:精华|面霜|面膜|咖啡|茶|零食|耳机|手机|键盘|灯|锅|杯|包|鞋|机|仪|器|喷雾|口红|粉底))/);
  if (productLike?.[1]) return productLike[1].trim();
  return keywords[0] ? `${keywords[0]}产品` : "待命名产品";
}

function inferTone(text: string) {
  if (/(科技|智能|AI|芯片|算法|数据|效率|性能)/i.test(text)) return "科技产品";
  if (/(温和|治愈|陪伴|家庭|妈妈|孩子|睡前|日常)/.test(text)) return "生活温暖";
  if (/(高端|极简|质感|轻奢|成分|专业|实验|医生)/.test(text)) return "专业可信";
  if (/(国风|东方|草本|茶|木|香|节气)/.test(text)) return "东方审美";
  if (/(学生|年轻|潮|穿搭|朋友|聚会|打卡)/.test(text)) return "年轻潮流";
  return "专业可信";
}

function pick(items: string[], index: number) {
  return items[index % items.length] ?? items[0] ?? "核心卖点";
}

function normalizeScene(scene: unknown, index: number, fallback: StoryboardScene | undefined, analysis: StoryboardAnalysis) {
  if (!isRecord(scene) && !fallback) return null;
  const source = isRecord(scene) ? scene : {};
  const backup = fallback ?? createFallbackStoryboard({ inputText: analysis.productName, brandTone: "auto", platform: "douyin", duration: "30s" }).scenes[index];

  return {
    id: `scene-${index + 1}`,
    sceneTitle: readString(source.sceneTitle, backup.sceneTitle),
    sellingPoint: readString(source.sellingPoint, backup.sellingPoint),
    painPoint: readString(source.painPoint, backup.painPoint),
    visualDescription: readString(source.visualDescription, backup.visualDescription),
    cameraMovement: readString(source.cameraMovement, backup.cameraMovement),
    aiEffect: readString(source.aiEffect, backup.aiEffect),
    subtitle: readString(source.subtitle, backup.subtitle),
    voiceover: readString(source.voiceover, backup.voiceover),
    promptZh: readString(source.promptZh, backup.promptZh),
    promptEn: readString(source.promptEn, backup.promptEn),
    negativePrompt: readString(source.negativePrompt, backup.negativePrompt),
    transitionFromPrevious: readString(source.transitionFromPrevious, backup.transitionFromPrevious)
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length ? items.slice(0, 8) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
