import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [];
let isAdmin = false;

// --- TEMA VE SWITCH ---
window.toggleDarkMode = () => {
    const isDark = document.getElementById('main-body').classList.toggle('dark-mode');
    const circle = document.getElementById('toggle-circle');
    const icon = document.getElementById('theme-icon');
    const btn = document.getElementById('theme-toggle-btn');
    
    if(isDark) {
        circle.style.transform = "translateX(24px)";
        btn.style.backgroundColor = "#4f46e5";
        icon.classList.replace('fa-sun', 'fa-moon');
        icon.classList.replace('text-orange-400', 'text-indigo-200');
    } else {
        circle.style.transform = "translateX(0px)";
        btn.style.backgroundColor = "#334155";
        icon.classList.replace('fa-moon', 'fa-sun');
        icon.classList.replace('text-indigo-200', 'text-orange-400');
    }
};

// --- ROL KONTROLÜ (RBAC) ---
async function checkRole(user) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        isAdmin = (docSnap.exists() && docSnap.data().role === "admin");
        
        // Admin elemanlarını görünürlüğünü ayarla
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
    } catch (e) {
        console.error("Rol okunurken hata:", e);
        isAdmin = false;
    }
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

// --- ARAYÜZ RENDER ---
function renderDashboard() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = "";
    document.getElementById('total-items').innerText = allProducts.length;

    allProducts.forEach(item => {
        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="p-6">
                    <div class="flex items-center space-x-3">
                        <img src="${item.imageUrl}" class="w-10 h-10 rounded-lg object-cover" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'">
                        <span class="font-bold text-slate-800 ${isAdmin ? 'cursor-pointer hover:text-indigo-600 transition' : ''}" 
                              onclick="${isAdmin ? `window.openEditModal('${item.id}')` : ''}">${item.name}</span>
                    </div>
                </td>
                <td class="p-6 font-black text-indigo-500 text-sm">₺${item.price || 0}</td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-7 h-7 bg-slate-100 rounded-lg hover:bg-red-100">-</button>` : ''}
                        <span class="font-black w-6 text-xs text-slate-800">${item.count}</span>
                        ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-7 h-7 bg-slate-100 rounded-lg hover:bg-emerald-100">+</button>` : ''}
                    </div>
                </td>
                <td class="p-6 text-right admin-only">
                    <button onclick="window.deleteProduct('${item.id}')" class="text-slate-200 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    });
}

function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all duration-500">
                <img src="${item.imageUrl}" class="w-full h-48 object-cover rounded-[1.8rem] mb-6 shadow-md" onerror="this.src='https://via.placeholder.com/300'">
                <h3 class="font-black text-slate-800 text-xl">${item.name}</h3>
                <div class="flex justify-between items-center mt-6">
                    <span class="text-2xl font-black text-slate-800">₺${item.price || 0}</span>
                    <button onclick="window.addToCart('${item.id}')" class="bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-indigo-600 transition shadow-xl flex items-center space-x-2">
                        <i class="fas fa-cart-plus"></i> <span class="text-sm font-bold">Sepete Ekle</span>
                    </button>
                </div>
            </div>`;
    });
}

// --- SEPET ---
window.addToCart = (id) => {
    if(!auth.currentUser) {
        document.getElementById('auth-msg').innerText = "Alışveriş için lütfen giriş yapın.";
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
    document.getElementById('cart-total-price').innerText = "₺" + total.toFixed(2);
    document.getElementById('cart-items').innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border">
            <img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover">
            <div class="flex-1 font-bold text-sm text-slate-800">${item.name} (x${item.qty})</div>
            <div class="text-xs font-black text-indigo-600">₺${(item.qty * item.price).toFixed(2)}</div>
        </div>
    `).join('');
}

// --- MODAL VE CRUD ---
window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
    document.getElementById('page-title').innerText = p === 'dashboard' ? 'Envanter' : 'Coffee Market';
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
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price || 0;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-date').value = item.expiryDate || "";
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Bilgileri Güncelle";
    window.toggleModal();
};

document.getElementById('save-btn').onclick = async () => {
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
    await updateDoc(doc(db, "products", id), { count: item.count + change });
};

window.deleteProduct = async (id) => { if(confirm("Ürünü silmek istediğine emin misin?")) await deleteDoc(doc(db, "products", id)); };

function updateChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Stok Adedi', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 8 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}