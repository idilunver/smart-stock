import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;

// --- GİRİŞ / ÇIKIŞ ---
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

// --- YENİ: GÜN HESAPLAMA FONKSİYONU ---
function calculateDaysLeft(expiryDate) {
    if (!expiryDate) return { text: "Belirtilmemiş", color: "text-slate-400" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "SKT GEÇTİ!", color: "text-red-500 font-black" };
    if (diffDays === 0) return { text: "BUGÜN SON!", color: "text-orange-500 font-black animate-pulse" };
    if (diffDays <= 7) return { text: `${diffDays} Gün Kaldı`, color: "text-amber-500 font-bold" };
    return { text: `${diffDays} Gün Kaldı`, color: "text-emerald-500" };
}

// --- VERİ DİNLEME ---
function listenData(userId) {
    const tableBody = document.getElementById('product-table-body');
    const q = query(collection(db, "products"), where("userId", "==", userId));

    onSnapshot(q, (snapshot) => {
        let products = [];
        snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        tableBody.innerHTML = "";
        document.getElementById('total-items').innerText = products.length;

        products.forEach(item => {
            const timeInfo = calculateDaysLeft(item.expiryDate);
            const isLowStock = item.count < 5;

            tableBody.innerHTML += `
                <tr class="${isLowStock ? 'bg-amber-50' : ''} hover:bg-slate-50 transition">
                    <td class="p-4">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" 
                             class="w-14 h-14 rounded-2xl object-cover border shadow-sm"
                             onerror="this.src='https://via.placeholder.com/50'">
                    </td>
                    <td class="p-6">
                        <div class="font-bold text-slate-700">${item.name}</div>
                        ${isLowStock ? '<span class="text-[10px] text-amber-600 font-black uppercase tracking-tighter">⚠️ STOK KRİTİK</span>' : ''}
                    </td>
                    <td class="p-6 text-center">
                        <span class="px-3 py-1 rounded-lg text-xs font-black ${isLowStock ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'}">
                            ${item.count} ADET
                        </span>
                    </td>
                    <td class="p-6">
                        <span class="text-sm ${timeInfo.color}">${timeInfo.text}</span>
                    </td>
                    <td class="p-6 text-center">
                        <button onclick="deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500 transition">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        });
        updateChart(products);
    });
}

// --- KAYDETME ---
document.getElementById('save-btn').onclick = async () => {
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;
    const imageUrl = document.getElementById('p-image-url').value;
    const user = auth.currentUser;

    if(name && count && user) {
        await addDoc(collection(db, "products"), { 
            name, count, expiryDate: date, imageUrl, userId: user.uid 
        });
        window.toggleModal();
        document.getElementById('p-name').value = "";
        document.getElementById('p-count').value = "";
        document.getElementById('p-image-url').value = "";
        document.getElementById('p-date').value = "";
    } else {
        alert("Lütfen isim ve miktar alanlarını doldurun!");
    }
};

// --- CHART VE SİLME (Aynı) ---
function updateChart(products) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                data: products.map(p => p.count),
                backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}
window.deleteProduct = async (id) => { if(confirm("Silinsin mi?")) await deleteDoc(doc(db, "products", id)); };
window.toggleModal = () => { const m = document.getElementById('modal'); m.classList.toggle('hidden'); m.classList.toggle('flex'); };