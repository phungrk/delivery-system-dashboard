"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Users, Sun, Moon } from "lucide-react";
import type { Project, Resource } from "./mockData";
import { ProjectsTab } from "./components/ProjectsTab";
import { ResourcesTab } from "./components/ResourcesTab";
import { AIChatDrawer, AIChatButton } from "./components/AIChatDrawer";

interface Props {
  initialProjects: Project[];
  initialResources: Resource[];
}

export function DeliveryDashboard({ initialProjects, initialResources }: Props) {
  const [dark, setDark]         = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "resources">("projects");
  const [chatOpen, setChatOpen]   = useState(false);

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-background text-foreground`}>

      {/* ── App header ─────────────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border">
        {/* Title row */}
        <div className="max-w-[1540px] mx-auto px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Delivery Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track projects and allocate resources</p>
          </div>
          <div className="flex items-center gap-3">
            <AIChatButton onClick={() => setChatOpen((o) => !o)} active={chatOpen} />
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/v4" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Tab nav row */}
        <div className="max-w-[1540px] mx-auto px-6 flex gap-1">
          {(["projects", "resources"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 mb-[-1px] text-sm font-medium rounded-t-lg border transition-colors ${
                activeTab === tab
                  ? "bg-background border-border border-b-background text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {tab === "projects"
                ? <FolderKanban className="w-4 h-4" />
                : <Users className="w-4 h-4" />
              }
              {tab === "projects" ? "Projects" : "Resources"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="max-w-[1540px] mx-auto px-6 py-8">
        {activeTab === "projects"
          ? <ProjectsTab projects={initialProjects} />
          : <ResourcesTab resources={initialResources} />
        }
      </main>

      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
