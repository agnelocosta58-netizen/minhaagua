
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';
import { AppData, Product } from '../types';
import { formatCurrency } from '../lib/utils';

interface ProductsViewProps {
  data: AppData;
  addProduct: (p: any) => Promise<boolean>;
  editProduct: (p: Product) => Promise<boolean>;
  deleteProduct: (id: string) => void;
}

export function ProductsView({ data, addProduct, editProduct, deleteProduct }: ProductsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    size: '', 
    expiryDate: '', 
    costPrice: 0, 
    retailPrice: 0, 
    resalePrice: 0 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert("Por favor, informe o nome do produto.");
      return;
    }
    if (!form.size) {
      alert("Por favor, informe o tamanho do produto.");
      return;
    }
    if (form.retailPrice <= 0) {
      alert("O valor de venda deve ser maior que zero.");
      return;
    }

    let success = false;
    if (editingId) {
      const product = data.products.find(p => p.id === editingId);
      if (product) {
        success = await editProduct({ 
          ...product, 
          name: form.name, 
          size: form.size, 
          expiryDate: form.expiryDate, 
          costPrice: form.costPrice, 
          retailPrice: form.retailPrice, 
          resalePrice: form.resalePrice 
        });
      }
      if (success) setEditingId(null);
    } else {
      success = await addProduct({ 
        name: form.name, 
        size: form.size, 
        expiryDate: form.expiryDate, 
        costPrice: form.costPrice, 
        retailPrice: form.retailPrice, 
        resalePrice: form.resalePrice, 
        batches: [] 
      });
    }
    
    if (success) {
      setForm({ name: '', size: '', expiryDate: '', costPrice: 0, retailPrice: 0, resalePrice: 0 });
    }
  };

  const startEdit = (p: Product) => {
    setForm({ 
      name: p.name, 
      size: p.size, 
      expiryDate: p.expiryDate || '', 
      costPrice: p.costPrice, 
      retailPrice: p.retailPrice, 
      resalePrice: p.resalePrice 
    });
    setEditingId(p.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-900 mb-6">{editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Ex: Galão 20L"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tamanho</label>
                    <input 
                      type="text" 
                      value={form.size}
                      onChange={e => setForm({...form, size: e.target.value})}
                      placeholder="Ex: 20L ou 500ml"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Validade</label>
                    <input 
                      type="date" 
                      value={form.expiryDate}
                      onChange={e => setForm({...form, expiryDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor de Custo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={form.costPrice === 0 ? '' : form.costPrice}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setForm({...form, costPrice: isNaN(val) ? 0 : val});
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                      />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Varejo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={form.retailPrice === 0 ? '' : form.retailPrice}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setForm({...form, retailPrice: isNaN(val) ? 0 : val});
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                      />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Revenda</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={form.resalePrice === 0 ? '' : form.resalePrice}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setForm({...form, resalePrice: isNaN(val) ? 0 : val});
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                      />
                    </div>
                </div>
             </div>

             <div className="flex gap-2 justify-end">
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => { setEditingId(null); setForm({ name: '', size: '', expiryDate: '', costPrice: 0, retailPrice: 0, resalePrice: 0 }); }}
                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="submit"
                  className="px-8 bg-blue-600 text-white rounded-xl h-[52px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
             </div>
          </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
             <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => startEdit(product)} 
                  className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Produto"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)} 
                  className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Produto"
                >
                  <Trash2 size={16} />
                </button>
             </div>
             <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xl mb-4 text-center">
               {product.name[0]}
             </div>
             <h4 className="text-lg font-bold text-slate-900 mb-0">{product.name}</h4>
             <p className="text-xs text-slate-400 font-medium mb-4">{product.size} {product.expiryDate && `• Val: ${new Date(product.expiryDate).toLocaleDateString('pt-BR')}`}</p>
             
             <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500 font-medium tracking-tight">Varejo:</span>
                   <span className="font-bold text-blue-600">{formatCurrency(product.retailPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500 font-medium tracking-tight">Revenda:</span>
                   <span className="font-bold text-slate-900">{formatCurrency(product.resalePrice)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest pt-1 border-t border-slate-50">
                   <span className="text-slate-400">Custo: {formatCurrency(product.costPrice)}</span>
                   <span className="text-emerald-600">Margem: {formatCurrency(product.retailPrice - product.costPrice)}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cheios</p>
                   <p className="font-bold text-slate-900">{product.batches.reduce((sum, b) => sum + b.full, 0)} un.</p>
                </div>
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Vazios</p>
                   <p className="font-bold text-slate-900">{product.batches.reduce((sum, b) => sum + b.empty, 0)} un.</p>
                </div>
             </div>
             {product.batches.length > 0 && (
               <div className="mt-4 pt-3 border-t border-slate-50 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Validades em Estoque</p>
                  {product.batches.sort((a, b) => a.year - b.year).map(batch => (
                    <div key={batch.year} className="flex justify-between items-center text-[11px]">
                       <span className="text-slate-600 font-medium">Ano {batch.year}:</span>
                       <span className="font-bold text-slate-900">{batch.full} un.</span>
                    </div>
                  ))}
               </div>
             )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
