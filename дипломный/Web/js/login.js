const API_URL = 'http://localhost:5009/api'; 

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.classList.add('d-none');

    try {
        const response = await fetch(`${API_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

       if (response.ok) {
            const user = await response.json();
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userRole', user.role);

            if (user.role === 'admin' || user.role === 'manager') {
                window.location.href = 'admin.html';
            } else if (user.role === 'dispatcher') {
                window.location.href = 'dispatcher.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.message || 'Неверный логин или пароль.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Ошибка соединения с сервером.';
        errorDiv.classList.remove('d-none');
    }
});