
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppData, Sale, Product } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { generatePixPayload } from '../lib/pixUtils';

interface SalesViewProps {
  data: AppData;
  addSale: (s: any) => Promise<boolean>;
  cancelSale: (id: string) => void;
}

export function SalesView({ data, addSale, cancelSale }: SalesViewProps) {
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [adminPassAttempt, setAdminPassAttempt] = useState('');
  const [passError, setPassError] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    productId: (data?.products || [])[0]?.id || '',
    batchYear: (data?.products || [])[0]?.batches?.find((b: any) => b.full > 0)?.year || (data?.products || [])[0]?.batches?.[0]?.year,
    quantity: 1,
    priceType: 'retail' as 'retail' | 'resale',
    paymentMethod: 'dinheiro' as const,
    borrowedQuantity: 0,
    borrowedBatchYear: (data?.products || [])[0]?.batches?.[0]?.year || new Date().getFullYear(),
    amountPaid: 0
  });

  const [error, setError] = useState<string | null>(null);

  const selectedProduct = (data?.products || []).find(p => p.id === form.productId);
  
  useEffect(() => {
    if (selectedProduct) {
      const firstWithStock = selectedProduct.batches.find(b => b.full > 0);
      setForm(f => ({ 
        ...f, 
        batchYear: firstWithStock?.year || selectedProduct.batches[0]?.year 
      }));
    }
  }, [form.productId, selectedProduct]);

  const currentPrice = selectedProduct 
    ? (form.priceType === 'retail' ? selectedProduct.retailPrice : selectedProduct.resalePrice) 
    : 0;

  const currentTotal = form.quantity * currentPrice;

  const pixPayload = useMemo(() => {
    if (form.paymentMethod === 'pix' && data.pixKey) {
      return generatePixPayload(
        data.pixKey, 
        data.pixName || 'VENDEDOR AGUA', 
        data.pixCity || 'BRASILIA', 
        currentTotal
      );
    }
    return '';
  }, [form.paymentMethod, data.pixKey, data.pixName, data.pixCity, currentTotal]);

  const handleCancelClick = (id: string) => {
    setCancellingSaleId(id);
    setAdminPassAttempt('');
    setPassError(false);
  };

  const confirmCancel = () => {
    if (adminPassAttempt === (data.adminPassword || '1234')) {
      if (cancellingSaleId) {
        cancelSale(cancellingSaleId);
        setCancellingSaleId(null);
        setAdminPassAttempt('');
        setPassError(false);
      }
    } else {
      setPassError(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!form.customerName) {
      alert("Por favor, informe o nome do cliente.");
      return;
    }
    if (!form.productId) {
      alert("Por favor, selecione um produto.");
      return;
    }
    if (form.quantity <= 0) {
      alert("A quantidade deve ser maior que zero.");
      return;
    }
    
    const selectedBatch = selectedProduct?.batches.find(b => b.year === form.batchYear);
    const totalAvailableInBatch = selectedBatch ? selectedBatch.full : 0;
    const totalAvailable = selectedProduct ? selectedProduct.batches.reduce((sum, b) => sum + b.full, 0) : 0;
    
    if (!selectedProduct || form.quantity > totalAvailable) {
      setError(`Estoque insuficiente! O produto ${selectedProduct?.name} tem apenas ${totalAvailable} unidades totais.`);
      return;
    }

    if (form.batchYear && form.quantity > totalAvailableInBatch) {
       setError(`Estoque insuficiente nesta validade! Ano ${form.batchYear} tem apenas ${totalAvailableInBatch} unidades.`);
       return;
    }

    const success = await addSale({
      customerId: form.customerId || 'anon',
      customerName: form.customerName,
      productId: form.productId,
      productName: selectedProduct.name,
      quantity: form.quantity,
      batchYear: form.batchYear,
      amount: form.quantity * currentPrice,
      paymentMethod: form.paymentMethod,
      borrowedQuantity: form.borrowedQuantity,
      borrowedBatchYear: form.borrowedBatchYear
    });

    if (success) {
      setForm({ ...form, customerName: '', quantity: 1, borrowedQuantity: 0, amountPaid: 0 });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-900 mb-6">Registrar Nova Venda</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</label>
                    <input 
                      type="text" 
                      value={form.customerName}
                      onChange={e => setForm({...form, customerName: e.target.value})}
                      placeholder="Nome do cliente"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</label>
                    <select 
                      value={form.productId}
                      onChange={e => setForm({...form, productId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    >
                      {data.products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.size})</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ano Validade</label>
                    <select 
                      value={form.batchYear || ''}
                      onChange={e => setForm({...form, batchYear: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    >
                      {selectedProduct?.batches.length === 0 && <option value="">Sem estoque</option>}
                      {selectedProduct?.batches.sort((a,b) => a.year - b.year).map(b => (
                        <option key={b.year} value={b.year}>
                          {b.year} ({b.full} un.)
                        </option>
                      ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Preço</label>
                    <select 
                      value={form.priceType}
                      onChange={e => setForm({...form, priceType: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    >
                      <option value="retail">Varejo ({selectedProduct ? formatCurrency(selectedProduct.retailPrice) : '-'})</option>
                      <option value="resale">Revenda ({selectedProduct ? formatCurrency(selectedProduct.resalePrice) : '-'})</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma Pagto.</label>
                    <select 
                      value={form.paymentMethod}
                      onChange={e => setForm({...form, paymentMethod: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    >
                      <option value="dinheiro">💵 Dinheiro</option>
                      <option value="pix">📱 PIX</option>
                      <option value="credito">💳 C. Crédito</option>
                      <option value="debito">💳 C. Débito</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantidade</label>
                    <input 
                      type="number" 
                      min="1"
                      value={form.quantity}
                      onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
             </div>

             {form.paymentMethod === 'dinheiro' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-center gap-6"
                >
                  <div className="w-full md:w-1/3 space-y-2">
                    <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Valor Pago pelo Cliente</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={form.amountPaid === 0 ? '' : form.amountPaid}
                        onChange={e => setForm({...form, amountPaid: Number(e.target.value)})}
                        placeholder="0,00"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 outline-none transition-all font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Troco a Devolver</p>
                    <h3 className="text-3xl font-black text-emerald-700">
                      {form.amountPaid > currentTotal ? formatCurrency(form.amountPaid - currentTotal) : 'R$ 0,00'}
                    </h3>
                    {form.amountPaid > 0 && form.amountPaid < currentTotal && (
                      <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Ainda faltam {formatCurrency(currentTotal - form.amountPaid)}</p>
                    )}
                  </div>
                </motion.div>
             )}

             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                      <ArrowRightLeft size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900">Empréstimo de Galão</h4>
                      <p className="text-[10px] text-slate-500 font-medium">O cliente não trouxe cascos suficientes? O valor informado será deduzido do estoque de vazios.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qtd. Emprestada</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.borrowedQuantity}
                        onChange={e => setForm({...form, borrowedQuantity: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ano do Galão Emprestado</label>
                      <select 
                        value={form.borrowedBatchYear}
                        onChange={e => setForm({...form, borrowedBatchYear: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                      >
                        {(selectedProduct?.batches || []).map(b => (
                          <option key={b.year} value={b.year}>Ano {b.year}</option>
                        ))}
                      </select>
                  </div>
                  <div className="pb-3 px-2">
                     <p className="text-xs font-medium text-slate-500 italic">
                        {form.borrowedQuantity > 0 
                          ? `${form.borrowedQuantity} casco(s) ficará(ão) pendente(s) de retorno.` 
                          : "Nenhum galão emprestado nesta venda."}
                     </p>
                  </div>
                </div>
             </div>

             <button 
               type="submit"
               className="w-full bg-blue-600 text-white rounded-xl h-[52px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
             >
               Confirmar Venda - {formatCurrency(form.quantity * currentPrice)}
             </button>
          </form>

          {form.paymentMethod === 'pix' && data.pixKey && (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <QRCodeSVG 
                  value={pixPayload} 
                  size={160}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-center text-[10px] font-bold text-slate-400 mt-2">VALOR: {formatCurrency(currentTotal)}</p>
              </div>
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                   <p className="font-bold text-slate-900">Pagamento via PIX</p>
                   <p className="text-sm text-slate-500">O valor de <span className="font-bold text-slate-900">{formatCurrency(currentTotal)}</span> aparecerá automaticamente no banco ao escanear.</p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código Copia e Cola</p>
                   <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 w-full overflow-hidden">
                     <span className="text-xs font-mono text-slate-600 truncate flex-1">{pixPayload}</span>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(pixPayload);
                         alert('Código PIX Copiado!');
                       }}
                       className="text-[10px] font-bold text-blue-600 uppercase hover:underline whitespace-nowrap"
                     >
                       Copiar
                     </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {form.paymentMethod === 'pix' && !data.pixKey && (
            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-amber-800 items-start">
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <p className="font-bold text-sm">Chave PIX não configurada!</p>
                <p className="text-xs">Para exibir o QR Code, configure sua chave Pix no menu de Configurações.</p>
              </div>
            </div>
          )}
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-red-500 font-bold flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {error}
            </motion.p>
          )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Histórico de Vendas</h2>
        </div>
        <div className="flex-1">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase border-b border-slate-50">
                  <th className="px-8 py-5">Data & Hora</th>
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Produto / Validade</th>
                  <th className="px-8 py-5 text-center">Qtd</th>
                  <th className="px-8 py-5">Forma PG</th>
                  <th className="px-8 py-5 text-right">Valor Total</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
                {(data?.sales || []).map(sale => (
                  <tr key={sale.id} className={cn("hover:bg-slate-50 transition-colors", sale.status === 'cancelled' && "opacity-50 grayscale")}>
                    <td className="px-8 py-5">{formatDate(sale.date)}</td>
                    <td className="px-8 py-5 font-medium text-slate-900">{sale.customerName}</td>
                    <td className="px-8 py-5">
                      {sale.productName || 'Galão 20L'} 
                      {sale.batchYear && <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">VAL {sale.batchYear}</span>}
                      {sale.borrowedQuantity && sale.borrowedQuantity > 0 && (
                        <div className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                          <ArrowRightLeft size={10} />
                          LENT: {sale.borrowedQuantity} un. ({sale.borrowedBatchYear})
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">{sale.quantity}</td>
                    <td className="px-8 py-5 capitalize">{sale.paymentMethod || '-'}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">{formatCurrency(sale.amount)}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        sale.status === 'cancelled' 
                          ? "bg-red-100 text-red-700" 
                           : "bg-emerald-100 text-emerald-700"
                      )}>
                        {sale.status === 'cancelled' ? 'Cancelado' : 'Entregue'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {sale.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancelClick(sale.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Estornar / Reembolsar"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-50">
            {(data?.sales || []).map(sale => (
              <div key={sale.id} className={cn("p-4 space-y-3", sale.status === 'cancelled' && "opacity-50 grayscale")}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(sale.date)}</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{sale.customerName}</p>
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
                
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium">
                    {sale.productName || 'Galão 20L'} ({sale.quantity} un.)
                  </p>
                  {sale.batchYear && <p className="text-[9px] text-slate-400 font-bold">Validade: {sale.batchYear}</p>}
                  {sale.borrowedQuantity && sale.borrowedQuantity > 0 && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                      <ArrowRightLeft size={10} /> Emprestado: {sale.borrowedQuantity} un. ({sale.borrowedBatchYear})
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{sale.paymentMethod || '-'}</span>
                    <span className="font-black text-slate-900 text-sm">{formatCurrency(sale.amount)}</span>
                  </div>
                  {sale.status !== 'cancelled' && (
                    <button 
                      onClick={() => handleCancelClick(sale.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <ArrowRightLeft size={10} /> Estornar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(data?.sales || []).length === 0 && (
            <div className="py-20 text-center text-slate-400 italic text-sm">
              Nenhuma venda processada.
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancellingSaleId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Confirmar Estorno</h2>
                <p className="text-sm text-slate-500">Para cancelar esta venda e devolver o produto ao estoque, informe a senha de administrador.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Senha de Segurança</label>
                  <input 
                   type="password" 
                   autoFocus
                   value={adminPassAttempt}
                   onChange={e => setAdminPassAttempt(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && confirmCancel()}
                   className={cn(
                     "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all font-bold text-center tracking-[0.5em]",
                     passError ? "border-red-500 bg-red-50 focus:border-red-600" : "border-slate-200 focus:border-blue-500"
                   )}
                  />
                  {passError && <p className="text-[10px] text-red-500 font-bold text-center">Senha incorreta!</p>}
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => setCancellingSaleId(null)}
                     className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                   >
                     Voltar
                   </button>
                   <button 
                     onClick={confirmCancel}
                     className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                   >
                     Estornar
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
