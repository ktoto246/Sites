// js/auth.js

function login(loginStr, passwordStr) {
    const db = getDB();
    const user = db.users.find(u => u.login === loginStr && u.password === passwordStr);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        redirectByRole(user.role);
    } else {
        alert('Неверный логин или пароль');
    }
}

// РЕГИСТРАЦИЯ ПОКУПАТЕЛЕЙ С ВВОДОМ ФИО
function register(loginStr, passwordStr, fullNameStr) {
    const db = getDB();
    
    // Чекаем, не занят ли логин
    const exists = db.users.find(u => u.login === loginStr);
    if (exists) {
        alert('Этот логин уже занят. Придумай другой.');
        return;
    }

    // Генерим новый ID
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    
    const newUser = {
        id: newId,
        login: loginStr,
        password: passwordStr,
        role: 'buyer', // Хардкодим роль покупателя
        full_name: fullNameStr && fullNameStr.trim() !== '' ? fullNameStr.trim() : 'Покупатель'
    };

    db.users.push(newUser);
    saveDB(db);

    // Сразу логиним его и кидаем на витрину
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    redirectByRole(newUser.role);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function redirectByRole(role) {
    const routes = {
        'admin': 'admin.html',
        'dispatcher': 'dispatcher.html',
        'courier': 'courier.html',
        'buyer': 'buyer.html'
    };
    window.location.href = routes[role] || 'index.html';
}

function checkAuth(allowedRoles) {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
        alert('Доступ запрещен. У вас нет прав для просмотра этой страницы.');
        redirectByRole(user.role);
    }
}