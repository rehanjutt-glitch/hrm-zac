// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDrzmh9TbcyuLAG6LkoKERcBuHvQ-sf0oU",
    authDomain: "my-hrm-project-d1aef.firebaseapp.com",
    projectId: "my-hrm-project-d1aef",
    storageBucket: "my-hrm-project-d1aef.appspot.com",
    messagingSenderId: "165053525844",
    appId: "1:165053525844:web:6abc82aca238d9e84862c1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = null;
let calcMode = 'monthly';

// --- Page Load / Refresh Handler ---
// یہ فنکشن پیج ریفریش ہونے پر چیک کرے گا کہ یوزر پہلے سے لاگ ان ہے یا نہیں اور کس پیج پر تھا
window.addEventListener('load', () => {
    const savedUser = sessionStorage.getItem("hrm_user");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById("navName").innerText = currentUser.name;
        applyPermissions();
        
        // ہیش چیک کریں، اگر ہیش موجود ہے تو اسی پیج پر لے جائے، ورنہ ڈیش بورڈ پر
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash && document.getElementById(currentHash)) {
            navTo(currentHash);
        } else {
            navTo('dashboardPage');
        }
    } else {
        // اگر لاگ ان نہیں ہے تو صرف لاگ ان پیج دکھائے اور ہیش صاف کر دے
        window.location.hash = '';
        navTo('loginPage');
    }
});

// --- Auth & Login ---
async function handleLogin() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    // Master Admin Check
    if (u === "Meskay" && p === "Pakistan786") {
        currentUser = { name: "Admin", role: "admin", access: ['view', 'add', 'edit', 'salary', 'reports'] };
        return loginOk();
    }

    // Check Users from DB
    const userSnap = await db.collection("users").where("username", "==", u).where("password", "==", p).get();
    if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        currentUser = { name: userData.fullName, role: "user", access: userData.permissions };
        return loginOk();
    }

    alert("Invalid Credentials!");
}

function loginOk() {
    document.getElementById("navName").innerText = currentUser.name;
    
    // یوزر کا ڈیٹا سیشن میں سیو کریں تاکہ ریفریش پر لاگ آؤٹ نہ ہو
    sessionStorage.setItem("hrm_user", JSON.stringify(currentUser));
    
    applyPermissions();
    navTo('dashboardPage');
}

function handleLogout() {
    // سیشن صاف کریں اور لاگ آؤٹ کر دیں
    sessionStorage.removeItem("hrm_user");
    window.location.hash = '';
    location.reload();
}

function applyPermissions() {
    const btns = document.querySelectorAll('.menu-btn');
    btns.forEach(btn => {
        const req = btn.getAttribute('data-access');
        if (req && !currentUser.access.includes(req)) {
            btn.classList.add('hidden');
        } else {
            btn.classList.remove('hidden');
        }
    });

    // Admin only button visibility
    if (currentUser.role === 'admin') {
        document.getElementById("adminOnlyBtn").classList.remove('hidden');
    } else {
        document.getElementById("adminOnlyBtn").classList.add('hidden');
    }
}

// --- Navigation with URL Hash ---
function navTo(id) {
    // لاگ ان کے بغیر کسی پیج پر جانے کی کوشش کو روکنے کے لیے
    if (!currentUser && id !== 'loginPage') {
        id = 'loginPage';
    }

    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    // یو ار ایل میں ہیش (#) سیٹ کرنا
    if (id !== 'loginPage') {
        window.location.hash = id;
    }

    if(id === 'dashboardPage') updateCounts();
    if(id === 'salaryPage' || id === 'reportPage') loadEmpDropdowns();
    if(id === 'userAdminPage') loadUsers();
}

// --- User Management (Admin Panel) ---
async function createNewUser() {
    const fn = document.getElementById("newFullNm").value;
    const un = document.getElementById("newUserNm").value;
    const up = document.getElementById("newUserPs").value;
    const perms = Array.from(document.querySelectorAll('.acc-check:checked')).map(cb => cb.value);

    if(!fn || !un || !up) return alert("All fields are required!");

    await db.collection("users").add({
        fullName: fn,
        username: un,
        password: up,
        permissions: perms
    });
    alert("User Created!");
    loadUsers();
}

async function loadUsers() {
    const body = document.getElementById("userListBody");
    body.innerHTML = "Loading...";
    const snap = await db.collection("users").get();
    body.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        body.innerHTML += `<tr>
            <td>${d.fullName}</td>
            <td>${d.username}</td>
            <td><small>${d.permissions.join(', ')}</small></td>
            <td><button class="btn-red" style="padding:5px;" onclick="deleteUser('${doc.id}')">Delete</button></td>
        </tr>`;
    });
}

async function deleteUser(id) {
    if(confirm("Delete this user?")) {
        await db.collection("users").doc(id).delete();
        loadUsers();
    }
}

// --- Helpers & UI Toggles ---
function togglePass() {
    const p = document.getElementById("password");
    p.type = p.type === "password" ? "text" : "password";
}

