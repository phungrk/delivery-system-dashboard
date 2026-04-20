"use client";

type Props = {
  completionPct: number;
  timePct: number;
};

export function DualProgressBar({ completionPct, timePct }: Props) {
  const gap = timePct - completionPct;
  const isLagging = gap > 20;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Done {completionPct.toFixed(0)}%</span>
        <span>Time {timePct.toFixed(0)}%</span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        {/* time elapsed (background) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gray-300"
          style={{ width: `${Math.min(timePct, 100)}%` }}
        />
        {/* completion (foreground) */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${isLagging ? "bg-orange-400" : "bg-green-500"}`}
          style={{ width: `${Math.min(completionPct, 100)}%` }}
        />
      </div>
      {isLagging && (
        <p className="text-xs text-orange-600">
          {gap.toFixed(0)}% behind schedule
        </p>
      )}
    </div>
  );
}
