// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
const GITHUB_USER = "tologamer1209";       // Tu usuario correcto de GitHub
const REPO_NAME = "tologamer1209.github.io"; // El nombre exacto de tu repositorio
const BRANCH = "main";                  // Tu rama principal

// Verificar al cargar la página si ya hay una sesión activa en sessionStorage
document.addEventListener('DOMContentLoaded', () => {
    const tokenGuardado = sessionStorage.getItem('gh_token');
    if (tokenGuardado) {
        const inputToken = document.getElementById('githubToken');
        if (inputToken) inputToken.value = tokenGuardado;
        verificarToken(true); // Oculta login y muestra el panel directamente
    }
    
    // Escuchar el evento de envío del formulario de avisos
    const formAviso = document.getElementById('avisoForm');
    if (formAviso) {
        formAviso.addEventListener('submit', publicarAviso);
    }
});

function verificarToken(silencioso = false) {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput ? tokenInput.value.trim() : sessionStorage.getItem('gh_token');
    
    if (!token) {
        if (!silencioso) alert("Por favor ingresa un token válido.");
        return;
    }
    
    // Guardamos el token de forma temporal en la sesión del navegador
    sessionStorage.setItem('gh_token', token);
    
    // Ocultamos login y mostramos panel
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    
    if (loginSection) loginSection.classList.add('hidden');
    if (adminSection) adminSection.classList.remove('hidden');

    // Cargamos la lista de avisos existentes para gestionarlos
    cargarAvisosAdmin();
}

function cerrarSesion() {
    sessionStorage.removeItem('gh_token');
    const adminSection = document.getElementById('adminSection');
    const loginSection = document.getElementById('loginSection');
    const githubToken = document.getElementById('githubToken');

    if (adminSection) adminSection.classList.add('hidden');
    if (loginSection) loginSection.classList.remove('hidden');
    if (githubToken) githubToken.value = '';
}

async function publicarAviso(e) {
    e.preventDefault();
    const token = sessionStorage.getItem('gh_token');
    
    if (!token) {
        alert("Sesión expirada. Ingresa tu token de nuevo.");
        cerrarSesion();
        return;
    }

    const titulo = document.getElementById('titulo').value;
    const fecha = document.getElementById('fecha').value;
    const resumen = document.getElementById('resumen').value;
    const enlaceFacebook = document.getElementById('enlaceFacebook').value;

    const btn = document.getElementById('btnPublicar');
    if (btn) {
        btn.textContent = "Publicando...";
        btn.disabled = true;
    }

    // Estructura de datos para el aviso nuevo
    const nuevoAviso = {
        titulo,
        fecha,
        resumen,
        enlaceFacebook,
        id: Date.now() // Identificador único basado en el tiempo
    };

    try {
        const path = "avisos.json";
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

        let sha = "";
        let avisosActuales = [];

        const response = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            sha = data.sha; // Necesario en GitHub para actualizar archivos existentes
            
            // Decodificación segura en UTF-8 para soportar tildes y caracteres especiales
            const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
            avisosActuales = JSON.parse(jsonTexto);
        }

        // Agregamos el nuevo aviso al inicio de la lista
        avisosActuales.unshift(nuevoAviso);

        // Convertimos la lista a texto JSON y la codificamos de manera segura en Base64 (UTF-8)
        const nuevoContenidoJson = JSON.stringify(avisosActuales, null, 2);
        const contenidoBase64 = btoa(unescape(encodeURIComponent(nuevoContenidoJson)));

        // Enviamos el commit automático a GitHub
        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Nuevo aviso añadido: ${titulo}`,
                content: contenidoBase64,
                sha: sha ? sha : undefined,
                branch: BRANCH
            })
        });

        if (responseUpdate.ok) {
            alert("¡Aviso publicado con éxito en la página!");
            document.getElementById('avisoForm').reset();
            cargarAvisosAdmin(); // Actualiza la lista en el panel
        } else {
            const errorData = await responseUpdate.json();
            alert("Error al publicar: " + errorData.message);
        }

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error de conexión o formato.");
    } finally {
        if (btn) {
            btn.textContent = "Publicar en la Página";
            btn.disabled = false;
        }
    }
}

// Función para listar y eliminar avisos desde el panel
async function cargarAvisosAdmin() {
    const token = sessionStorage.getItem('gh_token');
    const contenedorLista = document.getElementById('listaAvisosAdmin');
    if (!token || !contenedorLista) return;

    contenedorLista.innerHTML = "<p>Cargando avisos actuales...</p>";

    try {
        const path = "avisos.json";
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

        const response = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
            const avisos = JSON.parse(jsonTexto);

            if (avisos.length === 0) {
                contenedorLista.innerHTML = "<p>No hay avisos publicados todavía.</p>";
                return;
            }

            let html = '<ul style="list-style: none; padding: 0;">';
            avisos.forEach(aviso => {
                html += `
                    <li style="background: #f9f9f9; border: 1px solid #ddd; padding: 12px; margin-bottom: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${aviso.titulo}</strong> <small>(${aviso.fecha})</small>
                            <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #666;">${aviso.resumen}</p>
                        </div>
                        <button type="button" onclick="eliminarAviso(${aviso.id})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Eliminar</button>
                    </li>
                `;
            });
            html += '</ul>';
            contenedorLista.innerHTML = html;
        } else {
            contenedorLista.innerHTML = "<p>No se encontró el archivo avisos.json o está vacío (se creará al publicar el primero).</p>";
        }
    } catch (error) {
        console.error(error);
        contenedorLista.innerHTML = "<p>Error al cargar los avisos existentes.</p>";
    }
}

async function eliminarAviso(idAviso) {
    if (!confirm("¿Estás seguro de que deseas eliminar este aviso?")) return;

    const token = sessionStorage.getItem('gh_token');
    const path = "avisos.json";
    const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

    try {
        const response = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (!response.ok) return alert("No se pudo obtener el archivo para actualizar.");

        const data = await response.json();
        const sha = data.sha;
        const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
        let avisosActuales = JSON.parse(jsonTexto);

        // Filtramos para quitar el aviso seleccionado
        avisosActuales = avisosActuales.filter(a => a.id !== idAviso);

        const nuevoContenidoJson = JSON.stringify(avisosActuales, null, 2);
        const contenidoBase64 = btoa(unescape(encodeURIComponent(nuevoContenidoJson)));

        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Aviso eliminado`,
                content: contenidoBase64,
                sha: sha,
                branch: BRANCH
            })
        });

        if (responseUpdate.ok) {
            alert("Aviso eliminado correctamente.");
            cargarAvisosAdmin();
        } else {
            alert("No se pudo eliminar el aviso.");
        }
    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al procesar la eliminación.");
    }
}
