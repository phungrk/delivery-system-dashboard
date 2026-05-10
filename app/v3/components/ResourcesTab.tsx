import { useState, useMemo } from 'react';
import { resources, Resource } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, AlertTriangle, TrendingDown, Activity, LayoutGrid, CalendarDays } from 'lucide-react';
import ResourceDetailDialog from './ResourceDetailDialog';
import ScheduleView from './ScheduleView';
import { cn } from '@/lib/utils';

function utilizationColor(u: number) {
  if (u >= 95) return 'text-red-400';
  if (u >= 80) return 'text-yellow-400';
  return 'text-emerald-400';
}

function utilizationBarColor(u: number) {
  if (u >= 95) return '[&>div]:bg-red-500';
  if (u >= 80) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-emerald-500';
}

export default function ResourcesTab() {
  const [view, setView] = useState<'cards' | 'schedule'>('cards');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selected, setSelected] = useState<Resource | null>(null);

  const departments = useMemo(() => Array.from(new Set(resources.map(r => r.department))), []);

  const stats = useMemo(() => ({
    total: resources.length,
    overloaded: resources.filter(r => r.utilization >= 95).length,
    available: resources.filter(r => r.availability >= 30).length,
    avgUtil: Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length),
  }), []);

  const filtered = useMemo(() => resources.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase()) ||
      r.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchDept = deptFilter === 'all' || r.department === deptFilter;
    return matchSearch && matchDept;
  }), [search, deptFilter]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Resources" value={stats.total} sub="Team members" icon={<Users className="w-5 h-5 text-primary" />} />
        <StatCard label="Avg Utilization" value={`${stats.avgUtil}%`} sub="Across all members" icon={<Activity className="w-5 h-5 text-blue-400" />} />
        <StatCard label="Overloaded" value={stats.overloaded} sub="≥95% allocated" icon={<AlertTriangle className="w-5 h-5 text-red-400" />} />
        <StatCard label="Available" value={stats.available} sub="≥30% free" icon={<TrendingDown className="w-5 h-5 text-emerald-400" />} />
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          <button
            onClick={() => setView('cards')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'cards' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Card View
          </button>
          <button
            onClick={() => setView('schedule')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'schedule' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule / Forecast
          </button>
        </div>
      </div>

      {view === 'schedule' && <ScheduleView />}

      {/* Card View content */}
      {view === 'cards' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, role, or skill..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(resource => (
              <Card
                key={resource.id}
                className="cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
                onClick={() => setSelected(resource)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{resource.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{resource.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">{resource.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={`font-semibold ${utilizationColor(resource.utilization)}`}>{resource.utilization}%</span>
                    </div>
                    <Progress value={resource.utilization} className={`h-2 ${utilizationBarColor(resource.utilization)}`} />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Available: </span>
                      <span className={`font-medium ${resource.availability >= 30 ? 'text-emerald-400' : resource.availability > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {resource.availability}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{resource.projects.length} project{resource.projects.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                    {resource.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">{skill}</span>
                    ))}
                    {resource.skills.length > 4 && (
                      <span className="text-xs text-muted-foreground px-1">+{resource.skills.length - 4}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && <ResourceDetailDialog resource={selected} onClose={() => setSelected(null)} />}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className="mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
