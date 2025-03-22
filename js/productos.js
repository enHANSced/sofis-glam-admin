// Inicializar DataTable
let productosTable;

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar nombre del admin
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (adminData) {
        document.getElementById('adminName').textContent = `${adminData.nombre} ${adminData.apellido}`;
    }

    // Inicializar DataTable
    productosTable = $('#productosTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        order: [[0, 'desc']], // Ordenar por ID descendente
        columns: [
            { data: 'id_producto' },
            { 
                data: 'file',
                render: function(data) {
                    return `<img src="${data}" alt="Producto" style="width: 50px; height: 50px; object-fit: cover;">`;
                }
            },
            { data: 'nombre' },
            { 
                data: null,
                render: function(row) {
                    // Después de nuestras modificaciones, el campo debería ser "Categoria"
                    if (row.Categoria && row.Categoria.nombre) {
                        return row.Categoria.nombre;
                    } else if (row.Categorium && row.Categorium.nombre) {
                        return row.Categorium.nombre;
                    } else if (row.categoria && row.categoria.nombre) {
                        return row.categoria.nombre;
                    } else if (row.categoria_nombre) {
                        return row.categoria_nombre;
                    } else {
                        console.log('Datos recibidos:', row);
                        return 'No disponible';
                    }
                }
            },
            { 
                data: 'precio',
                render: function(data) {
                    return `L ${parseFloat(data).toFixed(2)}`;
                }
            },
            { data: 'stock' },
            { data: 'genero' },
            { data: 'material' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary editar-producto" data-id="${data.id_producto}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger eliminar-producto" data-id="${data.id_producto}">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Cargar productos
    cargarProductos();
    cargarCategorias();

    // Eventos
    document.getElementById('guardarProducto').addEventListener('click', guardarProducto);
    document.getElementById('productoModal').addEventListener('hidden.bs.modal', limpiarFormulario);
});

// Función para cargar productos
async function cargarProductos() {
    try {
        const response = await fetch('http://localhost:3009/api/productos', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }

        const productos = await response.json();
        productosTable.clear().rows.add(productos).draw();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los productos');
    }
}

// Función para cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch('http://localhost:3009/api/categorias', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al cargar categorías');
        }

        const categorias = await response.json();
        const selectCategoria = document.getElementById('categoria');
        selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
        
        categorias.forEach(categoria => {
            selectCategoria.innerHTML += `<option value="${categoria.id_categoria}">${categoria.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las categorías');
    }
}

// Función para guardar producto
async function guardarProducto() {
    try {
        const formData = new FormData();
        const productoId = document.getElementById('productoId').value;
        const imagen = document.getElementById('imagen').files[0];
        
        // Validación de campos obligatorios
        const nombre = document.getElementById('nombre').value;
        const precio = document.getElementById('precio').value;
        const stock = document.getElementById('stock').value;
        const categoria = document.getElementById('categoria').value;
        
        if (!nombre || !precio || !stock || !categoria) {
            alert('Por favor complete todos los campos obligatorios: Nombre, Precio, Stock y Categoría');
            return;
        }
    
        // Agregar datos del formulario
        formData.append('nombre', nombre);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('precio', precio);
        formData.append('stock', stock);
        formData.append('id_categoria', categoria);
        formData.append('genero', document.getElementById('genero').value);
        formData.append('material', document.getElementById('material').value);
    
        if (imagen) {
            formData.append('file', imagen);
        }
    
        const url = productoId 
            ? `http://localhost:3009/api/productos/${productoId}`
            : 'http://localhost:3009/api/productos';
        
        const method = productoId ? 'PUT' : 'POST';
    
        console.log(`Enviando ${method} a ${url}`);
        console.log('Datos del formulario:', {
            nombre,
            precio,
            stock,
            categoria,
            genero: document.getElementById('genero').value,
            material: document.getElementById('material').value,
            descripcion: document.getElementById('descripcion').value,
            imagen: imagen ? 'Presente' : 'No presente'
        });

        const response = await fetch(url, {
            method: method,
            body: formData,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
    
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || `Error al guardar el producto (${response.status})`);
        }
    
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
    
        // Cerrar modal y recargar tabla
        $('#productoModal').modal('hide');
        cargarProductos();
        alert('Producto guardado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert(`Error al guardar el producto: ${error.message}`);
    }
}

// Función para editar producto
async function editarProducto(id) {
    try {
        const response = await fetch(`http://localhost:3009/api/productos/${id}`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el producto');
        }

        const producto = await response.json();
        
        // Llenar formulario
        document.getElementById('productoId').value = producto.id_producto;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('categoria').value = producto.id_categoria;
        document.getElementById('genero').value = producto.genero;
        document.getElementById('material').value = producto.material;

        // Cambiar título del modal
        document.getElementById('productoModalLabel').textContent = 'Editar Producto';

        // Mostrar modal
        $('#productoModal').modal('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el producto');
    }
}

// Función para eliminar producto
async function eliminarProducto(id) {
    if (!confirm('¿Está seguro de eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3009/api/productos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el producto');
        }

        cargarProductos();
        alert('Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
    }
}

// Función para limpiar formulario
function limpiarFormulario() {
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    document.getElementById('productoModalLabel').textContent = 'Nuevo Producto';
}

// Eventos de la tabla
$('#productosTable').on('click', '.editar-producto', function() {
    const id = $(this).data('id');
    editarProducto(id);
});

$('#productosTable').on('click', '.eliminar-producto', function() {
    const id = $(this).data('id');
    eliminarProducto(id);
}); 