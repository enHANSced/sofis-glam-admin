document.addEventListener('DOMContentLoaded', function() {
    // Mostrar nombre del admin
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (adminData) {
        document.getElementById('adminName').textContent = `${adminData.nombre} ${adminData.apellido}`;
    }

    // Cargar datos del dashboard
    cargarEstadisticas();
    cargarUltimasCompras();
    cargarProductosBajoStock();
});

// Función para cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await fetch('http://localhost:3009/api/dashboard/estadisticas', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Sesión expirada. Inicie sesión nuevamente.');
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error respuesta:', errorText);
            throw new Error('Error al cargar estadísticas');
        }

        const result = await response.json();
        console.log('Estadísticas recibidas:', result);
        
        const stats = result.data || result;
        
        // Actualizar contadores
        document.getElementById('totalProductos').textContent = stats.totalProductos || 0;
        document.getElementById('totalCategorias').textContent = stats.totalCategorias || 0;
        document.getElementById('totalCompras').textContent = stats.totalCompras || 0;
        document.getElementById('totalClientes').textContent = stats.totalClientes || 0;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las estadísticas: ' + error.message);
    }
}

// Función para cargar últimas compras
async function cargarUltimasCompras() {
    try {
        const response = await fetch('http://localhost:3009/api/dashboard/ultimas-compras', {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Sesión expirada. Inicie sesión nuevamente.');
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error respuesta:', errorText);
            throw new Error('Error al cargar últimas compras');
        }

        const result = await response.json();
        console.log('Últimas compras recibidas:', result);
        
        // Manejar diferentes formatos de respuesta
        const compras = Array.isArray(result) ? result : 
                       (result.data && Array.isArray(result.data)) ? result.data : [];
                       
        const tbody = document.getElementById('ultimasCompras');
        tbody.innerHTML = '';

        if (compras.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="5" class="text-center">No hay compras recientes</td>`;
            tbody.appendChild(tr);
            return;
        }

        compras.forEach(compra => {
            // Asegurarse de que total sea un número antes de usar toFixed
            let totalNumerico = 0;
            if (typeof compra.total === 'string') {
                totalNumerico = parseFloat(compra.total);
            } else if (typeof compra.total === 'number') {
                totalNumerico = compra.total;
            }
            
            // Manejar diferentes formas en que el cliente puede estar representado
            let clienteNombre = 'Cliente no disponible';
            if (compra.cliente) {
                clienteNombre = compra.cliente;
            } else if (compra.Cliente) {
                clienteNombre = `${compra.Cliente.nombre || ''} ${compra.Cliente.apellido || ''}`.trim();
                if (!clienteNombre) clienteNombre = 'Cliente no disponible';
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${compra.id_compra}</td>
                <td>${clienteNombre}</td>
                <td>L ${totalNumerico.toFixed(2)}</td>
                <td>${new Date(compra.fecha).toLocaleDateString()}</td>
                <td>
                    <span class="badge badge-${getEstadoBadgeClass(compra.estado)}">
                        ${compra.estado}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las últimas compras: ' + error.message);
    }
}

// Función para cargar productos con bajo stock
async function cargarProductosBajoStock() {
    try {
        const response = await fetch('http://localhost:3009/api/dashboard/productos-bajo-stock', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Sesión expirada. Inicie sesión nuevamente.');
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error respuesta:', errorText);
            throw new Error('Error al cargar productos con bajo stock');
        }

        const result = await response.json();
        console.log('Productos bajo stock recibidos:', result);
        
        const productos = Array.isArray(result) ? result : 
                         (result.data && Array.isArray(result.data)) ? result.data : [];
                         
        const tbody = document.getElementById('productosBajoStock');
        tbody.innerHTML = '';

        if (productos.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="3" class="text-center">No hay productos con bajo stock</td>`;
            tbody.appendChild(tr);
            return;
        }

        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.stock}</td>
                <td>
                    <a href="productos.html?id=${producto.id_producto}" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los productos con bajo stock: ' + error.message);
    }
}

// Función auxiliar para determinar la clase del badge según el estado
function getEstadoBadgeClass(estado) {
    switch (estado.toLowerCase()) {
        case 'pendiente':
            return 'warning';
        case 'completado':
            return 'success';
        case 'cancelado':
            return 'danger';
        default:
            return 'secondary';
    }
} 