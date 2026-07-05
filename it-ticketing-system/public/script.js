// ============================================
// SERVICEDESKHQ — Frontend Logic (Production)
// ============================================

const API_URL = '/api/tickets';
const AUTH_URL = '/api/auth';

// ===== AUTH STATE =====
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ===== DOM REFERENCES =====

// Layout & Auth Modals
const mainApp = document.getElementById('main-app');
const loginModal = document.getElementById('login-modal');
const forgotModal = document.getElementById('forgot-password-modal');
const resetModal = document.getElementById('reset-password-modal');
const globalToast = document.getElementById('global-toast');

// Top Nav
const userInfoBox = document.getElementById('user-info');
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');

// Auth Tab Toggle
const authTabs = document.getElementById('auth-tabs');
const loginFormEl = document.getElementById('login-form');
const registerFormEl = document.getElementById('register-form');

// Login Form Inputs
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');

// Register Form Inputs
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerSubmitBtn = document.getElementById('register-submit-btn');

// Google Sign-In
const googleContainer = document.getElementById('google-signin-container');
const googleBtnWrapper = document.getElementById('g-btn-wrapper');

// Forgot / Reset Password Forms
const showForgotLink = document.getElementById('show-forgot-password');
const forgotCloseBtn = document.getElementById('forgot-close');
const forgotForm = document.getElementById('forgot-password-form');
const forgotEmail = document.getElementById('forgot-email');
const forgotSubmitBtn = document.getElementById('forgot-submit-btn');

const resetForm = document.getElementById('reset-password-form');
const resetPasswordInput = document.getElementById('reset-password');
const resetSubmitBtn = document.getElementById('reset-submit-btn');

// Form (New Ticket)
const form       = document.getElementById('ticket-form');
const titleInput = document.getElementById('ticket-title');
const descInput  = document.getElementById('ticket-desc');
const statusSel  = document.getElementById('ticket-status');
const submitBtn  = document.getElementById('submit-btn');
const toastEl    = document.getElementById('toast');

// Feed
const ticketList = document.getElementById('ticket-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

// Stats
const statTotal    = document.getElementById('stat-total');
const statOpen     = document.getElementById('stat-open');
const statUrgent   = document.getElementById('stat-urgent');
const statProgress = document.getElementById('stat-progress');
const statClosed   = document.getElementById('stat-closed');

// Filter buttons
const filterButtons = document.querySelectorAll('.stats__badge[data-filter]');

// Detail Modal
const modalOverlay     = document.getElementById('modal-overlay');
const modalClose       = document.getElementById('modal-close');
const modalTicketId    = document.getElementById('modal-ticket-id');
const modalBadge       = document.getElementById('modal-badge');
const modalTitle       = document.getElementById('modal-title');
const modalDesc        = document.getElementById('modal-desc');
const modalAssignee    = document.getElementById('modal-assignee');
const modalDate        = document.getElementById('modal-date');
const modalCommentsList = document.getElementById('modal-comments-list');
const commentForm      = document.getElementById('comment-form');
const commentAuthor    = document.getElementById('comment-author');
const commentText      = document.getElementById('comment-text');

// Claim Modal
const claimOverlay = document.getElementById('claim-modal-overlay');
const claimClose   = document.getElementById('claim-modal-close');
const claimForm    = document.getElementById('claim-form');
const claimName    = document.getElementById('claim-name');

// ===== STATE =====

let allTickets    = [];
let activeFilter  = 'all';
let searchQuery   = '';
let currentModalTicketId = null;
let currentClaimTicketId = null;

// ===== AUTHENTICATION LOGIC =====

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
}

function saveAuth(data) {
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
}

function clearAuth() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Check for password reset token in URL
function checkUrlForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        loginModal.classList.remove('modal-overlay--visible');
        resetModal.classList.add('modal-overlay--visible');
        resetModal.dataset.token = token;
        return true;
    }
    return false;
}

// ===== GOOGLE SIGN-IN (Conditional) =====

