import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// PLACE YOUR EXACT FIREBASE CREDENTIALS INSIDE THIS OBJECT:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener("DOMContentLoaded", () => {
    initAppRouting();
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('logoutBtn')) initDashboard();
});

function initAppRouting() {
    const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname === '/' || !window.location.pathname.includes('.html');
    if (!currentUser && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (currentUser && isLoginPage) {
        window.location.href = 'dashboard.html';
    }
}

/* ==========================================================================
   1. AUTHENTICATION MODULE (Username Engine)
   ========================================================================== */
function initLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userVal = document.getElementById('username').value.trim();
        const passVal = document.getElementById('password').value;

        try {
            const userRef = doc(db, "users", userVal);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().password === passVal) {
                const uData = userSnap.data();
                localStorage.setItem('currentUser', JSON.stringify({
                    username: uData.username,
                    realName: uData.realName,
                    role: uData.role
                }));
                window.location.href = 'dashboard.html';
            } else {
                alert("Invalid Username or Password.");
            }
        } catch (err) {
            console.error(err);
        }
    });
}

/* ==========================================================================
   2. DASHBOARD FRAMEWORK
   ========================================================================== */
function initDashboard() {
    renderHeaderProfile();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
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
    const snap = await getDoc(doc(db, "users", currentUser.username));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('headerRealName').innerText = d.realName;
        document.getElementById('headerRole').innerText = d.role;
        if(d.profilePicture) {
            document.getElementById('headerProfilePic').src = d.profilePicture;
        }
    }
}

/* ==========================================================================
   3. PROFILE MANAGEMENT (Real name display & Picture url / pass settings)
   ========================================================================== */
async function initProfileTab() {
    const snap = await getDoc(doc(db, "users", currentUser.username));
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById('profileUsername').value = d.username;
        document.getElementById('profileRealName').value = d.realName;
        if(d.profilePicture) {
            document.getElementById('profilePreview').src = d.profilePicture;
            document.getElementById('profilePicUrl').value = d.profilePicture;
        }
    }

    document.getElementById('updateProfileBtn').addEventListener('click', async () => {
        const newPass = document.getElementById('profileNewPassword').value;
        const picUrl = document.getElementById('profilePicUrl').value;
        const payload = { profilePicture: picUrl };
        if (newPass) payload.password = newPass;

        await updateDoc(doc(db, "users", currentUser.username), payload);
        alert("Profile updated successfully!");
        renderHeaderProfile();
    });
}

/* ==========================================================================
   4. ATTENDANCE JOURNAL
   ========================================================================== */
function initAttendanceTab() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('currentDateText').innerText = today;

    document.getElementById('markAttendanceBtn').addEventListener('click', async () => {
        const docId = `${currentUser.username}_${today}`;
        await setDoc(doc(db, "attendance", docId), {
            username: currentUser.username,
            date: today,
            status: "Present"
        });
        document.getElementById('attendanceStatus').style.display = 'block';
    });
}

/* ==========================================================================
   5. LEAVE REQUEST ENGINE (Supports custom approval counts)
   ========================================================================== */
async function initLeaveTab() {
    loadMyLeaves();
    
    document.getElementById('leaveRequestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sDate = document.getElementById('leaveStartDate').value;
        const rDays = parseInt(document.getElementById('leaveDays').value);

        const newLeaveRef = doc(collection(db, "leaveRequests"));
        await setDoc(newLeaveRef, {
            id: newLeaveRef.id,
            username: currentUser.username,
            realName: currentUser.realName,
            startDate: sDate,
            requestedDays: rDays,
            approvedDays: rDays, 
            status: "Pending"
        });

        alert("Leave request sent.");
        loadMyLeaves();
    });
}

async function loadMyLeaves() {
    const qSnap = await getDocs(collection(db, "leaveRequests"));
    const tbody = document.getElementById('myLeavesTable');
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
}

async function loadAllTeamLeaveRequests() {
    const qSnap = await getDocs(collection(db, "leaveRequests"));
    const tbody = document.getElementById('teamLeavesTable');
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
}

window.reviewLeave = async function(id, status) {
    const approvedCount = parseInt(document.getElementById(`appDays_${id}`).value);
    await updateDoc(doc(db, "leaveRequests", id), {
        status: status,
        approvedDays: approvedCount
    });
    alert(`Leave execution finalized as: ${status}`);
    loadAllTeamLeaveRequests();
    if(currentUser.role === 'Admin') loadMyLeaves();
};

/* ==========================================================================
   6. ACCOUNTS CONTROL (Create, Read, Update, Delete Engine)
   ========================================================================== */
function initAdminUsersTab() {
    document.getElementById('userAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
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

        alert("User record written to database.");
        document.getElementById('userAccountForm').reset();
        loadAdminUsersTable();
    });
}

async function loadAdminUsersTable() {
    const qSnap = await getDocs(collection(db, "users"));
    const tbody = document.getElementById('adminUsersTable');
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
}

window.editUser = async function(username) {
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
    if (confirm(`Are you sure you want to completely delete account: ${username}?`)) {
        await deleteDoc(doc(db, "users", username));
        loadAdminUsersTable();
    }
};

/* ==========================================================================
   7. PAYROLL & CALENDAR DEDUCTIONS COMPILER
   ========================================================================== */
function initPayrollTab() {
    document.getElementById('loadPayrollBtn').addEventListener('click', async () => {
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
            let deductionText = "0 Units";

            if (user.employmentType === "Daily") {
                netPayout = presentDays * user.baseSalary;
            } else {
                const dayRate = user.baseSalary / 30;
                const totalDeductions = unapprovedDays * dayRate;
                netPayout = user.baseSalary - totalDeductions;
                deductionText = `${unapprovedDays} Days Deducted (${Math.round(totalDeductions)})`;
            }

            tbody.innerHTML += `<tr>
                <td><strong>${user.realName}</strong><br><small>@${user.username}</small></td>
                <td>${user.employmentType} (${user.baseSalary})</td>
                <td>${presentDays} Active</td>
                <td><span style="color:${unapprovedDays > 0 ? 'red' : 'inherit'}">${deductionText}</span></td>
                <td><strong>${Math.round(netPayout)}</strong></td>
            </tr>`;
        });
    });
}
