import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [], isAdmin = false;

// --- MODAL VE ÜRÜN YÖNETİMİ ---

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden');
    // Kapatıldığında formu temizle
    if(m.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Yeni Ürün Ekle";
        document.getElementById('delete-btn-modal').classList.add('hidden');
        ['p-name', 'p-price', 'p-count', 'p-image-url'].forEach(id => document.getElementById(id).value = "");
    }
};

window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    if(!item) return;
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Düzenle";
    document.getElementById('delete-btn-modal').classList.remove('hidden'); // Düzenlerken silme butonu çıksın
    window.toggleModal();
};

document.getElementById('delete-btn-modal').onclick = async () => {
    const id = document.getElementById('p-id').value;
    if(id && confirm("DİKKAT: Bu ürün envanterden kalıcı olarak silinecek. Onaylıyor musunuz?")) {
        await deleteDoc(doc(db, "products", id));
        window.toggleModal();
    }
};

// --- CHART SİSTEMİ ---

function updateChart() {
    const canvas = document.getElementById('stockChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(stockChart) stockChart.destroy();
    
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{
                label: 'Mevcut Stok',
                data: allProducts.map(p => p.count),
                backgroundColor: '#6366f1',
                borderRadius: 8,
                barThickness: 20
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- AUTH VE VERİ DİNLEME (Admin/User Ayrımı) ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        // Koleksiyonun "users" olduğunu ve doküman ID'sinin User UID olduğunu doğruluyoruz
        const userSnap = await getDoc(doc(db, "users", user.uid));
        isAdmin = userSnap.exists() && userSnap.data().role === "admin";
        
        // Admin elementlerini göster/gizle
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
        listenData();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
    }
});

function listenData() {
    onSnapshot(collection(db, "products"), (snap) => {
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
        renderAll();
    });
}

function renderAll() {
    // 1. Yönetim Tablosu (Kalem İkonlu)
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = allProducts.map(item => `
        <tr class="hover:bg-slate-50 transition border-b text-slate-800">
            <td class="p-6 flex items-center space-x-4">
                <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="w-12 h-12 rounded-xl object-cover shadow-sm">
                <span class="font-bold tracking-tight">${item.name}</span>
            </td>
            <td class="p-6 font-black text-indigo-600 italic">₺${item.price}</td>
            <td class="p-6 text-center">
                <div class="flex items-center justify-center space-x-2">
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-7 h-7 bg-slate-100 rounded-lg hover:bg-slate-200">-</button>` : ''}
                    <span class="font-black w-8 text-sm">${item.count}</span>
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-7 h-7 bg-slate-100 rounded-lg hover:bg-slate-200">+</button>` : ''}
                </div>
            </td>
            <td class="p-6 text-right admin-only">
                <button onclick="window.openEditModal('${item.id}')" class="text-slate-300 hover:text-indigo-600 transition text-lg">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>`).join('');

    // 2. Market Kartları (İkonlu Buton)
    const marketGrid = document.getElementById('page-market');
    marketGrid.innerHTML = allProducts.map(item => `
        <div class="bg-white p-6 rounded-[2.5rem] border shadow-sm group">
            <div class="overflow-hidden rounded-[1.8rem] mb-6 h-48 bg-slate-100">
                <img src="${item.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="font-black text-slate-800 text-lg tracking-tight">${item.name}</h3>
            <div class="flex justify-between items-center mt-6">
                <span class="text-2xl font-black text-slate-800 tracking-tighter">₺${item.price}</span>
                <button onclick="window.addToCart('${item.id}')" class="bg-indigo-600 text-white px-5 py-3 rounded-2xl hover:bg-slate-900 transition flex items-center space-x-3">
                    <i class="fas fa-cart-plus text-sm"></i>
                    <span class="text-xs font-black uppercase tracking-widest">Sepete Ekle</span>
                </button>
            </div>
        </div>`).join('');
    
    if(isAdmin) updateChart();
}

// --- SEPET VE DİĞER FONKSİYONLAR ---

window.addToCart = (id) => {
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    exist ? exist.qty++ : cart.push({ ...item, qty: 1 });
    renderCart();
    // Sepete ekleyince paneli aç
    document.getElementById('cart-sidebar').classList.add('open');
};

window.changeCartQty = (id, change) => {
    const item = cart.find(c => c.id === id);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    renderCart();
};

function renderCart() {
    const total = cart.reduce((sum, i) => sum + (i.qty * i.price), 0);
    document.getElementById('cart-count').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('cart-total-price').innerText = "₺" + total.toLocaleString();
    
    document.getElementById('cart-items').innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border mb-2">
            <img src="${item.imageUrl}" class="w-10 h-10 rounded-lg object-cover">
            <div class="flex-1">
                <p class="text-[11px] font-black uppercase text-slate-500">${item.name}</p>
                <div class="flex items-center space-x-3 mt-1">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-5 h-5 bg-white border rounded text-[10px] shadow-sm">-</button>
                    <span class="text-xs font-bold text-indigo-600">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-5 h-5 bg-white border rounded text-[10px] shadow-sm">+</button>
                </div>
            </div>
            <div class="text-xs font-black italic">₺${item.qty * item.price}</div>
        </div>`).join('');
}

window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('open');

window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    document.getElementById('mode-icon').className = isDark ? 'fas fa-moon text-[10px] text-indigo-400' : 'fas fa-sun text-[10px] text-orange-400';
    if(isAdmin) setTimeout(updateChart, 100);
};

window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
    document.getElementById('page-title').innerText = p === 'dashboard' ? 'Envanter Paneli' : 'Market';
};

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        price: Number(document.getElementById('p-price').value),
        count: Number(document.getElementById('p-count').value),
        imageUrl: document.getElementById('p-image-url').value
    };
    id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
    window.toggleModal();
};

window.updateStock = async (id, change) => {
    const item = allProducts.find(p => p.id === id);
    await updateDoc(doc(db, "products", id), { count: Math.max(0, Number(item.count) + change) });
};

document.getElementById('login-btn').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value);
};
document.getElementById('logout-btn').onclick = () => signOut(auth);