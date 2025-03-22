document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form.user');
    const emailInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('clave');
    const rememberCheckbox = document.getElementById('customCheck');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const usuario = emailInput.value;
        const clave = passwordInput.value;

        console.log('Intentando iniciar sesión con:', { usuario });

        try {
            console.log('Enviando petición a:', 'http://localhost:3009/api/admin/login');
            
            const response = await fetch('http://localhost:3009/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ usuario, clave })
            });

            console.log('Respuesta recibida:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en la respuesta:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (data.ok) {
                // Guardar datos del admin, token y tiempo de expiración en localStorage
                localStorage.setItem('adminData', JSON.stringify(data.adminData));
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('tokenExpiresIn', data.expiresIn.toString());

                // Verificar que los datos se guardaron correctamente
                console.log('Datos guardados en localStorage:', {
                    adminData: localStorage.getItem('adminData'),
                    adminToken: localStorage.getItem('adminToken') ? "Token presente" : "Token ausente",
                    tokenExpiresIn: localStorage.getItem('tokenExpiresIn')
                });

                // Redirigir al dashboard
                window.location.href = 'index.html';
            } else {
                // Mostrar mensaje de error
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error completo:', error);
            if (error.message.includes('Failed to fetch')) {
                alert('No se pudo conectar con el servidor. Asegúrate de que:\n1. El servidor esté corriendo en http://localhost:3009\n2. No haya problemas de CORS\n3. La red esté funcionando correctamente');
            } else {
                alert('Error al iniciar sesión: ' + error.message);
            }
        }
    });
}); 