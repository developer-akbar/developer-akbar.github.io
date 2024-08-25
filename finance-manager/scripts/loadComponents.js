function loadComponent(componentId, url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(componentId).innerHTML = data;
        })
        .catch(error => console.error('Error loading component:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-container', 'templates/header.html');
    loadComponent('nav-container', 'templates/nav.html');
    loadComponent('login-modal-container', 'templates/login.html');
    loadComponent('footer-container', 'templates/footer.html');
});
