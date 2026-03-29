// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDrzmh9TbcyuLAG6LkoKERcBuHvQ-sf0oU",
    authDomain: "my-hrm-project-d1aef.firebaseapp.com",
    projectId: "my-hrm-project-d1aef",
    storageBucket: "my-hrm-project-d1aef.firebasestorage.app",
    messagingSenderId: "165053525844",
    appId: "1:165053525844:web:6abc82aca238d9e84862c1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const MASTER_ADMIN = "Meskay";
const MASTER_PASS = "Pakistan786";
let currentFilter = "All";

// Navigation
function navTo(pageId) {
    window.location.hash = pageId;
    renderPage(pageId);
}

window.onhashchange = () => renderPage(window.location.hash.replace('#', '') || 'loginPage');

function renderPage(pageId) {
    if (!sessionStorage.getItem("isLoggedIn") && pageId !== 'loginPage') pageId = 'loginPage';
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(pageId)?.classList.remove('hidden');
    if(pageId === 'adminPage') fetchUsers();
    if(pageId === 'listPage') fetchEmployees();
    if(pageId === 'dashboardPage') updateCounts();
    setupPermissions();
}

// Logic Functions
async function handleLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    if(u === MASTER_ADMIN && p === MASTER_PASS) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("currentUser", JSON.stringify({name: u, role: 'admin', pAdd: true}));
        navTo('dashboardPage');
    } else {
        const snap = await db.collection("users").where("name", "==", u).where("pass", "==", p).get();
        if(!snap.empty) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("currentUser", JSON.stringify(snap.docs[0].data()));
            navTo('dashboardPage');
        } else alert("FAILED!");
    }
}

async function updateCounts() {
    const snap = await db.collection("employees").get();
    let all = 0, act = 0, inact = 0;
    snap.forEach(doc => {
        all++;
        if(doc.data().status === "Active") act++; else inact++;
    });
    document.getElementById("countAll").innerText = all;
    document.getElementById("countActive").innerText = act;
    document.getElementById("countInactive").innerText = inact;
}

async function saveEmployee() {
    const emp = { 
        id: document.getElementById("eId").value, 
        name: document.getElementById("eName").value, 
        des: document.getElementById("eDes").value, 
        pho: document.getElementById("ePho").value,
        status: "Active" 
    };
    await db.collection("employees").add(emp);
    alert("SAVED!");
    navTo('dashboardPage');
}

async function fetchEmployees() {
    const body = document.getElementById("empListBody");
    body.innerHTML = "Loading...";
    let query = db.collection("employees");
    if(currentFilter !== "All") query = query.where("status", "==", currentFilter);
    const snap = await query.get();
    body.innerHTML = "";
    snap.forEach(doc => {
        const e = doc.data();
        body.innerHTML += `<tr class="${e.status==='Active'?'active-row':'inactive-row'}">
            <td>${e.id}</td><td>${e.name.toUpperCase()} (${e.status})</td>
            <td>${e.des}</td><td>${e.pho}</td>
            // بٹن کا نام سٹیٹس کے حساب سے طے کریں
async function fetchEmployees() {
    const body = document.getElementById("empListBody");
    if (!body) return; // اگر پیج لوڈ نہیں ہوا تو رک جاؤ
    
    body.innerHTML = "Syncing with Cloud...";
    
    let query = db.collection("employees");
    if(currentFilter !== "All") {
        query = query.where("status", "==", currentFilter);
    }
    
    try {
        const snap = await query.get();
        body.innerHTML = ""; // پرانا ڈیٹا صاف کریں
        
        snap.forEach(doc => {
            const e = doc.data();
            const docId = doc.id;
            const currentStatus = e.status || "Active"; // اگر سٹیٹس نہ ہو تو ایکٹو مکھیں

            // بٹن کا نام اور ڈیزائن طے کریں
            const btnText = currentStatus === 'Active' ? 'DEACTIVATE' : 'ACTIVATE';
            const btnClass = currentStatus === 'Active' ? 'action-btn' : 'action-btn logout-btn';

            body.innerHTML += `
                <tr class="${currentStatus === 'Active' ? 'active-row' : 'inactive-row'}">
                    <td>${e.id}</td>
                    <td>${e.name.toUpperCase()} <br><small>(${currentStatus})</small></td>
                    <td>${e.des}</td>
                    <td>${e.pho}</td>
                    <td>
                        <button class="${btnClass}" onclick="toggleStatus('${docId}','${currentStatus}')">
                            ${btnText}
                        </button>
                            async function toggleStatus(id, s) {
    const newStatus = s === 'Active' ? 'Inactive' : 'Active';
    await db.collection("employees").doc(id).update({status: newStatus});
    fetchEmployees(); // لسٹ اپڈیٹ کریں
    updateCounts();   // ڈیش بورڈ کے نمبر بدلیں
}
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Error fetching employees: ", error);
        body.innerHTML = "Error loading data.";
    }
}
    });
}

async function toggleStatus(id, s) {
    await db.collection("employees").doc(id).update({status: s==='Active'?'Inactive':'Active'});
    fetchEmployees();
}

function showFiltered(s) { currentFilter = s; navTo('listPage'); }
function setupPermissions() {
    const u = JSON.parse(sessionStorage.getItem("currentUser"));
    if(!u) return;
    document.getElementById("btnAdmin").classList.toggle("hidden", u.name !== MASTER_ADMIN);
}
function logout() { sessionStorage.clear(); navTo('loginPage'); }
function togglePass() { const p = document.getElementById("password"); p.type = p.type === "password"?"text":"password"; }

window.onload = () => renderPage(window.location.hash.replace('#', '') || 'loginPage');