function tryInitGoogleSignIn() {
    // Fetch the client ID from a meta tag or .env-served endpoint
    // For now, check if a real ID was provided in the env
    // We'll read it from a hidden endpoint or just check the placeholder
    const PLACEHOLDER = 'your_google_client_id_placeholder';

    // Try fetching the Google Client ID from the server
    fetch('/api/auth/google-client-id')
        .then(res => {
            if (!res.ok) throw new Error('No Google Client ID endpoint');
            return res.json();
        })
        .then(data => {
            if (!data.clientId || data.clientId === PLACEHOLDER || data.clientId.includes('placeholder')) {
                console.warn('[ServiceDeskHQ] Google Login is disabled — no valid Client ID configured. Email/password auth is active.');
                return;
            }
            // Dynamically load the Google SDK
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                try {
                    google.accounts.id.initialize({
                        client_id: data.clientId,
                        callback: handleCredentialResponse
                    });
                    google.accounts.id.renderButton(googleBtnWrapper, {
                        type: 'standard',
                        size: 'large',
                        theme: 'filled_black',
                        text: 'sign_in_with',
                        shape: 'rectangular',
                        logo_alignment: 'left'
                    });
                    googleContainer.style.display = 'block';
                } catch (err) {
                    console.warn('[ServiceDeskHQ] Google Sign-In render failed:', err.message);
                }
            };
            script.onerror = () => {
                console.warn('[ServiceDeskHQ] Failed to load Google Identity Services script.');
            };
            document.head.appendChild(script);
        })
        .catch(() => {
            console.warn('[ServiceDeskHQ] Google Login is disabled — server endpoint not available. Email/password auth is active.');
        });
}

// Google Sign-In callback
async function handleCredentialResponse(response) {
    try {
        const res = await fetch(`${AUTH_URL}/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });

        if (!res.ok) throw new Error('Google authentication failed');

        const data = await res.json();
        saveAuth(data);
        initApp();
    } catch (err) {
        showGlobalToast(err.message || 'Google sign-in failed', 'error');
    }
}

// ===== AUTH TAB TOGGLE =====

authTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.auth-tab');
    if (!tab) return;

    const tabName = tab.dataset.tab;

    // Update tab active state
    authTabs.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('auth-tab--active'));
    tab.classList.add('auth-tab--active');

    // Toggle forms
    if (tabName === 'login') {
        loginFormEl.style.display = '';
        registerFormEl.style.display = 'none';
    } else {
        loginFormEl.style.display = 'none';
        registerFormEl.style.display = '';
    }
});

// ===== LOGIN FORM =====

loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.classList.add('btn--loading');

    try {
        const res = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: loginEmail.value.trim(),
                password: loginPassword.value
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        saveAuth(data);
        initApp();
    } catch (err) {
        showGlobalToast(err.message, 'error');
    } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.classList.remove('btn--loading');
    }
});

// ===== REGISTER FORM =====

registerFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerSubmitBtn.disabled = true;
    registerSubmitBtn.classList.add('btn--loading');

    try {
        const res = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: registerName.value.trim(),
                email: registerEmail.value.trim(),
                password: registerPassword.value
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        saveAuth(data);
        showGlobalToast('Account created! Welcome to ServiceDeskHQ.', 'success');
        initApp();
    } catch (err) {
        showGlobalToast(err.message, 'error');
    } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.classList.remove('btn--loading');
    }
});

// ===== LOGOUT =====

logoutBtn.addEventListener('click', () => {
    clearAuth();
    window.location.reload();
});

// ===== FORGOT PASSWORD FLOW =====

showForgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('modal-overlay--visible');
    forgotModal.classList.add('modal-overlay--visible');
});

forgotCloseBtn.addEventListener('click', () => {
    forgotModal.classList.remove('modal-overlay--visible');
    loginModal.classList.add('modal-overlay--visible');
});

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotSubmitBtn.disabled = true;

    try {
        const res = await fetch(`${AUTH_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail.value })
        });

        const data = await res.json();
        showGlobalToast(data.message, 'success');

        setTimeout(() => {
            forgotModal.classList.remove('modal-overlay--visible');
            loginModal.classList.add('modal-overlay--visible');
            forgotEmail.value = '';
            forgotSubmitBtn.disabled = false;
        }, 2000);
    } catch (err) {
        showGlobalToast('Failed to request password reset', 'error');
        forgotSubmitBtn.disabled = false;
    }
});

