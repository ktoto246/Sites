const API_URL = 'http://localhost:5009/api'; 

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const name = document.getElementById('nameInput').value;
    const phone = document.getElementById('phoneInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    const msgBox = document.getElementById('errorMessage');
    
    msgBox.className = 'small mb-3 d-none text-center fw-bold p-2 rounded'; 

    try {
        const response = await fetch(`${API_URL}/Auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: name, 
                phone: phone,
                email: email, 
                password: password 
            })
        });

        if (response.ok) {
            const result = await response.json();
            msgBox.textContent = result.message;
            msgBox.className = 'text-success small mb-3 text-center fw-bold bg-success bg-opacity-10 p-2 rounded';
            
            document.getElementById('registerForm').reset();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            const errorData = await response.json();
            msgBox.textContent = errorData.message || 'Ошибка регистрации.';
            msgBox.className = 'text-danger small mb-3 text-center fw-bold bg-danger bg-opacity-10 p-2 rounded';
        }
    } catch (error) {
        msgBox.textContent = 'Ошибка сети. Проверьте сервер C#.';
        msgBox.className = 'text-danger small mb-3 text-center fw-bold bg-danger bg-opacity-10 p-2 rounded';
    }
});
