import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Search, Clock, HelpCircle, Bell, ChevronLeft, ChevronRight,
  Calendar, Settings, MessageSquare, Plus, MoreHorizontal,
  Folder, ChevronDown, ChevronRight as ChevRight, Info, User,
} from 'lucide-react';

// ─── Layout constants ──────────────────────────────────────────────────────────
const WEEK_W    = 116;
const ROW_H     = 44;
const HDR_H     = 36;
const NEST_H    = 28;   // nested sub-header row height
const NEST_ROW  = 40;   // nested project row height

const TM_COLS  = [200, 148, 76] as const;  // Member | Role | Actions
const TM_LEFT  = TM_COLS.reduce((s, w) => s + w, 0); // 424

// Nested sub-columns (must sum to TM_LEFT = 424)
const NC = [140, 96, 96, 92] as const; // Project | Est H | Actual H | Actions

const PR_COLS  = [196, 96, 82, 72] as const;
const PR_LEFT  = PR_COLS.reduce((s, w) => s + w, 0);

// ─── Weeks ────────────────────────────────────────────────────────────────────
const WEEKS = [
  { id:'w1',  top:'Jul 6',   bot:'– 12',    unavail:false },
  { id:'w2',  top:'Jul 13',  bot:'– 19',    unavail:false },
  { id:'w3',  top:'Jul 20',  bot:'– 26',    unavail:false },
  { id:'w4',  top:'Jul 27',  bot:'– Aug 2', unavail:true  },
  { id:'w5',  top:'Aug 3',   bot:'– 9',     unavail:false },
  { id:'w6',  top:'Aug 10',  bot:'– 16',    unavail:false },
  { id:'w7',  top:'Aug 17',  bot:'– 23',    unavail:false },
  { id:'w8',  top:'Aug 24',  bot:'– 30',    unavail:true  },
  { id:'w9',  top:'Aug 31',  bot:'– Sep 6', unavail:false },
  { id:'w10', top:'Sep 7',   bot:'– 13',    unavail:false },
];

// ─── Project color palette ────────────────────────────────────────────────────
const PC = {
  violet: { bg:'repeating-linear-gradient(-45deg,hsl(262 83% 58%/0.65) 0,hsl(262 83% 58%/0.65) 4px,hsl(262 83% 58%/0.12) 4px,hsl(262 83% 58%/0.12) 10px)', bd:'hsl(262 83% 58%/0.45)', ln:'hsl(262 83% 58%)', txt:'text-violet-400', dot:'bg-violet-400/70' },
  sky:    { bg:'repeating-linear-gradient(-45deg,hsl(199 89% 50%/0.65) 0,hsl(199 89% 50%/0.65) 4px,hsl(199 89% 50%/0.12) 4px,hsl(199 89% 50%/0.12) 10px)', bd:'hsl(199 89% 50%/0.45)', ln:'hsl(199 89% 50%)', txt:'text-sky-400',    dot:'bg-sky-400/70'    },
  pink:   { bg:'repeating-linear-gradient(-45deg,hsl(330 65% 58%/0.70) 0,hsl(330 65% 58%/0.70) 4px,hsl(330 65% 58%/0.12) 4px,hsl(330 65% 58%/0.12) 10px)', bd:'hsl(330 65% 58%/0.50)', ln:'hsl(330 65% 58%)', txt:'text-pink-400',   dot:'bg-pink-400/70'   },
  orange: { bg:'repeating-linear-gradient(-45deg,hsl(25  95% 53%/0.70) 0,hsl(25  95% 53%/0.70) 4px,hsl(25  95% 53%/0.12) 4px,hsl(25  95% 53%/0.12) 10px)', bd:'hsl(25  95% 53%/0.50)', ln:'hsl(25  95% 53%)', txt:'text-orange-400', dot:'bg-orange-400/70'  },
  teal:   { bg:'repeating-linear-gradient(-45deg,hsl(172 68% 42%/0.65) 0,hsl(172 68% 42%/0.65) 4px,hsl(172 68% 42%/0.12) 4px,hsl(172 68% 42%/0.12) 10px)', bd:'hsl(172 68% 42%/0.45)', ln:'hsl(172 68% 42%)', txt:'text-teal-400',   dot:'bg-teal-400/70'   },
  blue:   { bg:'repeating-linear-gradient(-45deg,hsl(217 91% 60%/0.65) 0,hsl(217 91% 60%/0.65) 4px,hsl(217 91% 60%/0.12) 4px,hsl(217 91% 60%/0.12) 10px)', bd:'hsl(217 91% 60%/0.45)', ln:'hsl(217 91% 60%)', txt:'text-blue-400',   dot:'bg-blue-400/70'   },
} as const;
type PColor = keyof typeof PC;

