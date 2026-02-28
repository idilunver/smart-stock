import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, LogOut, ShoppingCart, User as UserIcon, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { CartDrawer } from './CartDrawer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LayoutProps {
    children: React.ReactNode;
    activePage: 'dashboard' | 'market' | 'blog';
    onPageChange: (page: 'dashboard' | 'market' | 'blog') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onPageChange }) => {
    const { user } = useAuth();
    const { count } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-espresso-900 text-crema p-8 flex flex-col h-screen fixed left-0 top-0 z-50">
                <div className="flex items-center space-x-3 mb-12 px-2">
                    <div className="w-12 h-12 bg-caramel rounded-[1.2rem] flex items-center justify-center font-black italic text-2xl shadow-lg shadow-caramel/20">S</div>
                    <h1 className="text-2xl font-black italic tracking-tighter">SmartStock</h1>
                </div>

                <nav className="flex-1 space-y-3">
                    <button
                        onClick={() => onPageChange('dashboard')}
                        className={cn(
                            "flex items-center space-x-4 p-5 rounded-3xl w-full text-left transition-all duration-300 group",
                            activePage === 'dashboard' ? "bg-caramel text-white shadow-xl shadow-caramel/20" : "text-espresso-300 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <LayoutDashboard size={22} className={cn("transition-transform duration-300", activePage === 'dashboard' ? "scale-110" : "group-hover:scale-110")} />
                        <span className="font-black uppercase tracking-widest text-xs">Mağaza Paneli</span>
                    </button>

                    <button
                        onClick={() => onPageChange('market')}
                        className={cn(
                            "flex items-center space-x-4 p-5 rounded-3xl w-full text-left transition-all duration-300 group",
                            activePage === 'market' ? "bg-caramel text-white shadow-xl shadow-caramel/20" : "text-espresso-300 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <ShoppingBag size={22} className={cn("transition-transform duration-300", activePage === 'market' ? "scale-110" : "group-hover:scale-110")} />
                        <span className="font-black uppercase tracking-widest text-xs">Market</span>
                    </button>

                    <button
                        onClick={() => onPageChange('blog')}
                        className={cn(
                            "flex items-center space-x-4 p-5 rounded-3xl w-full text-left transition-all duration-300 group",
                            activePage === 'blog' ? "bg-caramel text-white shadow-xl shadow-caramel/20" : "text-espresso-300 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <BookOpen size={22} className={cn("transition-transform duration-300", activePage === 'blog' ? "scale-110" : "group-hover:scale-110")} />
                        <span className="font-black uppercase tracking-widest text-xs">Blog</span>
                    </button>
                </nav>

                <div className="mt-auto space-y-6">
                    <div className="bg-white/5 p-4 rounded-3xl flex items-center space-x-3 border border-white/5">
                        <div className="w-10 h-10 bg-espresso-800 rounded-2xl flex items-center justify-center border border-white/10">
                            <UserIcon size={18} className="text-espresso-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-espresso-500 uppercase tracking-widest">Barista</p>
                            <p className="text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut(auth)}
                        className="flex items-center space-x-4 p-5 rounded-3xl text-red-400 hover:bg-red-500/10 w-full font-black uppercase tracking-widest text-xs transition-all duration-300"
                    >
                        <LogOut size={22} />
                        <span>Vardiyayı Bitir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 ml-72 min-h-screen">
                <header className="h-24 bg-crema/80 backdrop-blur-md border-b border-espresso-100 flex justify-between items-center px-12 sticky top-0 z-40">
                    <div>
                        <p className="text-[10px] font-black text-espresso-400 uppercase tracking-[0.2em] mb-1">
                            {activePage === 'dashboard' ? 'Mağaza Paneli' : activePage === 'blog' ? 'Haberler & Notlar' : 'Ürün Galerisi'}
                        </p>
                        <h2 className="text-xl font-black text-espresso-800 tracking-tight">
                            {activePage === 'dashboard' ? 'Stok Yönetimi' : activePage === 'blog' ? 'Kahve Notları' : 'Taze Seçenekler'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-4 bg-espresso-50 rounded-[1.2rem] text-espresso-700 hover:bg-crema hover:text-caramel transition-all duration-300 shadow-sm group border border-espresso-100"
                        >
                            <ShoppingCart size={22} className="group-hover:scale-110 transition-transform duration-300" />
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-caramel text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-crema animate-in zoom-in duration-300">
                                    {count}
                                </span>
                            )}
                        </button>

                    </div>
                </header>

                <main className="p-12 flex-1">
                    {children}
                </main>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};
