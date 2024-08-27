// auth.js

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'admin';

    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');

    const validUsername = "admin";
    const validPassword = "admin";

    const info = document.createElement('p');
    info.className = 'mb-16';
    info.textContent = 'Please click on Login to continue. User creation is in progress';
    loginForm.append(info);

    function showLoginModal() {
        loginModal.style.display = "block";
    }

    function hideLoginModal() {
        loginModal.style.display = "none";
    }

    function isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    function authenticateUser(username, password) {
        return username === validUsername && password === validPassword;
    }

    function loginUser() {
        localStorage.setItem('isAuthenticated', 'true');
        hideLoginModal();
        logoutButton.style.display = "block";
        document.querySelector('main').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
    }

    function logoutUser() {
        localStorage.removeItem('isAuthenticated');
        location.reload();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (authenticateUser(username, password)) {
            loginUser();
        } else {
            alert('Invalid username or password.');
        }
    });

    logoutButton.addEventListener('click', () => {
        logoutUser();
    });

    // Redirect check
    if (!isAuthenticated()) {
        showLoginModal();
        document.querySelector('main').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
    } else {
        hideLoginModal();
        logoutButton.style.display = "block";
        document.querySelector('main').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
    }
});
