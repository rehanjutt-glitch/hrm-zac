// 1. FIREBASE MODULE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// जब आप तैयार हों, यहाँ अपनी Firebase क्रेडेंशियल्स डालें
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Application States
let currentUser = null;
let currentCalcMode = 'monthly'; 
let localUsersList = []; 

// ==========================================
// 2. ROUTING AND URL HASH MANAGEMENT
// ==========================================
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
    // ब्राउज़र में चेक करें कि क्या पहले से लॉगिन है?
    const savedUser = localStorage.getItem('hrm_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('navName').innerText = currentUser.fullName;
        applyAccessControl();
        if (window.location.hash === '#loginPage' || !window.location.hash) {
            navTo('dashboardPage');
        }
    }
    handleRouting();
    setupProfilePictureListener(); 
});

function handleRouting() {
    const hash = window.location.hash || '#loginPage';
    
    if (!currentUser && hash !== '#loginPage') {
        window.location.hash = '#loginPage';
        return;
    }

    document.querySelectorAll('.container').forEach(div => div.classList.add('hidden'));

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
    } else if (hash === '#reportPage' && currentUser?.access?.includes('reports')) {
        document.getElementById('reportPage').classList.remove('hidden');
    } else {
        window.location.hash = '#dashboardPage';
    }
}

window.navTo = function(pageId) {
    window.location.hash = '#' + pageId;
};

// ==========================================
// 3. AUTHENTICATION (TEMPORARY & LOGOUT)
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

    // 🌟 Temporary Admin Access (No '@' or email validation required)
    if (userNm === "admin@zac" && pass === "admin123") {
        currentUser = {
            fullName: "Zulfiqar Ali",
            username: "admin",
            role: "admin",
            access: ['view', 'add', 'edit', 'salary', 'reports', 'admin']
        };
        loginSuccessAction();
        return; 
    }

    const localUser = localUsersList.find(u => u.username === userNm && u.password === pass);
    if (localUser) {
        currentUser = localUser;
        loginSuccessAction();
        return;
    }

    try {
        const userRef = doc(db, "system_users", userNm);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().password === pass) {
            currentUser = userSnap.data();
            loginSuccessAction();
        } else {
            alert("Invalid Username or Password!");
        }
    } catch (error) {
        console.error("Login Error: ", error);
        alert("Database error. (You can still use temporary admin account)");
    }
};

function loginSuccessAction() {
    localStorage.setItem('hrm_user', JSON.stringify(currentUser));
    document.getElementById('navName').innerText = currentUser.fullName;
    
    if (currentUser.role === 'admin' || currentUser.access.includes('admin')) {
        document.getElementById('adminOnlyBtn').style.display = 'block';
    } else {
        document.getElementById('adminOnlyBtn').style.display = 'none';
    }

    applyAccessControl();
    navTo('dashboardPage');
}

window.logout = function() {
    localStorage.removeItem('hrm_user');
    location.reload();
};

function applyAccessControl() {
    document.querySelectorAll('#mainMenuGrid .menu-btn').forEach(btn => {
        const requiredAccess = btn.getAttribute('data-access');
        if (requiredAccess && !currentUser.access.includes(requiredAccess)) {
            btn.style.display = 'none'; 
        } else {
            btn.style.display = 'block';
        }
    });
}

window.toggleMenu = function() {
    document.getElementById('profileMenu').classList.toggle('hidden');
};

// ==========================================
// 4. PROFILE IMAGE UPLOADER
// ==========================================
function setupProfilePictureListener() {
    const navPic = document.getElementById('navPic');
    if (navPic) {
        navPic.style.cursor = 'pointer';
        navPic.title = 'Click to change profile picture';
        
        navPic.onclick = function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        navPic.src = event.target.result;
                        alert("Profile picture changed successfully!");
                    };
                    reader.readAsDataURL(file);
                }
            };
            fileInput.click();
        };
    }
}

// ==========================================
// 5. USER ACCOUNTS MANAGEMENT (ADMIN PANEL)
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

    const newUserData = {
        fullName: fullName,
        username: username,
        password: password,
        role: permissions.includes('admin') ? 'admin' : 'staff',
        access: permissions
    };

    localUsersList.push(newUserData);

    try {
        await setDoc(doc(db, "system_users", username), newUserData);
    } catch (error) {
        console.log("Cloud backup skipped.");
    }

    alert(`User Account "${fullName}" Created! ID: ${username}`);
    
    document.getElementById('newFullNm').value = "";
    document.getElementById('newUserNm').value = "";
    document.getElementById('newUserPs').value = "";

    loadUserList(); 
};

function loadUserList() {
    const tbody = document.getElementById('userListBody');
    tbody.innerHTML = "";
    
    tbody.innerHTML += `
        <tr>
            <td>Zulfiqar Ali (Default)</td>
            <td>admin</td>
            <td>Full Access (Admin)</td>
            <td><span style="color: gray">System Default</span></td>
        </tr>`;

    localUsersList.forEach((user, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${user.fullName}</td>
                <td>${user.username}</td>
                <td>${user.access.join(', ')}</td>
                <td><button class='main-btn btn-red' style='padding:5px 10px; font-size:12px;' onclick="window.deleteLocalUser(${index})">Remove</button></td>
            </tr>`;
    });
}

window.deleteLocalUser = function(index) {
    localUsersList.splice(index, 1);
    loadUserList();
};

// ==========================================
// 6. PLACEHOLDER FUNCTIONS (HTML एरर रोकने के लिए)
// ==========================================
window.showView = function(viewType) {
    console.log("Showing view: " + viewType);
    // स्टाफ लिस्ट देखने का लॉजिक यहाँ आएगा
    navTo('listPage');
    document.getElementById('listTitle').innerText = viewType.toUpperCase() + " STAFF RECORDS";
};

window.saveNewEmployee = function() { alert("Employee data save clicked."); };
window.updateEmployeeData = function() { alert("Update details clicked."); };
window.setCalcMode = function(mode) { console.log("Mode set to: " + mode); };
window.autoCalc = function() { console.log("Calculating..."); };
window.saveSalary = function() { alert("Salary saved."); };
window.generateReport = function() { alert("Report generated."); };
