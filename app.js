import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;
let allProducts = [];
let cart = [];
const FIXED_PRICE = 185.00; // Örnek fiyat

// --- PENCERE FONKSİYONLARI ---
window.showPage = (page) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', page !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', page !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', page === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', page === 'market');
    document.getElementById('page-title').innerText = page === 'dashboard' ? 'Dashboard' : 'Coffee Market';
    if(page === 'market') renderMarket();
};

window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-bg').classList.toggle('show');
};

window.toggleDarkMode = () => {
    document.getElementById('main-body').classList.toggle('dark-mode');
};

window.toggleModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.toggle('hidden');
    modal.classList.toggle('flex');
    if(modal.classList.contains('hidden')) document.getElementById('p-id').value = "";
};

// --- AUTH İŞLEMLERİ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        listenData(user.uid);
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }
});

// Güvenli Buton Atamaları (Hatayı çözen kısım)
const loginBtn = document.getElementById('login-btn');
if(loginBtn) {
    loginBtn.onclick = () => {
        signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value)
        .catch(err => alert("Giriş Hatalı: " + err.message));
    };
}

const signupBtn = document.getElementById('signup-btn');
if(signupBtn) {
    signupBtn.onclick = () => {
        createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value)
        .catch(err => alert("Kayıt Hatalı: " + err.message));
    };
}

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- VERİ DİNLEME VE DASHBOARD ---
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

function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    document.getElementById('total-items').innerText = allProducts.length;

    allProducts.forEach(item => {
        const timeInfo = calculateDays(item.expiryDate);
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition group">
                <td class="p-4"><img src="${item.imageUrl}" class="w-14 h-14 rounded-2xl object-cover shadow-sm" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'"></td>
                <td class="p-6">
                    <div class="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition" onclick="window.openEditModal('${item.id}')">
                        ${item.name} <i class="fas fa-edit text-[10px] ml-2 opacity-0 group-hover:opacity-100 transition"></i>
                    </div>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-3">
                        <button onclick="window.updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-xl hover:bg-red-100 transition">-</button>
                        <span class="font-black text-slate-800 w-8">${item.count}</span>
                        <button onclick="window.updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-xl hover:bg-emerald-100 transition">+</button>
                    </div>
                </td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[10px] font-black ${timeInfo.color} bg-opacity-10 border">${timeInfo.text}</span></td>
                <td class="p-6 text-right"><button onclick="window.deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500 transition px-4"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
    });
}

// --- MARKET VE SEPET ---
function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500">
                <img src="${item.imageUrl}" class="w-full h-52 object-cover rounded-[2rem] mb-6 group-hover:scale-105 transition duration-500" onerror="this.src='https://via.placeholder.com/300'">
                <h3 class="font-black text-slate-800 text-xl tracking-tight">${item.name}</h3>
                <div class="flex justify-between items-center mt-8">
                    <span class="text-2xl font-black text-slate-800">₺${FIXED_PRICE}</span>
                    <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white w-14 h-14 rounded-2xl hover:bg-indigo-600 transition shadow-xl flex items-center justify-center">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>`;
    });
}

window.addToCart = (id) => {
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
    
    const qtyCount = cart.reduce((sum, i) => sum + i.qty, 0);
    totalQty.innerText = qtyCount;
    totalPrice.innerText = "₺" + (qtyCount * FIXED_PRICE).toFixed(2);
    
    if(cart.length === 0) {
        cartDiv.innerHTML = '<p class="text-center py-20 text-slate-400 font-bold">Sepetiniz Boş</p>';
        return;
    }

    cartDiv.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <img src="${item.imageUrl}" class="w-16 h-16 rounded-xl object-cover shadow-sm">
            <div class="flex-1">
                <h4 class="font-black text-slate-800 text-sm leading-tight">${item.name}</h4>
                <div class="flex items-center space-x-3 mt-2">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-7 h-7 bg-white rounded-lg shadow-sm font-bold text-xs">-</button>
                    <span class="font-black text-indigo-600 text-sm">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-7 h-7 bg-white rounded-lg shadow-sm font-bold text-xs">+</button>
                </div>
            </div>
            <button onclick="window.removeFromCart('${item.id}')" class="text-red-300 hover:text-red-500 transition px-2"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

window.changeCartQty = (id, change) => {
    const item = cart.find(c => c.id === id);
    item.qty += change;
    if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
    renderCart();
};

window.removeFromCart = (id) => {
    cart = cart.filter(c => c.id !== id);
    renderCart();
};

// --- CRUD İŞLEMLERİ ---
window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-date').value = item.expiryDate || "";
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Düzenle";
    window.toggleModal();
};

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        count: Number(document.getElementById('p-count').value),
        expiryDate: document.getElementById('p-date').value,
        imageUrl: document.getElementById('p-image-url').value,
        userId: auth.currentUser.uid
    };
    if(id) await updateDoc(doc(db, "products", id), data);
    else await addDoc(collection(db, "products"), data);
    window.toggleModal();
};

window.updateStock = async (id, change) => {
    const item = allProducts.find(p => p.id === id);
    const next = item.count + change;
    if(next >= 0) await updateDoc(doc(db, "products", id), { count: next });
};

window.deleteProduct = async (id) => { if(confirm("Ürünü silmek istiyor musunuz?")) await deleteDoc(doc(db, "products", id)); };

// --- YARDIMCI ---
function calculateDays(date) {
    if(!date) return { text: "SÜRESİZ", color: "text-slate-400 border-slate-200" };
    const diff = new Date(date) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / 86400000);
    if(days < 0) return { text: "SÜRESİ DOLDU", color: "text-red-500 border-red-200" };
    return { text: days + " GÜN KALDI", color: "text-emerald-500 border-emerald-200" };
}

function updateChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Stok', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 8 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
    });
}