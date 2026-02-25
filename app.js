import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;

// --- GİRİŞ VE KAYIT İŞLEMLERİ ---
document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if(email && pass) {
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Giriş başarısız: " + err.message));
    } else { alert("Lütfen alanları doldurun!"); }
};

document.getElementById('signup-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if(email && pass) {
        createUserWithEmailAndPassword(auth, email, pass)
            .then(() => alert("Hesabınız oluşturuldu! Otomatik giriş yapılıyor..."))
            .catch(err => alert("Kayıt hatası: " + err.message));
    }
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- DURUM KONTROLÜ (Giriş Yapıldı mı?) ---
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');

    if (user) {
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        listenData(user.uid); // Sadece bu kullanıcının verilerini getir
    } else {
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// --- GRAFİK VE VERİ MANTIĞI ---
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
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

function listenData(userId) {
    const tableBody = document.getElementById('product-table-body');
    const totalDisplay = document.getElementById('total-items');
    const searchInput = document.getElementById('searchInput');

    // KRİTİK NOKTA: Sadece userId'si eşleşen ürünleri filtrele
    const q = query(collection(db, "products"), where("userId", "==", userId));

    onSnapshot(q, (snapshot) => {
        let allProducts = [];
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));

        const renderTable = (data) => {
            tableBody.innerHTML = "";
            totalDisplay.innerText = data.length;
            data.forEach((item) => {
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                tableBody.innerHTML += `
                    <tr class="hover:bg-slate-50/50 transition">
                        <td class="p-6 font-bold text-slate-700">${item.name}</td>
                        <td class="p-6"><span class="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold uppercase">${item.count} Adet</span></td>
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
        };

        renderTable(allProducts);
        updateChart(allProducts);

        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            renderTable(allProducts.filter(p => p.name.toLowerCase().includes(term)));
        };
    });
}

// --- MODAL VE ÜRÜN İŞLEMLERİ ---
window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden'); m.classList.toggle('flex');
}

document.getElementById('save-btn').onclick = async () => {
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;
    const user = auth.currentUser;

    if(name && count && user) {
        await addDoc(collection(db, "products"), { 
            name, 
            count, 
            expiryDate: date, 
            userId: user.uid // Kaydederken kullanıcının ID'sini ekliyoruz
        });
        window.toggleModal();
        document.getElementById('p-name').value = "";
        document.getElementById('p-count').value = "";
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, "products", id));
    }
};