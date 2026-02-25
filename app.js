import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let stockChart;

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden');
    m.classList.toggle('flex');
};

// --- GRAFİK GÜNCELLEME ---
function updateChart(products) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (stockChart) stockChart.destroy();

    const labels = products.map(p => p.name);
    const counts = products.map(p => p.count);

    stockChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

// --- VERİ DİNLEME VE ARAMA ---
function listenData() {
    const tableBody = document.getElementById('product-table-body');
    const totalDisplay = document.getElementById('total-items');
    const searchInput = document.getElementById('searchInput');

    // onSnapshot: Veritabanı her değiştiğinde otomatik tetiklenir
    onSnapshot(collection(db, "products"), (snapshot) => {
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
                        <td class="p-6">
                            <span class="text-xs font-bold uppercase ${isExpired ? 'text-red-500' : 'text-emerald-500'}">
                                ${isExpired ? 'SKT Geçti' : 'Güncel'}
                            </span>
                        </td>
                        <td class="p-6 text-center">
                            <button onclick="deleteProduct('${item.id}')" class="text-slate-300 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>`;
            });
        };

        renderTable(allProducts);
        updateChart(allProducts);

        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
            renderTable(filtered);
        };
    });
}

// --- KAYDETME ---
document.getElementById('save-btn').onclick = async () => {
    const name = document.getElementById('p-name').value;
    const count = Number(document.getElementById('p-count').value);
    const date = document.getElementById('p-date').value;

    if(name && count) {
        await addDoc(collection(db, "products"), { name, count, expiryDate: date });
        window.toggleModal();
        document.getElementById('p-name').value = "";
        document.getElementById('p-count').value = "";
    }
};

// --- SİLME ---
window.deleteProduct = async (id) => {
    if(confirm("Silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, "products", id));
    }
};

listenData();