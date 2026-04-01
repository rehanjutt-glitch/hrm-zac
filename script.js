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

// NAVIGATION WITH URL HASH
function navTo(id) {
    window.location.hash = id;
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'dashboardPage') updateCounts();
    if(id === 'salaryPage') loadEmpToSelect();
}

window.onhashchange = () => {
    const page = window.location.hash.replace('#','') || 'loginPage';
    navTo(page);
};

// PASSWORD EYE TOGGLE
function togglePassView() {
    const p = document.getElementById("password");
    const eye = document.getElementById("toggleEye");
    if(p.type === "password") {
        p.type = "text"; eye.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        p.type = "password"; eye.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// LOGIN
async function handleLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    
    // Master Admin
    if(u === "Meskay" && p === "Pakistan786") {
        currentUser = { name: "Admin", role: "admin", loginU: "Meskay", docId: 'master' };
        loginOk(); return;
    }

    const snap = await db.collection("users").where("loginU","==",u).where("pass","==",p).get();
    if(!snap.empty) {
        currentUser = snap.docs[0].data();
        currentUser.docId = snap.docs[0].id;
        loginOk();
    } else { alert("Login Failed!"); }
}

function loginOk() {
    document.getElementById("navName").innerText = currentUser.name;
    applyAccess();
    navTo('dashboardPage');
    loadProfilePic();
}

function applyAccess() {
    const r = currentUser.role;
    document.getElementById("adminLink").style.display = (r === 'admin') ? 'block' : 'none';
    document.getElementById("addBtn").style.display = (r === 'user') ? 'none' : 'block';
    document.getElementById("updBtn").style.display = (r === 'user') ? 'none' : 'block';
}

// DASHBOARD COUNTS
async function updateCounts() {
    const snap = await db.collection("employees").get();
    let all = 0, act = 0, inact = 0;
    snap.forEach(doc => {
        all++;
        if(doc.data().status === 'Active') act++; else inact++;
    });
    document.getElementById("cntAll").innerText = all;
    document.getElementById("cntActive").innerText = act;
    document.getElementById("cntInactive").innerText = inact;
}

// EMPLOYEE VIEW / UPDATE
async function showView(mode) {
    navTo('listPage');
    const body = document.getElementById("empTableBody");
    body.innerHTML = "Loading...";
    
    let query = db.collection("employees");
    if(mode === 'Active' || mode === 'Inactive') query = query.where("status","==",mode);
    
    const snap = await query.get();
    body.innerHTML = "";
    snap.forEach(doc => {
        const e = doc.data();
        const sClass = e.status === 'Active' ? 'active-text' : 'inactive-text';
        const action = (mode === 'update') ? 
            `<button onclick="changeStatus('${doc.id}','${e.status}')">Toggle Status</button>` : 'View Only';
        
        body.innerHTML += `<tr class="${e.status==='Active'?'active-row':'inactive-row'}">
            <td>${e.id}</td><td>${e.name}</td><td class="${sClass}">${e.status}</td><td>${action}</td>
        </tr>`;
    });
}

async function changeStatus(id, s) {
    await db.collection("employees").doc(id).update({ status: s==='Active'?'Inactive':'Active' });
    showView('update');
}

// SALARY CALCULATION
async function loadEmpToSelect() {
    const sel = document.getElementById("salEmpList");
    sel.innerHTML = "";
    const snap = await db.collection("employees").where("status","==","Active").get();
    snap.forEach(doc => {
        sel.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
    });
}

async function calcSalary() {
    const id = document.getElementById("salEmpList").value;
    const days = document.getElementById("salDays").value;
    const wages = document.getElementById("salWages").value;
    const date = document.getElementById("salDateCal").value || document.getElementById("salDateMan").value;
    const total = days * wages;
    
    if(!id || !date) return alert("Select Employee and Date");

    await db.collection("salaries").add({
        empId: id,
        date: date,
        days: days,
        wages: wages,
        total: total,
        empName: document.getElementById("salEmpList").options[document.getElementById("salEmpList").selectedIndex].text
    });
    alert("Salary Saved: " + total);
    navTo('dashboardPage');
}

// REPORTS
async function generateReport() {
    const month = document.getElementById("reportMonth").value; // YYYY-MM
    const area = document.getElementById("printArea");
    area.innerHTML = "Generating...";
    
    const snap = await db.collection("salaries").get();
    area.innerHTML = `<h2>Report for ${month}</h2>`;
    
    snap.forEach(doc => {
        const s = doc.data();
        if(s.date.includes(month)) {
            area.innerHTML += `
            <div class="slip-card">
                <h3>Salary Slip</h3>
                <p>Employee: ${s.empName}</p>
                <p>Date: ${s.date}</p>
                <p>Days: ${s.days} | Rate: ${s.wages}</p>
                <hr>
                <h4>Total Payable: ${s.total}</h4>
            </div>`;
        }
    });
}

// PROFILE & ADMIN
async function uploadPhoto() {
    const file = document.getElementById("picInput").files[0];
    const ref = storage.ref('profiles/' + currentUser.loginU);
    await ref.put(file);
    loadProfilePic();
}

async function loadProfilePic() {
    try {
        const url = await storage.ref('profiles/' + currentUser.loginU).getDownloadURL();
        document.getElementById("navPic").src = url;
        document.getElementById("menuPic").src = url;
    } catch(e){}
}

async function updateMyProfile() {
    const oldP = document.getElementById("myOldPass").value;
    const nName = document.getElementById("myNewName").value;
    const nPass = document.getElementById("myNewPass").value;

    if(oldP !== currentUser.pass && currentUser.loginU !== 'Meskay') return alert("Old Password Wrong!");
    
    await db.collection("users").doc(currentUser.docId).update({ name: nName, pass: nPass });
    alert("Profile Updated! Login again.");
    logout();
}

function logout() { location.hash = ''; location.reload(); }
function toggleProfileMenu() { document.getElementById("profileMenu").classList.toggle("hidden"); }
