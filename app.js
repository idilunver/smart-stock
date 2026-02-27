import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [];
let isAdmin = false;

// --- TEMA SWITCH ---
window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    const circle = document.getElementById('toggle-circle');
    const icon = document.getElementById('theme-icon');
    const lightText = document.getElementById('mode-text-light');
    const darkText = document.getElementById('mode-text-dark');
    
    if(isDark) {
        circle.style.transform = "translateX(140%)";
        icon.classList.replace('fa-sun', 'fa-moon');
        icon.classList.replace('text-orange-400', 'text-indigo-400');
        darkText.classList.replace('text-slate-500', 'text-indigo-400');
        lightText.classList.replace('text-orange-400', 'text-slate-500');
    } else {
        circle.style.transform = "translateX(0px)";
        icon.classList.replace('fa-moon', 'fa-sun');
        icon.classList.replace('text-indigo-400', 'text-orange-400');
        lightText.classList.replace('text-slate-500', 'text-orange-400');
        darkText.classList.replace('text-indigo-400', 'text-slate-500');
    }
};

// --- ROL KONTROLÜ ---
async function checkRole(user) {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    isAdmin = (docSnap.exists() && docSnap.data().role === "admin");
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
}

// --- AUTH ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        await checkRole(user);
    } else {
        isAdmin = false;
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    listenData();
});

document.getElementById('login-btn').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value)
    .catch(() => alert("Giriş bilgileri hatalı!"));
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- VERİ DİNLEME ---
function listenData() {
    onSnapshot(collection(db, "products"), (snapshot) => {
        allProducts = [];
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
        renderDashboard();
        renderMarket();
        if(isAdmin) updateChart();
    });
}

// --- YÖNETİM TABLOSU ---
function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    document.getElementById('total-items').innerText = allProducts.length;

    allProducts.forEach(item => {
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="p-6">
                    <div class="flex items-center space-x-4">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="w-12 h-12 rounded-xl object-cover shadow-sm">
                        <span class="font-bold text-slate-800 ${isAdmin ? 'cursor-pointer hover:text-indigo-600' : ''}" 
                              onclick="${isAdmin ? `window.openEditModal('${item.id}')` : ''}">${item.name}</span>
                    </div>
                </td>
                <td class="p-6 text-indigo-600 font-black">₺${(item.price || 0).toLocaleString()}</td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-red-100 transition">-</button>` : ''}
                        <span class="font-black text-slate-800 w-8 text-center">${item.count}</span>
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-lg hover:bg-emerald-100 transition">+</button>` : ''}
                    </div>
                </td>
                <td class="p-6 text-right admin-only">
                    <div class="flex justify-end space-x-4">
                        <button onclick="window.openEditModal('${item.id}')" class="text-slate-300 hover:text-indigo-600 transition"><i class="fas fa-edit"></i></button>
                        <button onclick="window.deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`;
    });
}

// --- MARKET KARTLARI ---
function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500">
                <img src="${item.imageUrl || 'https://via.placeholder.com/300'}" class="w-full h-52 object-cover rounded-[1.8rem] mb-6 shadow-md transition group-hover:scale-105">
                <h3 class="font-black text-slate-800 text-xl mb-1">${item.name}</h3>
                <div class="flex justify-between items-center mt-6">
                    <span class="text-2xl font-black text-slate-800">₺${(item.price || 0).toLocaleString()}</span>
                    <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-indigo-600 transition shadow-lg flex items-center space-x-2">
                        <i class="fas fa-cart-plus"></i> <span class="font-bold text-sm">Sepete Ekle</span>
                    </button>
                </div>
            </div>`;
    });
}

// --- SEPET SİSTEMİ (+/- BUTONLARIYLA) ---
window.addToCart = (id) => {
    if(!auth.currentUser) {
        document.getElementById('auth-msg').innerText = "Satın almak için lütfen giriş yapın.";
        document.getElementById('auth-screen').classList.remove('hidden');
        return;
    }
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
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <img src="${item.imageUrl}" class="w-14 h-14 rounded-xl object-cover shadow-sm">
            <div class="flex-1">
                <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                <div class="flex items-center space-x-3 mt-1">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-6 h-6 bg-white rounded shadow-sm font-bold text-xs">-</button>
                    <span class="font-black text-indigo-600 text-xs">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-6 h-6 bg-white rounded shadow-sm font-bold text-xs">+</button>
                </div>
            </div>
            <div class="text-right font-black text-slate-800 text-xs">₺${(item.qty * item.price).toLocaleString()}</div>
        </div>
    `).join('');
}

// --- MODAL & CRUD ---
window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
    document.getElementById('page-title').innerText = p === 'dashboard' ? 'Envanter Paneli' : 'Gurme Market';
};

window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-bg').classList.toggle('show');
};

window.toggleModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.toggle('hidden'); modal.classList.toggle('flex');
    if(modal.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Yeni Ürün Ekle";
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
    window.toggleModal();
};

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        price: Number(document.getElementById('p-price').value),
        count: Number(document.getElementById('p-count').value),
        imageUrl: document.getElementById('p-image-url').value,
        userId: auth.currentUser.uid
    };
    id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
    window.toggleModal();
};

window.updateStock = async (id, change) => {
    const item = allProducts.find(p => p.id === id);
    await updateDoc(doc(db, "products", id), { count: item.count + change });
};

window.deleteProduct = async (id) => { 
    if(confirm("Bu ürünü tamamen silmek istediğinizden emin misiniz?")) {
        await deleteDoc(doc(db, "products", id));
    }
};

// --- GRAFİK ---
function updateChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Stok', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 10 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}