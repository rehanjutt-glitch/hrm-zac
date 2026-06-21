import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// !!! AGAR AAPKE PAAS FIREBASE DATA HAI TO YAHA DAALEIN, WARNA ISKO AISE HI CHHOD DEIN !!!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
};

// Safe Firebase Initialization (Agar config nahi bhi hogi, to code crash nahi hoga)
let app, db;
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase Connected Successfully.");
    } else {
        console.warn("Firebase config not set. Running in Local-Only Mode.");
    }
} catch (e) {
    console.error("Firebase Init Failed:", e);
}

// Permanent Login Settings
let systemAdminUser = {
    username: "admin",
    password: "12345",
    realName: "Permanent Admin",
    role: "Admin",
    profilePicture: "https://via.placeholder.com/120"
};

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggle('toggleLoginPassword', 'password');
    setupPasswordToggle('toggleProfilePassword', 'profileNewPassword');

    if (currentUser) {
        showDashboard();
    } else {
        showLogin();
    }
    initLogin();
});

function setupPasswordToggle(iconId, inputId) {
    const icon = document.getElementById(iconId);
    const input = document.getElementById(inputId);
    if(icon && input) {
        icon.addEventListener('click', () => {
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = "password";
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    initDashboard();
}

/* ==========================================================================
   1. AUTH MODULE (Local Bypass First - 100% Works)
   ========================================================================== */
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userVal = document.getElementById('username').value.trim();
        const passVal = document.getElementById('password').value;

        // 🌟 1. SABSE PEHLE LOCAL BYPASS CHECK (No Firebase Required)
        if (userVal === systemAdminUser.username && passVal === systemAdminUser.password) {
            currentUser = {
                username: systemAdminUser.username,
                realName: systemAdminUser.realName,
                role: systemAdminUser.role
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
            return;
        }

        // 2. AGAR KOI AUR USER HAI TO FIREBASE SE CHECK KAREIN
        if (db) {
            try {
                const userRef = doc(db, "users", userVal);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && userSnap.data().password === passVal) {
                    const uData = userSnap.data();
                    currentUser = {
                        username: uData.username,
                        realName: uData.realName,
                        role: uData.role
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    showDashboard();
                } else {
                    alert("Incorrect Username or Password.");
                }
            } catch (err) {
                console.error("Firebase Query Error:", err);
                alert("Database Error. Try logging in with 'admin' and '12345'.");
            }
        } else {
            alert("Database not connected. Use 'admin' and '12345' to login locally.");
        }
    });
}

/* ==========================================================================
   2. DASHBOARD FRAMEWORK
   ========================================================================== */
function initDashboard() {
    renderHeaderProfile();

    document.getElementById('logoutBtn').onclick = () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        showLogin();
    };

    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        };
    });

    if (currentUser.role === 'Admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.manager-only').forEach(el => el.style.display = 'block');
        loadAdminUsersTable();
        loadAllTeamLeaveRequests();
    } else if (currentUser.role === 'Manager') {
        document.querySelectorAll('.manager-only').forEach(el => el.style.display = 'block');
        loadAllTeamLeaveRequests();
    }

    initProfileTab();
    initAttendanceTab();
    initLeaveTab();
    if (currentUser.role === 'Admin') {
        initAdminUsersTab();
        initPayrollTab();
    }
}

async function renderHeaderProfile() {
    if(currentUser.username === "admin") {
        document.getElementById('headerRealName').innerText = systemAdminUser.realName;
        document.getElementById('headerRole').innerText = systemAdminUser.role;
        document.getElementById('headerProfilePic').src = systemAdminUser.profilePicture;
    } else if (db) {
        try {
            const snap = await getDoc(doc(db, "users", currentUser.username));
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById('headerRealName').innerText = d.realName;
                document.getElementById('headerRole').innerText = d.role;
                if(d.profilePicture) document.getElementById('headerProfilePic').src = d.profilePicture;
            }
        } catch(e) { console.log(e); }
    }
}

/* ==========================================================================
   3. SELF PROFILE EDITOR
   ========================================================================== */
