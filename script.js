// 1. FIREBASE SDK IMPORTS (جاوا اسکرپٹ کے لنکس)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// اپنی فائر بیس کی کریڈینشلز (Credentials) یہاں ڈالیں
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// گلوبل ویری ایبلز (Current State)
let currentUser = null;
let currentCalcMode = 'monthly'; 

// ==========================================
// 2. NAVIGATION & URL SLASH/HASH HANDLING
// ==========================================
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
    handleRouting();
    if (currentUser) updateDashboardStats();
});

function handleRouting() {
    const hash = window.location.hash || '#loginPage';
    
    // اگر صارف لاگ ان نہیں ہے تو زبردستی لاگ ان پیج پر بھیجیں
    if (!currentUser && hash !== '#loginPage') {
        window.location.hash = '#loginPage';
        return;
    }

    // تمام کنٹینرز کو چھپائیں
    document.querySelectorAll('.container').forEach(div => div.classList.add('hidden'));

    // یو آر ایل ہیش کے حساب سے صحیح پیج دکھائیں
    if (hash === '#loginPage' && !currentUser) {
        document.getElementById('loginPage').classList.remove('hidden');
    } else if (hash === '#dashboardPage') {
        document.getElementById('dashboardPage').classList.remove('hidden');
    } else if (hash === '#userAdminPage' && currentUser?.access?.includes('admin')) {
        document.getElementById('userAdminPage').classList.remove('hidden');
        loadUserList();
    } else if (hash === '#addPage' && currentUser?.access?.includes('add')) {
        document.getElementById('addPage').classList.remove('hidden');
    } else if (hash === '#salaryPage' && currentUser?.access?.includes('salary')) {
        document.getElementById('salaryPage').classList.remove('hidden');
        populateEmployeeDropdown('salEmpList');
    } else if (hash === '#reportPage' && currentUser?.access?.includes('reports')) {
        document.getElementById('reportPage').classList.remove('hidden');
        populateEmployeeDropdown('repEmpList');
    } else {
        // اگر ایکسیس نہ ہو یا غلط یو آر ایل ہو تو ڈیش بورڈ پر واپس بھیجیں
        window.location.hash = '#dashboardPage';
    }
}

function navTo(pageId) {
    window.location.hash = '#' + pageId;
}

// ==========================================
// 3. AUTHENTICATION & ACCESS CONTROL
// ==========================================
window.togglePass = function() {
    const passInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    if (passInput.type === "password") {
        passInput.type = "text";
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = "password";
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

window.handleLogin = async function() {
    const userNm = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    if (!userNm || !pass) {
        alert("Please enter both Username and Password.");
        return;
    }

    try {
        // فائر بیس سے یوزر ڈیٹا چیک کرنا
        const userRef = doc(db, "system_users", userNm);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().password === pass) {
            currentUser = userSnap.data();
            document.getElementById('navName').innerText = currentUser.fullName;
            
            // مینیجر/اسٹاف کے لیے ایڈمن بٹن چھپانا
            if (currentUser.role === 'admin') {
                document.getElementById('adminOnlyBtn').style.display = 'block';
                currentUser.access = ['view', 'add', 'edit', 'salary', 'reports', 'admin'];
            } else {
                document.getElementById('adminOnlyBtn').style.display = 'none';
            }

            // رول کے حساب سے ڈیش بورڈ بٹنز کو فلٹر کرنا
            applyAccessControl();
            
            // ڈیش بورڈ پر منتقل کریں
            navTo('dashboardPage');
            updateDashboardStats();
        } else {
            alert("Invalid Username or Password!");
        }
    } catch (error) {
        console.error("Login Error: ", error);
        alert("Error connecting to database.");
    }
};

function applyAccessControl() {
    document.querySelectorAll('#mainMenuGrid .menu-btn').forEach(btn => {
        const requiredAccess = btn.getAttribute('data-access');
        if (requiredAccess && !currentUser.access.includes(requiredAccess)) {
            btn.style.display = 'none'; // اگر اجازت نہیں ہے تو بٹن چھپا دیں
        } else {
            btn.style.display = 'block';
        }
    });
}

window.toggleMenu = function() {
    document.getElementById('profileMenu').classList.toggle('hidden');
};

// ==========================================
// 4. ADMIN PANEL: CREATE USERS
// ==========================================
window.createNewUser = async function() {
    const fullName = document.getElementById('newFullNm').value.trim();
    const username = document.getElementById('newUserNm').value.trim();
    const password = document.getElementById('newUserPs').value;
    
    const permissions = [];
    document.querySelectorAll('.acc-check:checked').forEach(cb => permissions.push(cb.value));

    if (!fullName || !username || !password) {
        alert("All fields are required!");
        return;
    }

    try {
        await setDoc(doc(db, "system_users", username), {
            fullName: fullName,
            username: username,
            password: password,
            role: permissions.includes('admin') ? 'admin' : 'staff',
            access: permissions
        });
        alert("User Created Successfully!");
        loadUserList();
    } catch (error) {
        alert("Failed to create user: " + error.message);
    }
};

async function loadUserList() {
    const tbody = document.getElementById('userListBody');
    tbody.innerHTML = "<tr><td colspan='4'>Loading Users...</td></tr>";
    
    const querySnapshot = await getDocs(collection(db, "system_users"));
    tbody.innerHTML = "";
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        tbody.innerHTML += `
            <tr>
                <td>${data.fullName}</td>
                <td>${data.username}</td>
                <td>${data.access.join(', ')}</td>
                <td><button class='main-btn btn-red' style='padding:5px 10px' onclick="deleteUser('${doc.id}')">Remove</button></td>
            </tr>`;
    });
}