// ===== RESET PASSWORD FLOW =====

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = resetModal.dataset.token;
    if (!token) return;

    resetSubmitBtn.disabled = true;
    try {
        const res = await fetch(`${AUTH_URL}/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: resetPasswordInput.value })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to reset password');
        }

        showGlobalToast('Password reset successful! Please log in.', 'success');

        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            resetModal.classList.remove('modal-overlay--visible');
            loginModal.classList.add('modal-overlay--visible');
            resetPasswordInput.value = '';
            resetSubmitBtn.disabled = false;
        }, 2000);
    } catch (err) {
        showGlobalToast(err.message, 'error');
        resetSubmitBtn.disabled = false;
    }
});

// ===== APP BOOTSTRAPPER =====

function initApp() {
    if (!authToken || !currentUser) {
        // Not logged in — show login modal
        mainApp.style.display = 'none';
        mainApp.style.opacity = '0';

        if (!checkUrlForResetToken()) {
            loginModal.classList.add('modal-overlay--visible');
        }

        // Try to init Google Sign-In (non-blocking)
        tryInitGoogleSignIn();
        return;
    }

    // Logged in — show app
    loginModal.classList.remove('modal-overlay--visible');
    forgotModal.classList.remove('modal-overlay--visible');
    resetModal.classList.remove('modal-overlay--visible');
    mainApp.style.display = 'grid';
    setTimeout(() => { mainApp.style.opacity = '1'; }, 50);

    // Populate User Info
    userInfoBox.style.display = 'flex';
    userNameEl.textContent = currentUser.name;
    userRoleEl.textContent = currentUser.role;

    if (currentUser.role === 'Admin') {
        userRoleEl.className = 'ticket-card__badge ticket-card__badge--urgent';
    } else {
        userRoleEl.className = 'ticket-card__badge ticket-card__badge--open';
    }

    // Auto-fill author/claim with current user name
    commentAuthor.value = currentUser.name;
    claimName.value = currentUser.name;

    // Load data
    loadTickets().catch(err => {
        console.error('Initial ticket load failed:', err);
        showToast('Could not load tickets. Server may be unreachable.', 'error');
    });
}

// ===== LOAD & RENDER =====

async function loadTickets() {
    try {
        const res = await fetch(API_URL, { headers: getAuthHeaders() });

        if (res.status === 401 || res.status === 403) {
            clearAuth();
            mainApp.style.display = 'none';
            loginModal.classList.add('modal-overlay--visible');
            return;
        }

        allTickets = await res.json();
        updateStats();
        renderFilteredTickets();
    } catch (err) {
        console.error('Failed to load tickets:', err);
        showToast('Could not load tickets. Is the server running?', 'error');
    }
}

function updateStats() {
    const counts = { Open: 0, Urgent: 0, 'In Progress': 0, Closed: 0 };
    allTickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    animateCounter(statTotal, allTickets.length);
    animateCounter(statOpen, counts['Open']);
    animateCounter(statUrgent, counts['Urgent']);
    animateCounter(statProgress, counts['In Progress']);
    animateCounter(statClosed, counts['Closed']);
}

function renderFilteredTickets() {
    let filtered = allTickets;

    if (activeFilter !== 'all') {
        filtered = filtered.filter(t => t.status === activeFilter);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
            (t.assignee && t.assignee.toLowerCase().includes(q))
        );
    }

    renderTickets(filtered);
}

function renderTickets(tickets) {
    ticketList.querySelectorAll('.ticket-card').forEach(card => card.remove());
    emptyState.style.display = tickets.length === 0 ? 'flex' : 'none';

    tickets.forEach((ticket, i) => {
        const card = createTicketCard(ticket);
        card.style.animationDelay = `${i * 0.04}s`;
        ticketList.appendChild(card);
    });
}

// ===== TICKET CARD BUILDER =====

function createTicketCard(ticket) {
    const card = document.createElement('article');
    card.className = 'ticket-card' + (ticket.status === 'Closed' ? ' ticket-card--closed' : '');
    card.dataset.id = ticket._id;

    const badgeClass = getBadgeClass(ticket.status);
    const statusDot  = '<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>';

    const timeStr = formatDate(ticket.createdAt);
    const displayId = ticket.ticketId || `#${ticket._id.slice(-6).toUpperCase()}`;
    const commentCount = ticket.comments ? ticket.comments.length : 0;

    // Assignee row
    let assigneeHtml = '';
    if (ticket.assignee) {
        assigneeHtml = `
            <div class="ticket-card__assignee-row">
                <span class="ticket-card__assignee-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ${escapeHtml(ticket.assignee)}
                </span>
            </div>`;
    } else {
        assigneeHtml = `<div class="ticket-card__assignee-row"><span class="ticket-card__unassigned">Unassigned</span></div>`;
    }

    let actionsHtml = '<div class="ticket-actions">';

    if (ticket.status !== 'Closed') {
        if (!ticket.assignee) {
            actionsHtml += `
                <button class="action-btn action-btn--claim" data-action="claim" data-id="${ticket._id}" title="Claim this ticket">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Claim
                </button>`;
        }

        actionsHtml += `
            <button class="action-btn action-btn--resolve" data-action="resolve" data-id="${ticket._id}" title="Mark as resolved">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                Resolve
            </button>`;
    }

    // ROLE-BASED: Only Admins see Delete
    if (currentUser && currentUser.role === 'Admin') {
        actionsHtml += `
            <button class="action-btn action-btn--delete" data-action="delete" data-id="${ticket._id}" title="Delete ticket">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete
            </button>`;
    }

    actionsHtml += '</div>';

    card.innerHTML = `
        <div class="ticket-card__top">
            <h3 class="ticket-card__title">${escapeHtml(ticket.title)}</h3>
            <span class="ticket-card__badge ${badgeClass}">
                ${statusDot}
                ${ticket.status}
            </span>
        </div>
        <p class="ticket-card__desc">${escapeHtml(ticket.description)}</p>
        ${assigneeHtml}
        <div class="ticket-card__footer">
            <div class="ticket-card__footer-left">
                <span class="ticket-card__id">${displayId}</span>
                <span class="ticket-card__time">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    ${timeStr}
                </span>
                ${commentCount > 0 ? `<span class="ticket-card__comment-count"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${commentCount}</span>` : ''}
            </div>
            ${actionsHtml}
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        openDetailModal(ticket._id);
    });

    return card;
}

function getBadgeClass(status) {
    switch (status) {
        case 'Open':        return 'ticket-card__badge--open';
        case 'Urgent':      return 'ticket-card__badge--urgent';
        case 'In Progress': return 'ticket-card__badge--in-progress';
        case 'Closed':      return 'ticket-card__badge--closed';
        default:            return 'ticket-card__badge--open';
    }
}

// ===== FORM SUBMISSION (Create Ticket) =====

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title       = titleInput.value.trim();
    const description = descInput.value.trim();
    const status      = statusSel.value;

    if (!title || !description) return;

    submitBtn.disabled = true;
    submitBtn.classList.add('btn--loading');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, description, status })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Server error');
        }

        form.reset();
        showToast('Ticket submitted successfully!', 'success');
        await loadTickets();
    } catch (err) {
        console.error('Submit failed:', err);
        showToast(err.message || 'Failed to submit ticket.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn--loading');
    }
});

// ===== ACTION BUTTONS (Claim, Resolve, Delete) =====

ticketList.addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    e.stopPropagation();
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    switch (action) {
        case 'claim':   openClaimModal(id); break;
        case 'resolve': resolveTicket(id);  break;
        case 'delete':  deleteTicket(id);   break;
    }
});

// --- Claim ---
function openClaimModal(ticketId) {
    currentClaimTicketId = ticketId;
    claimOverlay.classList.add('modal-overlay--visible');
}

function closeClaimModal() {
    claimOverlay.classList.remove('modal-overlay--visible');
    currentClaimTicketId = null;
}

claimClose.addEventListener('click', closeClaimModal);
claimOverlay.addEventListener('click', (e) => {
    if (e.target === claimOverlay) closeClaimModal();
});

claimForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = claimName.value.trim() || (currentUser && currentUser.name);
    if (!name || !currentClaimTicketId) return;

    try {
        const res = await fetch(`${API_URL}/${currentClaimTicketId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ assignee: name, status: 'In Progress' })
        });

        if (!res.ok) throw new Error('Failed to claim');

        closeClaimModal();
        showToast(`Ticket claimed by ${name}`, 'success');
        await loadTickets();
    } catch (err) {
        showToast('Failed to claim ticket.', 'error');
    }
});

