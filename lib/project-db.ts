import fs from "fs";
import path from "path";
import projectsRaw from "@/data/projects.json";
import { ProjectsFileSchema, type RawProject } from "./data-schemas";

const ROOT_DIR = path.join(process.cwd(), "..");
const INPUT_DIR = path.join(ROOT_DIR, "input");
const PROCESSED_DIR = path.join(ROOT_DIR, "processed");

const PROJECTS = ProjectsFileSchema.parse(projectsRaw).data;

export interface MarkdownProjectListItem {
  code: string;
  name: string;
  domain: string;
  folder: string;
  hasContext: boolean;
  hasTracking: boolean;
}

export interface MarkdownProjectDetail {
  project: RawProject;
  inputDir: string;
  context: string;
  tracking: string;
  latestMetrics: string;
  latestInsights: string;
}

function projectInputDir(project: RawProject): string {
  return path.join(INPUT_DIR, project.folder);
}

function projectProcessedDir(project: RawProject): string {
  return path.join(PROCESSED_DIR, project.folder);
}

function readIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function latestFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return "";
  const file = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".md"))
    .sort()
    .at(-1);
  return file ? path.join(dir, file) : "";
}

function findProject(projectCode: string): RawProject | null {
  return PROJECTS.find((project) => project.code === projectCode) ?? null;
}

export function getProjectListFromMarkdown(): MarkdownProjectListItem[] {
  return PROJECTS.map((project) => {
    const dir = projectInputDir(project);
    return {
      code: project.code,
      name: project.name,
      domain: project.domain,
      folder: project.folder,
      hasContext: fs.existsSync(path.join(dir, "project-context.md")) || fs.existsSync(path.join(dir, "project-context.txt")),
      hasTracking: fs.existsSync(path.join(dir, "project-tracking.md")) || fs.existsSync(path.join(dir, "project-tracking.txt")),
    };
  });
}

export function getLatestProjectMetrics(projectCode: string): string {
  const project = findProject(projectCode);
  if (!project) return "";
  const filePath = latestFile(projectProcessedDir(project), "metrics-");
  return filePath ? readIfExists(filePath) : "";
}

export function getLatestProjectInsights(projectCode: string): string {
  const project = findProject(projectCode);
  if (!project) return "";
  const filePath = latestFile(projectProcessedDir(project), "insights-");
  return filePath ? readIfExists(filePath) : "";
}

export function getProjectDetailFromMarkdown(projectCode: string): MarkdownProjectDetail | null {
  const project = findProject(projectCode);
  if (!project) return null;

  const inputDir = projectInputDir(project);
  const context =
    readIfExists(path.join(inputDir, "project-context.md")) ||
    readIfExists(path.join(inputDir, "project-context.txt"));
  const tracking =
    readIfExists(path.join(inputDir, "project-tracking.md")) ||
    readIfExists(path.join(inputDir, "project-tracking.txt"));

  return {
    project,
    inputDir,
    context,
    tracking,
    latestMetrics: getLatestProjectMetrics(projectCode),
    latestInsights: getLatestProjectInsights(projectCode),
  };
}
