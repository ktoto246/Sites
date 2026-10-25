// Плавное появление элементов после загрузки страницы.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.animate-in').forEach((element, index) => {
    element.style.animationDelay = `${index * 70}ms`;
  });
  document.querySelectorAll('[data-tooltip]').forEach((element) => {
    element.setAttribute('title', element.dataset.tooltip);
  });
});
