// Inicialización de DataTables
let comprasTable;
let filtrosActivos = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Página de compras cargada");
    
    // Verificar autenticación
    if (!checkAuth()) {
        console.log("No autenticado, redirigiendo a login");
        window.location.href = 'login.html';
        return;
    }
    
    console.log("Usuario autenticado, continuando...");

    // Mostrar nombre del admin
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (adminData && adminData.nombre) {
        document.getElementById('adminName').textContent = adminData.nombre;
    }

    // Inicializar DataTable
    comprasTable = $('#comprasTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        order: [[0, 'desc']], // Ordenar por ID descendente
        columns: [
            { data: 'id_compra' },
            { 
                data: 'Cliente',
                render: function(data) {
                    return data ? data.nombre + ' ' + data.apellido : 'N/A';
                }
            },
            { 
                data: 'total',
                render: function(data) {
                    return `L ${parseFloat(data).toFixed(2)}`;
                }
            },
            { 
                data: 'fecha',
                render: function(data) {
                    return new Date(data).toLocaleString('es-ES');
                }
            },
            { 
                data: 'estado',
                render: function(data) {
                    let badgeClass = 'badge ';
                    switch(data.toLowerCase()) {
                        case 'pendiente':
                            badgeClass += 'badge-warning';
                            break;
                        case 'entregado':
                            badgeClass += 'badge-success';
                            break;
                        case 'cancelado':
                            badgeClass += 'badge-danger';
                            break;
                        default:
                            badgeClass += 'badge-secondary';
                    }
                    return `<span class="${badgeClass}">${data}</span>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-info btn-sm ver-detalles" data-id="${data.id_compra}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Cargar compras
    cargarCompras();

    // Event listeners
    document.getElementById('btnFiltrarEstado').addEventListener('click', toggleFiltros);
    document.getElementById('btnFiltrarFechas').addEventListener('click', toggleFiltros);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);
    document.getElementById('filtrosForm').addEventListener('submit', aplicarFiltros);
    document.getElementById('actualizarEstado').addEventListener('click', mostrarModalActualizarEstado);
    document.getElementById('guardarEstado').addEventListener('click', guardarEstadoCompra);

    // Event listener para los botones de ver detalles
    $('#comprasTable').on('click', '.ver-detalles', function() {
        const idCompra = $(this).data('id');
        verDetallesCompra(idCompra);
    });
});

// Función para cargar las compras
async function cargarCompras() {
    try {
        const token = getAuthToken();
        console.log('Token para cargar compras:', token ? 'Token presente' : 'Token ausente');
        
        if (!token) {
            console.error('No hay token de autenticación disponible');
            alert('Su sesión ha expirado, por favor inicie sesión nuevamente');
            window.location.href = 'login.html';
            return;
        }

        console.log('Haciendo petición a: http://localhost:3009/api/admin/compras');
        const response = await fetch('http://localhost:3009/api/admin/compras', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Token no válido o expirado, redirigiendo al login');
                alert('Su sesión ha expirado, por favor inicie sesión nuevamente');
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error en la respuesta:', errorText);
            throw new Error('Error al cargar las compras');
        }

        const result = await response.json();
        console.log('Datos de compras recibidos:', result);

        let data;
        if (result && Array.isArray(result)) {
            data = result;
        } else if (result && result.data && Array.isArray(result.data)) {
            data = result.data;
        } else if (result && result.ok && result.data && Array.isArray(result.data)) {
            data = result.data;
        } else {
            console.error('Formato de datos inesperado:', result);
            alert('Error en el formato de datos recibidos');
            return;
        }

        console.log('Datos procesados para DataTable:', data);
        comprasTable.clear().rows.add(data).draw();
    } catch (error) {
        console.error('Error al cargar compras:', error);
        alert('Error al cargar las compras: ' + error.message);
    }
}

// Función para ver detalles de una compra
async function verDetallesCompra(idCompra) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`http://localhost:3009/api/admin/compras/${idCompra}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Error al cargar los detalles de la compra');
        }

        const result = await response.json();
        console.log('Detalles de compra recibidos:', result);
        
        let compra;
        if (result && result.data) {
            compra = result.data;
        } else if (result) {
            compra = result;
        } else {
            throw new Error('Formato de datos inesperado');
        }
        
        // Actualizar información del cliente
        const clienteInfo = document.getElementById('clienteInfo');
        if (compra.Cliente) {
            clienteInfo.innerHTML = `
                <p><strong>Nombre:</strong> ${compra.Cliente.nombre} ${compra.Cliente.apellido}</p>
                <p><strong>Email:</strong> ${compra.Cliente.email}</p>
                <p><strong>Teléfono:</strong> ${compra.Cliente.telefono}</p>
                ${compra.Cliente.direccion ? `<p><strong>Dirección:</strong> ${compra.Cliente.direccion}</p>` : ''}
            `;
        } else {
            clienteInfo.innerHTML = `
                <p><em>No hay información de cliente disponible</em></p>
            `;
        }

        // Actualizar información de la compra
        const compraInfo = document.getElementById('compraInfo');
        compraInfo.innerHTML = `
            <p><strong>ID:</strong> ${compra.id_compra}</p>
            <p><strong>Fecha:</strong> ${new Date(compra.fecha).toLocaleString('es-ES')}</p>
            <p><strong>Estado:</strong> ${compra.estado}</p>
            <p><strong>Total:</strong> L ${parseFloat(compra.total).toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> ${compra.metodo_pago}</p>
            ${compra.referencia_pago ? `<p><strong>Referencia:</strong> ${compra.referencia_pago}</p>` : ''}
            ${compra.notas ? `<p><strong>Notas:</strong> ${compra.notas}</p>` : ''}
        `;

        // Actualizar tabla de detalles
        const detallesTable = document.getElementById('detallesTable').getElementsByTagName('tbody')[0];
        detallesTable.innerHTML = '';
        
        // Verificar si los detalles están en compra.DetallesCompras (nuevo alias)
        const detalles = compra.DetallesCompras || [];
        
        if (detalles.length > 0) {
            let totalCalculado = 0;
            detalles.forEach(detalle => {
                if (detalle && detalle.Producto) {
                    const subtotal = detalle.cantidad * detalle.precio_unitario;
                    totalCalculado += subtotal;
                    const row = detallesTable.insertRow();
                    row.innerHTML = `
                        <td>${detalle.Producto.nombre}</td>
                        <td>${detalle.cantidad}</td>
                        <td>L ${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                        <td>L ${parseFloat(subtotal).toFixed(2)}</td>
                    `;
                }
            });

            // Actualizar el total en el pie de la tabla
            document.getElementById('totalCompra').textContent = `L ${parseFloat(totalCalculado).toFixed(2)}`;
        } else {
            const row = detallesTable.insertRow();
            row.innerHTML = `
                <td colspan="4" class="text-center"><em>No hay detalles de compra disponibles</em></td>
            `;
            document.getElementById('totalCompra').textContent = 'L 0.00';
        }

        // Guardar ID de la compra para actualización de estado
        document.getElementById('detallesCompraModal').dataset.idCompra = idCompra;

        // Mostrar modal
        $('#detallesCompraModal').modal('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la compra: ' + error.message);
    }
}

// Función para mostrar/ocultar filtros
function toggleFiltros() {
    const filtrosCard = document.getElementById('filtrosCard');
    filtrosCard.style.display = filtrosCard.style.display === 'none' ? 'block' : 'none';
}

// Función para limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtrosForm').reset();
    document.getElementById('estadoFiltro').value = '';
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    cargarCompras();
    filtrosActivos = false;
}

