
import React from 'react';
import { cn } from '../../lib/utils';

export function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-900/40" 
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
