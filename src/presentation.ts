import type { DataQualityFlag } from "./lookup";

export function formatProbability(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function formatMedianSurvival(months: number | null): string {
  return months === null ? "未达到" : `${months} 月`;
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
