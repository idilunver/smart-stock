import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../contexts/CartContext';
import { Edit2, Trash2, AlertTriangle, Package, Coffee, Download, Plus } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { toast } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const AdminPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

    const updateProductStock = async (id: string, change: number) => {
        const product = products.find(p => p.id === id);
        if (product) {
            const newCount = Math.max(0, product.count + change);
            await updateDoc(doc(db, "products", id), { count: newCount });
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Bu ürünü envanterden silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, "products", id));
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const chartData = {
        labels: products.map(p => p.name),
        datasets: [
            {
                label: 'Stok Miktarı',
                data: products.map(p => p.count),
                backgroundColor: '#c68e5a',
                borderRadius: 20,
                hoverBackgroundColor: '#3d3730',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#3d3730',
                padding: 16,
                titleFont: { size: 14, weight: 'bold' as const },
                bodyFont: { size: 13 },
                cornerRadius: 15,
                displayColors: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f8f1e7' },
                ticks: { font: { weight: 'bold' as const, size: 11 }, color: '#a7a195' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold' as const, size: 11 }, color: '#a7a195', maxRotation: 45, minRotation: 45 }
            }
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white p-10 rounded-[4rem] border border-espresso-50 shadow-sm shadow-espresso-900/5">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-[10px] font-black text-espresso-300 uppercase tracking-widest mb-1">Stok Analizi</p>
                            <h3 className="text-2xl font-black text-espresso-900 tracking-tighter">Mevcut Kavrumlar</h3>
                        </div>
                        <div className="p-4 bg-latte text-caramel rounded-3xl">
                            <Coffee size={24} />
                        </div>
                    </div>
                    <div className="h-80">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-espresso-900 p-10 rounded-[4rem] text-crema shadow-[0_20px_40px_-10px_rgba(61,55,48,0.3)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-caramel opacity-10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-20 transition-opacity" />
                        <Package className="mb-6 opacity-30 text-caramel" size={40} />
                        <p className="text-espresso-300 text-[10px] font-black uppercase tracking-widest mb-1">Toplam Çeşit</p>
                        <h4 className="text-5xl font-black italic tracking-tighter">{products.length}</h4>
                    </div>
                    <div className="bg-white p-10 rounded-[4rem] border border-espresso-50 shadow-sm border-l-[12px] border-l-caramel">
                        <AlertTriangle className="text-caramel mb-6" size={40} />
                        <p className="text-espresso-300 text-[10px] font-black uppercase tracking-widest mb-1">Eksik Stok</p>
                        <h4 className="text-5xl font-black text-espresso-900 italic tracking-tighter">
                            {products.filter(p => p.count < 10).length}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-[4rem] border border-espresso-50 shadow-sm overflow-hidden">
                <div className="p-12 border-b flex flex-col md:flex-row justify-between items-center gap-6 bg-crema/20">
                    <div className="flex items-center space-x-4">
                        <div className="w-2 h-8 bg-caramel rounded-full" />
                        <h3 className="text-2xl font-black text-espresso-900 tracking-tighter">Envanter Arşivi</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => {
                                const csvContent = "data:text/csv;charset=utf-8,"
                                    + "Ürün Adı,Fiyat,Stok\n"
                                    + products.map(p => `${p.name},${p.price ?? 0},${p.count ?? 0}`).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", "kahve_stok_raporu.csv");
                                document.body.appendChild(link);
                                link.click();
                                toast.success('Stok raporu hazırlandı!', {
                                    style: { borderRadius: '1rem', background: '#3d3730', color: '#fff', fontWeight: 'bold' }
                                });
                            }}
                            className="text-espresso-500 hover:text-caramel font-black text-[10px] uppercase tracking-[0.2em] flex items-center space-x-3 bg-white px-8 py-5 rounded-[1.5rem] border border-espresso-100 shadow-sm transition-all hover:shadow-lg"
                        >
                            <Download size={16} />
                            <span>Rapor Al</span>
                        </button>
                        <button
                            onClick={openAddModal}
                            className="bg-espresso-800 text-crema px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-espresso-900/10 hover:bg-caramel transition-all flex items-center space-x-3 active:scale-95"
                        >
                            <Plus size={18} />
                            <span>Yeni Ürün</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-espresso-50/30 text-espresso-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-espresso-50">
                            <tr>
                                <th className="p-10">Katalog Detayı</th>
                                <th className="p-10 text-center">Birim Fiyat</th>
                                <th className="p-10 text-center">Stok Adedi</th>
                                <th className="p-10 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-espresso-50">
                            {products.map((item) => (
                                <tr key={item.id} className="hover:bg-crema/40 transition-colors group">
                                    <td className="p-10">
                                        <div className="flex items-center space-x-6">
                                            <div className="relative">
                                                <img src={item.imageUrl} className="w-20 h-20 rounded-[1.8rem] object-cover shadow-md group-hover:scale-110 transition-transform duration-500" />
                                                {item.count < 10 && (
                                                    <div className="absolute -top-3 -right-3 bg-caramel text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-pulse">
                                                        <AlertTriangle size={14} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-espresso-900 tracking-tight text-lg">{item.name}</span>
                                                <span className="text-[10px] font-black text-espresso-300 uppercase tracking-widest mt-1">Sektör: Gurme Kahve</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-10 text-center">
                                        <span className="font-black text-caramel italic text-xl">₺{(item.price ?? 0).toLocaleString()}</span>
                                    </td>
                                    <td className="p-10">
                                        <div className="flex items-center justify-center space-x-5">
                                            <button
                                                onClick={() => updateProductStock(item.id, -1)}
                                                className="w-12 h-12 bg-espresso-50 rounded-2xl flex items-center justify-center text-espresso-400 hover:bg-espresso-900 hover:text-crema transition shadow-sm font-black text-lg"
                                            >
                                                -
                                            </button>
                                            <div className="w-16 h-16 bg-white border border-espresso-100 rounded-[1.2rem] flex items-center justify-center shadow-inner">
                                                <span className={`font-black text-2xl ${(item.count ?? 0) < 10 ? 'text-caramel' : 'text-espresso-800'}`}>
                                                    {item.count}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => updateProductStock(item.id, 1)}
                                                className="w-12 h-12 bg-espresso-50 rounded-2xl flex items-center justify-center text-espresso-400 hover:bg-espresso-900 hover:text-crema transition shadow-sm font-black text-lg"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-10 text-right">
                                        <div className="flex items-center justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-5 bg-latte rounded-2xl text-caramel hover:bg-caramel hover:text-white transition shadow-sm"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(item.id)}
                                                className="p-5 bg-espresso-50 rounded-2xl text-espresso-300 hover:bg-red-500 hover:text-white transition shadow-sm"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
            />
        </div>
    );
};
