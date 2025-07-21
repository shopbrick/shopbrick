const initMenu = () => {
  const weightPlatesBtn = document.getElementById('weight-plates-button');
  const mobileMenu = document.getElementById('mobile-menu');

  const toggleMenu = () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
    weightPlatesBtn.classList.toggle('toggle-btn');
  };

  weightPlatesBtn.addEventListener('click', toggleMenu);
  mobileMenu.addEventListener('click', toggleMenu);
};

document.addEventListener('DOMContentLoaded', initMenu);
