import { ProjectMetrics } from "@/lib/schema";

const config: Record<ProjectMetrics["riskLevel"], { label: string; className: string }> = {
  Low:      { label: "Low",      className: "bg-green-100 text-green-800 border-green-300" },
  Medium:   { label: "Medium",   className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  High:     { label: "High",     className: "bg-orange-100 text-orange-800 border-orange-300" },
  Critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-300" },
};

export function RiskBadge({ level }: { level: ProjectMetrics["riskLevel"] }) {
  const { label, className } = config[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
