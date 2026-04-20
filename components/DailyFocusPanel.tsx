import { Task } from "@/lib/parser/sprint";

type UrgentItem = { task: Task; reason: string };
type WatchItem  = { task: Task; reason: string };

function classifyTasks(
  tasks: Task[],
  sprintPct: number,
  today: string,
): { urgent: UrgentItem[]; watch: WatchItem[] } {
  const urgent: UrgentItem[] = [];
  const watch: WatchItem[]   = [];

  for (const t of tasks) {
    if (t.status === "Done") continue;

    // ── 🔴 Urgent ──
    if (t.status === "Blocked") {
      urgent.push({ task: t, reason: `Blocked${t.blockedBy ? `: ${t.blockedBy}` : ""}` });
      continue;
    }
    if (t.overduedays && t.overduedays > 0) {
      urgent.push({ task: t, reason: `Overdue ${t.overduedays} ngày` });
      continue;
    }
    if (t.status === "Not Started" && sprintPct > 50) {
      urgent.push({ task: t, reason: `Chưa bắt đầu (${Math.round(sprintPct)}% sprint đã qua)` });
      continue;
    }

    // ── 🟡 Watch ──
    if (t.staleDays && t.staleDays > 7) {
      watch.push({ task: t, reason: `Không update ${t.staleDays} ngày` });
      continue;
    }
    if (t.due) {
      const daysUntil = Math.ceil(
        (new Date(t.due).getTime() - new Date(today).getTime()) / 86400000,
      );
      if (daysUntil >= 0 && daysUntil <= 2) {
        const label = daysUntil === 0 ? "hôm nay" : daysUntil === 1 ? "ngày mai" : "2 ngày nữa";
        watch.push({ task: t, reason: `Due ${label}` });
      }
    }
  }

  return { urgent, watch };
}

function buildFocus(urgent: UrgentItem[], watch: WatchItem[]): string[] {
  const items: string[] = [];

  for (const { task: t, reason } of urgent.slice(0, 3)) {
    if (t.status === "Blocked")
      items.push(`Unblock ${t.id}${t.owner ? ` — ${t.owner}` : ""}`);
    else if (reason.startsWith("Overdue"))
      items.push(`Xử lý ${t.id} (${reason.toLowerCase()})${t.owner ? ` — ${t.owner}` : ""}`);
    else
      items.push(`Bắt đầu ${t.id} ngay${t.owner ? ` — ${t.owner}` : ""}`);
  }

  for (const { task: t, reason } of watch.slice(0, 3 - items.length)) {
    if (reason.startsWith("Không update"))
      items.push(`${t.owner || t.id}: cập nhật tiến độ ${t.id} (${reason.toLowerCase()})`);
    else
      items.push(`Confirm ${t.id} on-track — ${reason.toLowerCase()}${t.owner ? ` (${t.owner})` : ""}`);
  }

  if (items.length === 0) items.push("Mọi thứ đang on-track — maintain nhịp hiện tại ✓");
  return items.slice(0, 3);
}

export function DailyFocusPanel({
  tasks,
  sprintProgressPct,
  today,
}: {
  tasks: Task[];
  sprintProgressPct: number;
  today: string;
}) {
  const { urgent, watch } = classifyTasks(tasks, sprintProgressPct, today);
  const focus = buildFocus(urgent, watch);
  const allClear = urgent.length === 0 && watch.length === 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Daily Focus
        </h2>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 🔴 Urgent */}
        <div>
          <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
            🔴 Cần xử lý ngay
            {urgent.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 text-xs font-bold">
                {urgent.length}
              </span>
            )}
          </p>
          {urgent.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Không có ✓</p>
          ) : (
            <ul className="space-y-1.5">
              {urgent.map(({ task: t, reason }) => (
                <li key={t.id} className="text-xs">
                  <span className="font-mono text-gray-500">{t.id}</span>
                  {t.owner && <span className="text-gray-400 mx-1">·</span>}
                  {t.owner && <span className="text-gray-600">{t.owner}</span>}
                  <span className="block text-red-600 mt-0.5">{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🟡 Watch */}
        <div>
          <p className="text-xs font-medium text-yellow-600 mb-2 flex items-center gap-1">
            🟡 Theo dõi hôm nay
            {watch.length > 0 && (
              <span className="ml-1 bg-yellow-100 text-yellow-700 rounded-full px-1.5 py-0.5 text-xs font-bold">
                {watch.length}
              </span>
            )}
          </p>
          {watch.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Không có</p>
          ) : (
            <ul className="space-y-1.5">
              {watch.map(({ task: t, reason }) => (
                <li key={t.id} className="text-xs">
                  <span className="font-mono text-gray-500">{t.id}</span>
                  {t.owner && <span className="text-gray-400 mx-1">·</span>}
                  {t.owner && <span className="text-gray-600">{t.owner}</span>}
                  <span className="block text-yellow-600 mt-0.5">{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Focus gợi ý */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Focus gợi ý</p>
          {allClear ? (
            <p className="text-xs text-green-600">Mọi thứ đang on-track ✓</p>
          ) : (
            <ol className="space-y-1.5 list-decimal list-inside">
              {focus.map((item, i) => (
                <li key={i} className="text-xs text-gray-700">{item}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
