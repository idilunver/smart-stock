import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.toggleModal = () => {
    const m = document.getElementById('modal');
    m.classList.toggle('hidden');
    m.classList.toggle('flex');
};

async function loadData() {
    const tableBody = document.getElementById('product-table-body');
    const totalDisplay = document.getElementById('total-items');

    try {
        const snap = await getDocs(collection(db, "products"));
        totalDisplay.innerText = snap.size;
        tableBody.innerHTML = "";
        
        snap.forEach((productDoc) => {
            const data = productDoc.data();
            const isExpired = data.expiryDate && new Date(data.expiryDate) < new Date();

            tableBody.innerHTML += `
                <tr class="hover:bg-slate-50/50 transition">
                    <td class="p-6 font-bold text-slate-700">${data.name}</td>
                    <td class="p-6"><span class="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold uppercase">${data.count} Adet</span></td>
                    <td class="p-6">
                        <span class="text-xs font-bold uppercase ${isExpired ? 'text-red-500' : 'text-emerald-500'}">
                            ${isExpired ? 'SKT Geçti' : 'Güncel'}
                        </span>
                    </td>
                    <td class="p-6 text-center">
                        <button onclick="deleteProduct('${productDoc.id}')" class="text-slate-300 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

document.getElementById('save-btn').onclick = async () => {
    const name = document.getElementById('p-name').value;
    const count = document.getElementById('p-count').value;
    const date = document.getElementById('p-date').value;

    if(name && count) {
        await addDoc(collection(db, "products"), { name, count, expiryDate: date });
        window.toggleModal();
        loadData();
    }
};

window.deleteProduct = async (id) => {
    if(confirm("Silinsin mi?")) {
        await deleteDoc(doc(db, "products", id));
        loadData();
    }
};

loadData();