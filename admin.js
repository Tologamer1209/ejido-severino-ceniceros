// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
const GITHUB_USER = "tologamer1209";
const REPO_NAME = "ejido-severino-ceniceros";
const BRANCH = "main";

document.addEventListener('DOMContentLoaded', () => {
    // Cargar avisos en la vista pública de la página principal
    cargarAvisosPublicos();

    const tokenGuardado = sessionStorage.getItem('gh_token');

    if (tokenGuardado) {
        const inputToken = document.getElementById('githubToken');

        if (inputToken) {
            inputToken.value = tokenGuardado;
        }

        verificarToken(true);
    }

    const formAviso = document.getElementById('avisoForm');

    if (formAviso) {
        formAviso.addEventListener('submit', publicarAviso);
    }
});

// Función para mostrar los avisos en la página principal pública
async function cargarAvisosPublicos() {
    const contenedor = document.getElementById('contenedorAvisos');
    if (!contenedor) return;

    try {
        // Se añade ?t= para saltar la caché de GitHub Pages y ver los cambios al instante
        const respuesta = await fetch(`avisos.json?t=${Date.now()}`);
        
        if (!respuesta.ok) {
            contenedor.innerHTML = "<p>No hay avisos publicados en este momento.</p>";
            return;
        }

        const avisos = await respuesta.json();

        if (!Array.isArray(avisos) || avisos.length === 0) {
            contenedor.innerHTML = "<p>No hay avisos recientes por el momento.</p>";
            return;
        }

        let html = '';
        avisos.forEach(aviso => {
            html += `
                <div class="aviso-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 15px;">
                    <span class="aviso-fecha" style="color: #666; font-size: 0.85rem;"><i class="fa-regular fa-calendar"></i> ${aviso.fecha || 'Fecha no especificada'}</span>
                    <h3 style="margin: 10px 0; color: #333;">${aviso.titulo}</h3>
                    <p style="color: #555; line-height: 1.5;">${aviso.resumen}</p>
                    ${aviso.enlaceFacebook ? `<a href="${aviso.enlaceFacebook}" target="_blank" class="btn-enlace-fb" style="display: inline-block; margin-top: 10px; color: #1877f2; text-decoration: none; font-weight: 600;"><i class="fa-brands fa-facebook"></i> Ver más en Facebook</a>` : ''}
                </div>
            `;
        });

        contenedor.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar los avisos públicos:", error);
        contenedor.innerHTML = "<p>Error al cargar los avisos recientes.</p>";
    }
}

function verificarToken(silencioso = false) {
    const tokenInput = document.getElementById('githubToken');

    const token = tokenInput
        ? tokenInput.value.trim()
        : sessionStorage.getItem('gh_token');

    if (!token) {
        if (!silencioso) {
            alert("Por favor ingresa un token válido.");
        }

        return;
    }

    sessionStorage.setItem('gh_token', token);

    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');

    if (loginSection) {
        loginSection.classList.add('hidden');
    }

    if (adminSection) {
        adminSection.classList.remove('hidden');
    }

    cargarAvisosAdmin();
}

function cerrarSesion() {
    sessionStorage.removeItem('gh_token');

    const adminSection = document.getElementById('adminSection');
    const loginSection = document.getElementById('loginSection');
    const githubToken = document.getElementById('githubToken');

    if (adminSection) {
        adminSection.classList.add('hidden');
    }

    if (loginSection) {
        loginSection.classList.remove('hidden');
    }

    if (githubToken) {
        githubToken.value = '';
    }
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

        // OBTENER AVISOS ACTUALES
        const responseGet = await fetch(url, {
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (responseGet.ok) {
            const data = await responseGet.json();
            sha = data.sha;

            try {
                const jsonTexto = new TextDecoder().decode(
                    Uint8Array.from(
                        atob(data.content),
                        c => c.charCodeAt(0)
                    )
                );

                avisosActuales = JSON.parse(jsonTexto);

                if (!Array.isArray(avisosActuales)) {
                    avisosActuales = [];
                }

            } catch (err) {
                console.error("Error al leer avisos.json:", err);
                avisosActuales = [];
            }
        }

        // AGREGAR NUEVO AVISO AL INICIO
        avisosActuales.unshift(nuevoAviso);

        const nuevoContenidoJson = JSON.stringify(
            avisosActuales,
            null,
            2
        );

        const contenidoBase64 = btoa(
            unescape(
                encodeURIComponent(nuevoContenidoJson)
            )
        );

        const payload = {
            message: `Actualización de avisos: ${titulo}`,
            content: contenidoBase64,
            branch: BRANCH
        };

        if (sha) {
            payload.sha = sha;
        }

        // ACTUALIZAR GITHUB
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
            cargarAvisosPublicos(); // Actualizar vista pública también si está abierta en otra pestaña
        } else {
            const errorData = await responseUpdate.json();
            throw new Error(
                errorData.message ||
                "Error desconocido al actualizar."
            );
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

    if (!token || !contenedorLista) {
        return;
    }

    contenedorLista.innerHTML = "<p>Cargando avisos actuales...</p>";

    try {
        const path = "avisos.json";
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (response.ok) {
            const data = await response.json();

            const jsonTexto = new TextDecoder().decode(
                Uint8Array.from(
                    atob(data.content),
                    c => c.charCodeAt(0)
                )
            );

            const avisos = JSON.parse(jsonTexto);

            if (!Array.isArray(avisos) || avisos.length === 0) {
                contenedorLista.innerHTML = "<p>No hay avisos publicados todavía.</p>";
                return;
            }

            let html = '<ul style="list-style: none; padding: 0;">';

            avisos.forEach(aviso => {
                html += `
                    <li style="
                        background: #f9f9f9;
                        border: 1px solid #ddd;
                        padding: 12px;
                        margin-bottom: 10px;
                        border-radius: 6px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <strong>${aviso.titulo}</strong>
                            <small>(${aviso.fecha})</small>
                            <p style="
                                margin: 5px 0 0 0;
                                font-size: 0.9rem;
                                color: #666;
                            ">
                                ${aviso.resumen}
                            </p>
                        </div>
                        <button
                            type="button"
                            onclick="eliminarAviso(${aviso.id})"
                            style="
                                background: #e74c3c;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: pointer;
                            "
                        >
                            Eliminar
                        </button>
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
    if (!confirm("¿Estás seguro de que deseas eliminar este aviso?")) {
        return;
    }

    const token = sessionStorage.getItem('gh_token');
    const path = "avisos.json";
    const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) {
            alert("No se pudo obtener el archivo para actualizar.");
            return;
        }

        const data = await response.json();
        const sha = data.sha;

        const jsonTexto = new TextDecoder().decode(
            Uint8Array.from(
                atob(data.content),
                c => c.charCodeAt(0)
            )
        );

        let avisosActuales = JSON.parse(jsonTexto);

        avisosActuales = avisosActuales.filter(a => a.id !== idAviso);

        const nuevoContenidoJson = JSON.stringify(
            avisosActuales,
            null,
            2
        );

        const contenidoBase64 = btoa(
            unescape(
                encodeURIComponent(nuevoContenidoJson)
            )
        );

        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: "Aviso eliminado",
                content: contenidoBase64,
                sha: sha,
                branch: BRANCH
            })
        });

        if (responseUpdate.ok) {
            alert("Aviso eliminado correctamente.");
            cargarAvisosAdmin();
            cargarAvisosPublicos();
        } else {
            const errorData = await responseUpdate.json();
            alert("No se pudo eliminar el aviso: " + (errorData.message || "Error desconocido"));
        }

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al procesar la eliminación.");
    }
}