import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;
let allProducts = [];

// --- SAYFA YÖNETİMİ ---
window.showPage = (page) => {
    document.getElementById('page-dashboard').classList.toggle('hidden', page !== 'dashboard');
    document.getElementById('page-market').classList.toggle('hidden', page !== 'market');
    document.getElementById('nav-dashboard').classList.toggle('nav-active', page === 'dashboard');
    document.getElementById('nav-market').classList.toggle('nav-active', page === 'market');
    document.getElementById('page-title').innerText = page === 'dashboard' ? "Envanter Yönetimi" : "Gurme Market";
    if(page === 'market') renderMarket();
};

window.toggleDarkMode = () => {
    document.getElementById('main-body').classList.toggle('dark-mode');
    document.getElementById('theme-text').innerText = document.getElementById('main-body').classList.contains('dark-mode') ? "Aydınlık" : "Koyu Tema";
};

// --- AUTH (Giriş/Çıkış) ---
document.getElementById('login-btn').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value).catch(err => alert(err.message));
};
document.getElementById('signup-btn').onclick = () => {
    createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value).catch(err => alert(err.message));
};
document.getElementById('logout-btn').onclick = () => signOut(auth);

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

// --- VERİ DİNLEME VE TABLO ---
function listenData(userId) {
    const tableBody = document.getElementById('product-table-body');
    const q = query(collection(db, "products"), where("userId", "==", userId));

    onSnapshot(q, (snapshot) => {
        allProducts = [];
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
        
        const renderTable = (data) => {
            tableBody.innerHTML = "";
            document.getElementById('total-items').innerText = data.length;
            data.forEach(item => {
                const time = calculateDaysLeft(item.expiryDate);
                tableBody.innerHTML += `
                    <tr class="group hover:bg-slate-50 transition-colors">
                        <td class="p-4"><img src="${item.imageUrl}" class="w-12 h-12 rounded-2xl object-cover shadow-sm border" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'"></td>
                        <td class="p-6 font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition" 
                            onclick="editProduct('${item.id}','${item.name}',${item.count},'${item.expiryDate}','${item.imageUrl}')">
                            ${item.name} <i class="fas fa-edit ml-2 text-[10px] opacity-0 group-hover:opacity-100 transition"></i>
                        </td>
                        <td class="p-6">
                            <div class="flex items-center justify-center space-x-3">
                                <button onclick="changeStock('${item.id}', ${item.count}, -1)" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 transition">-</button>
                                <span class="font-black w-6 text-center text-slate-800">${item.count}</span>
                                <button onclick="changeStock('${item.id}', ${item.count}, 1)" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-100 transition">+</button>
                            </div>
                        </td>
                        <td class="p-6 text-xs ${time.color}">${time.text}</td>
                        <td class="p-6 text-right">
                            <button onclick="deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>`;
            });
        };
        renderTable(allProducts);
        updateChart(allProducts);
        if(!document.getElementById('page-market').classList.contains('hidden')) renderMarket();

        document.getElementById('searchInput').oninput = (e) => {
            const val = e.target.value.toLowerCase();
            renderTable(allProducts.filter(p => p.name.toLowerCase().includes(val)));
        };
    });
}

// --- MARKET RENDER ---
function renderMarket() {
    const grid = document.getElementById('market-grid');
    grid.innerHTML = "";
    allProducts.forEach(item => {
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group relative overflow-hidden">
                <img src="${item.imageUrl}" class="w-full h-48 object-cover rounded-[2rem] mb-6 group-hover:scale-105 transition duration-500" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'">
                <h3 class="font-black text-slate-800 text-lg">${item.name}</h3>
                <div class="flex justify-between items-center mt-6">
                    <span class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs">Stok: ${item.count}</span>
                    <button onclick="changeStock('${item.id}', ${item.count}, -1)" class="bg-slate-900 text-white w-12 h-12 rounded-2xl hover:bg-indigo-600 transition shadow-lg flex items-center justify-center">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>`;
    });
}

// --- YARDIMCI FONKSİYONLAR ---
window.changeStock = async (id, current, change) => {
    const next = current + change;
    if (next >= 0) await updateDoc(doc(db, "products", id), { count: next });
};

window.editProduct = (id, name, count, date, url) => {
    document.getElementById('modal-title').innerText = "Ürünü Güncelle";
    document.getElementById('p-id').value = id;
    document.getElementById('p-name').value = name;
    document.getElementById('p-count').value = count;
    document.getElementById('p-date').value = date || "";
    document.getElementById('p-image-url').value = url || "";
    window.toggleModal();
};

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden'); m.classList.toggle('flex');
    if(m.classList.contains('hidden')) {
        document.getElementById('p-id').value = "";
        document.getElementById('modal-title').innerText = "Ürün Kaydı";
    }
};

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;
    const url = document.getElementById('p-image-url').value;
    const user = auth.currentUser;

    if(name && user) {
        const data = { name, count, expiryDate: date, imageUrl: url, userId: user.uid };
        id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
        window.toggleModal();
    }
};

function calculateDaysLeft(date) {
    if (!date) return { text: "STT GİRİLMEMİŞ", color: "text-slate-300" };
    const diff = new Date(date) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: "SÜRESİ DOLDU", color: "text-red-500 font-bold" };
    if (days <= 7) return { text: days + " Gün Kaldı", color: "text-amber-500 font-bold" };
    return { text: days + " Gün Kaldı", color: "text-emerald-500" };
}

function updateChart(products) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: products.map(p => p.name),
            datasets: [{ data: products.map(p => p.count), backgroundColor: ['#6366f1','#f43f5e','#10b981','#f59e0b','#8b5cf6'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

window.deleteProduct = async (id) => { if(confirm("Ürün silinecek, emin misiniz?")) await deleteDoc(doc(db, "products", id)); };