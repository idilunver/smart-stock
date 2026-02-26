import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;

// --- GİRİŞ / ÇIKIŞ İŞLEMLERİ ---
document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Hata: " + err.message));
};

document.getElementById('signup-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    createUserWithEmailAndPassword(auth, email, pass).catch(err => alert("Hata: " + err.message));
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- KULLANICI KONTROLÜ ---
onAuthStateChanged(auth, (user) => {
    const authS = document.getElementById('auth-screen');
    const mainA = document.getElementById('main-app');
    if (user) {
        authS.classList.add('hidden'); mainA.classList.remove('hidden');
        listenData(user.uid);
    } else {
        authS.classList.remove('hidden'); mainA.classList.add('hidden');
    }
});

// --- VERİ DİNLEME VE GÖRSELLEŞTİRME ---
function listenData(userId) {
    const tableBody = document.getElementById('product-table-body');
    const q = query(collection(db, "products"), where("userId", "==", userId));

    onSnapshot(q, (snapshot) => {
        let products = [];
        snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        tableBody.innerHTML = "";
        document.getElementById('total-items').innerText = products.length;

        products.forEach(item => {
            const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
            const isLowStock = item.count < 5; // Kritik stok sınırı: 5

            tableBody.innerHTML += `
                <tr class="${isLowStock ? 'bg-amber-50' : ''} hover:bg-slate-50 transition">
                    <td class="p-4">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" 
                             class="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm"
                             onerror="this.src='https://via.placeholder.com/50'">
                    </td>
                    <td class="p-6 font-bold text-slate-700">
                        ${item.name}
                        ${isLowStock ? '<br><span class="text-[10px] text-amber-600 font-black italic tracking-widest uppercase">⚠️ Stok Azalıyor</span>' : ''}
                    </td>
                    <td class="p-6">
                        <span class="px-3 py-1 rounded-lg text-xs font-black ${isLowStock ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                            ${item.count} ADET
                        </span>
                    </td>
                    <td class="p-6 text-xs font-bold ${isExpired ? 'text-red-500' : 'text-emerald-500'}">
                        ${isExpired ? 'SKT GEÇTİ' : 'GÜNCEL'}
                    </td>
                    <td class="p-6 text-center">
                        <button onclick="deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500 transition">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        });
        updateChart(products);
        
        // Arama özelliği
        document.getElementById('searchInput').oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = products.filter(p => p.name.toLowerCase().includes(term));
            // Arama için tekrar render... (kısalık için temel filtreleme eklendi)
        };
    });
}

// --- GRAFİK ---
function updateChart(products) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                data: products.map(p => p.count),
                backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// --- KAYDETME VE SİLME ---
window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden'); m.classList.toggle('flex');
}

document.getElementById('save-btn').onclick = async () => {
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;
    const imageUrl = document.getElementById('p-image-url').value;
    const user = auth.currentUser;

    if(name && count && user) {
        await addDoc(collection(db, "products"), { name, count, expiryDate: date, imageUrl, userId: user.uid });
        window.toggleModal();
        document.getElementById('p-name').value = ""; document.getElementById('p-count').value = ""; document.getElementById('p-image-url').value = "";
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Silmek istediğinize emin misiniz?")) await deleteDoc(doc(db, "products", id));
};