import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  iconClass: string;
}

export function StatCard({ label, value, sub, icon: Icon, iconClass }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <Icon className={`w-5 h-5 mt-0.5 ${iconClass}`} />
      </div>
    </div>
  );
}