function toggleMenu() { 
    document.getElementById("profileMenu").classList.toggle("hidden"); 
}

// --- Salary Calculator ---
function setCalcMode(mode) {
    calcMode = mode;
    document.getElementById("btnMonthly").classList.toggle("active-type", mode === 'monthly');
    document.getElementById("btnDaily").classList.toggle("active-type", mode === 'daily');
    document.getElementById("baseAmount").placeholder = mode === 'monthly' ? "Monthly Fix Salary" : "Daily Wage Rate";
    autoCalc();
}

function autoCalc() {
    const sVal = document.getElementById("startDate").value;
    const eVal = document.getElementById("endDate").value;
    const amount = parseFloat(document.getElementById("baseAmount").value) || 0;
    if (sVal && eVal) {
        const s = new Date(sVal);
        const e = new Date(eVal);
        const days = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById("displayDays").innerText = days;
        if (calcMode === 'monthly') {
            const daysInMonth = new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
            document.getElementById("monthInfo").innerText = `(Dividing by ${daysInMonth} days)`;
            document.getElementById("displayTotal").innerText = Math.round((amount / daysInMonth) * days);
        } else {
            document.getElementById("monthInfo").innerText = "";
            document.getElementById("displayTotal").innerText = amount * days;
        }
    }
}

async function saveSalary() {
    const empRefId = document.getElementById("salEmpList").value;
    const empSnap = await db.collection("employees").doc(empRefId).get();
    const empData = empSnap.data();
    const t = document.getElementById("displayTotal").innerText;
    if(t == "0") return alert("Calculate first!");
    await db.collection("salaries").add({
        empName: empData.name,
        empId: empData.id,
        phone: empData.phone || 'N/A',
        bank: empData.bank || '',
        acc: empData.acc || '',
        total: t,
        days: document.getElementById("displayDays").innerText,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        dateKey: document.getElementById("endDate").value.substring(0,7)
    });
    alert("Salary Saved!"); 
    navTo('dashboardPage');
}

// --- Stats Counter ---
async function updateCounts() {
    const snap = await db.collection("employees").get();
    let all = 0, act = 0, inact = 0;
    snap.forEach(doc => { 
        all++; 
        if(doc.data().status === 'Active') act++; 
        else inact++;
    });
    document.getElementById("cntAll").innerText = all;
    document.getElementById("cntActive").innerText = act;
    document.getElementById("cntInactive").innerText = inact;
}

// --- Dropdown Population ---
async function loadEmpDropdowns() {
    const salSel = document.getElementById("salEmpList");
    const repSel = document.getElementById("repEmpList");
    salSel.innerHTML = "";
    repSel.innerHTML = '<option value="all">-- Full Staff --</option>';
    const snap = await db.collection("employees").where("status","==","Active").get();
    snap.forEach(doc => {
        const data = doc.data();
        salSel.innerHTML += `<option value="${doc.id}">${data.name} (${data.id})</option>`;
        repSel.innerHTML += `<option value="${data.name}">${data.name}</option>`;
    });
}

// --- Reports & Slip Generation ---
async function generateReport() {
    const m = document.getElementById("repMonth").value;
    const selectedEmp = document.getElementById("repEmpList").value;
    const area = document.getElementById("printArea");
    if (!m) return alert("Please select a month first!");
    let query = db.collection("salaries").where("dateKey", "==", m);
    if (selectedEmp !== "all") query = query.where("empName", "==", selectedEmp);
    const snap = await query.get();
    area.innerHTML = snap.empty ? "<h3>No Records Found</h3>" : "";
    if (snap.empty) return;
    if (selectedEmp === "all") {
        let tableHtml = `<div class="slip-card" style="width:95%; border:none;"><h2 style="text-align:center; border-bottom:3px solid #000; padding-bottom:10px;">MESKAY & FEMTEE - STAFF SALARY LIST (${m})</h2><table style="width:100%; margin-top:10px;"><thead><tr style="background:#eee;"><th style="width:12%;">ID No</th><th>Employee Name</th><th>Days</th><th>Salary Amount</th><th>Receiving Sign</th></tr></thead><tbody>`;
        let grandTotal = 0;
        snap.forEach(doc => {
            const s = doc.data(); grandTotal += parseInt(s.total);
            tableHtml += `<tr><td style="font-weight:bold;">${s.empId || '-'}</td><td style="text-align:left; padding-left:10px;">${s.empName}</td><td>${s.days}</td><td style="font-weight:bold;">${s.total} PKR</td><td style="height:45px; border: 2px solid #000;"></td></tr>`;
        });
        tableHtml += `<tr style="background:#f9f9f9; font-weight:bold;"><td colspan="3" style="text-align:right;">GRAND TOTAL:</td><td>${grandTotal} PKR</td><td></td></tr></tbody></table><div class="sig-container" style="margin-top:30px;"><div class="sig-box">Verified By (Admin)</div><div class="sig-box">Manager/Authorized Signature</div></div></div>`;
        area.innerHTML = tableHtml;
    } else {
        snap.forEach(doc => {
            const s = doc.data();
            let bankInfo = (s.bank || s.acc) ? `<p><strong>Bank:</strong> ${s.bank} | <strong>A/C:</strong> ${s.acc}</p>` : '';
            area.innerHTML += `<div class="slip-card"><div style="text-align:center; border-bottom:2px solid #000; margin-bottom:10px;"><h2 style="margin:5px;">MESKAY & FEMTEE</h2><p style="margin:5px;">Monthly Salary Slip</p></div><p><strong>Employee ID:</strong> <span style="font-size:1.3em; font-weight:bold; background:#eee; padding:2px 8px; border:1px solid #000;">${s.empId || '-'}</span></p><p><strong>Full Name:</strong> ${s.empName}</p><p><strong>Phone:</strong> ${s.phone}</p>${bankInfo}<p><strong>Period:</strong> ${s.startDate} to ${s.endDate} (${s.days} Days)</p><div style="background:#eee; padding:12px; border:2px solid #000; margin-top:10px;"><h3 style="margin:0; text-align:center;">NET PAYABLE: ${s.total} PKR</h3></div><div class="sig-container"><div class="sig-box">Prepared By (Admin)</div><div class="sig-box">Employee Signature</div></div></div>`;
        });
    }
}

