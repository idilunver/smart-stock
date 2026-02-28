import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';

export interface Product {
    id: string;
    name: string;
    price: number;
    count: number;
    imageUrl: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        if ((product.count ?? 0) <= 0) {
            toast.error('Bu ürün tükendi!', {
                style: { borderRadius: '1rem', background: '#ef4444', color: '#fff', fontWeight: 'bold' }
            });
            return;
        }

        setItems(current => {
            const existing = current.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= (product.count ?? 0)) {
                    toast.error('Stokta daha fazla ürün yok!', {
                        style: { borderRadius: '1rem', background: '#f59e0b', color: '#fff', fontWeight: 'bold' }
                    });
                    return current;
                }
                toast.success(`${product.name} sayısı artırıldı!`, {
                    style: { borderRadius: '1rem', background: '#1e293b', color: '#fff', fontWeight: 'bold' }
                });
                return current.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            toast.success(`${product.name} sepete eklendi!`, {
                style: { borderRadius: '1rem', background: '#1e293b', color: '#fff', fontWeight: 'bold' }
            });
            return [...current, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(current => current.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const item = items.find(i => i.id === productId);
        if (!item) return;

        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        if (quantity > (item.count ?? 0)) {
            toast.error('Stok miktarını aşamazsınız!', {
                style: { borderRadius: '1rem', background: '#f59e0b', color: '#fff', fontWeight: 'bold' }
            });
            return;
        }

        setItems(current =>
            current.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, count }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