async function initProfileTab() {
    document.getElementById('profileUsername').value = currentUser.username;
    
    if(currentUser.username === "admin") {
        document.getElementById('profileRealName').value = systemAdminUser.realName;
        document.getElementById('profilePreview').src = systemAdminUser.profilePicture;
        document.getElementById('profilePicUrl').value = systemAdminUser.profilePicture;
    } else if (db) {
        try {
            const snap = await getDoc(doc(db, "users", currentUser.username));
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById('profileRealName').value = d.realName;
                if(d.profilePicture) {
                    document.getElementById('profilePreview').src = d.profilePicture;
                    document.getElementById('profilePicUrl').value = d.profilePicture;
                }
            }
        } catch(e) { console.log(e); }
    }

    // Dynamic URL Box Preview
    document.getElementById('profilePicUrl').addEventListener('input', (e) => {
        if(e.target.value.trim() !== "") {
            document.getElementById('profilePreview').src = e.target.value;
        }
    });

    document.getElementById('updateProfileBtn').onclick = async () => {
        const newPass = document.getElementById('profileNewPassword').value;
        const picUrl = document.getElementById('profilePicUrl').value;

        if(currentUser.username === "admin") {
            if(newPass) systemAdminUser.password = newPass;
            systemAdminUser.profilePicture = picUrl;
            alert("Local Admin changes saved successfully!");
        } else if (db) {
            const payload = { profilePicture: picUrl };
            if (newPass) payload.password = newPass;
            await setDoc(doc(db, "users", currentUser.username), payload, { merge: true });
            alert("User settings written to database.");
        }
        renderHeaderProfile();
    };
}

/* ==========================================================================
   4. ATTENDANCE LOG
   ========================================================================== */
function initAttendanceTab() {
    const today = new Date().toISOString().split('T')[0];
    const dateTxt = document.getElementById('currentDateText');
    if(dateTxt) dateTxt.innerText = today;

    document.getElementById('markAttendanceBtn').onclick = async () => {
        if (!db) { alert("Local mode active: Attendance cannot be saved without Firebase configuration."); return; }
        try {
            const docId = `${currentUser.username}_${today}`;
            await setDoc(doc(db, "attendance", docId), {
                username: currentUser.username,
                date: today,
                status: "Present"
            });
            document.getElementById('attendanceStatus').style.display = 'block';
        } catch(e) { alert("Error writing attendance to Firebase."); }
    };
}

/* ==========================================================================
   5. LEAVE REQUEST ENGINE
   ========================================================================== */
async function initLeaveTab() {
    loadMyLeaves();
    
    document.getElementById('leaveRequestForm').onsubmit = async (e) => {
        e.preventDefault();
        if (!db) { alert("Local mode active: Leave request requires active Firebase configurations."); return; }
        const sDate = document.getElementById('leaveStartDate').value;
        const rDays = parseInt(document.getElementById('leaveDays').value);

        try {
            const newLeaveRef = doc(collection(db, "leaveRequests"));
            await setDoc(newLeaveRef, {
                id: newLeaveRef.id,
                username: currentUser.username,
                realName: currentUser.username === 'admin' ? systemAdminUser.realName : currentUser.username,
                startDate: sDate,
                requestedDays: rDays,
                approvedDays: rDays,
                status: "Pending"
            });
            alert("Leave request submitted successfully.");
            loadMyLeaves();
        } catch(err) { alert("Firebase upload failed."); }
    };
}

async function loadMyLeaves() {
    if (!db) return;
    try {
        const qSnap = await getDocs(collection(db, "leaveRequests"));
        const tbody = document.getElementById('myLeavesTable');
        if(!tbody) return;
        tbody.innerHTML = "";
        qSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.username === currentUser.username) {
                tbody.innerHTML += `<tr>
                    <td>${data.startDate}</td>
                    <td>${data.requestedDays}</td>
                    <td>${data.status === 'Pending' ? '-' : data.approvedDays}</td>
                    <td><span class="badge">${data.status}</span></td>
                </tr>`;
            }
        });
    } catch(e) {}
}

async function loadAllTeamLeaveRequests() {
    if (!db) return;
    try {
        const qSnap = await getDocs(collection(db, "leaveRequests"));
        const tbody = document.getElementById('teamLeavesTable');
        if(!tbody) return;
        tbody.innerHTML = "";
        qSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.status === "Pending") {
                tbody.innerHTML += `<tr>
                    <td>${data.realName}</td>
                    <td>${data.startDate}</td>
                    <td>${data.requestedDays} Days</td>
                    <td><input type="number" id="appDays_${data.id}" value="${data.requestedDays}" style="width:60px;" class="form-control"></td>
                    <td>
                        <button onclick="reviewLeave('${data.id}', 'Approved')" class="btn btn-sm btn-success">Approve</button>
                        <button onclick="reviewLeave('${data.id}', 'Rejected')" class="btn btn-sm btn-danger">Reject</button>
                    </td>
                </tr>`;
            }
        });
    } catch(e) {}
}

window.reviewLeave = async function(id, status) {
    if (!db) return;
    const approvedCount = parseInt(document.getElementById(`appDays_${id}`).value);
    await updateDoc(doc(db, "leaveRequests", id), {
        status: status,
        approvedDays: approvedCount
    });
    alert(`Leave status updated: ${status}`);
    loadAllTeamLeaveRequests();
};

/* ==========================================================================
   6. ADMIN CRUD ACCOUNTS
   ========================================================================== */