// --- Resolve ---
async function resolveTicket(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'Closed' })
        });

        if (!res.ok) throw new Error('Failed to resolve');

        showToast('Ticket marked as resolved!', 'success');
        await loadTickets();

        if (currentModalTicketId === id) {
            openDetailModal(id);
        }
    } catch (err) {
        showToast('Failed to resolve ticket.', 'error');
    }
}

// --- Delete ---
async function deleteTicket(id) {
    if (!confirm('Are you sure you want to permanently delete this ticket? (Admins Only)')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            if (res.status === 403) throw new Error('Forbidden: Admins only');
            throw new Error('Failed to delete');
        }

        showToast('Ticket deleted.', 'success');

        if (currentModalTicketId === id) closeDetailModal();

        await loadTickets();
    } catch (err) {
        showToast(err.message || 'Failed to delete ticket.', 'error');
    }
}

// ===== DETAIL MODAL (Comments / Internal Notes) =====

function openDetailModal(ticketId) {
    const ticket = allTickets.find(t => t._id === ticketId);
    if (!ticket) return;

    currentModalTicketId = ticketId;

    modalTicketId.textContent = ticket.ticketId || `#${ticket._id.slice(-6).toUpperCase()}`;
    modalBadge.textContent = ticket.status;
    modalBadge.className = 'modal__badge ' + getBadgeClass(ticket.status);

    modalTitle.textContent = ticket.title;
    modalDesc.textContent  = ticket.description;
    modalAssignee.textContent = ticket.assignee || 'Unassigned';
    modalDate.textContent = formatDate(ticket.createdAt);

    renderComments(ticket.comments || []);

    modalOverlay.classList.add('modal-overlay--visible');
}

