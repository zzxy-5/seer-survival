import type { DataQualityFlag } from "./lookup";

export type Language = "zh" | "en";

export const APP_COPY = {
  eyebrow: "SEER cohort atlas",
  name: "头颈肿瘤生存图谱",
  description: "基于 SEER 队列的相似病例组生存参照",
  statusBadges: ["SEER 队列数据", "研究参考", "不用于临床决策"],
  method: {
    title: "方法与边界",
    points: [
      "基于 SEER 队列中相似病例组的统计生存结果。",
      "展示队列层面的生存参照，不是个人预后预测。",
      "不用于临床决策，具体诊疗需要结合医生判断。",
    ],
  },
  tnm: {
    title: "TNM 分期口径",
    points: [
      "2010-2015 年病例使用 Derived AJCC T/N/M, 7th ed (2010-2015)。",
      "2016 年及以后病例使用 Derived SEER Combined T/N/M (2016+)。",
      "下拉项统一为 T/N/M 主分期；子分期已合并，缺失或无法解析值标为 Unknown。",
    ],
  },
  source: {
    title: "数据来源",
    note: "源字段来自 SEER 导出表，网站运行时只读取离线生成的静态查找表。",
  },
} as const;

export const APP_COPY_EN = {
  eyebrow: "SEER cohort atlas",
  name: "Head and Neck Tumor Survival Atlas",
  description: "Survival reference for similar SEER cohort groups",
  statusBadges: ["SEER cohort data", "Research reference", "Not for clinical decisions"],
  method: {
    title: "Method & Limits",
    points: [
      "Based on statistical survival results from similar case groups in the SEER cohort.",
      "Shows cohort-level survival reference values, not an individual prognosis prediction.",
      "Not for clinical decision-making; diagnosis and treatment require physician judgment.",
    ],
  },
  tnm: {
    title: "TNM Staging Basis",
    points: [
      "Cases from 2010-2015 use Derived AJCC T/N/M, 7th ed (2010-2015).",
      "Cases from 2016 onward use Derived SEER Combined T/N/M (2016+).",
      "Dropdowns use major T/N/M categories; substages are collapsed and missing or unparseable values are marked Unknown.",
    ],
  },
  source: {
    title: "Data Source",
    note: "Source fields come from the SEER export table; the website reads only offline-generated static lookup artifacts at runtime.",
  },
} as const;

export const UI_COPY = {
  zh: {
    workspaceAria: "头颈肿瘤生存图谱工作区",
    inputPanelAria: "查询条件",
    inputKicker: "输入条件",
    inputTitle: "患者与肿瘤信息",
    loading: "加载中",
    recordsUnit: "条记录",
    dataOverviewAria: "数据概览",
    effectiveRecords: "有效记录",
    lookupGroups: "可查询组合",
    sex: "性别",
    tumorSite: "肿瘤部位",
    histologyGroup: "组织学大类",
    age: "年龄",
    unavailable: "（暂无数据）",
    resultAria: "生存参照结果",
    noGroup: "没有对应生存分组",
    loadingGroup: "正在加载生存分组",
    emptyAge: "年龄不能为空",
    invalidAge: "年龄需要是数字",
    lookupFailed: "查询失败",
    missingSite: (site: string) => `当前数据源没有“${site}”对应的生存分组；请更换肿瘤部位，或使用包含该部位病例的数据重新生成查找表。`,
    dataSource: "具体来源",
    processedRows: "处理行数",
    includedRecords: "纳入记录",
    skippedRecords: "跳过记录",
    medianSurvival: "队列中位生存",
    survival12: "12 月生存率",
    survival36: "36 月生存率",
    survival60: "60 月生存率",
    sampleSize: "样本量",
    matchLevel: "匹配层级",
    eventsCensored: "事件 / 删失",
    matchedGroup: "匹配组合",
    kmCurve: "Kaplan-Meier 生存曲线",
    monthSuffix: "月",
  },
  en: {
    workspaceAria: "Head and neck tumor survival atlas workspace",
    inputPanelAria: "Query inputs",
    inputKicker: "Inputs",
    inputTitle: "Patient & Tumor Information",
    loading: "Loading",
    recordsUnit: "records",
    dataOverviewAria: "Data overview",
    effectiveRecords: "Included records",
    lookupGroups: "Queryable groups",
    sex: "Sex",
    tumorSite: "Tumor site",
    histologyGroup: "Histology group",
    age: "Age",
    unavailable: " (no data)",
    resultAria: "Survival reference result",
    noGroup: "No matching survival group",
    loadingGroup: "Loading survival groups",
    emptyAge: "Age is required",
    invalidAge: "Age must be a number",
    lookupFailed: "Lookup failed",
    missingSite: (site: string) => `The current data source has no survival group for ${site}. Choose another tumor site or regenerate the lookup with data that includes this primary site.`,
    dataSource: "Specific source",
    processedRows: "Processed rows",
    includedRecords: "Included records",
    skippedRecords: "Skipped records",
    medianSurvival: "Cohort median survival",
    survival12: "12-mo survival",
    survival36: "36-mo survival",
    survival60: "60-mo survival",
    sampleSize: "Sample size",
    matchLevel: "Match level",
    eventsCensored: "Events / censored",
    matchedGroup: "Matched group",
    kmCurve: "Kaplan-Meier survival curve",
    monthSuffix: "mo",
  },
} as const;

export function appCopy(language: Language) {
  return language === "en" ? APP_COPY_EN : APP_COPY;
}

