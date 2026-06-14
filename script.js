// 1. FIREBASE SDK IMPORTS (جاوا اسکرپٹ کے لنکس)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// अपनी فائر بیس کی کریڈینشلز (Credentials) یہاں ڈالیں
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

// ग्लोबल वेरिएबल्स
let currentUser = null;
let currentCalcMode = 'monthly'; 
let localUsersList = []; // लोकल टेस्टिंग के लिए यूज़र्स स्टोर करने के लिए

// ==========================================
// 2. NAVIGATION & URL HASH HANDLING
// ==========================================
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
    handleRouting();
    setupProfilePictureListener(); // प्रोफाइल पिक्चर अपलोड चालू करने के लिए
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
// 3. AUTHENTICATION & TEMPORARY LOGIN
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

    // 🌟 आरज़ी (Temporary) लॉगिन सिस्टम - जो आपने मांगा था
    if (userNm === "admin" && pass === "admin123") {
        currentUser = {
            fullName: "Zulfiqar Ali",
            username: "admin",
            role: "admin",
            access: ['view', 'add', 'edit', 'salary', 'reports', 'admin']
        };
        loginSuccessAction();
        return; 
    }

    // लोकल क्रिएट किए गए यूज़र्स के लिए चेक
    const localUser = localUsersList.find(u => u.username === userNm && u.password === pass);
    if (localUser) {
        currentUser = localUser;
        loginSuccessAction();
        return;
    }

    // अगर ऊपर कुछ मैच नहीं हुआ, तो फ़ायरबेस डेटाबेस चेक करेगा
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
        alert("Database connection error. (You can still use temporary admin login)");
    }
};

function loginSuccessAction() {
    document.getElementById('navName').innerText = currentUser.fullName;
    
    if (currentUser.role === 'admin' || currentUser.access.includes('admin')) {
        document.getElementById('adminOnlyBtn').style.display = 'block';
    } else {
        document.getElementById('adminOnlyBtn').style.display = 'none';
    }

    applyAccessControl();
    navTo('dashboardPage');
}

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
// 4. PROFILE PICTURE LOGIC (प्रोफाइल पिक्चर अपलोड)
// ==========================================
function setupProfilePictureListener() {
    const uploadInput = document.getElementById('upload-avatar');
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // स्क्रीन पर दिखने वाली इमेज को यूजर की फोटो से बदल देगा
                    document.getElementById('navPic').src = event.target.result;
                    alert("Profile picture updated locally!");
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// ==========================================
// 5. ADMIN PANEL: CREATE NEW USERS
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

    // 1. टेस्टिंग के लिए लोकल एरे (Array) में सेव करना ताकि तुरंत बिना इंटरनेट दिखे
    localUsersList.push(newUserData);

    // 2. फ़ायरबेस क्लाउड डेटाबेस में सेव करना
    try {
        await setDoc(doc(db, "system_users", username), newUserData);
    } catch (error) {
        console.log("Firebase save skipped or errored, user saved locally.");
    }

    alert(`User "${fullName}" Created Successfully! You can now login with ID: ${username}`);
    
    // फॉर्म को खाली करना
    document.getElementById('newFullNm').value = "";
    document.getElementById('newUserNm').value = "";
    document.getElementById('newUserPs').value = "";

    loadUserList(); // नीचे बनी टेबल को रिफ्रेश करना
};

function loadUserList() {
    const tbody = document.getElementById('userListBody');
    tbody.innerHTML = "";
    
    // पहले से बने आरज़ी एडमिन को टेबल में दिखाना
    tbody.innerHTML += `
        <tr>
            <td>Zulfiqar Ali (Default)</td>
            <td>admin</td>
            <td>Full Access (Admin)</td>
            <td><span style="color: gray">System Default</span></td>
        </tr>`;

    // आपके द्वारा क्रिएट किए गए नए यूज़र्स को टेबल में दिखाना
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
