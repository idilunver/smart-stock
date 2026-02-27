import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [], isAdmin = false;

// --- SİSTEM KRİTİK FONKSİYONLARI ---

// 1. Silme İşlemi
window.deleteProduct = async (id) => {
    if(confirm("DİKKAT: Bu ürün envanterden kalıcı olarak silinecek. Onaylıyor musunuz?")) {
        try {
            await deleteDoc(doc(db, "products", id));
        } catch (e) {
            alert("Silme işlemi başarısız: " + e.message);
        }
    }
};

// 2. Düzenleme Modalını Açma
window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Düzenle";
    window.toggleModal();
};

// 3. Grafik Güncelleme (Chart.js)
function updateChart() {
    const ctx = document.getElementById('stockChart')?.getContext('2d');
    if(!ctx) return;
    if(stockChart) stockChart.destroy();
    
    const isDark = document.getElementById('main-body').classList.contains('dark-mode');
    
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{
                label: 'Stok Seviyesi',
                data: allProducts.map(p => p.count),
                backgroundColor: '#6366f1',
                borderRadius: 12,
                barThickness: 25
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { weight: 'bold' } } },
                x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { weight: 'bold' } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- AUTH VE VERİ YÖNETİMİ ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        const snap = await getDoc(doc(db, "users", user.uid));
        isAdmin = snap.exists() && snap.data().role === "admin";
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
    }
    listenData();
});

function listenData() {
    onSnapshot(collection(db, "products"), (snap) => {
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
        renderDashboard();
        renderMarket();
        if(isAdmin) updateChart();
    });
}

// --- ARAYÜZ OLUŞTURMA (RENDER) ---

function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = allProducts.map(item => `
        <tr class="hover:bg-slate-50 transition border-b text-slate-800">
            <td class="p-6">
                <div class="flex items-center space-x-4">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="w-12 h-12 rounded-xl object-cover shadow-sm">
                    <span class="font-bold tracking-tight">${item.name}</span>
                </div>
            </td>
            <td class="p-6 font-black text-indigo-600 italic">₺${(item.price || 0).toLocaleString()}</td>
            <td class="p-6 text-center">
                <div class="flex items-center justify-center space-x-3">
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-slate-200 transition">-</button>` : ''}
                    <span class="font-black w-8 text-sm">${item.count}</span>
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-slate-200 transition">+</button>` : ''}
                </div>
            </td>
            <td class="p-6 text-right admin-only">
                <div class="flex justify-end space-x-4 text-slate-300">
                    <button onclick="window.openEditModal('${item.id}')" class="hover:text-indigo-600 transition"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteProduct('${item.id}')" class="hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>`).join('');
}

function renderMarket() {
    const grid = document.getElementById('page-market');
    grid.innerHTML = allProducts.map(item => `
        <div class="bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div class="overflow-hidden rounded-[1.8rem] mb-6 h-48">
                <img src="${item.imageUrl}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
            </div>
            <h3 class="font-black text-slate-800 text-xl tracking-tight">${item.name}</h3>
            <div class="flex justify-between items-center mt-6">
                <span class="text-2xl font-black text-slate-800 tracking-tighter">₺${item.price}</span>
                <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-indigo-600 transition flex items-center space-x-3">
                    <i class="fas fa-shopping-basket text-sm"></i>
                    <span class="text-xs font-black uppercase tracking-widest">Sepete Ekle</span>
                </button>
            </div>
        </div>`).join('');
}

// --- SEPET SİSTEMİ ---

window.addToCart = (id) => {
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    exist ? exist.qty++ : cart.push({ ...item, qty: 1 });
    renderCart();
    if(!document.getElementById('cart-sidebar').classList.contains('open')) window.toggleCart();
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
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-[1.5rem] border mb-3 text-slate-800">
            <img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover">
            <div class="flex-1">
                <div class="font-bold text-[11px] uppercase tracking-tight">${item.name}</div>
                <div class="flex items-center space-x-3 mt-1">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-6 h-6 bg-white border rounded shadow-sm text-[10px]">-</button>
                    <span class="font-black text-indigo-600 text-xs">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-6 h-6 bg-white border rounded shadow-sm text-[10px]">+</button>
                </div>
            </div>
            <div class="font-black text-xs">₺${(item.qty * item.price).toLocaleString()}</div>
        </div>`).join('');
}

// --- DİĞER FONKSİYONLAR ---

window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    const icon = document.getElementById('mode-icon');
    icon.className = isDark ? 'fas fa-moon text-[10px] text-indigo-400' : 'fas fa-sun text-[10px] text-orange-400';
    if(isAdmin) setTimeout(updateChart, 100); 
};

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden'); m.classList.toggle('flex');
    if(m.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Yeni Ürün Ekle";
        document.getElementById('p-name').value = "";
        document.getElementById('p-price').value = "";
        document.getElementById('p-count').value = "";
        document.getElementById('p-image-url').value = "";
    }
};

window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-bg').classList.toggle('show');
};

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        price: Number(document.getElementById('p-price').value),
        count: Number(document.getElementById('p-count').value),
        imageUrl: document.getElementById('p-image-url').value
    };
    try {
        id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
        window.toggleModal();
    } catch (e) { alert("Hata: " + e.message); }
};

window.updateStock = async (id, change) => {
    const item = allProducts.find(p => p.id === id);
    await updateDoc(doc(db, "products", id), { count: Math.max(0, item.count + change) });
};

window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
    document.getElementById('page-title').innerText = p === 'dashboard' ? 'Envanter Paneli' : 'Market';
};

document.getElementById('login-btn').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value);
};
document.getElementById('logout-btn').onclick = () => signOut(auth);