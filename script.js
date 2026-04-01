const firebaseConfig = {
    apiKey: "AIzaSyDrzmh9TbcyuLAG6LkoKERcBuHvQ-sf0oU",
    authDomain: "my-hrm-project-d1aef.firebaseapp.com",
    projectId: "my-hrm-project-d1aef",
    storageBucket: "my-hrm-project-d1aef.appspot.com",
    messagingSenderId: "165053525844",
    appId: "1:165053525844:web:6abc82aca238d9e84862c1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

// NAVIGATION
function navTo(id) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'dashboardPage') updateDashboardCounts();
}

function toggleMenu() { document.getElementById("profileMenu").classList.toggle("hidden"); }

// LOGIN LOGIC
async function handleLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    
    if(u === "Meskay" && p === "Pakistan786") {
        currentUser = { name: "Admin", role: "admin", loginU: "Meskay" };
        loginSuccess();
        return;
    }

    const snap = await db.collection("users").where("loginU", "==", u).where("pass", "==", p).get();
    if(!snap.empty) {
        currentUser = snap.docs[0].data();
        loginSuccess();
    } else { alert("Invalid Credentials!"); }
}

function loginSuccess() {
    document.getElementById("navName").innerText = currentUser.name;
    document.getElementById("adminBtn").style.display = (currentUser.role === 'admin') ? 'block' : 'none';
    navTo('dashboardPage');
    loadProfilePic();
}

// UPDATE QUANTITIES ON BUTTONS
async function updateDashboardCounts() {
    const snap = await db.collection("employees").get();
    let all = 0, act = 0, inact = 0;
    snap.forEach(doc => {
        all++;
        if(doc.data().status === 'Active') act++; else inact++;
    });
    document.getElementById("countAll").innerText = all;
    document.getElementById("countActive").innerText = act;
    document.getElementById("countInactive").innerText = inact;
}

// SHOW EMPLOYEES
async function showView(mode) {
    navTo('listPage');
    const body = document.getElementById("empTableBody");
    body.innerHTML = "Syncing...";
    
    let query = db.collection("employees");
    if(mode === 'Active' || mode === 'Inactive') query = query.where("status", "==", mode);
    
    const snap = await query.get();
    body.innerHTML = "";
    snap.forEach(doc => {
        const e = doc.data();
        const sClass = e.status === 'Active' ? 'active-bg' : 'inactive-bg';
        const actionHtml = (mode === 'master') ? 
            `<button class="status-btn ${sClass}" onclick="toggleEmpStatus('${doc.id}','${e.status}')">${e.status}</button>` : 
            `<span class="status-btn ${sClass}">${e.status}</span>`;

        body.innerHTML += `<tr>
            <td>${e.id}</td><td>${e.name.toUpperCase()}</td><td>${e.des}</td>
            <td>${actionHtml}</td><td>${mode==='master'?'Edit':'View'}</td>
        </tr>`;
    });
}

async function toggleEmpStatus(id, s) {
    const newStatus = s === 'Active' ? 'Inactive' : 'Active';
    await db.collection("employees").doc(id).update({ status: newStatus });
    showView('master');
}

// SAVE EMPLOYEE
async function saveEmployee() {
    const emp = {
        id: document.getElementById("eId").value,
        name: document.getElementById("eName").value,
        des: document.getElementById("eDes").value,
        status: "Active"
    };
    await db.collection("employees").add(emp);
    alert("Employee Added!");
    navTo('dashboardPage');
}

// STORAGE: PROFILE PIC
async function uploadImage() {
    const file = document.getElementById("picUpload").files[0];
    if(!file) return;
    const ref = storage.ref('profiles/' + currentUser.loginU);
    await ref.put(file);
    loadProfilePic();
    alert("Photo Updated!");
}

async function loadProfilePic() {
    try {
        const url = await storage.ref('profiles/' + currentUser.loginU).getDownloadURL();
        document.getElementById("navPic").src = url;
        document.getElementById("menuPic").src = url;
    } catch(e) {}
}

// ADMIN: UPDATE USER
async function updateUserAccount() {
    const oldU = document.getElementById("oldU").value;
    const oldP = document.getElementById("oldP").value;
    const newU = document.getElementById("updU").value;
    const newP = document.getElementById("updP").value;

    const snap = await db.collection("users").where("loginU", "==", oldU).where("pass", "==", oldP).get();
    if(!snap.empty) {
        await db.collection("users").doc(snap.docs[0].id).update({ loginU: newU, pass: newP });
        alert("Account Updated! Please Login again.");
        logout();
    } else { alert("Verification Failed!"); }
}

function logout() { location.reload(); }
