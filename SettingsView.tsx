
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Settings as SettingsIcon, Package, ShieldCheck, UserPlus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { AppData, User, UserRole } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { generateId } from '../lib/idUtils';

interface SettingsViewProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export function SettingsView({ data, setData }: SettingsViewProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>({ name: '', username: '', password: '', role: 'seller' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const sqlScript = `-- SCRIPT PARA CONFIGURAR O BANCO DE DADOS (SUPABASE)
-- Copie este código e cole no SQL Editor do seu projeto Supabase

-- 1. Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    size TEXT,
    "costPrice" DECIMAL(10,2) DEFAULT 0,
    "retailPrice" DECIMAL(10,2) DEFAULT 0,
    "resalePrice" DECIMAL(10,2) DEFAULT 0,
    batches JSONB DEFAULT '[]'::jsonb,
    stock INTEGER DEFAULT 0,
    "salePrice" DECIMAL(10,2) DEFAULT 0,
    "expiryDate" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    debt DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Vendas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date BIGINT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "productId" UUID REFERENCES public.products(id),
    "productName" TEXT,
    quantity INTEGER DEFAULT 1,
    amount DECIMAL(10,2) DEFAULT 0,
    "paymentMethod" TEXT,
    status TEXT DEFAULT 'delivered',
    "batchYear" INTEGER,
    "borrowedQuantity" INTEGER DEFAULT 0,
    "borrowedBatchYear" INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Devoluções
CREATE TABLE IF NOT EXISTS public."bottleReturns" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date BIGINT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "productId" UUID REFERENCES public.products(id),
    "productName" TEXT,
    "batchYear" INTEGER,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Configurações Gerais
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DESATIVAR RLS (Row Level Security) para uso simplificado
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."bottleReturns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- Ativar Realtime de forma segura
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public."bottleReturns";
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro crítico ao ativar realtime: %', SQLERRM;
END $$;`;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.username || !userForm.password) return;
    
    if (userForm.password !== confirmPassword) {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 3000);
      return;
    }
    
    if (editingUserId) {
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUserId ? { ...userForm, id: u.id } as User : u)
      }));
    } else {
      setData(prev => ({
        ...prev,
        users: [...prev.users, { ...userForm, id: generateId() }]
      }));
    }
    
    setUserForm({ name: '', username: '', password: '', role: 'seller' });
    setConfirmPassword('');
    setShowUserForm(false);
    setEditingUserId(null);
  };

  const startEditUser = (user: User) => {
    setUserForm({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role
    });
    setConfirmPassword(user.password || '');
    setEditingUserId(user.id);
    setShowUserForm(true);
  };

  const deleteUser = (id: string) => {
    if (confirm('Deseja realmente remover este usuário?')) {
      setData(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id)
      }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="space-y-8">
        {/* Cloud Sync Config */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Droplets size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Sincronização em Nuvem (Supabase)</h3>
                <p className="text-xs text-slate-500">Dados salvos automaticamente na nuvem.</p>
              </div>
           </div>

           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status da Conexão</span>
                 <span className={cn(
                   "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                   supabase ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                 )}>
                    {supabase ? 'Conectado' : 'Aguardando Configuração'}
                 </span>
              </div>
              
              {!supabase && (
                  <div className="space-y-3 font-sans">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para ativar a sincronização em nuvem, configure as variáveis de ambiente <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> no menu de configurações da plataforma.
                  </p>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Configuração do Banco</p>
                    <p className="text-[10px] text-blue-600 leading-relaxed">
                      Se você vir o erro <strong>"relation does not exist"</strong>, significa que as tabelas não foram criadas. Clique no botão abaixo para ver o Script SQL que deve ser executado no Supabase.
                    </p>
                    <button 
                      onClick={() => setShowSql(!showSql)}
                      className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all"
                    >
                      {showSql ? 'Ocultar Script SQL' : 'Ver Script SQL para Supabase'}
                    </button>
                    
                    <AnimatePresence>
                      {showSql && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="relative group">
                            <pre className="mt-2 p-3 bg-slate-900 text-blue-400 text-[9px] font-mono leading-tight rounded-lg overflow-x-auto max-h-60 scrollbar-thin scrollbar-thumb-slate-700">
                              {sqlScript}
                            </pre>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(sqlScript);
                                alert('Script SQL copiado com sucesso! Agora cole no SQL Editor do Supabase.');
                              }}
                              className="absolute top-4 right-4 bg-slate-800 text-white px-2 py-1 rounded text-[8px] font-bold hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              COPIAR SCRIPT
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              
              {supabase && (
                <p className="text-xs text-slate-600 italic">
                  Seus dados estão sendo replicados em tempo real para o banco de dados PostgreSQL do Supabase.
                </p>
              )}
           </div>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
         <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-900 border-b pb-2">
               <SettingsIcon size={18} className="text-blue-500" />
               Geral & PIX
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chave PIX</label>
                  <input 
                   type="text" 
                   value={data.pixKey || ''}
                   onChange={e => setData({...data, pixKey: e.target.value})}
                   placeholder="E-mail, CPF, CNPJ ou Telefone"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Esta chave será usada para gerar o QR Code.</p>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Favorecido (Nome)</label>
                  <input 
                   type="text" 
                   value={data.pixName || ''}
                   onChange={e => setData({...data, pixName: e.target.value})}
                   placeholder="Nome que aparece no banco"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cidade</label>
                  <input 
                   type="text" 
                   value={data.pixCity || ''}
                   onChange={e => setData({...data, pixCity: e.target.value})}
                   placeholder="Ex: Sao Paulo"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-red-500">Senha Admin (Segurança)</label>
                  <input 
                   type="text" 
                   value={data.adminPassword || ''}
                   onChange={e => setData({...data, adminPassword: e.target.value})}
                   placeholder="Senha para estornos"
                   className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl outline-none focus:border-red-500 transition-all font-bold text-red-900"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Esta senha será exigida para estornar vendas ou excluir registros sensíveis.</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-900">
               <Package size={18} className="text-blue-500" />
               Capacidade de Armazenamento
            </h3>
            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total de Galões (Capacidade)</label>
               <input 
                type="number" 
                value={data.inventory.totalCap}
                onChange={e => setData({...data, inventory: {...data.inventory, totalCap: Number(e.target.value)}})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold"
               />
            </div>
         </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2 text-slate-900 border-b pb-2">
                  <ShieldCheck size={18} className="text-blue-500" />
                  Gestão de Usuários (Vendedores)
               </h3>
               <button 
                 onClick={() => {
                   if (showUserForm) {
                     setShowUserForm(false);
                     setEditingUserId(null);
                     setUserForm({ name: '', username: '', password: '', role: 'seller' });
                   } else {
                     setShowUserForm(true);
                   }
                 }}
                 className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
               >
                 <UserPlus size={14} />
                 {editingUserId ? 'Cancelar Edição' : 'Novo Vendedor'}
               </button>
            </div>

            {showUserForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddUser}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 overflow-hidden"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nome Completo</label>
                       <input 
                        type="text" 
                        required
                        value={userForm.name}
                        onChange={e => setUserForm({...userForm, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                        placeholder="Nome do vendedor"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nome de Usuário</label>
                       <input 
                        type="text" 
                        required
                        value={userForm.username}
                        onChange={e => setUserForm({...userForm, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-medium"
                        placeholder="ex: joao.silva"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Cargo / Permissões</label>
                       <select 
                        value={userForm.role}
                        onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-bold"
                       >
                          <option value="seller">Vendedor (Restrito)</option>
                          <option value="admin">Administrador (Total)</option>
                       </select>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Senha</label>
                       <div className="relative">
                          <input 
                           type={showPassword ? "text" : "password"} 
                           required
                           value={userForm.password}
                           onChange={e => setUserForm({...userForm, password: e.target.value})}
                           className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-bold"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                          >
                             {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirmar Senha</label>
                       <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-bold",
                          passwordError && "border-red-500 bg-red-50"
                        )}
                       />
                       {passwordError && (
                          <p className="text-[10px] text-red-500 font-bold pl-1 mt-1">As senhas não coincidem!</p>
                       )}
                    </div>
                 </div>
                 <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowUserForm(false);
                        setEditingUserId(null);
                        setUserForm({ name: '', username: '', password: '', role: 'seller' });
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      {editingUserId ? 'Salvar Alterações' : 'Adicionar Usuário'}
                    </button>
                 </div>
              </motion.form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {data.users.map(u => (
                 <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                         u.role === 'admin' ? "bg-slate-900 text-white" : "bg-blue-100 text-blue-600"
                       )}>
                          {u.name[0]}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                             <span className="font-bold">@{u.username}</span>
                             <span>•</span>
                             <span className="capitalize">{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEditUser(u)}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                         <Pencil size={16} />
                      </button>
                      {u.id !== 'admin-1' && (
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                           <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
            <button 
              onClick={() => {
                if(confirm('Tem certeza? Isso apagará TODAS as vendas e clientes.')) {
                   setData({
                     products: [],
                     customers: [],
                     sales: [],
                     inventory: { full: 0, empty: 0, totalCap: 500 },
                     unitPrice: 15.00,
                     pixKey: '',
                     adminPassword: '1234',
                     bottleReturns: [],
                     users: [
                       { id: 'admin-1', name: 'Administrador', username: 'administrador', password: '123', role: 'admin' }
                     ]
                   });
                   localStorage.clear();
                   window.location.reload();
                }
              }}
              className="text-red-500 text-xs font-bold hover:underline"
            >
              Resetar todos os dados
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">Ponto Certo • Controle de Águas</p>
         </div>
      </div>
     </div>
    </motion.div>
  );
}
