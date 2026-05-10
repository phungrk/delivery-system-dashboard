import fs from "fs";
import path from "path";
import { findProjectDir } from "../projectDir";
import { INPUT_DIR } from "../paths";

export interface ContextMember {
  name: string;
  role: string;
  team?: string;
  alsoOn?: string;
}

function parseMarkdownTable(block: string): Record<string, string>[] {
  const lines = block.trim().split("\n").filter((l) => l.startsWith("|"));
  if (lines.length < 3) return [];
  const headers = lines[0].split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

export function loadContextTeam(projectCode: string): ContextMember[] {
  const dir = findProjectDir(INPUT_DIR, projectCode);
  if (!dir) return [];
  const filePath = path.join(dir, "project-context.md");
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  const teamBlock = content.match(/## Team\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const rows = parseMarkdownTable(teamBlock);

  return rows
    .map((r) => ({
      name: r["name"] ?? "",
      role: r["role"] ?? "",
      team: r["team"] || undefined,
      alsoOn: r["also on projects"] ?? r["also on"] ?? r["alsoon"] ?? undefined,
    }))
    .filter((m) => m.name && !m.name.startsWith("["));
}