// Función para aplicar filtros
async function aplicarFiltros(e) {
    e.preventDefault();
    
    const estado = document.getElementById('estadoFiltro').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        let url = 'http://localhost:3009/api/admin/compras';
        const params = new URLSearchParams();

        if (estado) {
            url = `http://localhost:3009/api/admin/compras/estado/${estado}`;
        } else if (fechaInicio && fechaFin) {
            params.append('fechaInicio', fechaInicio);
            params.append('fechaFin', fechaFin);
            url += `?${params.toString()}`;
        }

        console.log('Aplicando filtros, URL:', url);
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error en la respuesta:', errorText);
            throw new Error('Error al aplicar los filtros');
        }

        const result = await response.json();
        console.log('Datos filtrados recibidos:', result);
        
        let data;
        if (result && Array.isArray(result)) {
            data = result;
        } else if (result && result.data && Array.isArray(result.data)) {
            data = result.data;
        } else if (result && result.ok && result.data && Array.isArray(result.data)) {
            data = result.data;
        } else {
            console.error('Formato de datos inesperado:', result);
            alert('Error en el formato de datos recibidos');
            return;
        }
        
        console.log('Datos procesados para DataTable:', data);
        comprasTable.clear().rows.add(data).draw();
        filtrosActivos = true;
        document.getElementById('filtrosCard').style.display = 'none';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al aplicar los filtros: ' + error.message);
    }
}

// Función para mostrar modal de actualización de estado
function mostrarModalActualizarEstado() {
    const idCompra = document.getElementById('detallesCompraModal').dataset.idCompra;
    document.getElementById('compraId').value = idCompra;
    $('#detallesCompraModal').modal('hide');
    $('#actualizarEstadoModal').modal('show');
}

// Función para guardar el estado de una compra
async function guardarEstadoCompra() {
    const idCompra = document.getElementById('compraId').value;
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    const notas = document.getElementById('notas').value;

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        console.log('Actualizando estado, datos:', { idCompra, nuevoEstado, notas });
        const response = await fetch(`http://localhost:3009/api/admin/compras/${idCompra}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                estado: nuevoEstado,
                notas: notas || undefined
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            const errorText = await response.text();
            console.error('Error en la respuesta:', errorText);
            throw new Error('Error al actualizar el estado de la compra');
        }

        const result = await response.json();
        console.log('Resultado de actualización:', result);

        alert('Estado actualizado correctamente');
        $('#actualizarEstadoModal').modal('hide');
        cargarCompras();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado de la compra: ' + error.message);
    }
} 