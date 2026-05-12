
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PackagePlus, History, Trash2 } from 'lucide-react';
import { AppData, Product, Customer } from '../types';
import { cn, formatDate } from '../lib/utils';

interface InventoryViewProps {
  data: AppData;
  updateInventory: (id: string, year: number, amount: number) => void;
  addBottleReturn: (r: any) => void;
  deleteBatch: (productId: string, year: number) => void;
  isAdmin: boolean;
}

export function InventoryView({ data, updateInventory, addBottleReturn, deleteBatch, isAdmin }: InventoryViewProps) {
  const [selectedProductId, setSelectedProductId] = useState((data?.products || [])[0]?.id || '');
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [amount, setAmount] = useState(0);
  const [operationType, setOperationType] = useState<'replenish' | 'return'>('replenish');
  const [customerId, setCustomerId] = useState('');

  const selectedProduct = (data?.products || []).find(p => p.id === selectedProductId);
  const selectedCustomer = (data?.customers || []).find(c => c.id === customerId);

  const handleAction = () => {
    if (amount <= 0 || !selectedProductId || !year) return;
    if (operationType === 'replenish') {
      updateInventory(selectedProductId, year, amount);
    } else {
      addBottleReturn({
        customerId: customerId || 'consumidor',
        customerName: selectedCustomer?.name || 'Venda Avulsa / Consumidor',
        productId: selectedProductId,
        productName: selectedProduct?.name || '',
        quantity: amount,
        batchYear: year
      });
    }
    setAmount(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
           <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest">Total em Estoque (Cheios)</p>
           <h3 className="text-5xl md:text-7xl font-black text-slate-900">{(data?.products || []).reduce((acc, p) => acc + (p?.batches || []).reduce((sum, b) => sum + (b?.full || 0), 0), 0)}</h3>
           <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium">
             <span>Unidades prontas para entrega</span>
           </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
          <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Vazios (Retorno)</p>
           <h3 className="text-5xl md:text-7xl font-black text-slate-900">{(data?.products || []).reduce((acc, p) => acc + (p?.batches || []).reduce((sum, b) => sum + (b?.empty || 0), 0), 0)}</h3>
           <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-medium">
             <span>Aguardando reabastecimento</span>
           </div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
               <PackagePlus size={20} className="text-blue-500" />
               Movimentação de Estoque
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
               <button 
                 onClick={() => setOperationType('replenish')}
                 className={cn(
                   "flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                   operationType === 'replenish' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                 )}
               >
                 Entrada (Cheio)
               </button>
               <button 
                 onClick={() => setOperationType('return')}
                 className={cn(
                   "flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                   operationType === 'return' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                 )}
               >
                 Devolução (Vazio)
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</label>
               <select 
                 value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-semibold"
               >
                 {(data?.products || []).map(p => (
                   <option key={p.id} value={p.id}>{p.name} ({p.size})</option>
                 ))}
               </select>
            </div>
            
            {operationType === 'return' && (
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente (Revenda)</label>
                 <select 
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-semibold"
                 >
                   <option value="">Consumidor Final / Avulso</option>
                   {(data?.customers || []).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
              </div>
            )}

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ano de Validade</label>
               <input 
                 type="number" 
                 value={year}
                 onChange={e => setYear(Number(e.target.value))}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-semibold"
                 placeholder="Ex: 2027"
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                 {operationType === 'replenish' ? 'Quantidade Recebida' : 'Quantidade Devolvida'}
               </label>
               <input 
                type="number" 
                value={amount || ''} 
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="Ex: 20"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-semibold"
              />
            </div>
            <button 
              onClick={handleAction}
              className={cn(
                "px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg",
                operationType === 'replenish' 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20" 
                  : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
              )}
            >
              {operationType === 'replenish' ? 'Confirmar Entrada' : 'Confirmar Devolução'}
            </button>
         </div>
         
         {selectedProduct && selectedProduct.batches.length > 0 && (
           <div className="mt-12 space-y-4">
              <h4 className="font-bold text-slate-900 border-b pb-2">Status por Ano ({selectedProduct.name})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                 {selectedProduct.batches.sort((a, b) => a.year - b.year).map(batch => (
                   <div key={batch.year} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center relative group">
                      {isAdmin && (
                        <button 
                          onClick={() => deleteBatch(selectedProduct.id, batch.year)}
                          className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="Remover este ano do estoque"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Validade: {batch.year}</p>
                      <div className="flex w-full divide-x divide-slate-200">
                         <div className="flex-1 px-2">
                            <p className="text-3xl font-black text-slate-900">{batch.full}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Disponível</p>
                         </div>
                         <div className="flex-1 px-2">
                            <p className="text-3xl font-black text-slate-900">{batch.empty}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Vazios</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
         <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History size={20} className="text-amber-500" />
            Últimas Devoluções de Cascos
         </h3>
         <div className="flex-1">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                    <th className="px-4 py-4">Data</th>
                    <th className="px-4 py-4">Cliente</th>
                    <th className="px-4 py-4">Produto</th>
                    <th className="px-4 py-4">Ano</th>
                    <th className="px-4 py-4 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
                  {(data?.bottleReturns || []).slice(0, 10).map(ret => (
                    <tr key={ret.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">{formatDate(ret.date)}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">{ret.customerName}</td>
                      <td className="px-4 py-4">{ret.productName}</td>
                      <td className="px-4 py-4">{ret.batchYear}</td>
                      <td className="px-4 py-4 text-right font-bold">{ret.quantity} un.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {(data?.bottleReturns || []).slice(0, 10).map(ret => (
                <div key={ret.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(ret.date)}</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{ret.customerName}</p>
                    </div>
                    <span className="font-black text-slate-900 text-sm">{ret.quantity} un.</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {ret.productName} • Ano {ret.batchYear}
                  </p>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {(data?.bottleReturns || []).length === 0 && (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                Nenhuma devolução registrada ainda.
              </div>
            )}
         </div>
      </div>
    </motion.div>
  );
}
