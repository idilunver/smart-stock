import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart, allProducts = [], cart = [], isAdmin = false;

// SİLME VE GÜNCELLEME
window.deleteProduct = async (id) => {
    if(confirm("Silmek istediğinize emin misiniz?")) await deleteDoc(doc(db, "products", id));
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

// GRAFİK SİSTEMİ
function updateChart() {
    const canvas = document.getElementById('stockChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
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

// VERİ DİNLEME
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
    });
}

function renderAll() {
    const table = document.getElementById('product-table-body');
    const market = document.getElementById('page-market');
    
    table.innerHTML = allProducts.map(item => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-6 flex items-center space-x-4"><img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover"><b>${item.name}</b></td>
            <td class="p-6 text-indigo-600 font-black">₺${item.price}</td>
            <td class="p-6 text-center">
                <button onclick="window.updateStock('${item.id}', -1)" class="admin-only px-2 bg-slate-100 rounded">-</button>
                <span class="mx-2 font-bold">${item.count}</span>
                <button onclick="window.updateStock('${item.id}', 1)" class="admin-only px-2 bg-slate-100 rounded">+</button>
            </td>
            <td class="p-6 text-right admin-only">
                <button onclick="window.openEditModal('${item.id}')" class="text-blue-500 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="window.deleteProduct('${item.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');

    market.innerHTML = allProducts.map(item => `
        <div class="bg-white p-6 rounded-[2rem] border shadow-sm">
            <img src="${item.imageUrl}" class="w-full h-40 object-cover rounded-2xl mb-4">
            <h3 class="font-bold text-lg">${item.name}</h3>
            <div class="flex justify-between items-center mt-4">
                <span class="font-black text-xl">₺${item.price}</span>
                <button onclick="window.addToCart('${item.id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm italic"><i class="fas fa-cart-plus mr-2"></i>Ekle</button>
            </div>
        </div>`).join('');
    
    if(isAdmin) updateChart();
}

// SEPET VE DİĞERLERİ
window.toggleDarkMode = () => {
    document.getElementById('main-body').classList.toggle('dark-mode');
    if(isAdmin) updateChart();
};

window.toggleModal = () => document.getElementById('modal').classList.toggle('hidden');
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

window.addToCart = (id) => {
    const item = allProducts.find(p => p.id === id);
    cart.push(item);
    document.getElementById('cart-count').innerText = cart.length;
};

document.getElementById('login-btn').addEventListener('click', () => {
    const e = document.getElementById('auth-email').value;
    const p = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, e, p);
});

document.getElementById('logout-btn').onclick = () => signOut(auth);