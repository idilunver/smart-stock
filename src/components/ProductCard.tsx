import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProductCardProps {
    product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(product);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group bg-white rounded-[2.5rem] border border-espresso-50 p-6 hover:shadow-[0_32px_64px_-16px_rgba(61,55,48,0.12)] transition-all duration-700 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-latte/30 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-caramel/10 transition-colors duration-700" />

            <div className="relative aspect-square mb-8 overflow-hidden rounded-[2rem] bg-crema group-hover:shadow-2xl transition-all duration-700">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-[2000ms] ease-out"
                />
                {!product.count && (
                    <div className="absolute inset-0 bg-espresso-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <span className="bg-white text-espresso-900 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Tükendi</span>
                    </div>
                )}
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-xl font-black text-espresso-900 tracking-tight leading-snug group-hover:text-caramel transition-colors duration-500">{product.name}</h3>
                    <div className="text-right">
                        <p className="text-2xl font-black text-espresso-900">₺{product.price}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-espresso-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-espresso-400 uppercase tracking-widest">Stok Durumu</span>
                        <span className={cn(
                            "text-xs font-bold",
                            (product.count ?? 0) > 10 ? "text-green-600" : (product.count ?? 0) > 0 ? "text-caramel" : "text-red-500"
                        )}>
                            {(product.count ?? 0) > 0 ? `${product.count} Adet` : 'Tükendi'}
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={!product.count}
                        className={cn(
                            "p-5 rounded-2xl transition-all duration-500 group/btn active:scale-95 shadow-lg",
                            product.count
                                ? "bg-espresso-800 text-crema hover:bg-caramel shadow-espresso-900/10 hover:shadow-caramel/20"
                                : "bg-espresso-50 text-espresso-200 cursor-not-allowed shadow-none"
                        )}
                    >
                        <ShoppingCart size={22} className={cn("transition-transform duration-500", product.count && "group-hover/btn:scale-110")} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
