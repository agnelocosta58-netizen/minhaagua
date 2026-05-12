
import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Droplets, Package, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { AppData } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { StatCard } from './ui/StatCard';

interface DashboardViewProps {
  data: AppData;
  stats: any;
}

export function DashboardView({ data, stats }: DashboardViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Vendas Hoje" 
          value={stats.todayRevenue} 
          isCurrency 
          icon={<TrendingUp className="text-emerald-500" />} 
          trend="+12% que ontem"
          trendColor="text-emerald-600"
        />
        <StatCard 
          label="Unidades Vendidas" 
          value={stats.todayGallons} 
          icon={<Droplets className="text-blue-500" />} 
          trend="Total de hoje"
        />
        <StatCard 
          label="Estoque Cheio" 
          value={stats.totalFull} 
          icon={<Package className="text-blue-500" />} 
          subtitle="Disponível no estoque"
          trend="Total disponível"
          trendColor="text-emerald-600"
        />
        <StatCard 
          label="Emprestados (Revenda)" 
          value={stats.totalBorrowed} 
          icon={<ArrowRightLeft className="text-red-500" />} 
          trend="Pendente de retorno"
          trendColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Últimos Pedidos</h2>
          </div>
          <div className="flex-1">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-50">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4">Pagto.</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
                  {(data?.sales || []).filter(s => s).slice(0, 5).map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{sale.customerName}</td>
                      <td className="px-6 py-4">{sale.productName || 'Galão 20L'}</td>
                      <td className="px-6 py-4">{sale.quantity}</td>
                      <td className="px-6 py-4 capitalize">{sale.paymentMethod || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(sale.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          sale.status === 'cancelled' 
                            ? "bg-red-100 text-red-700" 
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          {sale.status === 'cancelled' ? 'Cancelado' : 'Entregue'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {(data?.sales || []).filter(s => s).slice(0, 5).map(sale => (
                <div key={sale.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{sale.customerName}</p>
                      <p className="text-xs text-slate-500">{sale.productName || 'Galão 20L'} • {sale.quantity} un.</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                      sale.status === 'cancelled' 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {sale.status === 'cancelled' ? 'Cancelado' : 'Entregue'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 capitalize">{sale.paymentMethod || '-'}</span>
                    <span className="font-black text-slate-900">{formatCurrency(sale.amount)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {(data?.sales || []).length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                Nenhuma venda registrada ainda.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h2 className="font-bold text-slate-900 mb-4">Nível do Estoque</h2>
          <div className="flex-1 flex flex-col justify-center items-center relative">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <motion.circle 
                  cx="80" cy="80" r="70" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="440" 
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * Math.min(100, stats.stockLevel) / 100) }}
                  className={cn(
                    "transition-all duration-1000",
                    stats.lowStock ? "text-red-500" : "text-blue-500"
                  )}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-slate-900">{Math.round(stats.stockLevel)}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Capacidade</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Cheio (Todos Produtos)</span>
                <span className="font-bold">{stats.totalFull} un.</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stats.stockLevel)}%` }}
                  className={cn("h-full", stats.lowStock ? "bg-red-500" : "bg-blue-500")}
                />
              </div>
              
              {stats.lowStock && (
                <div className="p-3 bg-red-50 rounded-xl flex gap-2 text-red-700 items-start mt-4">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-semibold">Abaixo de 10 unidades!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
