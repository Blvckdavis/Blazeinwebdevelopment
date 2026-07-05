/* ==========================================================================
   App.js — Portfolio interactivity
   Handles navigation, contact form, and scroll-triggered card reveals.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initContactForm();
    initScrollReveal();
});

/* --- Navigation ---
   Smooth-scroll to section when a nav link is clicked.
   ========================================================================== */

function initNavigation() {
    var navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var targetId = link.getAttribute('href');
            var target = document.querySelector(targetId);

            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/* --- Contact Form ---
   Validates inputs, shows inline status messages, simulates submission.
   ========================================================================== */

function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var name = form.querySelector('input[name="name"]').value.trim();
        var email = form.querySelector('input[name="email"]').value.trim();
        var message = form.querySelector('textarea[name="message"]').value.trim();

        // Validate
        if (!name || !email || !message) {
            setFormStatus('Please fill in all fields.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            setFormStatus('Please enter a valid email address.', 'error');
            return;
        }

        // Disable button while "sending"
        var btn = form.querySelector('.submit-button');
        var originalLabel = btn.textContent;
        btn.textContent = 'Sending…';
        btn.disabled = true;

        // Log the data (no real backend)
        console.log('Contact form submitted:', { name: name, email: email, message: message });

        // Simulate a short delay, then show success
        setTimeout(function () {
            form.reset();
            btn.textContent = originalLabel;
            btn.disabled = false;
            setFormStatus('Message sent — I\'ll get back to you soon.', 'success');

            // Clear the status after a few seconds
            setTimeout(function () { setFormStatus(''); }, 4000);
        }, 1200);
    });
}

/**
 * Show a status message below the contact form.
 * @param {string} text - Message to display (empty string clears it)
 * @param {'success'|'error'|''} type - Visual variant
 */
function setFormStatus(text, type) {
    var el = document.getElementById('form-status');
    if (!el) return;

    el.textContent = text;
    el.className = 'form-status' + (type ? ' ' + type : '');
}

/**
 * Basic email validation.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --- Scroll Reveal ---
   Fades project cards in when they enter the viewport.
   Uses IntersectionObserver for performance.
   ========================================================================== */

function initScrollReveal() {
    var cards = document.querySelectorAll('.project-card');

    // If IntersectionObserver isn't supported, just show everything
    if (!('IntersectionObserver' in window)) {
        cards.forEach(function (card) { card.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // only animate once
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function (card) {
        observer.observe(card);
    });
}
