import { notFound } from "next/navigation";
import { loadRealData } from "../realDataLoader";
import { loadInsights } from "@/lib/parser/insights";
import { PROJECTS } from "../mockData";
import { ProjectDetailPage } from "./ProjectDetailPage";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const real = loadRealData();
  const projects = real.projects.length > 0 ? real.projects : PROJECTS;
  const project = projects.find((p) => p.id === projectId);
  if (!project) notFound();
  const insights = loadInsights(projectId);
  return <ProjectDetailPage project={project} insights={insights} />;
}
