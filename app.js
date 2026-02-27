import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let allProducts = [], cart = [], isAdmin = false;

// --- 1. SİLME FONKSİYONU (KESİN ÇÖZÜM) ---
window.deleteProduct = async (id) => {
    if(confirm("Bu ürünü tamamen silmek istediğinizden emin misiniz?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            console.log("Silindi:", id);
        } catch (e) {
            alert("Silme hatası: Yetkiniz olmayabilir.");
        }
    }
};

// --- 2. DAR TOGGLE MANTIĞI ---
window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    const circle = document.getElementById('toggle-circle');
    const icon = document.getElementById('theme-icon');
    const lLight = document.getElementById('label-light');
    const lDark = document.getElementById('label-dark');

    if(isDark) {
        circle.style.transform = "translateX(180px)"; // Dar yapıya göre kaydırma
        icon.classList.replace('fa-sun', 'fa-moon');
        icon.classList.replace('text-orange-400', 'text-indigo-400');
        lDark.classList.replace('text-slate-500', 'text-indigo-400');
        lLight.classList.replace('text-orange-400', 'text-slate-500');
    } else {
        circle.style.transform = "translateX(0px)";
        icon.classList.replace('fa-moon', 'fa-sun');
        icon.classList.replace('text-indigo-400', 'text-orange-400');
        lLight.classList.replace('text-orange-400', 'text-slate-500');
        lDark.classList.replace('text-indigo-400', 'text-slate-500');
    }
};

// --- 3. SEPET +/- KONTROLLERİ ---
window.changeCartQty = (id, change) => {
    const item = cart.find(c => c.id === id);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    renderCart();
};

window.addToCart = (id) => {
    if(!auth.currentUser) {
        document.getElementById('auth-screen').classList.remove('hidden');
        return;
    }
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    exist ? exist.qty++ : cart.push({ ...item, qty: 1 });
    renderCart();
    if(!document.getElementById('cart-sidebar').classList.contains('open')) window.toggleCart();
};

function renderCart() {
    const total = cart.reduce((sum, i) => sum + (i.qty * i.price), 0);
    document.getElementById('cart-count').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('cart-total-price').innerText = "₺" + total.toLocaleString();
    
    document.getElementById('cart-items').innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border text-slate-800">
            <img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover">
            <div class="flex-1">
                <div class="font-bold text-xs">${item.name}</div>
                <div class="flex items-center space-x-2 mt-1">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-6 h-6 bg-white border rounded shadow-sm">-</button>
                    <span class="font-black text-indigo-600 text-xs">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-6 h-6 bg-white border rounded shadow-sm">+</button>
                </div>
            </div>
            <div class="font-black text-xs">₺${(item.qty * item.price).toLocaleString()}</div>
        </div>
    `).join('');
}

// --- 4. AUTH & VERİ ---
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
    });
}

function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    allProducts.forEach(item => {
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b">
                <td class="p-6">
                    <div class="flex items-center space-x-4">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="w-12 h-12 rounded-xl object-cover">
                        <span class="font-bold text-slate-800">${item.name}</span>
                    </div>
                </td>
                <td class="p-6 font-black text-indigo-500">₺${(item.price || 0).toLocaleString()}</td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-8 h-8 bg-slate-100 rounded-lg">-</button>` : ''}
                        <span class="font-black w-8 text-center text-slate-800">${item.count}</span>
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-8 h-8 bg-slate-100 rounded-lg">+</button>` : ''}
                    </div>
                </td>
                <td class="p-6 text-right admin-only">
                    <div class="flex justify-end space-x-4 text-slate-400">
                        <button onclick="window.openEditModal('${item.id}')" class="hover:text-indigo-600"><i class="fas fa-edit"></i></button>
                        <button onclick="window.deleteProduct('${item.id}')" class="hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`;
    });
}

function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = allProducts.map(item => `
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border">
            <img src="${item.imageUrl}" class="w-full h-48 object-cover rounded-[1.8rem] mb-6">
            <h3 class="font-black text-slate-800 text-xl">${item.name}</h3>
            <div class="flex justify-between items-center mt-6">
                <span class="text-2xl font-black text-slate-800">₺${item.price}</span>
                <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition">Ekle</button>
            </div>
        </div>`).join('');
}

// --- 5. YARDIMCI FONKSİYONLAR ---
window.toggleModal = () => document.getElementById('modal').classList.toggle('hidden');
window.toggleCart = () => {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('cart-bg').classList.toggle('show');
};

window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
};

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

document.getElementById('login-btn').onclick = () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, e, p);
};

document.getElementById('logout-btn').onclick = () => signOut(auth);