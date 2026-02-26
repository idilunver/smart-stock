import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let stockChart;

// --- TEMA VE MODAL ---
window.toggleDarkMode = () => {
    document.getElementById('main-body').classList.toggle('dark-mode');
    const isDark = document.getElementById('main-body').classList.contains('dark-mode');
    document.getElementById('theme-text').innerText = isDark ? "Aydınlık Tema" : "Koyu Tema";
};

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden'); m.classList.toggle('flex');
    if(m.classList.contains('hidden')) clearForm();
};

const clearForm = () => {
    document.getElementById('p-id').value = "";
    document.getElementById('p-name').value = "";
    document.getElementById('p-count').value = "";
    document.getElementById('p-date').value = "";
    document.getElementById('p-image-url').value = "";
    document.getElementById('modal-title').innerText = "Yeni Ürün Kaydı";
};

// --- AUTH ---
document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
};
document.getElementById('signup-btn').onclick = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    createUserWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
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

// --- VERİ İŞLEMLERİ ---
function calculateDaysLeft(date) {
    if (!date) return { text: "Belirtilmemiş", color: "text-slate-400" };
    const diff = new Date(date) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: "SKT GEÇTİ", color: "text-red-500 font-bold" };
    if (days <= 7) return { text: days + " Gün Kaldı", color: "text-amber-500 font-bold" };
    return { text: days + " Gün Kaldı", color: "text-emerald-500" };
}

window.changeStock = async (id, current, change) => {
    const next = current + change;
    if (next >= 0) await updateDoc(doc(db, "products", id), { count: next });
};

window.editProduct = (id, name, count, date, url) => {
    document.getElementById('modal-title').innerText = "Ürünü Güncelle";
    document.getElementById('p-id').value = id;
    document.getElementById('p-name').value = name;
    document.getElementById('p-count').value = count;
    document.getElementById('p-date').value = date;
    document.getElementById('p-image-url').value = url;
    window.toggleModal();
};

function listenData(userId) {
    const tableBody = document.getElementById('product-table-body');
    const q = query(collection(db, "products"), where("userId", "==", userId));

    onSnapshot(q, (snapshot) => {
        let products = [];
        snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
        
        const render = (data) => {
            tableBody.innerHTML = "";
            document.getElementById('total-items').innerText = data.length;
            data.forEach(item => {
                const time = calculateDaysLeft(item.expiryDate);
                const low = item.count < 5;
                tableBody.innerHTML += `
                    <tr class="${low ? 'bg-amber-50/30' : ''} transition-colors">
                        <td class="p-4"><img src="${item.imageUrl}" class="w-12 h-12 rounded-xl object-cover shadow-sm" onerror="this.src='https://cdn-icons-png.flaticon.com/512/679/679821.png'"></td>
                        <td class="p-6 font-bold text-slate-700">${item.name}</td>
                        <td class="p-6">
                            <div class="flex items-center justify-center space-x-3">
                                <button onclick="changeStock('${item.id}', ${item.count}, -1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 transition">-</button>
                                <span class="font-black w-6 text-center">${item.count}</span>
                                <button onclick="changeStock('${item.id}', ${item.count}, 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 transition">+</button>
                            </div>
                        </td>
                        <td class="p-6 text-sm ${time.color}">${time.text}</td>
                        <td class="p-6 text-right space-x-2">
                            <button onclick="editProduct('${item.id}','${item.name}',${item.count},'${item.expiryDate}','${item.imageUrl}')" class="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteProduct('${item.id}')" class="p-2 text-slate-300 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>`;
            });
        };
        render(products);
        updateChart(products);
        document.getElementById('searchInput').oninput = (e) => {
            const t = e.target.value.toLowerCase();
            render(products.filter(p => p.name.toLowerCase().includes(t)));
        };
    });
}

document.getElementById('save-btn').onclick = async () => {
    const id = document.getElementById('p-id').value;
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;
    const url = document.getElementById('p-image-url').value;
    const user = auth.currentUser;

    if(name && count && user) {
        const data = { name, count, expiryDate: date, imageUrl: url, userId: user.uid };
        id ? await updateDoc(doc(db, "products", id), data) : await addDoc(collection(db, "products"), data);
        window.toggleModal();
    }
};

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

window.deleteProduct = async (id) => { if(confirm("Silinsin mi?")) await deleteDoc(doc(db, "products", id)); };