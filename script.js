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

// fetchEmployees کے لوپ کے اندر یہ والا حصہ اپڈیٹ کریں
snap.forEach(doc => {
    const e = doc.data();
    const currentStatus = e.status || "Active";
    
    // رنگ اور نام کا فیصلہ یہاں ہوگا
    let statusColor = currentStatus === 'Active' ? '#28a745' : '#dc3545'; // سبز اور سرخ
    let btnText = currentStatus === 'Active' ? 'SET INACTIVE' : 'SET ACTIVE';

    body.innerHTML += `
        <tr class="${currentStatus === 'Active' ? 'active-row' : 'inactive-row'}">
            <td>${e.id}</td>
            <td>
                ${e.name.toUpperCase()} <br>
                <span style="color: ${statusColor}; font-weight: bold; font-size: 10px;">
                    ● ${currentStatus.toUpperCase()}
                </span>
            </td>
            <td>${e.des}</td>
            <td>${e.pho}</td>
            <td>
                <button class="action-btn" 
                        style="background: ${statusColor}; border: none; color: white; padding: 5px 10px; cursor: pointer;" 
                        onclick="toggleStatus('${doc.id}','${currentStatus}')">
                    ${btnText}
                </button>
            </td>
        </tr>`;
});

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

async function createNewUser() {
    const n = document.getElementById("newU").value.trim();
    const p = document.getElementById("newP").value.trim();
    const canAdd = document.getElementById("pAdd").checked;
    const canDel = document.getElementById("pDel").checked;

    if(!n || !p) return alert("براہ کرم یوزر نیم اور پاسورڈ لکھیں!");

    try {
        await db.collection("users").add({
            name: n,
            pass: p,
            role: 'user', 
            pAdd: canAdd, 
            pDel: canDel
        });
        alert("USER SAVED SUCCESSFULLY!");
        
        // خانے خالی کر دیں
        document.getElementById("newU").value = "";
        document.getElementById("newP").value = "";
        fetchUsers(); // لسٹ اپڈیٹ کریں
    } catch (error) {
        console.error("Error saving user: ", error);
        alert("سیو کرنے میں غلطی ہوئی!");
    }
}
