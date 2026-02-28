import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Layout } from './components/Layout';
import { MarketPage } from './pages/MarketPage';
import { AdminPage } from './pages/AdminPage';
import { BlogPage } from './pages/BlogPage';
import { LogIn, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Toaster } from 'react-hot-toast';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  state = { hasError: false, error: null as any };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 min-h-screen font-sans">
          <h1 className="text-2xl font-black mb-4">Bir Hata Oluştu</h1>
          <p className="mb-4 font-bold text-slate-600">Lütfen tarayıcı konsoluna bakın veya sayfayı yenileyin.</p>
          <pre className="bg-white p-6 rounded-3xl border border-red-100 overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Hatalı e-posta veya şifre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-espresso-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-espresso-800 via-espresso-900 to-black">
      <div className="bg-crema p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-caramel/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-caramel/10 transition-colors" />

        <div className="relative text-center mb-10">
          <div className="w-16 h-16 bg-caramel rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-caramel/20">
            <ShoppingBag className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-espresso-900 italic tracking-tighter mb-2">SmartStock</h1>
          <p className="text-espresso-400 font-bold uppercase tracking-widest text-[10px]">Barista Envanter Ekosistemi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold border border-red-100 text-center animate-in shake duration-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
              <input
                type="email"
                placeholder="barista@coffee.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-espresso-50/50 border border-espresso-100 p-5 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/5 transition-all duration-300 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-1">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-espresso-50/50 border border-espresso-100 p-5 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/5 transition-all duration-300 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-espresso-200 hover:text-espresso-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-espresso-800 text-crema py-5 rounded-[1.5rem] font-black hover:bg-caramel transition-all duration-500 shadow-xl shadow-espresso-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                <span className="uppercase tracking-widest">Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-espresso-400 text-xs font-bold uppercase tracking-widest letter-spacing-widest">
          Kahve aşkıyla yönetilen stoklar.
        </p>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<'dashboard' | 'market' | 'blog'>('market');

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-pulse" />
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 animate-bounce">
            <ShoppingBag className="text-white" size={40} />
          </div>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout
      activePage={activePage}
      onPageChange={setActivePage}
    >
      {activePage === 'dashboard' ? <AdminPage /> : activePage === 'blog' ? <BlogPage /> : <MarketPage />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <Toaster position="bottom-right" />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
