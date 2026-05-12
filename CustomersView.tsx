
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';
import { AppData, Customer } from '../types';

interface CustomersViewProps {
  data: AppData;
  addCustomer: (c: Customer) => void;
  editCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  isAdmin: boolean;
}

export function CustomersView({ data, addCustomer, editCustomer, deleteCustomer, isAdmin }: CustomersViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    if (editingId) {
      const customer = data.customers.find(c => c.id === editingId);
      if (customer) {
        editCustomer({
          ...customer,
          ...form
        });
      }
      setEditingId(null);
    } else {
      const newCustomer: Customer = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      };
      addCustomer(newCustomer);
    }

    setForm({ name: '', phone: '', address: '' });
  };

  const startEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, address: c.address || '' });
    setEditingId(c.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-900 mb-6">{editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
          <form onSubmit={handleAdd} className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                   <input 
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone / WhatsApp</label>
                   <input 
                    type="text" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço de Entrega</label>
                <textarea 
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                />
             </div>
             <div className="flex gap-4">
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => { setEditingId(null); setForm({ name: '', phone: '', address: '' }); }}
                    className="text-slate-500 font-bold px-4"
                  >
                    Cancelar
                  </button>
                )}
             </div>
          </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {(data?.customers || []).map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
             <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => startEdit(customer)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                  <Pencil size={16} />
                </button>
                {isAdmin && (
                  <button onClick={() => deleteCustomer(customer.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
             </div>
             <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xl">
                  {customer.name[0]}
                </div>
             </div>
             <h4 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h4>
             <p className="text-blue-600 font-medium text-sm mb-4">{customer.phone}</p>
             <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Endereço</p>
                <p className="text-sm text-slate-600 line-clamp-2">{customer.address || 'Não informado'}</p>
             </div>
          </div>
        ))}
        {(data?.customers || []).length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">
             Nenhum cliente cadastrado.
          </div>
        )}
      </div>
    </motion.div>
  );
}
