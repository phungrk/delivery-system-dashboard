import fs from "fs";
import path from "path";
import projectsRaw from "@/data/projects.json";
import { ProjectsFileSchema } from "./data-schemas";

const PROJECTS = ProjectsFileSchema.parse(projectsRaw).data;

// Scans baseDir for [Domain]/[projectCode] two-level structure.
// Returns full path to project dir, or null if not found.
export function findProjectDir(baseDir: string, projectCode: string): string | null {
  if (!fs.existsSync(baseDir)) return null;
  const canonical = PROJECTS.find((project) => project.code === projectCode);
  if (canonical) {
    const dir = path.join(baseDir, canonical.folder);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
  }
  for (const entry of fs.readdirSync(baseDir)) {
    const domainPath = path.join(baseDir, entry);
    if (!fs.statSync(domainPath).isDirectory()) continue;
    const candidate = path.join(domainPath, projectCode);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

// Returns all [domain, projectCode] pairs found in baseDir.
export function listAllProjects(baseDir: string): { domain: string; code: string; dir: string }[] {
  if (!fs.existsSync(baseDir)) return [];
  const canonical = PROJECTS
    .map((project) => ({
      domain: project.domain,
      code: project.code,
      dir: path.join(baseDir, project.folder),
    }))
    .filter((project) => fs.existsSync(project.dir) && fs.statSync(project.dir).isDirectory());
  if (canonical.length > 0) return canonical;

  const results: { domain: string; code: string; dir: string }[] = [];
  for (const domain of fs.readdirSync(baseDir)) {
    const domainPath = path.join(baseDir, domain);
    if (!fs.statSync(domainPath).isDirectory()) continue;
    for (const code of fs.readdirSync(domainPath)) {
      const dir = path.join(domainPath, code);
      if (fs.statSync(dir).isDirectory()) {
        results.push({ domain, code, dir });
      }
    }
  }
  return results;
}
