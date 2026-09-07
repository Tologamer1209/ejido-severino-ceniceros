// CONFIGURACIÓN DE TU REPOSITORIO DE GITHUB
const GITHUB_USER = "Tologamer109";      // Tu usuario de GitHub
const REPO_NAME = "ejido-severino-ceniceros"; // El nombre exacto de tu repositorio
const BRANCH = "main";                  // Tu rama principal

function verificarToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        alert("Por favor ingresa un token válido.");
        return;
    }
    
    // Guardamos el token de forma temporal en la sesión del navegador
    sessionStorage.setItem('gh_token', token);
    
    // Ocultamos login y mostramos panel
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
}

async function publicarAviso(e) {
    e.preventDefault();
    const token = sessionStorage.getItem('gh_token');
    
    if (!token) {
        alert("Sesión expirada. Ingresa tu token de nuevo.");
        location.reload();
        return;
    }

    const titulo = document.getElementById('titulo').value;
    const fecha = document.getElementById('fecha').value;
    const resumen = document.getElementById('resumen').value;
    const enlaceFacebook = document.getElementById('enlaceFacebook').value;

    const btn = document.getElementById('btnPublicar');
    btn.textContent = "Publicando...";
    btn.disabled = true;

    // Estructura de datos para el aviso nuevo
    const nuevoAviso = {
        titulo,
        fecha,
        resumen,
        enlaceFacebook,
        id: Date.now() // Identificador único basado en el tiempo
    };

    try {
        // 1. Obtenemos el archivo de avisos actual de GitHub (ej. avisos.json) si existiera, 
        // o creamos uno nuevo. Por simplicidad, consultamos la API.
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
            // Decodificamos el contenido actual de Base64 a texto plano
            const jsonTexto = decodeURIComponent(escape(atob(data.content)));
            avisosActuales = JSON.parse(jsonTexto);
        }

        // Agregamos el nuevo aviso al inicio de la lista
        avisosActuales.unshift(nuevoAviso);

        // Convertimos la lista a texto JSON
        const nuevoContenidoJson = JSON.stringify(avisosActuales, null, 2);
        // Codificamos a Base64 para enviarlo por la API de GitHub
        const contenidoBase64 = btoa(unescape(encodeURIComponent(nuevoContenidoJson)));

        // 2. Enviamos el commit automático a GitHub
        const responseUpdate = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Nuevo aviso añadido: ${titulo}`,
                content: contenidoBase64,
                sha: sha ? sha : undefined, // Si ya existía el archivo, mandamos su sha
                branch: BRANCH
            })
        });

        if (responseUpdate.ok) {
            alert("¡Aviso publicado con éxito en la página!");
            document.getElementById('avisoForm').reset();
        } else {
            const errorData = await responseUpdate.json();
            alert("Error al publicar: " + errorData.message);
        }

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error de conexión.");
    } finally {
        btn.textContent = "Publicar en la Página";
        btn.disabled = false;
    }
}