import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [], isAdmin = false;

// MODAL KONTROLLERİ (SİLME DÜĞMESİ DAHİL)
window.toggleModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.toggle('hidden');
    if(modal.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Yeni Ürün Ekle";
        document.getElementById('delete-btn-modal').classList.add('hidden');
    }
};

window.openEditModal = (id) => {
    const item = allProducts.find(p => p.id === id);
    document.getElementById('p-id').value = item.id;
    document.getElementById('p-name').value = item.name;
    document.getElementById('p-price').value = item.price;
    document.getElementById('p-count').value = item.count;
    document.getElementById('p-image-url').value = item.imageUrl || "";
    document.getElementById('modal-title').innerText = "Ürünü Düzenle";
    document.getElementById('delete-btn-modal').classList.remove('hidden'); // Silme butonunu göster
    window.toggleModal();
};

document.getElementById('delete-btn-modal').onclick = async () => {
    const id = document.getElementById('p-id').value;
    if(id && confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, "products", id));
        window.toggleModal();
    }
};

// GRAFİK
function updateChart() {
    const ctx = document.getElementById('stockChart')?.getContext('2d');
    if(!ctx) return;
    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allProducts.map(p => p.name),
            datasets: [{ label: 'Stok', data: allProducts.map(p => p.count), backgroundColor: '#6366f1', borderRadius: 8 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// AUTH & ROLE SİSTEMİ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        const snap = await getDoc(doc(db, "users", user.uid));
        isAdmin = snap.exists() && snap.data().role === "admin";
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
        if(isAdmin) updateChart();
    });
}

function renderAll() {
    // YÖNETİM TABLOSU
    const table = document.getElementById('product-table-body');
    table.innerHTML = allProducts.map(item => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-6 flex items-center space-x-4"><img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover"><b>${item.name}</b></td>
            <td class="p-6 text-indigo-600 font-black">₺${item.price}</td>
            <td class="p-6 text-center">
                <div class="flex items-center justify-center space-x-2">
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', -1)" class="w-6 h-6 bg-slate-100 rounded">-</button>` : ''}
                    <span class="font-bold w-6 text-center">${item.count}</span>
                    ${isAdmin ? `<button onclick="window.updateStock('${item.id}', 1)" class="w-6 h-6 bg-slate-100 rounded">+</button>` : ''}
                </div>
            </td>
            <td class="p-6 text-right admin-only">
                <button onclick="window.openEditModal('${item.id}')" class="text-indigo-400 hover:text-indigo-600"><i class="fas fa-edit"></i></button>
            </td>
        </tr>`).join('');

    // MARKET KARTLARI
    const market = document.getElementById('page-market');
    market.innerHTML = allProducts.map(item => `
        <div class="bg-white p-6 rounded-[2rem] border shadow-sm">
            <img src="${item.imageUrl}" class="w-full h-40 object-cover rounded-2xl mb-4">
            <h3 class="font-bold text-lg">${item.name}</h3>
            <div class="flex justify-between items-center mt-4">
                <span class="font-black text-xl">₺${item.price}</span>
                <button onclick="window.addToCart('${item.id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2">
                    <i class="fas fa-cart-plus"></i> <span>Sepete Ekle</span>
                </button>
            </div>
        </div>`).join('');
}

// SEPET MANTIĞI
window.addToCart = (id) => {
    const item = allProducts.find(p => p.id === id);
    const exist = cart.find(c => c.id === id);
    if(exist) exist.qty++;
    else cart.push({...item, qty: 1});
    
    renderCart();
    window.toggleCart(); // Sepete basınca yan panel açılır
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
        <div class="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border">
            <img src="${item.imageUrl}" class="w-10 h-10 rounded-lg object-cover">
            <div class="flex-1">
                <p class="text-xs font-bold">${item.name}</p>
                <div class="flex items-center space-x-2 mt-1">
                    <button onclick="window.changeCartQty('${item.id}', -1)" class="w-5 h-5 bg-white border rounded text-[10px]">-</button>
                    <span class="text-xs font-black">${item.qty}</span>
                    <button onclick="window.changeCartQty('${item.id}', 1)" class="w-5 h-5 bg-white border rounded text-[10px]">+</button>
                </div>
            </div>
            <span class="text-xs font-black italic">₺${item.qty * item.price}</span>
        </div>`).join('');
}

// DİĞERLERİ
window.toggleDarkMode = () => {
    document.getElementById('main-body').classList.toggle('dark-mode');
    if(isAdmin) updateChart();
};

window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('open');

window.showPage = (p) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', p !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', p !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', p === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', p === 'market');
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