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

export type Persona =
  | "auto"
  | "female_creator"
  | "beauty_expert"
  | "tech_reviewer"
  | "working_woman"
  | "mom_lifestyle"
  | "student_budget"
  | "premium_taste"
  | "fitness_selfcare"
  | "oriental_lifestyle";

export type VisualStyle =
  | "auto"
  | "feminine"
  | "tech"
  | "luxury"
  | "minimal"
  | "warm"
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
  persona?: Persona;
  personaPrompt?: string;
};

export type StoryboardAnalysis = {
  productName: string;
  brandTone: string;
  sellingPoints: string[];
  painPoints: string[];
  useCases: string[];
  resultValues: string[];
};

export type PublicReasoningStep = {
  title: string;
  detail: string;
};

export type StoryboardScene = {
  id: string;
  sceneTitle: string;
  scriptAnchor: string;
  sellingPoint: string;
  painPoint: string;
  visualDescription: string;
  cameraMovement: string;
  aiEffect: string;
  promptZh: string;
  promptEn: string;
  negativePrompt: string;
  transitionFromPrevious: string;
};

export type StoryboardResponse = {
  source: "model";
  analysis: StoryboardAnalysis;
  reasoningSummary: PublicReasoningStep[];
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
  warm: "温暖生活",
  fresh: "清新自然",
  cute: "可爱活泼",
  dramatic: "强冲击种草",
  oriental: "东方审美"
};

const visualStyleHints: Record<VisualStyle, string> = {
  auto: "根据产品品类、品牌调性和使用人群自动选择视觉风格。",
  feminine: "柔和肤色、奶油白/玫瑰粉/香槟金、细腻皮肤质感、闺蜜分享感、轻柔微距和优雅手部动作。",
  tech: "清晰结构、微观剖面、数据轨迹、冷暖对比光、透明材质、精密运动和产品功能链路可视化。",
  luxury: "低饱和高级色、克制光影、金属/玻璃/丝绸质感、慢速推镜和精品广告构图。",
  minimal: "大面积留白、干净背景、单一主体、慢速稳定镜头、少装饰、强调产品形态和清晰信息。",
  warm: "自然暖光、家庭餐桌/客厅/厨房等真实场景、柔和手持、亲密关系和安心感。",
  fresh: "自然日光、植物/水感/通透空气、浅色背景、生活化手持、清爽轻盈的结果变化。",
  cute: "明快色块、圆润道具、轻快节奏、拟物化视觉提示和更强的情绪反馈。",
  dramatic: "强前后对比、快速节奏、冲击式画面构图、夸张但可理解的视觉转化和高记忆点结尾。",
  oriental: "木、纸、瓷、水墨、茶色、柔和侧光、节制构图和自然材质的东方生活美学。"
};

const personaProfiles: Record<
  Persona,
  {
    label: string;
    visualStyle: VisualStyle;
    hint: string;
  }
> = {
  auto: {
    label: "自动识别",
    visualStyle: "auto",
    hint: "根据产品品类、文案语气、价格带和使用场景自动判断人设与画面风格。"
  },
  female_creator: {
    label: "精致女性种草博主",
    visualStyle: "feminine",
    hint: "适合美妆、护肤、香氛、穿搭和生活好物；画面更细腻、柔和、干净，有闺蜜分享感。"
  },
  beauty_expert: {
    label: "成分党护肤博主",
    visualStyle: "minimal",
    hint: "适合护肤、个护、功效型产品；画面重成分、肤感、微距质地和专业可信证据。"
  },
  tech_reviewer: {
    label: "科技数码测评人",
    visualStyle: "tech",
    hint: "适合数码、家电、AI 工具和效率产品；画面重结构剖面、数据轨迹、性能对比和精密质感。"
  },
  working_woman: {
    label: "都市白领通勤人设",
    visualStyle: "luxury",
    hint: "适合通勤、办公、效率、包袋、咖啡和精致生活产品；画面更利落、克制、有轻商务质感。"
  },
  mom_lifestyle: {
    label: "宝妈家庭生活家",
    visualStyle: "warm",
    hint: "适合家清、母婴、食品、小家电和家庭收纳；画面更温暖、真实、注重安心感和使用前后变化。"
  },
  student_budget: {
    label: "学生党平价分享",
    visualStyle: "cute",
    hint: "适合平价好物、学习宿舍、零食饮料和小预算变美；画面更轻快、明亮、强调高性价比和即时反馈。"
  },
  premium_taste: {
    label: "轻熟高奢审美",
    visualStyle: "luxury",
    hint: "适合高客单、礼盒、香氛、珠宝和品质生活；画面更高级、克制、重材质和光影。"
  },
  fitness_selfcare: {
    label: "自律健康生活家",
    visualStyle: "fresh",
    hint: "适合运动、健康食品、功能饮料、仪器和自我管理；画面更清爽、有身体状态变化和能量感。"
  },
  oriental_lifestyle: {
    label: "东方美学生活家",
    visualStyle: "oriental",
    hint: "适合茶、香、草本、家居、国风护肤和生活方式产品；画面重材质、留白、自然光和东方意境。"
  }
};

