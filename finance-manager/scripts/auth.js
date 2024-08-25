// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');

    const validUsername = "akbar";
    const validPassword = "211200";

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
