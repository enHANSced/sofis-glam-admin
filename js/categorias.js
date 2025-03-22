// Inicializar DataTable
let categoriasTable;

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar nombre del admin
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (adminData) {
        document.getElementById('adminName').textContent = `${adminData.nombre} ${adminData.apellido}`;
    }

    // Inicializar DataTable
    categoriasTable = $('#categoriasTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        },
        order: [[0, 'desc']], // Ordenar por ID descendente
        columns: [
            { data: 'id_categoria' },
            { data: 'nombre' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary editar-categoria" data-id="${data.id_categoria}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger eliminar-categoria" data-id="${data.id_categoria}">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Cargar categorías
    cargarCategorias();

    // Eventos
    document.getElementById('guardarCategoria').addEventListener('click', guardarCategoria);
    document.getElementById('categoriaModal').addEventListener('hidden.bs.modal', limpiarFormulario);
});

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
        categoriasTable.clear().rows.add(categorias).draw();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las categorías');
    }
}

// Función para guardar categoría
async function guardarCategoria() {
    const categoriaId = document.getElementById('categoriaId').value;
    const nombre = document.getElementById('nombre').value;

    try {
        const url = categoriaId 
            ? `http://localhost:3009/api/categorias/${categoriaId}`
            : 'http://localhost:3009/api/categorias';
        
        const method = categoriaId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al guardar la categoría');
        }

        // Cerrar modal y recargar tabla
        $('#categoriaModal').modal('hide');
        cargarCategorias();
        alert('Categoría guardada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la categoría');
    }
}

// Función para editar categoría
async function editarCategoria(id) {
    try {
        const response = await fetch(`http://localhost:3009/api/categorias/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al cargar la categoría');
        }

        const categoria = await response.json();
        
        // Llenar formulario
        document.getElementById('categoriaId').value = categoria.id_categoria;
        document.getElementById('nombre').value = categoria.nombre;

        // Cambiar título del modal
        document.getElementById('categoriaModalLabel').textContent = 'Editar Categoría';

        // Mostrar modal
        $('#categoriaModal').modal('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la categoría');
    }
}

// Función para eliminar categoría
async function eliminarCategoria(id) {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3009/api/categorias/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la categoría');
        }

        cargarCategorias();
        alert('Categoría eliminada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la categoría');
    }
}

// Función para limpiar formulario
function limpiarFormulario() {
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaModalLabel').textContent = 'Nueva Categoría';
}

// Eventos de la tabla
$('#categoriasTable').on('click', '.editar-categoria', function() {
    const id = $(this).data('id');
    editarCategoria(id);
});

$('#categoriasTable').on('click', '.eliminar-categoria', function() {
    const id = $(this).data('id');
    eliminarCategoria(id);
}); 