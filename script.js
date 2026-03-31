const firebaseConfig = {
    apiKey: "AIzaSyDrzmh9TbcyuLAG6LkoKERcBuHvQ-sf0oU",
    authDomain: "my-hrm-project-d1aef.firebaseapp.com",
    projectId: "my-hrm-project-d1aef",
    storageBucket: "my-hrm-project-d1aef.appspot.com", // سٹوریج کے لیے
    messagingSenderId: "165053525844",
    appId: "1:165053525844:web:6abc82aca238d9e84862c1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let viewMode = 'all';

// --- FUNCTIONS ---

function navTo(id) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function toggleMenu() { document.getElementById("profileMenu").classList.toggle("hidden"); }

// لاگ ان
async function handleLogin() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    
    // ماسٹر ایڈمن چیک
    if(u === "Meskay" && p === "Pakistan786") {
        currentUser = { name: "Admin", role: "admin" };
        loginSuccess();
        return;
    }

    const snap = await db.collection("users").where("loginU", "==", u).where("pass", "==", p).get();
    if(!snap.empty) {
        currentUser = snap.docs[0].data();
        loginSuccess();
    } else { alert("غلط لاگ ان!"); }
}

function loginSuccess() {
    document.getElementById("navName").innerText = currentUser.name;
    document.getElementById("adminBtn").style.display = (currentUser.role === 'admin') ? 'block' : 'none';
    navTo('dashboardPage');
}

// ایمپلائی ڈیٹا دکھانا
async function showView(mode) {
    viewMode = mode;
    navTo('listPage');
    const body = document.getElementById("empTableBody");
    body.innerHTML = "لوڈنگ...";
    
    let query = db.collection("employees");
    if(mode === 'Active' || mode === 'Inactive') query = query.where("status", "==", mode);
    
    const snap = await query.get();
    body.innerHTML = "";
    snap.forEach(doc => {
        const e = doc.data();
        const sClass = e.status === 'Active' ? 'active-bg' : 'inactive-bg';
        const actionHtml = (mode === 'master') ? 
            `<button class="status-btn ${sClass}" onclick="toggleEmp('${doc.id}','${e.status}')">${e.status}</button>` : 
            `<span class="status-btn ${sClass}">${e.status}</span>`;

        body.innerHTML += `<tr>
            <td>${e.id}</td><td>${e.name}</td><td>${e.des}</td>
            <td>${actionHtml}</td><td>${mode==='master'?'Edit':'View'}</td>
        </tr>`;
    });
}

async function toggleEmp(id, s) {
    await db.collection("employees").doc(id).update({ status: s === 'Active' ? 'Inactive' : 'Active' });
    showView('master');
}

// امیج اپلوڈ (Firebase Storage)
async function uploadImage() {
    const file = document.getElementById("picUpload").files[0];
    if(!file) return;
    const ref = storage.ref('profiles/' + currentUser.loginU);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    document.getElementById("displayPic").src = url;
    document.getElementById("menuPic").src = url;
    alert("تصویر اپڈیٹ ہوگئی!");
}

// یوزر اپڈیٹ (Old vs New Logic)
async function updateUserAccount() {
    const oldU = document.getElementById("oldU").value;
    const oldP = document.getElementById("oldP").value;
    const newU = document.getElementById("updU").value;
    const newP = document.getElementById("updP").value;

    const snap = await db.collection("users").where("loginU", "==", oldU).where("pass", "==", oldP).get();
    if(!snap.empty) {
        await db.collection("users").doc(snap.docs[0].id).update({ loginU: newU, pass: newP });
        alert("اکاؤنٹ اپڈیٹ ہوگیا! دوبارہ لاگ ان کریں۔");
        logout();
    } else { alert("پرانا ڈیٹا غلط ہے!"); }
}

function logout() { location.reload(); }
