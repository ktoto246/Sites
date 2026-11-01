const form = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const switchToRegister = document.querySelector('#show-register');
const title = document.querySelector('#login-title');
const subtitle = document.querySelector('.subtitle');
const message = document.querySelector('#message');
const registerMessage = document.querySelector('#register-message');

function showRegistration(show) {
  form.hidden = show;
  switchToRegister.parentElement.hidden = show;
  registerForm.hidden = !show;
  title.textContent = show ? 'Регистрация' : 'Добро пожаловать';
  subtitle.textContent = show ? 'Создайте аккаунт клиента.' : 'Войдите в свой аккаунт, чтобы продолжить.';
  message.textContent = '';
  registerMessage.textContent = '';
}

switchToRegister.addEventListener('click', () => showRegistration(true));
document.querySelector('#show-login').addEventListener('click', () => showRegistration(false));

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const login = registerForm.elements.login.value.trim();
  const password = registerForm.elements.password.value;
  const confirmation = registerForm.elements.confirmPassword.value;
  const users = database.get('users');
  registerMessage.classList.remove('success');
  if (!login) {
    registerMessage.textContent = 'Введите логин.';
    return;
  }
  if (password !== confirmation) {
    registerMessage.textContent = 'Пароли не совпадают.';
    return;
  }
  if (users.some((user) => user.login.toLowerCase() === login.toLowerCase())) {
    registerMessage.textContent = 'Этот логин уже занят.';
    return;
  }
  users.push({ login, password, role: 'client', name: 'Клиент' });
  database.set('users', users);
  registerForm.reset();
  showRegistration(false);
  form.elements.login.value = login;
  message.classList.add('success');
  message.textContent = 'Аккаунт создан. Введите пароль для входа.';
});

function enter(user) {
  if (user.role === 'client') database.mergeGuestCart(user.login);
  database.set('session', { login: user.login, role: user.role, name: user.name });
  if (user.role === 'client') {
    window.location.href = 'catalog.html';
  } else if (user.role === 'dispatcher') {
    window.location.href = 'dispatcher.html';
  } else if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    message.classList.add('success');
    message.textContent = `Вы вошли как ${user.name}. Личный кабинет пока недоступен.`;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const login = form.elements.login.value.trim();
  const password = form.elements.password.value;
  const user = database.get('users').find((item) => item.login === login && item.password === password);
  if (user) {
    enter(user);
  } else {
    message.classList.remove('success');
    message.textContent = 'Неверный логин или пароль. Попробуйте ещё раз.';
  }
});

document.querySelectorAll('[data-role]').forEach((button) => {
  button.addEventListener('click', () => {
    const user = database.get('users').find((item) => item.role === button.dataset.role);
    if (user) {
      if (form.hidden) showRegistration(false);
      enter(user);
    }
  });
});
