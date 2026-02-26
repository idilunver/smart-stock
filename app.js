import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;
let allProducts = [];
let cart = [];

// --- TEMA VE SAYFA ---
window.showPage = (page) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', page !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', page !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', page === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', page === 'market');
    document.getElementById('page-title').innerText = page === 'dashboard' ? 'Dashboard' : 'Gurme Market';
    if(page === 'market') renderMarket();
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    document.getElementById('theme-text').innerText = isDark ? "Aydınlık Tema" : "Koyu Tema";
};

window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('open');

window.toggleModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.toggle('hidden');
    modal.classList.toggle('flex');
    if(modal.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Yeni Ürün";
    }
};

// --- AUTH ---
document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Giriş başarısız!"));
};

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

function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    document.getElementById('total-items').innerText = allProducts.length;

    allProducts.forEach(item => {
        const timeInfo = calculateDays(item.expiryDate);
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-none">
                <td class="p-4"><img src="${item.imageUrl}" class="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'"></td>
                <td class="p-6">
                    <div class="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition flex items-center" 
                         onclick="openEditModal('${item.id}')">
                        ${item.name} <i class="fas fa-edit text-[10px] ml-2 opacity-0 group-hover:opacity-100 transition-all"></i>
                    </div>
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ürün Kimliği: ${item.id.substring(0,8)}</span>
                </td>
                <td class="p-6">
                    <div class="flex items-center justify-center space-x-3">
                        <button onclick="updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-xl hover:bg-red-100 transition font-bold text-slate-600">-</button>
                        <span class="font-black text-slate-800 w-6 text-center">${item.count}</span>
                        <button onclick="updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-xl hover:bg-emerald-100 transition font-bold text-slate-600">+</button>
                    </div>
                </td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[10px] font-black ${timeInfo.color} bg-opacity-10">${timeInfo.text}</span></td>
                <td class="p-6 text-right">
                    <button onclick="deleteProduct('${item.id}')" class="w-10 h-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    });
}

function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 z-10 shadow-sm border">STOK: ${item.count}</div>
                <img src="${item.imageUrl}" class="w-full h-52 object-cover rounded-[2rem] mb-6 group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://via.placeholder.com/300'">
                <h3 class="font-black text-slate-800 text-xl tracking-tight">${item.name}</h3>
                <p class="text-slate-400 text-xs mt-1 font-medium">Özel Seçim Ürün</p>
                <div class="flex justify-between items-center mt-8">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Birim Fiyat</span>
                        <span class="text-xl font-black text-slate-800">₺---</span>
                    </div>
                    <button onclick="addToCart('${item.id}')" class="bg-slate-900 text-white w-14 h-14 rounded-[1.2rem] hover:bg-indigo-600 transition shadow-xl flex items-center justify-center group-hover:rotate-12">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>`;
    });
}

// --- ÜRÜN İŞLEMLERİ ---
window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-date').value = item.expiryDate || "";
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Güncelle";
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

window.deleteProduct = async (id) => { if(confirm("Bu ürünü silmek istediğinizden emin misiniz?")) await deleteDoc(doc(db, "products", id)); };

// --- SEPET SİSTEMİ ---
window.addToCart = (id) => {
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({ ...item, qty: 1 });
    renderCart();
    if(!document.getElementById('cart-sidebar').classList.contains('open')) toggleCart();
};

function renderCart() {
    const cartDiv = document.getElementById('cart-items');
    const countSpan = document.getElementById('cart-count');
    const totalQty = document.getElementById('cart-total-qty');
    const qty = cart.reduce((sum, i) => sum + i.qty, 0);
    countSpan.innerText = qty;
    totalQty.innerText = qty;
    
    if(cart.length === 0) {
        cartDiv.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-slate-300">
            <i class="fas fa-shopping-basket text-5xl mb-4"></i>
            <p class="font-bold">Sepetiniz Boş</p>
        </div>`;
        return;
    }

    cartDiv.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 transition-colors">
            <img src="${item.imageUrl}" class="w-16 h-16 rounded-xl object-cover shadow-sm">
            <div class="flex-1">
                <h4 class="font-black text-slate-800 text-sm leading-tight">${item.name}</h4>
                <p class="text-[10px] font-black text-indigo-600 mt-1 uppercase">Miktar: ${item.qty}</p>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 transition"><i class="fas fa-times text-xs"></i></button>
        </div>
    `).join('');
}

window.removeFromCart = (id) => {
    cart = cart.filter(c => c.id !== id);
    renderCart();
};

// --- YARDIMCI ---
function calculateDays(date) {
    if(!date) return { text: "S.T.T. YOK", color: "text-slate-400 bg-slate-400" };
    const diff = new Date(date) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / 86400000);
    if(days < 0) return { text: "SÜRESİ DOLDU", color: "text-red-500 bg-red-500" };
    if(days <= 7) return { text: days + " GÜN KALDI", color: "text-amber-600 bg-amber-600" };
    return { text: days + " GÜN KALDI", color: "text-emerald-500 bg-emerald-500" };
}

function updateChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Stok Adedi', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 8, barThickness: 20 }]
        },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
        }
    });
}