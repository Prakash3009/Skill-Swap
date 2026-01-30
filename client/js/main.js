/**
 * SkillSwap - Main JavaScript
 * Shared utilities and helper functions
 */

// 🔥 BACKEND BASE URL (RENDER)
const API_BASE_URL = "https://skill-swap-5k20.onrender.com";

/* =========================
   UI HELPERS
========================= */

// Show alert message
function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert-floating');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-floating`;
    alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease;
    `;
    alert.textContent = message;

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Time ago formatter
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* =========================
   AUTH STORAGE
========================= */

function getAuthToken() {
    return localStorage.getItem('token');
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function setCurrentUserId(userId) {
    localStorage.setItem('userId', userId);
}

function getCurrentUserId() {
    return localStorage.getItem('userId');
}

function clearCurrentUser() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
}

function logout() {
    clearCurrentUser();
    window.location.href = 'login.html';
}

/* =========================
   API CALLS
========================= */

// 🔐 Authenticated API call
async function authenticatedFetch(endpoint, options = {}) {
    const token = getAuthToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
}

// 🌐 Public API call (login/register)
async function publicFetch(endpoint, options = {}) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
}

/* =========================
   THEME MANAGEMENT
========================= */

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const navbar = document.querySelector('.navbar .container');
    if (navbar && !document.querySelector('.theme-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
        toggleBtn.title = 'Toggle Dark Mode';

        toggleBtn.onclick = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        };

        navbar.appendChild(toggleBtn);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initTheme);

/* =========================
   ANIMATIONS
========================= */

const style = document.createElement('style');
style.textContent = `
@keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
}
`;
document.head.appendChild(style);
