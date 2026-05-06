const API_URL = 'http://localhost:5009/api';
const userId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', loadProfile);

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim()
    };
    
    try {
        const res = await fetch(`${API_URL}/Auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            localStorage.setItem('userName', data.name);
            showToast('Профиль успешно обновлен!', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            const err = await res.json();
            showToast(err.message || 'Ошибка сохранения', 'danger');
        }
    } catch(e) { showToast('Ошибка сети', 'danger'); }
});

async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/Auth/profile/${userId}`);
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        
        document.getElementById('profileName').value = data.name || '';
        if (data.name) document.getElementById('profileNameDisplay').textContent = data.name;
        document.getElementById('profileEmail').value = data.email || '';
        document.getElementById('profilePhone').value = data.phone || '';
        
        if (data.registrationDate) {
            const d = new Date(data.registrationDate);
            document.getElementById('profileDate').value = d.toLocaleDateString('ru-RU');
        }

        document.getElementById('loadingProfile').classList.add('d-none');
        document.getElementById('profileForm').classList.remove('d-none');
    } catch (err) {
        showToast('Ошибка при загрузке профиля', 'danger');
    }
}

async function updatePhone() {
    const phoneInput = document.getElementById('profilePhone').value;
    const btn = document.getElementById('savePhoneBtn');
    
    if (!phoneInput.trim()) {
        showToast('Телефон не может быть пустым', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

    try {
        const res = await fetch(`${API_URL}/Auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput })
        });
        
        if (res.ok) {
            showToast('Телефон успешно сохранен!', 'success');
        } else {
            const err = await res.json();
            showToast(err.message || 'Ошибка сохранения', 'danger');
        }
    } catch (err) {
        showToast('Ошибка соединения', 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = container.lastElementChild;
    setTimeout(() => {
        toastElement.classList.remove('show');
        setTimeout(() => toastElement.remove(), 300);
    }, 3000);
}