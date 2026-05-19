import type { DataQualityFlag } from "./lookup";

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
} as const;

const DISPLAY_LABELS: Record<string, string> = {
  Any: "不限",
  Female: "女性",
  Male: "男性",
  "Gum and Other Mouth": "牙龈及其他口腔",
  Hypopharynx: "下咽",
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

export function formatMedianSurvival(months: number | null): string {
  return months === null ? "未达到" : `${months} 月`;
}

export function displayLabel(value: string): string {
  return DISPLAY_LABELS[value] ?? value;
}

export function qualityLabel(flag: DataQualityFlag): string {
  if (flag === "stable") {
    return "样本稳定";
  }
  if (flag === "small_sample") {
    return "小样本";
  }
  return "极小样本";
}

export function matchingLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    full: "完全匹配",
    no_sex: "忽略性别",
    no_histology: "忽略组织学",
    coarse_age: "粗年龄组",
    site_tnm: "部位 + TNM",
    site_m: "部位 + M 分期",
    site_only: "仅部位",
  };
  return labels[level] ?? level;
}

export function formatMatchedKey(key: string): string {
  const [level, sex, site, histologyGroup, ageGroup, tStage, nStage, mStage] = key.split("|");
  if (!level || !sex || !site || !histologyGroup || !ageGroup || !tStage || !nStage || !mStage) {
    return key;
  }

  const sexLabel = sex === "Any" ? "性别不限" : displayLabel(sex);
  const histologyLabel = histologyGroup === "Any" ? "组织学不限" : displayLabel(histologyGroup);
  const ageLabel = ageGroup === "Any" ? "年龄不限" : `${ageGroup} 岁`;

  return [matchingLevelLabel(level), sexLabel, displayLabel(site), histologyLabel, ageLabel, [displayLabel(tStage), displayLabel(nStage), displayLabel(mStage)].join(" / ")].join(
    " · ",
  );
}
