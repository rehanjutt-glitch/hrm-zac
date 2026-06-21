/* Purani files ke aage yeh CSS replace karein */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: #f4f6f9;
    color: #333;
}

.centered-body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #2c3e50, #3498db);
}

.login-container {
    background: #ffffff;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
}

/* EYE BUTTON WRAPPER CLASSES */
.input-icon-container {
    position: relative;
    display: flex;
    align-items: center;
}

.toggle-password {
    position: absolute;
    right: 15px;
    cursor: pointer;
    color: #777;
    z-index: 10;
}

.toggle-password:hover {
    color: #333;
}

.main-header {
    background: #2c3e50;
    color: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-user {
    display: flex;
    align-items: center;
    gap: 15px;
}

.profile-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
}

.dashboard-layout {
    display: flex;
    min-height: calc(100vh - 70px);
}

.sidebar {
    width: 240px;
    background: #34495e;
    padding: 20px 0;
}

.sidebar ul {
    list-style: none;
}

.nav-link {
    width: 100%;
    background: transparent;
    border: none;
    color: #ecf0f1;
    padding: 15px 25px;
    text-align: left;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s;
}

.nav-link:hover, .nav-link.active {
    background: #2c3e50;
    color: #3498db;
    border-left: 4px solid #3498db;
}

.content-area {
    flex-grow: 1;
    padding: 30px;
    overflow-y: auto;
}

.card {
    background: white;
    border-radius: 6px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
}

.form-group {
    margin-bottom: 15px;
    width: 100%;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}

.form-control {
    width: 100%;
    padding: 10px;
    padding-right: 40px; /* Space for eye icon */
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
}

.btn-primary { background: #3498db; color: white; }
.btn-success { background: #2ecc71; color: white; }
.btn-danger { background: #e74c3c; color: white; }
.btn-block { width: 100%; }
.btn-sm { padding: 5px 10px; font-size: 12px; }

.badge {
    background: #e67e22;
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.data-table th, .data-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

.data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
}

.tab-content { display: none; }
.tab-content.active { display: block; }

.profile-editor {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 30px;
}

.avatar-upload img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ddd;
}

.calculator {
    width: 100%;
    max-width: 300px;
    background: #2c3e50;
    padding: 15px;
    border-radius: 6px;
}

.calc-screen {
    width: 100%;
    height: 50px;
    background: #ecf0f1;
    border: none;
    text-align: right;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    border-radius: 4px;
}

.calc-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.btn-calc {
    padding: 15px;
    font-size: 16px;
    font-weight: bold;
    background: #34495e;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-calc.operator { background: #e67e22; }
.btn-calc.danger { background: #e74c3c; }
.btn-calc.success { background: #2ecc71; }
