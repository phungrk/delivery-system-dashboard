import { ResourceData, Badge } from "@/lib/parser/resource";

const BADGE_CELL: Record<Badge, string> = {
  OVER:    "bg-red-50 text-red-700 font-semibold",
  FULL:    "bg-orange-50 text-orange-700 font-semibold",
  PARTIAL: "bg-green-50 text-green-700",
  FREE:    "bg-blue-50 text-blue-600",
  LEAVE:   "bg-gray-100 text-gray-400 italic",
};

// Sticky column offsets (px)
const COL1_W = 110; // Member
const COL2_W = 130; // Project

export function ResourceTable({ data }: { data: ResourceData }) {
  const { weeks, weekLabels, members, capacity, memberData } = data;

  return (
    <div className="overflow-auto rounded-lg border bg-white" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <table className="border-collapse text-sm" style={{ minWidth: `${COL1_W + COL2_W + weeks.length * 110}px` }}>
        {/* ── Header ─────────────────────────────────────── */}
        <thead>
          <tr className="bg-gray-50 border-b">
            {/* Frozen corner: Member */}
            <th
              className="border-r border-b bg-gray-50 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap z-30"
              style={{ position: "sticky", top: 0, left: 0, minWidth: COL1_W }}
            >
              Member
            </th>
            {/* Frozen corner: Project */}
            <th
              className="border-r border-b bg-gray-50 text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap z-30"
              style={{ position: "sticky", top: 0, left: COL1_W, minWidth: COL2_W }}
            >
              Project
            </th>
            {/* Week columns */}
            {weeks.map((w) => {
              const [label, range] = weekLabels[w].split("\n");
              return (
                <th
                  key={w}
                  className="border-r border-b bg-gray-50 text-center px-3 py-2 whitespace-nowrap z-20"
                  style={{ position: "sticky", top: 0, minWidth: 110 }}
                >
                  <span className="block text-xs font-bold text-gray-700">{label}</span>
                  <span className="block text-[10px] text-gray-400">{range}</span>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* ── Body ───────────────────────────────────────── */}
        <tbody>
          {members.map((member) => {
            const md = memberData[member];
            const memberProjects = Object.keys(md.projects).sort();
            const totalRows = 1 + memberProjects.length; // total + projects

            return (
              <>
                {/* Total row */}
                <tr key={`${member}-total`} className="bg-gray-50/60 border-b">
                  {/* Member cell — rowspan */}
                  <td
                    rowSpan={totalRows}
                    className="border-r bg-white text-left px-3 py-2 font-semibold text-gray-800 align-top whitespace-nowrap z-10"
                    style={{ position: "sticky", left: 0, minWidth: COL1_W }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span>{member}</span>
                      <span className="text-[10px] font-normal text-gray-400">{capacity}h/wk</span>
                    </div>
                  </td>

                  {/* "(total)" label */}
                  <td
                    className="border-r bg-gray-50/60 px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap z-10"
                    style={{ position: "sticky", left: COL1_W, minWidth: COL2_W }}
                  >
                    total committed
                  </td>

                  {/* Week totals */}
                  {weeks.map((w) => {
                    const cell = md.weeks[w];
                    const avail = cell.available;
                    const isOver = avail < 0;
                    return (
                      <td key={w} className={`border-r px-3 py-2 text-center whitespace-nowrap ${BADGE_CELL[cell.badge]}`}>
                        <span className="text-sm font-bold">{cell.committed}h</span>
                        <span className={`block text-[10px] mt-0.5 ${isOver ? "text-red-500" : "text-gray-400"}`}>
                          {isOver ? `${avail}h ⚠` : `+${avail}h free`}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Per-project rows */}
                {memberProjects.map((project) => (
                  <tr key={`${member}-${project}`} className="border-b hover:bg-gray-50/40 transition-colors">
                    <td
                      className="border-r bg-white px-3 py-1.5 text-sm text-gray-600 whitespace-nowrap z-10"
                      style={{ position: "sticky", left: COL1_W, minWidth: COL2_W }}
                    >
                      {project}
                    </td>
                    {weeks.map((w) => {
                      const hrs = md.projects[project]?.[w] ?? 0;
                      return (
                        <td key={w} className="border-r px-3 py-1.5 text-center text-sm text-gray-700">
                          {hrs > 0 ? `${hrs}h` : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

              </>
            );
          })}
        </tbody>

        {/* ── Footer: Team total ─────────────────────────── */}
        <tfoot>
          <tr className="bg-gray-100 border-t-2 border-gray-300">
            <td
              className="border-r bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 uppercase z-10"
              style={{ position: "sticky", left: 0, minWidth: COL1_W }}
            >
              Team
            </td>
            <td
              className="border-r bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 z-10"
              style={{ position: "sticky", left: COL1_W, minWidth: COL2_W }}
            >
              free slots
            </td>
            {weeks.map((w) => {
              const totalCap = members.length * data.capacity;
              const totalCommitted = members.reduce((sum, m) => sum + memberData[m].weeks[w].committed, 0);
              const free = totalCap - totalCommitted;
              const isOver = free < 0;
              return (
                <td key={w} className="border-r px-3 py-2 text-center whitespace-nowrap">
                  <span className={`text-xs font-bold ${isOver ? "text-red-600" : "text-gray-600"}`}>
                    {isOver ? `${free}h ⚠` : `+${free}h`}
                  </span>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
