import { z } from "zod";

export const OwnerMetricSchema = z.object({
  owner: z.string(),
  total: z.number(),
  inProgress: z.number(),
  done: z.number(),
  blocked: z.number(),
  flag: z.string().optional(),
});

export const CompletionMetricSchema = z.object({
  completionRate: z.number(),
  onTrackRate: z.number(),
  overdueRate: z.number(),
  blockRate: z.number(),
});

export const ProjectMetricsSchema = z.object({
  projectCode: z.string(),
  projectName: z.string(),
  type: z.enum(["Waterfall", "Scrum", "Scrum-P", "Kanban"]).default("Waterfall"),
  period: z.object({ start: z.string(), end: z.string() }),
  daysElapsed: z.number(),
  totalDays: z.number(),
  daysRemaining: z.number(),
  completion: CompletionMetricSchema,
  workload: z.array(OwnerMetricSchema),
  activeBlockers: z.number(),
  riskScore: z.number(),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
  flags: z.array(z.string()),
  metricsDate: z.string(),
  warnings: z.array(z.string()),
});

export type ProjectMetrics = z.infer<typeof ProjectMetricsSchema>;
export type OwnerMetric = z.infer<typeof OwnerMetricSchema>;
