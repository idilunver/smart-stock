import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [];

// --- ARAYÜZ KONTROLLERİ ---
window.showPage = (page) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', page !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', page !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', page === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', page === 'market');
    document.getElementById('page-title').innerText = page === 'dashboard' ? 'Yönetim Paneli' : 'Coffee Market';
    if(page === 'market') renderMarket();
};

window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-bg').classList.toggle('show');
};

window.toggleDarkMode = () => document.getElementById('main-body').classList.toggle('dark-mode');

window.toggleModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.toggle('hidden'); modal.classList.toggle('flex');
    if(modal.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('p-name').value = "";
        document.getElementById('p-price').value = "";
        document.getElementById('p-count').value = "";
        document.getElementById('p-date').value = "";
        document.getElementById('p-image-url').value = "";
    }
};

// --- AUTH (GİRİŞ) SİSTEMİ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        listenData(user.uid);
    } else {
        // Kullanıcı giriş yapmamışsa marketi görmeye devam edebilir
        // Ancak işlem yapmak istediğinde auth-screen açılacak (Bkz: addToCart)
    }
});

document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Giriş başarısız, lütfen bilgileri kontrol et."));
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- VERİ DİNLEME ---
function listenData(userId) {
    const q = query(collection(db, "products"), where("userId", "==", userId));
    onSnapshot(q, (snapshot) => {
        allProducts = [];
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
        renderDashboard();
        if(!document.getElementById('page-market').classList.contains('hidden')) renderMarket();
        updateChart();
    });
}

// --- YÖNETİM PANELİ RENDER ---
function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    document.getElementById('total-items').innerText = allProducts.length;

    allProducts.forEach(item => {
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition group border-b border-slate-50 last:border-none">
                <td class="p-4 flex items-center space-x-4">
                    <img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover shadow-sm" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'">
                    <span class="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition" onclick="window.openEditModal('${item.id}')">${item.name}</span>
                </td>
                <td class="p-6">
                    <div class="text-sm font-black text-indigo-500">₺${item.price || 0}</div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Birim Fiyat</div>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-3">
                        <button onclick="window.updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-red-100 transition">-</button>
                        <span class="font-black text-slate-800 w-6">${item.count}</span>
                        <button onclick="window.updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-emerald-100 transition">+</button>
                    </div>
                </td>
                <td class="p-6 text-right">
                    <button onclick="window.deleteProduct('${item.id}')" class="text-slate-200 hover:text-red-500 transition px-4"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    });
}

// --- MARKET RENDER ---
function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500">
                <img src="${item.imageUrl}" class="w-full h-48 object-cover rounded-[1.8rem] mb-6 group-hover:scale-105 transition duration-500">
                <h3 class="font-black text-slate-800 text-xl mb-1">${item.name}</h3>
                <p class="text-slate-400 text-xs mb-8">Özel kavrulmuş taze çekirdekler.</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-black text-slate-800">₺${item.price || 0}</span>
                    <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white px-6 py-3.5 rounded-2xl hover:bg-indigo-600 transition shadow-xl flex items-center space-x-2">
                        <i class="fas fa-cart-plus"></i>
                        <span class="font-bold text-sm">Sepete Ekle</span>
                    </button>
                </div>
            </div>`;
    });
}

// --- SEPET MANTIĞI ---
window.addToCart = (id) => {
    // Giriş Kontrolü
    if(!auth.currentUser) {
        document.getElementById('auth-screen').classList.remove('hidden');
        return;
    }
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({ ...item, qty: 1 });
    renderCart();
    if(!document.getElementById('cart-sidebar').classList.contains('open')) window.toggleCart();
};

function renderCart() {
    const cartDiv = document.getElementById('cart-items');
    const totalQty = document.getElementById('cart-count');
    const totalPrice = document.getElementById('cart-total-price');
    
    const qty = cart.reduce((sum, i) => sum + i.qty, 0);
    const total = cart.reduce((sum, i) => sum + (i.qty * (i.price || 0)), 0);
    
    totalQty.innerText = qty;
    totalPrice.innerText = "₺" + total.toFixed(2);
    
    if(cart.length === 0) {
        cartDiv.innerHTML = '<div class="text-center py-20 text-slate-300 font-bold uppercase text-xs tracking-widest">Sepetiniz Boş</div>';
        return;
    }

    cartDiv.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 transition-all">
            <img src="${item.imageUrl}" class="w-16 h-16 rounded-2xl object-cover">
            <div class="flex-1">
                <h4 class="font-black text-slate-800 text-sm leading-tight">${item.name}</h4>
                <div class="flex items-center space-x-3 mt-2">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-7 h-7 bg-white rounded-lg shadow-sm font-bold text-xs">-</button>
                    <span class="font-black text-indigo-600 text-sm">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-7 h-7 bg-white rounded-lg shadow-sm font-bold text-xs">+</button>
                </div>
            </div>
            <div class="text-right">
                <div class="font-black text-slate-800 text-xs tracking-tighter">₺${(item.qty * (item.price || 0)).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

window.changeCartQty = (id, change) => {
    const item = cart.find(c => c.id === id);
    item.qty += change;
    if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
    renderCart();
};

// --- ÜRÜN İŞLEMLERİ (CRUD) ---
window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price || "";
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-date').value = item.expiryDate || "";
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Güncelle";
    window.toggleModal();
};

document.getElementById('save-btn').onclick = async () => {
    if(!auth.currentUser) return;
    const id = document.getElementById('p-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        price: Number(document.getElementById('p-price').value),
        count: Number(document.getElementById('p-count').value),
        expiryDate: document.getElementById('p-date').value,
        imageUrl: document.getElementById('p-image-url').value,
        userId: auth.currentUser.uid
    };
    id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
    window.toggleModal();
};

window.updateStock = async (id, change) => {
    const item = allProducts.find(p => p.id === id);
    const next = item.count + change;
    if(next >= 0) await updateDoc(doc(db, "products", id), { count: next });
};

window.deleteProduct = async (id) => { if(confirm("Ürünü silmek istediğine emin misin?")) await deleteDoc(doc(db, "products", id)); };

// --- GRAFİK ---
function updateChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Mevcut Stok', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 12, barThickness: 20 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
    });
}