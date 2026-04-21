"use client";

// ── Lightweight UI primitives for the v2 dashboard ───────────────────────────

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// ── Progress ─────────────────────────────────────────────────────────────────

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("w-full bg-muted/50 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium", className)}>
      {children}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface TabsCtx { active: string; setActive: (v: string) => void }
const TabsContext = createContext<TabsCtx>({ active: "", setActive: () => {} });

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex", className)}>{children}</div>;
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "border-b-2 border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground border-b-2 border-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}

// ── Dialog ────────────────────────────────────────────────────────────────────

export function Dialog({ open, onClose, children, maxWidth = "max-w-3xl" }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={cn("relative z-10 w-full bg-card text-card-foreground rounded-xl shadow-2xl flex flex-col overflow-hidden", maxWidth)}
        style={{ maxHeight: "90vh" }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
