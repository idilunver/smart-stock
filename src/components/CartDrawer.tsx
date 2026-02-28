import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { items, updateQuantity, removeFromCart, total } = useCart();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col bg-crema">
                    <div className="p-8 border-b border-espresso-100 flex justify-between items-center bg-white shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-espresso-900 italic tracking-tighter">Siparişiniz</h2>
                            <p className="text-[10px] font-black text-espresso-400 uppercase tracking-widest">Özel Seçkiler</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-espresso-50 rounded-2xl transition-colors text-espresso-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-espresso-300 space-y-4">
                                <div className="p-8 bg-espresso-50 rounded-[2.5rem]">
                                    <ShoppingCart size={48} className="opacity-20" />
                                </div>
                                <p className="font-bold uppercase tracking-widest text-[11px]">Sepetiniz henüz boş</p>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4 p-5 bg-white rounded-3xl border border-espresso-50 shadow-sm hover:shadow-md transition-shadow">
                                    <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-2xl bg-crema" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-espresso-900 truncate tracking-tight">{item.name}</h4>
                                        <p className="text-caramel font-black text-sm mt-1">₺{item.price}</p>

                                        <div className="flex items-center space-x-4 mt-3">
                                            <div className="flex items-center bg-espresso-50 rounded-xl border border-espresso-100 p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:bg-white rounded-lg transition-colors text-espresso-600"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-black text-espresso-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-white rounded-lg transition-colors text-espresso-600"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-400 hover:text-red-600 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="p-8 border-t border-espresso-100 bg-white space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-espresso-400 font-black uppercase tracking-widest text-xs">Toplam Tutar</span>
                                <span className="text-3xl font-black text-espresso-900 tracking-tighter">₺{total}</span>
                            </div>
                            <button className="w-full bg-espresso-800 text-crema py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-caramel transition-all duration-500 shadow-xl shadow-espresso-900/10 active:scale-[0.98]">
                                Siparişi Onayla
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
