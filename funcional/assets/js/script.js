function toggleMenu() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    const toggle = document.querySelector('.menu-toggle');

    nav.classList.toggle('active');
    overlay.classList.toggle('active');
    toggle.classList.toggle('active');

    // Prevenir scroll cuando el menu está abierto
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
}

function closeMenu() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    const toggle = document.querySelector('.menu-toggle');

    nav.classList.remove('active');
    overlay.classList.remove('active');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
}

// Cerrar menu al hacer scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (Math.abs(currentScroll - lastScroll) > 50) {
        closeMenu();
    }
    lastScroll = currentScroll;
});

// Smooth scroll para los enlaces
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});