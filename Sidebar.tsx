
import React from 'react';
import { Droplets, LayoutDashboard, Tag, Package, ShoppingCart, Users, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { SidebarItem } from './ui/SidebarItem';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  currentUser: User;
  isAdmin: boolean;
  isSyncing: boolean;
  handleLogout: () => void;
}

export function Sidebar({ 
  activeView, 
  setActiveView, 
  setIsSidebarOpen, 
  isSidebarOpen, 
  currentUser, 
  isAdmin, 
  isSyncing, 
  handleLogout 
}: SidebarProps) {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0 h-full",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
          <Droplets size={24} />
        </div>
        <h1 className="font-bold text-white tracking-tight text-sm leading-tight">
          Ponto Certo<br/>
          <span className="text-xs font-medium text-slate-400">Distribuidora</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={activeView === 'dashboard'} 
          onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} 
        />
        {isAdmin && (
          <SidebarItem 
            icon={<Tag size={20} />} 
            label="Produtos" 
            active={activeView === 'products'} 
            onClick={() => { setActiveView('products'); setIsSidebarOpen(false); }} 
          />
        )}
        <SidebarItem 
          icon={<Package size={20} />} 
          label="Estoque" 
          active={activeView === 'inventory'} 
          onClick={() => { setActiveView('inventory'); setIsSidebarOpen(false); }} 
        />
        <SidebarItem 
          icon={<ShoppingCart size={20} />} 
          label="Vendas" 
          active={activeView === 'sales'} 
          onClick={() => { setActiveView('sales'); setIsSidebarOpen(false); }} 
        />
        <SidebarItem 
          icon={<Users size={20} />} 
          label="Clientes" 
          active={activeView === 'customers'} 
          onClick={() => { setActiveView('customers'); setIsSidebarOpen(false); }} 
        />
      </nav>

      <div className="px-6 py-2">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-slate-800/50",
          isSyncing ? "text-blue-400" : "text-slate-500"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-blue-500 animate-pulse" : "bg-emerald-500")} />
          {isSyncing ? "Sincronizando..." : "Nuvem Ativa"}
        </div>
      </div>

      <div className="p-6 mt-auto">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700">
             <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                <UserIcon size={16} />
             </div>
             <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">{currentUser.name}</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider">{currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium"
          >
            <LogOut size={14} />
            Sair do Sistema
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="p-4 border-t border-slate-800">
           <SidebarItem 
            icon={<Settings size={20} />} 
            label="Configurações" 
            active={activeView === 'settings'} 
            onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} 
          />
        </div>
      )}
    </aside>
  );
}
