
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface LoginScreenProps {
  users: User[];
  onLogin: (u: User) => void;
}

export function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username.toLowerCase().trim() && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
              <Droplets size={32} />
           </div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Ponto Certo</h1>
           <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-4">Controle de Águas</p>
           <p className="text-slate-500 text-sm font-medium">Gestão Inteligente de Distribuidora</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Usuário</label>
              <div className="relative">
                 <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="Seu nome de usuário"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Senha</label>
              <div className="relative">
                 <input 
                   type={showPassword ? "text" : "password"} 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className={cn(
                     "w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl outline-none focus:border-blue-500 transition-all font-bold tracking-widest pr-12",
                     error && "border-red-500 bg-red-500/10"
                   )}
                   placeholder="••••"
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                 >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
              </div>
              {error && <p className="text-[10px] text-red-500 font-bold text-center">Usuário ou senha incorretos!</p>}
           </div>

           <button 
             type="submit"
             className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 mt-4"
           >
             Entrar no Painel
           </button>

           {users.length === 1 && users[0].username === 'administrador' && (
              <div className="mt-6 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 text-center space-y-1">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Acesso Padrão Administrador:</p>
                 <div className="flex justify-center gap-4 text-[10px]">
                   <p className="text-slate-400">Usuário: <span className="text-blue-400 font-bold">administrador</span></p>
                   <p className="text-slate-400">Senha: <span className="text-blue-400 font-bold">123</span></p>
                 </div>
              </div>
           )}
        </form>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
           <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Distribuidora de Água</p>
        </div>
      </motion.div>
    </div>
  );
}