function initAdminUsersTab() {
    document.getElementById('userAccountForm').onsubmit = async (e) => {
        e.preventDefault();
        if (!db) { alert("Firebase configuration missing. Cannot save custom user accounts to cloud database."); return; }
        const user = document.getElementById('adminUsername').value.trim();
        const pass = document.getElementById('adminPassword').value;
        const rName = document.getElementById('adminRealName').value;
        const role = document.getElementById('adminRole').value;
        const wage = document.getElementById('adminWageType').value;
        const sal = parseFloat(document.getElementById('adminBaseSalary').value);

        await setDoc(doc(db, "users", user), {
            username: user,
            password: pass,
            realName: rName,
            role: role,
            employmentType: wage,
            baseSalary: sal,
            profilePicture: ""
        });

        alert("Employee Account created successfully!");
        document.getElementById('userAccountForm').reset();
        loadAdminUsersTable();
    };
}

async function loadAdminUsersTable() {
    if (!db) return;
    try {
        const qSnap = await getDocs(collection(db, "users"));
        const tbody = document.getElementById('adminUsersTable');
        if(!tbody) return;
        tbody.innerHTML = "";
        qSnap.forEach(docSnap => {
            const u = docSnap.data();
            tbody.innerHTML += `<tr>
                <td>${u.username}</td>
                <td>${u.realName}</td>
                <td>${u.role}</td>
                <td>${u.employmentType}</td>
                <td>
                    <button onclick="editUser('${u.username}')" class="btn btn-sm btn-primary">Edit</button>
                    <button onclick="deleteUser('${u.username}')" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>`;
        });
    } catch(e) {}
}

window.editUser = async function(username) {
    if (!db) return;
    const snap = await getDoc(doc(db, "users", username));
    if (snap.exists()) {
        const u = snap.data();
        document.getElementById('adminUsername').value = u.username;
        document.getElementById('adminPassword').value = u.password;
        document.getElementById('adminRealName').value = u.realName;
        document.getElementById('adminRole').value = u.role;
        document.getElementById('adminWageType').value = u.employmentType;
        document.getElementById('adminBaseSalary').value = u.baseSalary;
    }
};

window.deleteUser = async function(username) {
    if (!db) return;
    if (confirm(`Delete account ${username}?`)) {
        await deleteDoc(doc(db, "users", username));
        loadAdminUsersTable();
    }
};

/* ==========================================================================
   7. PAYROLL MANAGEMENT SYSTEM
   ========================================================================== */
function initPayrollTab() {
    const loadBtn = document.getElementById('loadPayrollBtn');
    if(!loadBtn) return;
    
    loadBtn.onclick = async () => {
        if (!db) { alert("Firebase configuration required to parse collective user sheets."); return; }
        const targetMonth = document.getElementById('payrollMonth').value; 
        const userSnap = await getDocs(collection(db, "users"));
        const attSnap = await getDocs(collection(db, "attendance"));
        const leaveSnap = await getDocs(collection(db, "leaveRequests"));

        const tbody = document.getElementById('payrollTableBody');
        tbody.innerHTML = "";

        let attendanceList = [];
        attSnap.forEach(d => attendanceList.push(d.data()));
        let leaveList = [];
        leaveSnap.forEach(d => leaveList.push(d.data()));

        userSnap.forEach(uDoc => {
            const user = uDoc.data();
            const presentDays = attendanceList.filter(a => a.username === user.username && a.date.startsWith(targetMonth) && a.status === 'Present').length;
            
            let totalRequestedLeaves = 0;
            let totalApprovedLeaves = 0;
            
            leaveList.filter(l => l.username === user.username && l.startDate.startsWith(targetMonth) && l.status === 'Approved')
                     .forEach(l => {
                         totalRequestedLeaves += l.requestedDays;
                         totalApprovedLeaves += l.approvedDays;
                     });

            const unapprovedDays = totalRequestedLeaves - totalApprovedLeaves;
            let netPayout = 0;
            let deductionText = "0 PKR";

            if (user.employmentType === "Daily") {
                netPayout = presentDays * user.baseSalary;
            } else {
                const dayRate = user.baseSalary / 30;
                const totalDeductions = unapprovedDays * dayRate;
                netPayout = user.baseSalary - totalDeductions;
                deductionText = `${unapprovedDays} Days (${Math.round(totalDeductions)} PKR)`;
            }

            tbody.innerHTML += `<tr>
                <td><strong>${user.realName}</strong></td>
                <td>${user.employmentType}</td>
                <td>${presentDays} Days</td>
                <td><span style="color:red">${deductionText}</span></td>
                <td><strong>${Math.round(netPayout)} PKR</strong></td>
            </tr>`;
        });
    };
}
