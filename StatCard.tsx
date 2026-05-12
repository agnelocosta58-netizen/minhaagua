
import React from 'react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';

export function StatCard({ label, value, isCurrency, icon, subtitle, trend, trendColor = 'text-slate-500' }: { label: string, value: number, isCurrency?: boolean, icon: React.ReactNode, subtitle?: string, trend?: string, trendColor?: string }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
        {isCurrency ? formatCurrency(value).split(',')[0] : value}
      </h3>
      {trend && (
        <div className={cn("mt-1 sm:mt-2 flex items-center gap-1 text-[10px] sm:text-xs font-medium", trendColor)}>
          <span>{trend}</span>
        </div>
      )}
      {subtitle && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">{subtitle}</p>}
    </div>
  );
}
