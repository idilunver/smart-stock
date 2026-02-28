import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../contexts/CartContext';
import { Search } from 'lucide-react';

export const MarketPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];
            setProducts(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-r-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-espresso-300 group-focus-within:text-caramel transition-colors" size={22} />
                        <input
                            type="text"
                            placeholder="Taze kavrulmuş seçenekleri keşfedin..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-espresso-100 pl-16 pr-8 py-6 rounded-[2rem] outline-none focus:border-caramel focus:ring-8 focus:ring-caramel/5 transition-all duration-500 font-medium placeholder:text-espresso-300 text-lg shadow-sm shadow-caramel/5"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <p className="text-lg font-medium">Aradığınız kriterlere uygun ürün bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