const durationSceneCount: Record<Duration, number> = {
  "15s": 5,
  "30s": 6,
  "45s": 7,
  "60s": 7
};

export function getToneLabel(tone: BrandTone) {
  return toneLabels[tone] ?? toneLabels.auto;
}

export function getPlatformLabel(platform: Platform) {
  return platformLabels[platform] ?? platformLabels.douyin;
}

export function getVisualStyleLabel(style: VisualStyle) {
  return visualStyleLabels[style] ?? visualStyleLabels.auto;
}

export function getPersonaLabel(persona: Persona) {
  return personaProfiles[persona]?.label ?? personaProfiles.auto.label;
}

export function getPersonaStyleSummary(persona: Persona) {
  const profile = personaProfiles[persona] ?? personaProfiles.auto;
  return `${getVisualStyleLabel(profile.visualStyle)}：${profile.hint}`;
}

export function getPersonaPromptFromPreset(persona: Persona) {
  const profile = personaProfiles[persona] ?? personaProfiles.auto;
  if (persona === "auto") return "";
  return `${profile.label}：${profile.hint}`;
}

export function getCustomPersonaTitle(personaPrompt: string, fallbackPersona: Persona = "auto") {
  const cleaned = personaPrompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return getPersonaLabel(fallbackPersona);

  const firstPart = cleaned.split(/[：:。；;，,\n]/)[0]?.trim() || cleaned;
  return firstPart.length > 24 ? `${firstPart.slice(0, 24)}...` : firstPart;
}

export function getCustomPersonaStyleSummary(
  personaPrompt: string,
  fallbackPersona: Persona = "auto"
) {
  const cleaned = personaPrompt.trim();
  if (!cleaned) return getPersonaStyleSummary(fallbackPersona);

  const inferredStyle = inferVisualStyleFromPersona(cleaned);
  const fallbackProfile = personaProfiles[fallbackPersona] ?? personaProfiles.auto;
  const visualStyle =
    inferredStyle === "auto" ? fallbackProfile.visualStyle : inferredStyle;

  return `${getVisualStyleLabel(visualStyle)}：${visualStyleHints[visualStyle]} 模型会优先按你输入的人设身份、口吻、审美、专业程度和脚本场景生成。`;
}

export function normalizeStoryboardResponse(data: unknown): StoryboardResponse {
  if (!isRecord(data)) {
    throw new Error("模型返回不是对象");
  }

  const rawAnalysis = requireRecord(data.analysis, "模型返回缺少 analysis");
  const analysis: StoryboardAnalysis = {
    productName: requireString(rawAnalysis.productName, "analysis.productName"),
    brandTone: requireString(rawAnalysis.brandTone, "analysis.brandTone"),
    sellingPoints: requireStringArray(rawAnalysis.sellingPoints, "analysis.sellingPoints"),
    painPoints: requireStringArray(rawAnalysis.painPoints, "analysis.painPoints"),
    useCases: requireStringArray(rawAnalysis.useCases, "analysis.useCases"),
    resultValues: requireStringArray(rawAnalysis.resultValues, "analysis.resultValues")
  };

  const sceneInput = Array.isArray(data.scenes) ? data.scenes : [];
  const scenes = sceneInput
    .map((scene, index) => normalizeScene(scene, index));

  if (scenes.length < 3) {
    throw new Error("模型返回分镜数量不足");
  }

  return {
    source: "model",
    analysis,
    reasoningSummary: normalizeReasoningSummary(data.reasoningSummary, []),
    scenes,
    warnings: readStringArray(data.warnings, [])
  };
}

