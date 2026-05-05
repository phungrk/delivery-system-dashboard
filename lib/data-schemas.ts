import { z } from "zod";

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MemberStatusSchema = z.enum(["active", "inactive", "on_leave"]);
export const ProjectStatusSchema = z.enum(["Active", "Pipeline", "Paused", "Complete"]);
export const ProjectTypeSchema = z.enum(["Waterfall", "Scrum", "Scrum-P", "Kanban"]);
export const LeaveStatusSchema = z.enum(["approved", "pending", "rejected"]);
export const LeaveTypeSchema = z.enum(["annual", "sick", "compensatory", "unpaid", "wfh"]);
export const CapacityScopeSchema = z.enum(["all", "VN", "JP", "US", "opt"]);

export const MemberSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  initials: z.string().min(2),
  role: z.string().min(1),
  department: z.string().min(1),
  email: z.string().email(),
  startDate: DateStringSchema,
  status: MemberStatusSchema,
  avatarColor: z.string().min(1),
  weeklyCapacityHours: z.number().positive().max(80),
  skills: z.array(z.string()),
});

export const ProjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  folder: z.string().min(1),
  color: z.string().min(1),
  status: ProjectStatusSchema,
  phase: z.string().min(1),
  type: ProjectTypeSchema,
  budget: z.number().nonnegative(),
  eac: z.number().nonnegative(),
  actualFees: z.number().nonnegative(),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
}).refine((p) => p.folder === `${p.domain}/${p.code}`, {
  message: "folder must equal domain/code",
  path: ["folder"],
});

export const WeeklyAllocationEntrySchema = z.object({
  weekStart: DateStringSchema,
  hours: z.number().min(0),
});

export const AllocationSchema = z.object({
  id: z.string().min(1),
  memberCode: z.string().min(1),
  projectCode: z.string().min(1),
  weeklyHours: z.array(WeeklyAllocationEntrySchema).min(1),
}).refine((a) => {
  const keys = a.weeklyHours.map((entry) => entry.weekStart);
  return new Set(keys).size === keys.length;
}, {
  message: "weeklyHours contains duplicate weekStart entries",
  path: ["weeklyHours"],
});

export const HolidaySchema = z.object({
  date: DateStringSchema,
  name: z.string().min(1),
  impactPct: z.number().min(1).max(100),
  scope: CapacityScopeSchema,
});

export const LeaveSchema = z.object({
  memberCode: z.string().min(1),
  from: DateStringSchema,
  to: DateStringSchema,
  type: LeaveTypeSchema,
  days: z.number().nonnegative(),
  status: LeaveStatusSchema,
  notes: z.string().optional(),
}).refine((l) => l.from <= l.to, {
  message: "from must be before or equal to to",
  path: ["to"],
});

export const MembersFileSchema = z.object({
  version: z.string(),
  updatedAt: DateStringSchema,
  data: z.array(MemberSchema),
});

export const ProjectsFileSchema = z.object({
  version: z.string(),
  updatedAt: DateStringSchema,
  data: z.array(ProjectSchema),
});

export const AllocationsFileSchema = z.object({
  version: z.string(),
  updatedAt: DateStringSchema,
  data: z.array(AllocationSchema),
});

export const CapacityFileSchema = z.object({
  version: z.string(),
  updatedAt: DateStringSchema,
  holidays: z.array(HolidaySchema),
  leaves: z.array(LeaveSchema),
});

export type RawMember = z.infer<typeof MemberSchema>;
export type RawProject = z.infer<typeof ProjectSchema>;
export type RawAllocation = z.infer<typeof AllocationSchema>;
export type RawHoliday = z.infer<typeof HolidaySchema>;
export type RawLeave = z.infer<typeof LeaveSchema>;
