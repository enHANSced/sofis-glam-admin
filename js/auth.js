// Función para verificar si el usuario está autenticado
function checkAuth() {
    const adminData = localStorage.getItem('adminData');
    const expiresIn = localStorage.getItem('tokenExpiresIn');
    const token = localStorage.getItem('adminToken');

    console.log('Verificando autenticación:', {
        adminData: adminData ? 'Presente' : 'Ausente',
        expiresIn: expiresIn ? 'Presente' : 'Ausente',
        token: token ? 'Presente' : 'Ausente'
    });

    // Verificar que todos los elementos necesarios estén presentes
    if (!adminData || !expiresIn || !token) {
        console.log('Faltan datos de autenticación, autenticación fallida');
        return false;
    }

    // Verificar si el token ha expirado
    const tokenExpiration = parseInt(expiresIn);
    const currentTime = Date.now();
    
    console.log('Verificando expiración del token:', {
        tokenExpiration: new Date(tokenExpiration).toLocaleString(),
        currentTime: new Date(currentTime).toLocaleString(),
        isExpired: currentTime >= tokenExpiration
    });
    
    if (currentTime >= tokenExpiration) {
        console.log('Token expirado, autenticación fallida');
        return false;
    }

    console.log('Autenticación exitosa');
    return true;
}

// Función para cerrar sesión
function logout() {
    console.log('Ejecutando logout, limpiando localStorage');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tokenExpiresIn');
    
    // Redirigir a la página de login
    window.location.href = 'login.html';
}

// Función para obtener el token para las peticiones
function getAuthToken() {
    const token = localStorage.getItem('adminToken');
    console.log('Obteniendo token de autenticación:', token ? 'Token presente' : 'Token ausente');
    return token;
}

// Verificar autenticación en cada página protegida
document.addEventListener('DOMContentLoaded', function() {
    console.log('Verificando autenticación en:', window.location.pathname);
    
    // No verificar autenticación en la página de login
    if (window.location.pathname.includes('login.html')) {
        console.log('Página de login, no se requiere verificación');
        return;
    }

    // Verificar autenticación en todas las demás páginas
    const isAuthenticated = checkAuth();
    
    if (!isAuthenticated) {
        console.log('Autenticación fallida, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }

    // Agregar evento de cierre de sesión al botón de logout
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}); 