export function buildModelMessages(
  request: Pick<StoryboardRequest, "inputText" | "brandTone" | "platform" | "duration"> & {
    persona?: Persona;
    personaPrompt?: string;
  }
) {
  const scriptSegments = createScriptSegments(request.inputText, durationSceneCount[request.duration] ?? 6);
  const personaContext = resolvePersonaContext(request.personaPrompt, request.persona);

  return [
    {
      role: "system",
      content:
        "你是一个 AI 视频提示词导演，负责把产品卖点、品牌调性和画面风格转译成可直接用于 AI 视频工具的分镜 Prompt 包。必须只输出合法 JSON，不要 Markdown，不要解释。"
    },
    {
      role: "user",
      content: [
        "请根据以下产品文案/脚本/逐字稿生成产品种草短视频分镜。",
        `平台：${getPlatformLabel(request.platform)}`,
        `时长：${request.duration}`,
        `品牌调性：${getToneLabel(request.brandTone)}`,
        `目标人设（用户输入，最高优先级）：${personaContext.personaText}`,
        `人设执行要求：${personaContext.personaInstruction}`,
        `由人设推导出的画面风格：${getVisualStyleLabel(personaContext.visualStyle)}`,
        `风格执行说明：${visualStyleHints[personaContext.visualStyle]}`,
        "脚本拆分参考。必须优先按这些原文片段的顺序生成镜头；如果你重新拆分，也要保持原文叙事顺序：",
        JSON.stringify(scriptSegments, null, 2),
        "要求：",
        "1. 脚本贴合优先级最高：每个镜头必须绑定一个 scriptAnchor，scriptAnchor 必须是原始文案中的连续原文片段或轻微清理后的原句，不要编造新剧情。",
        "2. 镜头顺序必须跟原脚本顺序一致；画面描述和 AI 视频效果要沿着 scriptAnchor 的含义展开，不要改成另一套通用种草话术。",
        "3. AI 视频效果只能服务于该段脚本正在表达的内容：把该句的痛点、卖点、情绪或结果做视觉化放大，不能跳到脚本没有出现的场景。",
        "4. 默认生成 5-7 个镜头，适配 15-60 秒种草短视频；如果脚本明显有开头/承接/证明/结果/行动引导，要按这些段落切镜头。",
        "5. 每个 AI 视频效果必须来自具体卖点、痛点、使用场景、结果价值或脚本原句，不能写空泛的赛博、未来感、炫酷特效。",
        "6. 每个镜头必须可直接复制到 AI 视频工具。",
        "7. 中文 prompt 和英文 prompt 都要具体描述主体、场景、动作、镜头、光线、质感、画面风格、脚本原文含义和夸张效果；不要单独输出字幕和旁白字段。",
        "8. 负面 prompt 要包含画面错误、文字错误、产品变形、手部错误、水印等。",
        "9. AI 效果优先使用：微观成分/结构可视化、时间压缩、不可见问题具象化、同一镜头前后状态共存、环境响应、情绪/触感/气味/噪声/吸收/效率等抽象体验可视化。",
        "10. 所有镜头必须统一人设和画面风格，不要一镜一套视觉体系；人设和风格要进入 visualDescription、aiEffect、promptZh 和 promptEn，而不是只写在分析里。",
        "11. 必须把用户输入的人设和脚本原文结合起来：如果人设里有年龄、职业、表达口吻、审美偏好、拍摄习惯、专业程度或目标受众，要在每个镜头里转成具体场景、视角、道具、画面质感和 AI 效果。",
        "12. 输出 reasoningSummary，展示可公开的导演分析步骤，必须说明如何按脚本段落拆镜、如何结合人设选择画面风格。不要输出隐藏思维链、逐 token 推理或长篇内心过程，只输出用户可读的简洁创作依据。",
        "13. 输出 JSON 结构必须严格匹配：",
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
            reasoningSummary: [
              {
                title: "人设判断",
                detail: "为什么选择这个人设和画面气质"
              },
              {
                title: "卖点转译",
                detail: "如何把核心卖点转成 AI 视频画面"
              }
            ],
            scenes: [
              {
                sceneTitle: "镜头标题",
                scriptAnchor: "对应脚本原文片段",
                sellingPoint: "对应卖点",
                painPoint: "痛点/场景",
                visualDescription: "画面描述",
                cameraMovement: "镜头运动",
                aiEffect: "绑定卖点的夸张 AI 视觉效果",
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
        "原始文案：",
        request.inputText
      ].join("\n")
    }
  ];
}

function resolvePersonaContext(personaPrompt?: string, persona: Persona = "auto") {
  const cleanedPrompt = personaPrompt?.trim();
  const fallbackProfile = personaProfiles[persona] ?? personaProfiles.auto;

  if (!cleanedPrompt) {
    return {
      personaText: fallbackProfile.label,
      visualStyle: fallbackProfile.visualStyle,
      personaInstruction: fallbackProfile.hint
    };
  }

  const inferredStyle = inferVisualStyleFromPersona(cleanedPrompt);
  const visualStyle = inferredStyle === "auto" ? fallbackProfile.visualStyle : inferredStyle;

  return {
    personaText: cleanedPrompt,
    visualStyle,
    personaInstruction:
      "严格以用户输入的人设为准，结合脚本原文生成镜头。不要退回预设人设；不要只写通用种草博主。每个镜头都要体现该人设的身份、口吻、审美、专业程度、拍摄习惯和目标受众。"
  };
}

function inferVisualStyleFromPersona(personaPrompt: string): VisualStyle {
  const text = personaPrompt.toLowerCase();
  const rules: { style: VisualStyle; keywords: string[] }[] = [
    {
      style: "minimal",
      keywords: ["成分党", "专业", "医生", "实验", "干净", "极简", "白皮书", "证据"]
    },
    {
      style: "tech",
      keywords: ["科技", "数码", "测评", "参数", "性能", "效率", "ai", "工具", "家电", "理性", "极客"]
    },
    {
      style: "feminine",
      keywords: ["女性", "女生", "女", "闺蜜", "美妆", "护肤", "精致", "香氛", "穿搭", "变美", "白领"]
    },
    {
      style: "luxury",
      keywords: ["高奢", "轻熟", "高级", "品质", "精品", "审美", "礼盒", "珠宝", "奢华", "通勤", "质感"]
    },
    {
      style: "warm",
      keywords: ["宝妈", "妈妈", "家庭", "亲子", "居家", "厨房", "家清", "母婴", "安心"]
    },
    {
      style: "cute",
      keywords: ["学生", "平价", "宿舍", "可爱", "活泼", "元气", "小预算"]
    },
    {
      style: "fresh",
      keywords: ["健康", "健身", "自律", "运动", "轻食", "清爽", "自然", "养生"]
    },
    {
      style: "oriental",
      keywords: ["东方", "国风", "草本", "茶", "中式", "香道", "木质", "水墨"]
    },
    {
      style: "dramatic",
      keywords: ["夸张", "娱乐", "搞笑", "反差", "冲击", "剧情", "爽感"]
    }
  ];

  const bestMatch = rules.reduce<{ style: VisualStyle; score: number }>(
    (best, rule) => {
      const score = rule.keywords.reduce(
        (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
        0
      );

      return score > best.score ? { style: rule.style, score } : best;
    },
    { style: "auto", score: 0 }
  );

  return bestMatch.score > 0 ? bestMatch.style : "auto";
}

function splitSentences(text: string) {
  const chunks = text
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return chunks.length ? chunks : [text || "请粘贴产品文案"];
}

function createScriptSegments(inputText: string, maxCount: number) {
  const rawText = inputText.trim();
  const lineUnits = rawText
    .split(/\n+/)
    .map(cleanScriptUnit)
    .filter((item) => item.length >= 4);
  const sentenceUnits = splitSentences(rawText)
    .map(cleanScriptUnit)
    .filter((item) => item.length >= 4);
  const units = unique(lineUnits.length >= 2 ? lineUnits : sentenceUnits);

  if (!units.length) return ["请先粘贴产品文案、脚本或逐字稿。"];

  const targetCount =
    units.length >= 4 ? Math.min(maxCount, units.length) : Math.min(maxCount, Math.max(3, units.length));
  if (units.length <= targetCount) return units;

  const groups: string[] = [];
  for (let index = 0; index < targetCount; index += 1) {
    const start = Math.floor((index * units.length) / targetCount);
    const end = Math.floor(((index + 1) * units.length) / targetCount);
    const group = units.slice(start, Math.max(start + 1, end)).join("。");
    groups.push(group);
  }

  return groups.map((item) => shortenText(item, 96));
}

function cleanScriptUnit(text: string) {
  return text
    .replace(/^\s*(?:镜头|场景|scene|shot)\s*\d*\s*[:：.-]\s*/i, "")
    .replace(/^\s*(?:旁白|字幕|口播|主播|画面|文案|开头|结尾|承接|转折|行动引导|cta)\s*[:：]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenText(text: string, maxLength: number) {
  const cleaned = cleanScriptUnit(text);
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned;
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function normalizeScene(scene: unknown, index: number): StoryboardScene {
  if (!isRecord(scene)) {
    throw new Error(`模型返回的第 ${index + 1} 个分镜不是对象`);
  }

  return {
    id: `scene-${index + 1}`,
    sceneTitle: stripSceneTitleIndex(requireString(scene.sceneTitle, `scenes[${index}].sceneTitle`)),
    scriptAnchor: requireString(scene.scriptAnchor, `scenes[${index}].scriptAnchor`),
    sellingPoint: requireString(scene.sellingPoint, `scenes[${index}].sellingPoint`),
    painPoint: requireString(scene.painPoint, `scenes[${index}].painPoint`),
    visualDescription: requireString(
      scene.visualDescription,
      `scenes[${index}].visualDescription`
    ),
    cameraMovement: requireString(scene.cameraMovement, `scenes[${index}].cameraMovement`),
    aiEffect: requireString(scene.aiEffect, `scenes[${index}].aiEffect`),
    promptZh: requireString(scene.promptZh, `scenes[${index}].promptZh`),
    promptEn: requireString(scene.promptEn, `scenes[${index}].promptEn`),
    negativePrompt: requireString(scene.negativePrompt, `scenes[${index}].negativePrompt`),
    transitionFromPrevious: requireString(
      scene.transitionFromPrevious,
      `scenes[${index}].transitionFromPrevious`
    )
  };
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }

  return value;
}

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} 必须是非空字符串`);
  }

  return value.trim();
}

function requireStringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是字符串数组`);
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  if (!items.length) {
    throw new Error(`${fieldName} 至少需要 1 项`);
  }

  return items.slice(0, 8);
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stripSceneTitleIndex(title: string) {
  return title.replace(/^\s*(?:镜头|场景)?\s*\d+\s*[.、:：-]\s*/, "").trim() || title;
}

function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  return items.length ? items.slice(0, 8) : fallback;
}

function normalizeReasoningSummary(
  value: unknown,
  fallback: PublicReasoningStep[]
): PublicReasoningStep[] {
  if (!Array.isArray(value)) return fallback;

  const steps = value
    .map((item) => {
      if (!isRecord(item)) return null;

      const title = readString(item.title, "");
      const detail = readString(item.detail, "");
      return title && detail ? { title, detail } : null;
    })
    .filter((item): item is PublicReasoningStep => Boolean(item));

  return steps.length ? steps.slice(0, 8) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
