// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
const GITHUB_USER = "tologamer1209";
const REPO_NAME = "ejido-severino-ceniceros";
const BRANCH = "main";                 

document.addEventListener('DOMContentLoaded', () => {
    const tokenGuardado = sessionStorage.getItem('gh_token');
    if (tokenGuardado) {
        const inputToken = document.getElementById('githubToken');
        if (inputToken) inputToken.value = tokenGuardado;
        verificarToken(true); 
    }
    
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
    
    sessionStorage.setItem('gh_token', token);
    
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    
    if (loginSection) loginSection.classList.add('hidden');
    if (adminSection) adminSection.classList.remove('hidden');

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

    const titulo = document.getElementById('titulo').value.trim();
    const fecha = document.getElementById('fecha').value;
    const resumen = document.getElementById('resumen').value.trim();
    const enlaceFacebook = document.getElementById('enlaceFacebook').value.trim();

    const btn = document.getElementById('btnPublicar');
    if (btn) {
        btn.textContent = "Publicando...";
        btn.disabled = true;
    }

    const nuevoAviso = {
        titulo,
        fecha,
        resumen,
        enlaceFacebook,
        id: Date.now()
    };

    try {
        const path = "avisos.json";
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

        let sha = null;
        let avisosActuales = [];

        // Intentar leer el archivo actual para conservar los anteriores
        const responseGet = await fetch(url, {
            headers: { 
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Cache-Control": "no-cache"
            }
        });

        if (responseGet.ok) {
            const data = await responseGet.json();
            sha = data.sha; 
            try {
                const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
                avisosActuales = JSON.parse(jsonTexto);
                if (!Array.isArray(avisosActuales)) avisosActuales = [];
            } catch (err) {
                avisosActuales = [];
            }
        }

        // Agregar el nuevo aviso al inicio
        avisosActuales.unshift(nuevoAviso);

        const nuevoContenidoJson = JSON.stringify(avisosActuales, null, 2);
        const contenidoBase64 = btoa(unescape(encodeURIComponent(nuevoContenidoJson)));

        const payload = {
            message: `Actualización de avisos: ${titulo}`,
            content: contenidoBase64,
            branch: BRANCH
        };

        if (sha) {
            payload.sha = sha;
        }

        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify(payload)
        });

        if (responseUpdate.ok) {
            alert("¡Aviso publicado con éxito en la página!");
            document.getElementById('avisoForm').reset();
            cargarAvisosAdmin(); 
        } else {
            const errorData = await responseUpdate.json();
            throw new Error(errorData.message || "Error desconocido al actualizar.");
        }

    } catch (error) {
        console.error(error);
        alert("Error al publicar: " + error.message);
    } finally {
        if (btn) {
            btn.textContent = "Publicar en la Página";
            btn.disabled = false;
        }
    }
}

async function cargarAvisosAdmin() {
    const token = sessionStorage.getItem('gh_token');
    const contenedorLista = document.getElementById('listaAvisosAdmin');
    if (!token || !contenedorLista) return;

    contenedorLista.innerHTML = "<p>Cargando avisos actuales...</p>";

    try {
        const path = "avisos.json";
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

        const response = await fetch(url, {
            headers: { 
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Cache-Control": "no-cache"
            }
        });

        if (response.ok) {
            const data = await response.json();
            const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
            const avisos = JSON.parse(jsonTexto);

            if (!Array.isArray(avisos) || avisos.length === 0) {
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
            contenedorLista.innerHTML = "<p>No se encontró el archivo avisos.json (se creará automáticamente al publicar el primer aviso).</p>";
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
            headers: { 
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) return alert("No se pudo obtener el archivo para actualizar.");

        const data = await response.json();
        const sha = data.sha;
        const jsonTexto = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
        let avisosActuales = JSON.parse(jsonTexto);

        avisosActuales = avisosActuales.filter(a => a.id !== idAviso);

        const nuevoContenidoJson = JSON.stringify(avisosActuales, null, 2);
        const contenidoBase64 = btoa(unescape(encodeURIComponent(nuevoContenidoJson)));

        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
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