// ==========================================
// 5. EMPLOYEE MANAGEMENT (ADD / STATS)
// ==========================================
window.saveNewEmployee = async function() {
    const empId = document.getElementById('newEmpId').value.trim();
    const name = document.getElementById('newEmpName').value.trim();
    const phone = document.getElementById('newEmpPhone').value.trim();
    const bank = document.getElementById('newEmpBank').value.trim();
    const acc = document.getElementById('newEmpAcc').value.trim();
    const status = document.getElementById('newEmpStatus').value;

    if (!empId || !name || !phone) {
        alert("ID, Name and Phone are mandatory!");
        return;
    }

    try {
        await setDoc(doc(db, "employees", empId), {
            empId, name, phone, bank, acc, status
        });
        alert("Employee Saved Successfully!");
        navTo('dashboardPage');
        updateDashboardStats();
    } catch (error) {
        alert("Error saving employee.");
    }
};

async function updateDashboardStats() {
    const snapshot = await getDocs(collection(db, "employees"));
    let total = 0, active = 0, inactive = 0;

    snapshot.forEach(doc => {
        total++;
        if (doc.data().status === 'Active') active++;
        else inactive++;
    });

    document.getElementById('cntAll').innerText = total;
    document.getElementById('cntActive').innerText = active;
    document.getElementById('cntInactive').innerText = inactive;
}

// ==========================================
// 6. PAYROLL & SALARY CALCULATOR LOGIC
// ==========================================
window.setCalcMode = function(mode) {
    currentCalcMode = mode;
    document.getElementById('btnMonthly').classList.toggle('active-type', mode === 'monthly');
    document.getElementById('btnDaily').classList.toggle('active-type', mode === 'daily');
    
    if(mode === 'daily') {
        document.getElementById('baseAmount').placeholder = "Enter Daily Wages Rate";
    } else {
        document.getElementById('baseAmount').placeholder = "Enter Monthly Fixed Salary";
    }
    autoCalc();
};

window.autoCalc = function() {
    const start = new Date(document.getElementById('startDate').value);
    const end = new Date(document.getElementById('endDate').value);
    const baseAmount = parseFloat(document.getElementById('baseAmount').value) || 0;

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        document.getElementById('displayDays').innerText = "0";
        document.getElementById('displayTotal').innerText = "0";
        return;
    }

    // دنوں کا فرق معلوم کرنا (Days worked)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    document.getElementById('displayDays').innerText = diffDays;

    let totalPayable = 0;

    if (currentCalcMode === 'daily') {
        // ڈیلی ویجز کے حساب سے: جتنے دن کام کیا ملٹی پلائی بائے روزانہ کی اجرت
        totalPayable = diffDays * baseAmount;
        document.getElementById('monthInfo').innerText = `Daily Wager Base: ${baseAmount} x ${diffDays} days`;
    } else {
        // ماہانہ تنخواہ کے حساب سے (بشمول چھٹیوں کی کٹوتی)
        // فرض کریں مہینہ 30 دن کا ہے، تو فی دن کی کٹوتی کا حساب:
        const currentMonthDays = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const totalAbsentDays = currentMonthDays - diffDays; // 30 دنوں میں سے کام کیے گئے دن نکال کر غیر حاضری معلوم کریں

        if (totalAbsentDays > 0) {
            const perDayDeduction = baseAmount / currentMonthDays;
            totalPayable = baseAmount - (perDayDeduction * totalAbsentDays);
            document.getElementById('monthInfo').innerText = `Month Days: ${currentMonthDays} | Deducted Days: ${totalAbsentDays}`;
        } else {
            totalPayable = baseAmount;
            document.getElementById('monthInfo').innerText = `Full month salary paid.`;
        }
    }

    document.getElementById('displayTotal').innerText = Math.max(0, Math.round(totalPayable));
};

async function populateEmployeeDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = dropdownId === 'repEmpList' ? '<option value="all">-- Full Staff --</option>' : '';
    
    const snapshot = await getDocs(collection(db, "employees"));
    snapshot.forEach(doc => {
        if (doc.data().status === 'Active') {
            dropdown.innerHTML += `<option value="${doc.id}">${doc.data().name} (${doc.id})</option>`;
        }
    });
}

window.saveSalary = async function() {
    const empId = document.getElementById('salEmpList').value;
    const amount = document.getElementById('displayTotal').innerText;
    const dateFrom = document.getElementById('startDate').value;
    const dateTo = document.getElementById('endDate').value;

    if (!empId || amount == "0") {
        alert("Please calculate a valid payroll amount first.");
        return;
    }

    try {
        await addDoc(collection(db, "salary_slips"), {
            empId, amount, dateFrom, dateTo, generatedAt: new Date().toISOString()
        });
        alert("Salary details uploaded to cloud storage!");
        navTo('dashboardPage');
    } catch (error) {
        alert("Error saving payroll to cloud.");
    }
};
