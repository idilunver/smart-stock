import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Tag, DollarSign, Package, Coffee } from 'lucide-react';
import type { Product } from '../contexts/CartContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        count: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                price: product.price.toString(),
                count: product.count.toString(),
                imageUrl: product.imageUrl || ''
            });
        } else {
            setFormData({ name: '', price: '', count: '', imageUrl: '' });
        }
    }, [product, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            name: formData.name,
            price: Number(formData.price),
            count: Number(formData.count),
            imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=800'
        };

        try {
            if (product) {
                await updateDoc(doc(db, "products", product.id), data);
                toast.success('Ürün güncellendi!', {
                    style: { borderRadius: '1rem', background: '#3d3730', color: '#fff' }
                });
            } else {
                await addDoc(collection(db, "products"), data);
                toast.success('Mağazaya yeni ürün eklendi!', {
                    style: { borderRadius: '1rem', background: '#c68e5a', color: '#fff' }
                });
            }
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Bağlantı hatası: Kayıt yapılamadı.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-espresso-950/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="bg-crema w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                <div className="p-12 border-b border-espresso-100 flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-latte text-caramel rounded-3xl">
                            <Coffee size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-espresso-300 uppercase tracking-[0.2em] mb-1">Envanter Formu</p>
                            <h2 className="text-3xl font-black text-espresso-900 tracking-tighter">
                                {product ? 'Reçeteyi Güncelle' : 'Yeni Ürün Ekle'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-espresso-50 rounded-2xl transition-all duration-300 text-espresso-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-10">
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Tag size={14} className="text-caramel" /> Ürün İsmi
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Örn: Espresso Blend No.1"
                                className="w-full bg-white border border-espresso-100 p-6 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-8 focus:ring-caramel/5 transition-all duration-300 font-bold text-espresso-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <DollarSign size={14} className="text-caramel" /> Fiyat (₺)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-white border border-espresso-100 p-6 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-8 focus:ring-caramel/5 transition-all duration-300 font-bold text-espresso-900"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <Package size={14} className="text-caramel" /> Stok Adedi
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.count}
                                    onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-white border border-espresso-100 p-6 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-8 focus:ring-caramel/5 transition-all duration-300 font-bold text-espresso-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-espresso-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <ImageIcon size={14} className="text-caramel" /> Görsel URL
                            </label>
                            <input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-white border border-espresso-100 p-6 rounded-[1.5rem] outline-none focus:border-caramel focus:ring-8 focus:ring-caramel/5 transition-all duration-300 font-bold text-espresso-900"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-espresso-900 text-crema py-7 rounded-[2rem] font-black shadow-2xl shadow-espresso-950/20 hover:bg-caramel transition-all duration-500 flex items-center justify-center space-x-4 active:scale-[0.98] disabled:opacity-50 group"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="uppercase tracking-[0.2em] text-xs">Değişiklikleri Kaydet</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