// --- View Employee Records ---
async function showView(mode) {
    navTo('listPage');
    const b = document.getElementById("empTableBody"); b.innerHTML = "";
    const isUpdate = mode === 'update';
    if(mode === 'Inactive') document.getElementById("listTitle").innerText = "Inactive Staff Records";
    else if(mode === 'Active') document.getElementById("listTitle").innerText = "Active Staff Records";
    else document.getElementById("listTitle").innerText = "Employee Records";
    document.getElementById("tableHead").innerHTML = `<tr><th>ID</th><th>Name</th><th>Phone</th><th>Status</th>${isUpdate ? '<th>Actions</th>' : ''}</tr>`;
    const snap = await db.collection("employees").get();
    snap.forEach(doc => {
        const e = doc.data(); const docId = doc.id;
        if(mode === 'all' || e.status === mode || isUpdate) {
            let actionBtn = "";
            if(isUpdate) {
                actionBtn = `<td><button onclick="editEmp('${docId}')" style="background:#2196f3; color:white; border:none; padding:5px 10px; cursor:pointer; margin-right:5px; border-radius:3px; font-weight:bold;">Edit</button><button onclick="delEmp('${docId}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; font-weight:bold;">Delete</button></td>`;
            }
            const statusColor = e.status === 'Active' ? 'green' : 'red';
            b.innerHTML += `<tr><td>${e.id}</td><td>${e.name}</td><td>${e.phone || '-'}</td><td style="color:${statusColor}; font-weight:bold;">${e.status}</td>${actionBtn}</tr>`;
        }
    });
}

// --- CRUD Operations for Employee ---
async function editEmp(docId) {
    const doc = await db.collection("employees").doc(docId).get();
    const data = doc.data();
    document.getElementById("editDocId").value = docId;
    document.getElementById("editEmpId").value = data.id;
    document.getElementById("editEmpName").value = data.name;
    document.getElementById("editEmpPhone").value = data.phone || '';
    document.getElementById("editEmpBank").value = data.bank || '';
    document.getElementById("editEmpAcc").value = data.acc || '';
    document.getElementById("editEmpStatus").value = data.status;
    navTo('editPage');
}

async function updateEmployeeData() {
    const docId = document.getElementById("editDocId").value;
    const updatedData = {
        id: document.getElementById("editEmpId").value,
        name: document.getElementById("editEmpName").value,
        phone: document.getElementById("editEmpPhone").value,
        bank: document.getElementById("editEmpBank").value,
        acc: document.getElementById("editEmpAcc").value,
        status: document.getElementById("editEmpStatus").value
    };
    if(!updatedData.id || !updatedData.name) return alert("ID and Name are required!");
    await db.collection("employees").doc(docId).update(updatedData);
    alert("Employee Details Updated!"); 
    showView('update');
}

async function delEmp(id) { 
    if(confirm("Are you sure?")) { 
        await db.collection("employees").doc(id).delete(); 
        showView('update'); 
    } 
}

async function saveNewEmployee() {
    const id = document.getElementById("newEmpId").value;
    const name = document.getElementById("newEmpName").value;
    const phone = document.getElementById("newEmpPhone").value;
    const bank = document.getElementById("newEmpBank").value;
    const acc = document.getElementById("newEmpAcc").value;
    const status = document.getElementById("newEmpStatus").value;
    if(!id || !name) return alert("ID and Name are required!");
    await db.collection("employees").add({ id, name, phone, bank, acc, status });
    alert("Employee Added Successfully!"); 
    navTo('dashboardPage');
}
