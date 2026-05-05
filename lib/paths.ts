import path from "path";

export const RESOURCES_DIR = path.join(process.cwd(), "..", "resources");
export const PROJECTS_DIR  = path.join(process.cwd(), "..", "projects");  // future migration
export const INPUT_DIR     = path.join(process.cwd(), "..", "input");     // legacy, will become PROJECTS_DIR
