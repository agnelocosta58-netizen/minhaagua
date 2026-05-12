
import { useState, useEffect, useMemo } from 'react';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { 
  AppData, 
  Product, 
  Customer, 
  Sale, 
  User, 
  BottleReturn 
} from './types';
import { supabase } from './lib/supabase';
import { generateId } from './lib/idUtils';
import { motion } from 'motion/react';

// Components
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { CustomersView } from './components/CustomersView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';

const INITIAL_DATA: AppData = {
  products: [],
  customers: [],
  sales: [],
  inventory: { full: 0, empty: 0, totalCap: 500 },
  unitPrice: 15.00,
  pixKey: '',
  pixName: '',
  pixCity: '',
  adminPassword: '123',
  bottleReturns: [],
  users: [
    { id: 'admin-1', name: 'Administrador', username: 'administrador', password: '123', role: 'admin' }
  ]
};

function App() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'inventory' | 'sales' | 'customers' | 'settings'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Stats Calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = (data.sales || []).filter(s => s.status !== 'cancelled' && s.date >= today.getTime());
    const totalFull = (data.products || []).reduce((acc, p) => acc + (p.batches || []).reduce((sum, b) => sum + b.full, 0), 0);
    const totalBorrowed = (data.sales || []).filter(s => s.status !== 'cancelled').reduce((acc, s) => acc + (s.borrowedQuantity || 0), 0) - (data.bottleReturns || []).reduce((acc, r) => acc + (r.quantity || 0), 0);

    return {
      todayRevenue: todaySales.reduce((acc, s) => acc + s.amount, 0),
      todayGallons: todaySales.reduce((acc, s) => acc + s.quantity, 0),
      totalFull,
      totalBorrowed: Math.max(0, totalBorrowed),
      stockLevel: (totalFull / (data.inventory.totalCap || 500)) * 100,
      lowStock: totalFull < 10
    };
  }, [data]);

  // Supabase Sync
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        const saved = localStorage.getItem('aguadb');
        if (saved) {
          try {
            setData(JSON.parse(saved));
          } catch(e) {
            console.error("Erro ao carregar dados locais");
          }
        }
        return;
      }

      setIsSyncing(true);
      try {
        const [pRes, cRes, sRes, bRes, setRes] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('customers').select('*').order('name'),
          supabase.from('sales').select('*').order('date', { ascending: false }),
          supabase.from('bottleReturns').select('*').order('date', { ascending: false }),
          supabase.from('app_settings').select('config').eq('id', 'main').single()
        ]);

        const products = (pRes.data || []).map(p => ({
          ...p,
          batches: p.batches || []
        }));

        setData(prev => ({
          ...prev,
          products,
          customers: cRes.data || [],
          sales: sRes.data || [],
          bottleReturns: bRes.data || [],
          ...(setRes.data?.config || {})
        }));
      } catch (error) {
        console.error("Erro Supabase:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchData();

    if (supabase) {
      const pSub = supabase.channel('p-changes').on('postgres_changes' as any, { event: '*', table: 'products' }, fetchData).subscribe();
      const cSub = supabase.channel('c-changes').on('postgres_changes' as any, { event: '*', table: 'customers' }, fetchData).subscribe();
      const sSub = supabase.channel('s-changes').on('postgres_changes' as any, { event: '*', table: 'sales' }, fetchData).subscribe();
      const bSub = supabase.channel('b-changes').on('postgres_changes' as any, { event: '*', table: 'bottleReturns' }, fetchData).subscribe();
      const setSub = supabase.channel('set-changes').on('postgres_changes' as any, { event: '*', table: 'app_settings' }, fetchData).subscribe();

      return () => {
        pSub.unsubscribe();
        cSub.unsubscribe();
        sSub.unsubscribe();
        bSub.unsubscribe();
        setSub.unsubscribe();
      };
    }
  }, []);

  // Persist local if no supabase
  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('aguadb', JSON.stringify(data));
    } else {
      // Sync settings only if changed significantly (throttled/debounced in real apps)
      const saveSettings = async () => {
        const config = {
          pixKey: data.pixKey,
          pixName: data.pixName,
          pixCity: data.pixCity,
          adminPassword: data.adminPassword,
          inventory: data.inventory,
          users: data.users
        };
        await supabase.from('app_settings').upsert({ id: 'main', config });
      };
      const timeout = setTimeout(saveSettings, 2000);
      return () => clearTimeout(timeout);
    }
  }, [data.pixKey, data.pixName, data.pixCity, data.adminPassword, data.inventory, data.users]);

  // Global Readiness test for Firebase (if used, here used Supabase)
  // But contextually the user asked for Firebase skill instructions too.
  // I will stick to Supabase as it is already implemented.

  // Actions
  const addSale = async (sale: Omit<Sale, 'id' | 'date' | 'status'>) => {
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      date: Date.now(),
      status: 'delivered'
    };

    if (supabase) {
       // Update Stock locally first for UI snap
       const product = data.products.find(p => p.id === sale.productId);
       if (product) {
          const updatedBatches = product.batches.map(b => {
             if (b.year === sale.batchYear) {
               return { ...b, full: b.full - sale.quantity };
             }
             if (b.year === sale.borrowedBatchYear && sale.borrowedQuantity && sale.borrowedQuantity > 0) {
                return { ...b, empty: b.empty - sale.borrowedQuantity };
             }
             return b;
          });
          
          await Promise.all([
            supabase.from('products').update({ batches: updatedBatches }).eq('id', product.id),
            supabase.from('sales').insert(newSale)
          ]);
       }
    } else {
      setData(prev => {
        const products = prev.products.map(p => {
          if (p.id === sale.productId) {
            const batches = p.batches.map(b => {
              if (b.year === sale.batchYear) return { ...b, full: b.full - sale.quantity };
              if (b.year === sale.borrowedBatchYear && sale.borrowedQuantity && sale.borrowedQuantity > 0) return { ...b, empty: b.empty - (sale.borrowedQuantity || 0) };
              return b;
            });
            return { ...p, batches };
          }
          return p;
        });
        return { ...prev, sales: [newSale, ...prev.sales].slice(0, 500), products };
      });
    }
    return true;
  };

  const cancelSale = async (id: string) => {
    const sale = data.sales.find(s => s.id === id);
    if (!sale || sale.status === 'cancelled') return;

    if (supabase) {
      const product = data.products.find(p => p.id === sale.productId);
      if (product) {
        const updatedBatches = product.batches.map(b => {
          if (b.year === sale.batchYear) return { ...b, full: b.full + sale.quantity };
          if (b.year === sale.borrowedBatchYear && sale.borrowedQuantity && sale.borrowedQuantity > 0) return { ...b, empty: b.empty + sale.borrowedQuantity };
          return b;
        });
        await Promise.all([
          supabase.from('products').update({ batches: updatedBatches }).eq('id', product.id),
          supabase.from('sales').update({ status: 'cancelled' }).eq('id', id)
        ]);
      }
    } else {
      setData(prev => ({
        ...prev,
        sales: prev.sales.map(s => s.id === id ? { ...s, status: 'cancelled' } : s),
        products: prev.products.map(p => {
          if (p.id === sale.productId) {
             const batches = p.batches.map(b => {
               if (b.year === sale.batchYear) return { ...b, full: b.full + sale.quantity };
               if (b.year === sale.borrowedBatchYear && sale.borrowedQuantity && sale.borrowedQuantity > 0) return { ...b, empty: b.empty + (sale.borrowedQuantity || 0) };
               return b;
             });
             return { ...p, batches };
          }
          return p;
        })
      }));
    }
  };

  const updateInventory = async (productId: string, year: number, amnt: number) => {
    const product = data.products.find(p => p.id === productId);
    if (!product) return;

    let batches = [...(product.batches || [])];
    const idx = batches.findIndex(b => b.year === year);

    if (idx >= 0) {
      const newEmpty = Math.max(0, batches[idx].empty - amnt);
      const addedToFull = amnt - (batches[idx].empty - newEmpty);
      batches[idx] = { ...batches[idx], full: batches[idx].full + amnt, empty: newEmpty };
    } else {
      batches.push({ year, full: amnt, empty: 0 });
    }

    if (supabase) {
      await supabase.from('products').update({ batches }).eq('id', productId);
    } else {
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === productId ? { ...p, batches } : p)
      }));
    }
  };

  const addBottleReturn = async (ret: Omit<BottleReturn, 'id' | 'date'>) => {
    const newRet: BottleReturn = { ...ret, id: generateId(), date: Date.now() };
    const product = data.products.find(p => p.id === ret.productId);
    if (!product) return;

    let batches = [...(product.batches || [])];
    const idx = batches.findIndex(b => b.year === ret.batchYear);
    if (idx >= 0) {
      batches[idx] = { ...batches[idx], empty: batches[idx].empty + ret.quantity };
    } else {
      batches.push({ year: ret.batchYear, full: 0, empty: ret.quantity });
    }

    if (supabase) {
      await Promise.all([
        supabase.from('products').update({ batches }).eq('id', product.id),
        supabase.from('bottleReturns').insert(newRet)
      ]);
    } else {
      setData(prev => ({
        ...prev,
        bottleReturns: [newRet, ...prev.bottleReturns].slice(0, 300),
        products: prev.products.map(p => p.id === product.id ? { ...p, batches } : p)
      }));
    }
  };

  const addProduct = async (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: generateId() };
    if (supabase) {
      const { error } = await supabase.from('products').insert(newProduct);
      return !error;
    } else {
      setData(prev => ({ ...prev, products: [...prev.products, newProduct as Product] }));
      return true;
    }
  };

  const editProduct = async (p: Product) => {
    if (supabase) {
      const { error } = await supabase.from('products').update(p).eq('id', p.id);
      return !error;
    } else {
      setData(prev => ({
        ...prev,
        products: prev.products.map(old => old.id === p.id ? p : old)
      }));
      return true;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Excluir este produto apagará todo seu estoque. Continuar?')) return;
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    } else {
      setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    }
  };

  const addCustomer = async (c: Customer) => {
    if (supabase) {
      await supabase.from('customers').insert(c);
    } else {
      setData(prev => ({ ...prev, customers: [...prev.customers, c] }));
    }
  };

  const editCustomer = async (c: Customer) => {
    if (supabase) {
      await supabase.from('customers').update(c).eq('id', c.id);
    } else {
      setData(prev => ({
        ...prev,
        customers: prev.customers.map(old => old.id === c.id ? c : old)
      }));
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!isAdmin) return;
    if (supabase) {
      await supabase.from('customers').delete().eq('id', id);
    } else {
      setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    }
  };

  const deleteBatch = async (productId: string, year: number) => {
    const product = data.products.find(p => p.id === productId);
    if (!product) return;
    const batches = product.batches.filter(b => b.year !== year);
    if (supabase) {
      await supabase.from('products').update({ batches }).eq('id', productId);
    } else {
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === productId ? { ...p, batches } : p)
      }));
    }
  };

  if (!currentUser) {
    return <LoginScreen users={data.users} onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isSyncing={isSyncing}
        handleLogout={() => { setCurrentUser(null); setActiveView('dashboard'); }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {activeView === 'dashboard' ? 'Overview' : activeView}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Operador Ativo</span>
                <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
             </div>
             <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <UserIcon size={20} />
             </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth overflow-x-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div key="v-dash">
                <DashboardView data={data} stats={stats} />
              </motion.div>
            )}
            {activeView === 'products' && (
              <motion.div key="v-prod">
                <ProductsView 
                  data={data} 
                  addProduct={addProduct}
                  editProduct={editProduct}
                  deleteProduct={deleteProduct}
                />
              </motion.div>
            )}
            {activeView === 'inventory' && (
              <motion.div key="v-inv">
                <InventoryView 
                  data={data} 
                  updateInventory={updateInventory}
                  addBottleReturn={addBottleReturn}
                  deleteBatch={deleteBatch}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}
            {activeView === 'sales' && (
              <motion.div key="v-sale">
                <SalesView 
                  data={data} 
                  addSale={addSale}
                  cancelSale={cancelSale}
                />
              </motion.div>
            )}
            {activeView === 'customers' && (
              <motion.div key="v-cust">
                <CustomersView 
                  data={data} 
                  addCustomer={addCustomer}
                  editCustomer={editCustomer}
                  deleteCustomer={deleteCustomer}
                  isAdmin={isAdmin}
                />
              </motion.div>
            )}
            {activeView === 'settings' && (
              <motion.div key="v-sett">
                <SettingsView 
                  data={data} 
                  setData={setData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
