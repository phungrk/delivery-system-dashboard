import fs from "fs";
import path from "path";

// Scans baseDir for [Domain]/[projectCode] two-level structure.
// Returns full path to project dir, or null if not found.
export function findProjectDir(baseDir: string, projectCode: string): string | null {
  if (!fs.existsSync(baseDir)) return null;
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
