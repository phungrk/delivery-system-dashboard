import fs from "fs";
import path from "path";
import { findProjectDir } from "../projectDir";

const PROCESSED_DIR = path.join(process.cwd(), "..", "processed");

export type RiskLevel = "critical" | "warning" | "info";

export type RiskSignal = {
  level: RiskLevel;
  text: string;
};

export type ActionItem = {
  action: string;
  owner: string;
  priority: "High" | "Medium" | "Low";
  relatedTasks: string[];
};

export type StandupQuestion = {
  person: string;
  question: string;
};

export type InsightsData = {
  summary: string;
  signals: RiskSignal[];
  actions: ActionItem[];
  standupQuestions: StandupQuestion[];
  positives: string[];
  insightsDate: string;
};

function parseSignalLine(line: string): RiskSignal | null {
  if (line.startsWith("🔴")) return { level: "critical", text: line.replace(/^🔴\s*(CRITICAL\s*—\s*)?/, "").trim() };
  if (line.startsWith("🟡")) return { level: "warning", text: line.replace(/^🟡\s*(WARNING\s*—\s*)?/, "").trim() };
  if (line.startsWith("🔵")) return { level: "info", text: line.replace(/^🔵\s*(INFO\s*—\s*)?/, "").trim() };
  return null;
}

function parseActionLine(line: string): ActionItem | null {
  if (!line.match(/^[→\->]/)) return null;
  const text = line.replace(/^[→\->]+\s*/, "").trim();

  const ownerMatch = text.match(/Người thực hiện:\s*([^—\-]+)/i);
  const priorityMatch = text.match(/Ưu tiên:\s*(High|Medium|Low)/i);
  const tasksMatch = text.match(/Liên quan:\s*(.+?)(?:\s*$)/i);

  const action = text.split("—")[0].replace(/Người thực hiện:.*/i, "").trim();
  const owner = ownerMatch?.[1]?.trim() ?? "";
  const priority = (priorityMatch?.[1] ?? "Medium") as ActionItem["priority"];
  const relatedTasks = tasksMatch?.[1]?.split(/[,;]/).map((t) => t.trim()).filter(Boolean) ?? [];

  return { action, owner, priority, relatedTasks };
}

export function loadInsights(projectCode: string): InsightsData {
  const dir = findProjectDir(PROCESSED_DIR, projectCode);
  const empty: InsightsData = { summary: "", signals: [], actions: [], standupQuestions: [], positives: [], insightsDate: "" };

  if (!dir) return empty;

  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith("insights-") && f.endsWith(".md"))
    .sort().reverse();

  if (files.length === 0) return empty;

  const content = fs.readFileSync(path.join(dir, files[0]), "utf-8");
  const insightsDate = files[0].replace("insights-", "").replace(".md", "");

  // Summary
  const summaryBlock = content.match(/## Tình hình tổng thể\s*\n([\s\S]*?)(?=\n##)/)?.[1]?.trim() ?? "";

  // Risk signals
  const signalBlock = content.match(/## Tín hiệu rủi ro\s*\n([\s\S]*?)(?=\n##)/)?.[1] ?? "";
  const signals = signalBlock.split("\n")
    .map(parseSignalLine)
    .filter((s): s is RiskSignal => s !== null);

  // Action items
  const actionBlock = content.match(/## Hành động đề xuất\s*\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const actions = actionBlock.split("\n")
    .map(parseActionLine)
    .filter((a): a is ActionItem => a !== null && a.action.length > 0);

  // Standup questions
  const standupBlock = content.match(/## Câu hỏi cho standup\s*\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const standupQuestions = standupBlock.split("\n")
    .filter((l) => l.match(/^\d+\./))
    .map((l) => {
      const text = l.replace(/^\d+\.\s*/, "").trim();
      const colonIdx = text.indexOf(":");
      return {
        person: colonIdx > 0 ? text.slice(0, colonIdx).trim() : "",
        question: colonIdx > 0 ? text.slice(colonIdx + 1).trim() : text,
      };
    });

  // Positives
  const positivesBlock = content.match(/## Điểm tích cực\s*\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const positives = positivesBlock.split("\n")
    .filter((l) => l.startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim());

  return { summary: summaryBlock, signals, actions, standupQuestions, positives, insightsDate };
}