// ─── Types ────────────────────────────────────────────────────────────────────
interface AllocBar { startW:number; endW:number; pct:number; label:string; }
interface MemberProj { id:string; name:string; color:PColor; estH:number; actualH?:number; bars:AllocBar[]; }
interface Member { id:string; name:string; role:string; initials:string; ac:string; skills:number; util:number[]; projects:MemberProj[]; }

// ─── Member data with project assignments ─────────────────────────────────────
const MEMBERS: Member[] = [
  { id:'m1', name:'Sarah Mitchell', role:'Senior Designer',    initials:'SM', ac:'bg-violet-500/20 text-violet-300', skills:5, util:[71,85,100,115,60,75,90,45,80,70],
    projects:[
      { id:'mp1', name:'E-Commerce Platform Redesign', color:'violet', estH:240, actualH:182,
        bars:[{startW:0,endW:3,pct:55,label:'88h'},{startW:5,endW:7,pct:60,label:'72h'}] },
      { id:'mp2', name:'AI Chatbot Integration',        color:'pink',   estH:100,
        bars:[{startW:1,endW:3,pct:20,label:'24h'},{startW:5,endW:9,pct:25,label:'50h'}] },
    ] },
  { id:'m2', name:'James Carter',   role:'Frontend Developer', initials:'JC', ac:'bg-sky-500/20 text-sky-300',       skills:6, util:[55,90,80,95,110,70,65,85,75,60],
    projects:[
      { id:'mp3', name:'E-Commerce Platform Redesign', color:'violet', estH:180, actualH:120,
        bars:[{startW:0,endW:5,pct:50,label:'120h'}] },
      { id:'mp4', name:'Mobile App v3.0',              color:'sky',    estH:140,
        bars:[{startW:3,endW:9,pct:40,label:'112h'}] },
    ] },
  { id:'m3', name:'Emily Davis',    role:'Project Manager',    initials:'ED', ac:'bg-emerald-500/20 text-emerald-300', skills:4, util:[80,80,80,80,80,80,80,80,80,80],
    projects:[
      { id:'mp5', name:'CRM Integration Suite',        color:'orange', estH:200, actualH:140,
        bars:[{startW:0,endW:6,pct:50,label:'140h'}] },
      { id:'mp6', name:'Data Analytics Dashboard',     color:'blue',   estH:120,
        bars:[{startW:2,endW:8,pct:30,label:'84h'}] },
    ] },
  { id:'m4', name:'Michael Chen',   role:'Backend Developer',  initials:'MC', ac:'bg-rose-500/20 text-rose-300',     skills:7, util:[100,100,105,115,100,100,110,100,95,90],
    projects:[
      { id:'mp7', name:'Mobile App v3.0',              color:'sky',    estH:300, actualH:280,
        bars:[{startW:0,endW:9,pct:70,label:'280h'}] },
      { id:'mp8', name:'CRM Integration Suite',        color:'orange', estH:80,
        bars:[{startW:3,endW:7,pct:30,label:'60h'}] },
    ] },
  { id:'m5', name:'Lisa Thompson',  role:'UX Researcher',      initials:'LT', ac:'bg-amber-500/20 text-amber-300',   skills:4, util:[40,50,60,55,45,70,65,80,75,85],
    projects:[
      { id:'mp9',  name:'Data Analytics Dashboard',    color:'blue',   estH:120, actualH:70,
        bars:[{startW:0,endW:4,pct:35,label:'70h'}] },
      { id:'mp10', name:'AI Chatbot Integration',      color:'pink',   estH:160,
        bars:[{startW:4,endW:9,pct:45,label:'108h'}] },
    ] },
  { id:'m6', name:'David Park',     role:'DevOps Engineer',    initials:'DP', ac:'bg-teal-500/20 text-teal-300',    skills:5, util:[75,70,85,80,90,95,100,85,75,65],
    projects:[
      { id:'mp11', name:'Cloud Migration Phase 2',     color:'teal',   estH:80,  actualH:80,
        bars:[{startW:0,endW:3,pct:50,label:'80h'}] },
      { id:'mp12', name:'E-Commerce Platform Redesign', color:'violet', estH:120,
        bars:[{startW:3,endW:9,pct:40,label:'112h'}] },
    ] },
];