function closeDetailModal() {
    modalOverlay.classList.remove('modal-overlay--visible');
    currentModalTicketId = null;
}

modalClose.addEventListener('click', closeDetailModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeDetailModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDetailModal();
        closeClaimModal();
    }
});

function renderComments(comments) {
    if (comments.length === 0) {
        modalCommentsList.innerHTML = '<p class="modal__no-comments">No notes yet.</p>';
        return;
    }

    modalCommentsList.innerHTML = comments.map(c => `
        <div class="comment">
            <div class="comment__header">
                <span class="comment__author">${escapeHtml(c.author)}</span>
                <span class="comment__time">${formatDate(c.createdAt)}</span>
            </div>
            <p class="comment__text">${escapeHtml(c.text)}</p>
        </div>
    `).join('');

    modalCommentsList.scrollTop = modalCommentsList.scrollHeight;
}

// --- Add Comment ---
commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = currentUser ? currentUser.name : commentAuthor.value.trim();
    const text   = commentText.value.trim();
    if (!author || !text || !currentModalTicketId) return;

    try {
        const res = await fetch(`${API_URL}/${currentModalTicketId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ author, text })
        });

        if (!res.ok) throw new Error('Failed to add comment');

        const data = await res.json();

        commentText.value = '';

        renderComments(data.ticket.comments);

        const idx = allTickets.findIndex(t => t._id === currentModalTicketId);
        if (idx !== -1) allTickets[idx] = data.ticket;

        renderFilteredTickets();

        showToast('Note added!', 'success');
    } catch (err) {
        showToast('Failed to add note.', 'error');
    }
});

// ===== SEARCH & FILTERING =====

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;

        filterButtons.forEach(b => b.classList.remove('stats__badge--active'));
        btn.classList.add('stats__badge--active');

        renderFilteredTickets();
    });
});

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    searchClear.style.display = searchQuery ? 'flex' : 'none';
    renderFilteredTickets();
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    renderFilteredTickets();
    searchInput.focus();
});

// ===== TOAST NOTIFICATIONS =====

let toastTimeout;
let globalToastTimeout;

function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = `toast toast--${type} toast--visible`;
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('toast--visible');
    }, 3000);
}

function showGlobalToast(message, type = 'success') {
    clearTimeout(globalToastTimeout);
    globalToast.textContent = message;
    globalToast.className = `toast toast--${type} toast--visible`;
    globalToastTimeout = setTimeout(() => {
        globalToast.classList.remove('toast--visible');
    }, 4000);
}

// ===== UTILITY FUNCTIONS =====

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function animateCounter(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(current + (target - current) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ===== START UP =====
document.addEventListener('DOMContentLoaded', initApp);