const DISPLAY_LABELS_ZH: Record<string, string> = {
  Any: "不限",
  Female: "女性",
  Male: "男性",
  "Gum and Other Mouth": "牙龈及其他口腔",
  Hypopharynx: "下咽",
  Larynx: "喉",
  Nasopharynx: "鼻咽",
  Oropharynx: "口咽",
  "Other Oral Cavity and Pharynx": "其他口腔与咽部",
  Tongue: "舌",
  Tonsil: "扁桃体",
  "8000-8009: unspecified neoplasms": "8000-8009：未特指肿瘤",
  "8010-8049: epithelial neoplasms, NOS": "8010-8049：上皮性肿瘤 NOS",
  "8050-8089: squamous cell neoplasms": "8050-8089：鳞状细胞肿瘤",
  "8090-8119: basal cell neoplasms": "8090-8119：基底细胞肿瘤",
  "8120-8139: transitional cell papillomas and carcinomas": "8120-8139：移行细胞乳头状瘤与癌",
  "8140-8389: adenomas and adenocarcinomas": "8140-8389：腺瘤与腺癌",
  "8430-8439: mucoepidermoid neoplasms": "8430-8439：黏液表皮样肿瘤",
  "8440-8499: cystic, mucinous and serous neoplasms": "8440-8499：囊性、黏液性与浆液性肿瘤",
  "8500-8549: ductal and lobular neoplasms": "8500-8549：导管与小叶肿瘤",
  "8550-8559: acinar cell neoplasms": "8550-8559：腺泡细胞肿瘤",
  "8560-8579: complex epithelial neoplasms": "8560-8579：复杂上皮性肿瘤",
  "8680-8719: paragangliomas and glumus tumors": "8680-8719：副神经节瘤与血管球瘤",
  "8800-8809: soft tissue tumors and sarcomas, NOS": "8800-8809：软组织肿瘤与肉瘤 NOS",
  "8810-8839: fibromatous neoplasms": "8810-8839：纤维瘤性肿瘤",
  "8850-8889: lipomatous neoplasms": "8850-8889：脂肪瘤性肿瘤",
  "8890-8929: myomatous neoplasms": "8890-8929：肌瘤性肿瘤",
  "8930-8999: complex mixed and stromal neoplasms": "8930-8999：复杂混合与间质肿瘤",
  "9040-9049: synovial-like neoplasms": "9040-9049：滑膜样肿瘤",
  "9060-9099: germ cell neoplasms": "9060-9099：生殖细胞肿瘤",
  "9120-9169: blood vessel tumors": "9120-9169：血管肿瘤",
  "9180-9249: osseous and chondromatous neoplasms": "9180-9249：骨与软骨肿瘤",
  "9350-9379: miscellaneous tumors": "9350-9379：其他肿瘤",
  "9490-9529: neuroepitheliomatous neoplasms": "9490-9529：神经上皮肿瘤",
  Unknown: "未知",
};

export function formatProbability(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function formatMedianSurvival(months: number | null, language: Language = "zh"): string {
  if (language === "en") {
    return months === null ? "Not reached" : `${months} mo`;
  }
  return months === null ? "未达到" : `${months} 月`;
}

export function displayLabel(value: string, language: Language = "zh"): string {
  if (language === "en") {
    return value === "Any" ? "Any" : value;
  }
  return DISPLAY_LABELS_ZH[value] ?? value;
}

export function qualityLabel(flag: DataQualityFlag, language: Language = "zh"): string {
  if (language === "en") {
    if (flag === "stable") {
      return "Stable sample";
    }
    if (flag === "small_sample") {
      return "Small sample";
    }
    return "Very small sample";
  }
  if (flag === "stable") {
    return "样本稳定";
  }
  if (flag === "small_sample") {
    return "小样本";
  }
  return "极小样本";
}

export function matchingLevelLabel(level: string, language: Language = "zh"): string {
  const labelsZh: Record<string, string> = {
    full: "完全匹配",
    no_sex: "忽略性别",
    no_histology: "忽略组织学",
    coarse_age: "粗年龄组",
    site_tnm: "部位 + TNM",
    site_m: "部位 + M 分期",
    site_only: "仅部位",
  };
  const labelsEn: Record<string, string> = {
    full: "Full match",
    no_sex: "Sex ignored",
    no_histology: "Histology ignored",
    coarse_age: "Coarse age group",
    site_tnm: "Site + TNM",
    site_m: "Site + M stage",
    site_only: "Site only",
  };
  const labels = language === "en" ? labelsEn : labelsZh;
  return labels[level] ?? level;
}

export function formatMatchedKey(key: string, language: Language = "zh"): string {
  const [level, sex, site, histologyGroup, ageGroup, tStage, nStage, mStage] = key.split("|");
  if (!level || !sex || !site || !histologyGroup || !ageGroup || !tStage || !nStage || !mStage) {
    return key;
  }

  const sexLabel = sex === "Any" ? (language === "en" ? "Sex: any" : "性别不限") : displayLabel(sex, language);
  const histologyLabel = histologyGroup === "Any" ? (language === "en" ? "Histology: any" : "组织学不限") : displayLabel(histologyGroup, language);
  const ageLabel = ageGroup === "Any" ? (language === "en" ? "Age: any" : "年龄不限") : language === "en" ? `${ageGroup} years` : `${ageGroup} 岁`;

  return [matchingLevelLabel(level, language), sexLabel, displayLabel(site, language), histologyLabel, ageLabel, [displayLabel(tStage, language), displayLabel(nStage, language), displayLabel(mStage, language)].join(" / ")].join(
    " · ",
  );
}