const PROJECTS = [
  { id:'pr1', name:'Website Redesign',        count:4, status:'Active',   budget:'$120,000', eac:'$125,000', actualFees:'$48,500', barStart:0, barEnd:7,
    resources:[
      { id:'r1', name:'Sarah Mitchell', initials:'SM', ac:'bg-violet-500/20 text-violet-300', estH:120, allocH:130, util:[14,14,14,25,25,25,25,25,0,0] },
      { id:'r2', name:'James Carter',   initials:'JC', ac:'bg-sky-500/20 text-sky-300',       estH:160, allocH:160, util:[25,25,25,25,25,25,25,25,0,0] },
      { id:'r3', name:'Emily Davis',    initials:'ED', ac:'bg-emerald-500/20 text-emerald-300',estH:80,  allocH:75,  util:[19,19,19,0,0,0,0,0,0,0]    },
    ] },
  { id:'pr2', name:'Mobile App v3.0',         count:3, status:'Active',   budget:'$85,000',  eac:'$90,000',  actualFees:'$22,000', barStart:2, barEnd:9,
    resources:[
      { id:'r4', name:'Michael Chen', initials:'MC', ac:'bg-rose-500/20 text-rose-300', estH:200, allocH:215, util:[0,0,19,19,19,19,19,19,19,19] },
      { id:'r5', name:'David Park',   initials:'DP', ac:'bg-teal-500/20 text-teal-300', estH:80,  allocH:80,  util:[0,0,15,15,15,15,15,15,0,0]  },
    ] },
  { id:'pr3', name:'Data Analytics Platform', count:2, status:'Pipeline', budget:'$200,000', eac:'$195,000', actualFees:'—', barStart:5, barEnd:9, resources:[] },
  { id:'pr4', name:'CRM Integration Suite',   count:3, status:'On Hold',  budget:'$60,000',  eac:'$65,000',  actualFees:'$15,000', barStart:0, barEnd:4, resources:[] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UNAVAIL_BG = 'repeating-linear-gradient(-45deg,hsl(0 0% 50%/0.04) 0,hsl(0 0% 50%/0.04) 3px,transparent 3px,transparent 8px)';

const statusStyle: Record<string,string> = {
  'Active':   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  'Pipeline': 'bg-primary/15 text-primary border border-primary/30',
  'On Hold':  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  'Complete': 'bg-muted text-muted-foreground border border-border',
};

// ─── UtilCell ─────────────────────────────────────────────────────────────────
function UtilCell({ pct, gray }: { pct: number; gray?: boolean }) {
  if (pct === 0) return <div className="flex items-center justify-center" style={{ width:WEEK_W, height:ROW_H }}><span className="text-[10px] text-muted-foreground/30">–</span></div>;
  const over = pct > 100;
  const textCls = gray ? 'text-muted-foreground' : over ? 'text-destructive' : 'text-primary';
  const hours = ((pct / 100) * 40).toFixed(0);
  return (
    <div className="flex items-center justify-center" style={{ width:WEEK_W, height:ROW_H }}>
      <span className={cn('text-[11px] font-semibold tabular-nums', textCls)}>{hours}h</span>
    </div>
  );
}

// ─── FinancialBar ─────────────────────────────────────────────────────────────
function FinancialBar({ barStart, barEnd, actualFees, eac }: { barStart:number; barEnd:number; actualFees:string; eac:string }) {
  const left  = barStart * WEEK_W + 8;
  const width = (barEnd - barStart + 1) * WEEK_W - 16;
  return (
    <div className="relative" style={{ width:WEEKS.length*WEEK_W, height:ROW_H }}>
      <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 rounded"
        style={{ left, width, height:20, background:'hsl(var(--muted-foreground)/0.12)', border:'1px solid hsl(var(--border))' }}>
        <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap truncate">Actual Fees: {actualFees} · EAC: {eac}</span>
      </div>
    </div>
  );
}

// ─── Team Members — left panel sub-components ─────────────────────────────────

function LeftMemberRow({ m, expanded, onToggle }: { m:Member; expanded:boolean; onToggle:()=>void }) {
  return (
    <div className={cn('flex border-b border-border hover:bg-muted/20 transition-colors', expanded && 'bg-muted/10')} style={{ height:ROW_H }}>
      <div className="flex items-center gap-1.5 px-2 border-r border-border" style={{ width:TM_COLS[0] }}>
        <button onClick={onToggle} className="w-4 h-4 flex items-center justify-center text-muted-foreground/50 hover:text-primary flex-shrink-0 transition-colors rounded hover:bg-primary/10">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevRight className="w-3 h-3" />}
        </button>
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0', m.ac)}>{m.initials}</div>
        <span className="text-xs font-medium text-foreground truncate">{m.name}</span>
      </div>
      <div className="flex items-center px-3 border-r border-border" style={{ width:TM_COLS[1] }}>
        <span className="text-[11px] text-muted-foreground truncate">{m.role}</span>
      </div>
      <div className="flex items-center justify-center gap-1.5" style={{ width:TM_COLS[2] }}>
        <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"><Plus className="w-3 h-3" /></button>
        <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"><MoreHorizontal className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

function LeftNestedHeader() {
  return (
    <div className="flex border-b border-border bg-muted/50" style={{ height:NEST_H }}>
      <div className="flex items-center pl-8 border-r border-border/60 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width:NC[0] }}>Project</div>
      <div className="flex items-center justify-center border-r border-border/60 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width:NC[1] }}>Est. Hours</div>
      <div className="flex items-center justify-center border-r border-border/60 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width:NC[2] }}>Actual</div>
      <div style={{ width:NC[3] }} />
    </div>
  );
}

function LeftProjectRow({ proj }: { proj:MemberProj }) {
  const c = PC[proj.color];
  return (
    <div className="flex border-b border-border/50 hover:bg-muted/15 transition-colors" style={{ height:NEST_ROW }}>
      <div className="flex items-center gap-1.5 pl-5 pr-2 border-r border-border/50" style={{ width:NC[0] }}>
        <div className="w-0.5 h-6 rounded-sm flex-shrink-0" style={{ background:c.ln }} />
        <ChevRight className="w-2.5 h-2.5 text-muted-foreground/35 flex-shrink-0" />
        <Folder className={cn('w-3.5 h-3.5 flex-shrink-0', c.txt)} style={{ strokeWidth:1.5 }} />
        <span className={cn('text-[11px] font-medium underline underline-offset-2 cursor-pointer truncate', c.txt)}>{proj.name}</span>
      </div>
      <div className="flex items-center justify-center border-r border-border/50" style={{ width:NC[1] }}>
        <span className="text-[11px] text-muted-foreground tabular-nums">{proj.estH}h</span>
      </div>
      <div className="flex items-center justify-center border-r border-border/50" style={{ width:NC[2] }}>
        <span className="text-[11px] text-muted-foreground tabular-nums">{proj.actualH != null ? `${proj.actualH}h` : '—'}</span>
      </div>
      <div className="flex items-center justify-center gap-1" style={{ width:NC[3] }}>
        <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"><MoreHorizontal className="w-3 h-3" /></button>
        <button className="w-4 h-4 rounded-sm border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"><Plus className="w-2.5 h-2.5" /></button>
      </div>
    </div>
  );
}

// ─── Team Members — right panel sub-components ───────────────────────────────

function RightMemberRow({ m, expanded }: { m:Member; expanded:boolean }) {
  return (
    <div className={cn('flex border-b border-border hover:bg-muted/20 transition-colors', expanded && 'bg-muted/10')}>
      {WEEKS.map((w, wi) => (
        <div key={w.id} className={cn('flex-shrink-0 border-r border-border/60 last:border-r-0', w.unavail && 'bg-muted/15')}>
          <UtilCell pct={m.util[wi] ?? 0} />
        </div>
      ))}
    </div>
  );
}

function RightNestedHeader() {
  return (
    <div className="flex border-b border-border bg-muted/50" style={{ height:NEST_H, width:WEEKS.length*WEEK_W }}>
      {WEEKS.map((w) => (
        <div key={w.id} className={cn('flex-shrink-0 border-r border-border/60 last:border-r-0', w.unavail && 'bg-muted/20')} style={{ width:WEEK_W }} />
      ))}
    </div>
  );
}

function RightProjectRow({ proj }: { proj:MemberProj }) {
  const c = PC[proj.color];
  return (
    <div className="relative border-b border-border/50 hover:bg-muted/10 transition-colors overflow-hidden"
      style={{ height:NEST_ROW, width:WEEKS.length*WEEK_W }}>
      {/* Unavailable period shading */}
      {WEEKS.map((w, wi) => w.unavail && (
        <div key={w.id} className="absolute top-0 bottom-0" style={{ left:wi*WEEK_W, width:WEEK_W, background:UNAVAIL_BG }} />
      ))}
      {/* Vertical grid lines */}
      {WEEKS.map((_, wi) => (
        <div key={wi} className="absolute top-0 bottom-0 w-px" style={{ left:(wi+1)*WEEK_W-1, background:'hsl(var(--border)/0.4)' }} />
      ))}
      {/* Allocation bars */}
      {proj.bars.map((bar, i) => {
        const left  = bar.startW * WEEK_W + 3;
        const width = (bar.endW - bar.startW + 1) * WEEK_W - 6;
        return (
          <div key={i} className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center overflow-hidden rounded"
            style={{ left, width, height:22, background:c.bg, border:`1px solid ${c.bd}` }}>
            <span className="text-[9px] font-semibold text-white/90 px-1.5 whitespace-nowrap drop-shadow-sm">
              {bar.pct}% ({bar.label})
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Virtual row builder ──────────────────────────────────────────────────────
type VRow =
  | { kind:'member';      m:Member }
  | { kind:'nested-hdr';  mId:string }
  | { kind:'project';     proj:MemberProj };

function buildRows(expanded: Set<string>): VRow[] {
  const rows: VRow[] = [];
  for (const m of MEMBERS) {
    rows.push({ kind:'member', m });
    if (expanded.has(m.id)) {
      rows.push({ kind:'nested-hdr', mId:m.id });
      for (const proj of m.projects) rows.push({ kind:'project', proj });
    }
  }
  return rows;
}

// ─── Team Members View ────────────────────────────────────────────────────────
function TeamMembersView() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const rows = buildRows(expanded);

  return (
    <div className="flex border-t border-border">
      {/* ── LEFT FIXED PANEL (thick right divider) ── */}
      <div className="flex-shrink-0" style={{ width:TM_LEFT, borderRight:'2px solid hsl(var(--border))' }}>
        {/* Column header */}
        <div className="flex bg-muted/60 border-b border-border" style={{ height:HDR_H }}>
          {(['Team Member','Role',''] as const).map((label, i) => (
            <div key={i} className="flex items-center px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-r border-border last:border-r-0" style={{ width:TM_COLS[i] }}>
              {label}
            </div>
          ))}
        </div>
        {rows.map((row, i) => {
          if (row.kind === 'member')     return <LeftMemberRow     key={`l-m-${row.m.id}`}     m={row.m}  expanded={expanded.has(row.m.id)} onToggle={() => toggle(row.m.id)} />;
          if (row.kind === 'nested-hdr') return <LeftNestedHeader  key={`l-nh-${i}`} />;
          return                                <LeftProjectRow    key={`l-p-${row.proj.id}`}  proj={row.proj} />;
        })}
      </div>

      {/* ── RIGHT SCROLLABLE PANEL ── */}
      <div className="flex-1 overflow-x-auto">
        <div style={{ width:WEEKS.length*WEEK_W, minWidth:WEEKS.length*WEEK_W }}>
          {/* Week header */}
          <div className="flex bg-muted/60 border-b border-border" style={{ height:HDR_H }}>
            {WEEKS.map(w => (
              <div key={w.id} className={cn('flex flex-col items-center justify-center border-r border-border last:border-r-0 flex-shrink-0', w.unavail && 'bg-muted/40')} style={{ width:WEEK_W }}>
                <span className="text-[10.5px] font-semibold text-foreground leading-none">{w.top}</span>
                <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{w.bot}</span>
                {w.unavail && <span className="text-[7.5px] text-muted-foreground/50 mt-0.5">holiday</span>}
              </div>
            ))}
          </div>
          {rows.map((row, i) => {
            if (row.kind === 'member')     return <RightMemberRow    key={`r-m-${row.m.id}`}    m={row.m}  expanded={expanded.has(row.m.id)} />;
            if (row.kind === 'nested-hdr') return <RightNestedHeader key={`r-nh-${i}`} />;
            return                                <RightProjectRow   key={`r-p-${row.proj.id}`} proj={row.proj} />;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Projects View ────────────────────────────────────────────────────────────
function ProjectRow({ proj, expanded, onToggle }: { proj:typeof PROJECTS[0]; expanded:boolean; onToggle:()=>void }) {
  const colW = PR_COLS;
  return (
    <>
      <div className="flex border-b border-border">
        <div className="flex-shrink-0 border-r border-border" style={{ width:PR_LEFT }}>
          <div className="flex hover:bg-muted/30 transition-colors" style={{ height:ROW_H }}>
            <button className="flex items-center gap-2 px-2.5 border-r border-border text-left" style={{ width:colW[0] }} onClick={onToggle}>
              <span className="text-muted-foreground/50 flex-shrink-0">{expanded ? <ChevronDown className="w-3 h-3" /> : <ChevRight className="w-3 h-3" />}</span>
              <Folder className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-foreground truncate flex-1">{proj.name}</span>
              <span className="text-[9px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">{proj.count}</span>
            </button>
            <div className="flex items-center justify-center border-r border-border" style={{ width:colW[1] }}>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusStyle[proj.status] ?? statusStyle['Active'])}>{proj.status}</span>
            </div>
            <div className="flex items-center px-3 border-r border-border" style={{ width:colW[2] }}>
              <span className="text-[11px] text-muted-foreground tabular-nums">{proj.budget}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5" style={{ width:colW[3] }}>
              <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"><Plus className="w-3 h-3" /></button>
              <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"><MoreHorizontal className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <FinancialBar barStart={proj.barStart} barEnd={proj.barEnd} actualFees={proj.actualFees} eac={proj.eac} />
        </div>
      </div>

      {expanded && proj.resources.map(r => (
        <div key={r.id} className="flex border-b border-border bg-muted/20">
          <div className="flex-shrink-0 border-r border-border" style={{ width:PR_LEFT }}>
            <div className="flex hover:bg-muted/30 transition-colors" style={{ height:ROW_H }}>
              <div className="flex items-center gap-2 px-3 pl-9 border-r border-border" style={{ width:colW[0] }}>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0', r.ac)}>{r.initials}</div>
                <span className="text-[11px] font-medium text-primary underline underline-offset-2 truncate cursor-pointer">{r.name}</span>
              </div>
              <div className="flex items-center justify-center border-r border-border" style={{ width:colW[1] }}>
                <span className="text-[11px] text-muted-foreground tabular-nums">{r.estH}h</span>
              </div>
              <div className="flex items-center justify-center border-r border-border" style={{ width:colW[2] }}>
                <span className={cn('text-[11px] font-semibold tabular-nums', r.allocH > r.estH ? 'text-destructive' : 'text-foreground')}>{r.allocH}h</span>
              </div>
              <div className="flex items-center justify-center gap-1" style={{ width:colW[3] }}>
                <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"><MoreHorizontal className="w-3 h-3" /></button>
                <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex" style={{ width:WEEKS.length*WEEK_W }}>
              {WEEKS.map((w,wi) => (
                <div key={w.id} className="flex-shrink-0 border-r border-border/60 last:border-r-0">
                  <UtilCell pct={r.util[wi] ?? 0} gray />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function ProjectsView() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['pr1']));
  const toggle = (id: string) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return (
    <div className="flex border-t border-border">
      <div className="w-full">
        <div className="flex border-b border-border">
          <div className="flex-shrink-0 border-r border-border" style={{ width:PR_LEFT }}>
            <div className="flex bg-muted/60" style={{ height:HDR_H }}>
              {(['Project','Status','Budget',''] as const).map((label,i) => (
                <div key={i} className="flex items-center px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-r border-border last:border-r-0" style={{ width:PR_COLS[i] }}>{label}</div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex bg-muted/60" style={{ width:WEEKS.length*WEEK_W, height:HDR_H }}>
              {WEEKS.map(w => (
                <div key={w.id} className="flex flex-col items-center justify-center border-r border-border last:border-r-0 flex-shrink-0" style={{ width:WEEK_W }}>
                  <span className="text-[10.5px] font-semibold text-foreground leading-none">{w.top}</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{w.bot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {PROJECTS.map(p => <ProjectRow key={p.id} proj={p} expanded={expanded.has(p.id)} onToggle={() => toggle(p.id)} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ResourceCenter() {
  const [tab, setTab] = useState<'team'|'projects'>('team');
  const [timeView, setTimeView] = useState<'D'|'W'|'M'>('W');

  return (
    <div className="bg-background text-foreground">
      <div className="bg-primary/10 text-primary text-xs px-4 py-2 flex items-center gap-2 border-b border-primary/20">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-primary/80">Resource planning is in <strong className="text-primary font-semibold">beta</strong> — your feedback helps us improve.</span>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <h1 className="text-base font-bold text-foreground tracking-tight">Resource Center</h1>
        <div className="flex items-center gap-3">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Search className="w-4 h-4" /></button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono bg-muted px-2 py-1 rounded"><Clock className="w-3 h-3" /><span>24h 00 00</span></div>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><HelpCircle className="w-4 h-4" /></button>
          <div className="relative">
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><Bell className="w-4 h-4" /></button>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>
        </div>
      </div>

      <div className="flex items-end border-b border-border px-5 bg-card">
        {(['team','projects'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px', tab === t ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-foreground')}>
            {t === 'team' ? 'Team Members' : 'Projects'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-5 py-2 border-b border-border bg-card flex-wrap">
        <div className="flex items-center gap-1 text-xs text-foreground font-semibold">
          <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <span className="px-1">2025</span>
          <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"><Calendar className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <button className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-all">Today</button>
        <div className="flex bg-muted rounded overflow-hidden">
          {(['D','W','M'] as const).map(v => (
            <button key={v} onClick={() => setTimeView(v)} className={cn('px-2.5 py-1 text-[11px] font-semibold transition-all', timeView === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{v}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-[11px] text-primary font-medium px-2.5 py-1 rounded border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <MessageSquare className="w-3 h-3" /> Share Feedback
          </button>
          <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-all"><Settings className="w-3.5 h-3.5" /></button>
          <button className="flex items-center gap-1 text-[11px] text-muted-foreground px-2.5 py-1 rounded border border-border hover:text-foreground transition-colors">
            <span className="flex gap-0.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background:'repeating-linear-gradient(-45deg,hsl(var(--primary)/0.6) 0,hsl(var(--primary)/0.6) 2px,hsl(var(--primary)/0.1) 2px,hsl(var(--primary)/0.1) 5px)' }} />
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background:'repeating-linear-gradient(-45deg,hsl(var(--destructive)/0.6) 0,hsl(var(--destructive)/0.6) 2px,hsl(var(--destructive)/0.1) 2px,hsl(var(--destructive)/0.1) 5px)' }} />
            </span>
            Legend
          </button>
        </div>
      </div>

      {tab === 'team' ? <TeamMembersView /> : <ProjectsView />}
    </div>
  );
}
