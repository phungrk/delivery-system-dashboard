import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Resource } from '@/data/mockData';
import { Briefcase, Zap, Activity } from 'lucide-react';

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

export default function ResourceDetailDialog({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{resource.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{resource.role}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Department */}
          <Badge variant="outline" className="text-xs">{resource.department}</Badge>

          {/* Utilization */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Activity className="w-4 h-4" /> Utilization</span>
              <span className={`font-semibold ${utilizationColor(resource.utilization)}`}>{resource.utilization}%</span>
            </div>
            <Progress value={resource.utilization} className={`h-3 ${utilizationBarColor(resource.utilization)}`} />
          </div>

          {/* Allocation vs Availability */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Allocation</p>
              <p className="text-xl font-bold">{resource.allocation}%</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className={`text-xl font-bold ${resource.availability >= 30 ? 'text-emerald-400' : resource.availability > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                {resource.availability}%
              </p>
            </div>
          </div>

          {/* Projects */}
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
              <Briefcase className="w-4 h-4" /> Assigned Projects
            </p>
            <div className="space-y-2">
              {resource.projects.map(p => (
                <div key={p} className="text-sm px-3 py-2 rounded-lg bg-muted/30 border border-border">
                  {p}
                </div>
              ))}
              {resource.projects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects assigned</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4" /> Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {resource.skills.map(skill => (
                <span key={skill} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
