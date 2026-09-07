// ==========================================
// 1. MENÚ NAVEGACIÓN Y RESALTADO DE SECCIONES
// ==========================================

function abrirMenu() {
    document.querySelector(".menu")?.classList.toggle("activo");
}

const menuPrincipal = document.querySelector(".menu");

function actualizarMenuFijo() {
    if (menuPrincipal) {
        menuPrincipal.classList.toggle("menu-fijo", window.scrollY > 150);
    }
}

window.addEventListener("scroll", actualizarMenuFijo, { passive: true });
actualizarMenuFijo();

const enlacesMenu = [...document.querySelectorAll(".menu a[href^='#']")];
const seccionesMenu = enlacesMenu
    .map(enlace => document.querySelector(enlace.getAttribute("href")))
    .filter(Boolean);

function marcarEnlaceActivo(id) {
    enlacesMenu.forEach(enlace => {
        enlace.classList.toggle("activo", enlace.getAttribute("href") === `#${id}`);
    });
}

enlacesMenu.forEach(enlace => {
    enlace.addEventListener("click", () => {
        marcarEnlaceActivo(enlace.getAttribute("href").slice(1));
        menuPrincipal?.classList.remove("activo");
    });
});

const observadorSecciones = new IntersectionObserver((entradas) => {
    const visible = entradas
        .filter(entrada => entrada.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) marcarEnlaceActivo(visible.target.id);
}, { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.2, 0.5] });

seccionesMenu.forEach(seccion => observadorSecciones.observe(seccion));


// ==========================================
// 2. CARRUSEL HERO PRINCIPAL
// ==========================================

const slides = document.querySelectorAll(".hero-slide");
const mensajes = document.querySelectorAll(".hero-mensaje");
const indicadores = document.querySelectorAll(".indicadores button");
let diapositivaActual = 0;
let temporizadorHero = null;

function mostrarDiapositiva(indice) {
    if (slides.length === 0) return;
    diapositivaActual = (indice + slides.length) % slides.length;
    
    slides.forEach((slide, i) => slide.classList.toggle("activo", i === diapositivaActual));
    mensajes.forEach((mensaje, i) => mensaje.classList.toggle("activo", i === diapositivaActual));
    indicadores.forEach((indicador, i) => indicador.classList.toggle("activo", i === diapositivaActual));
}

function iniciarAutoplayHero() {
    if (temporizadorHero) clearInterval(temporizadorHero);
    temporizadorHero = setInterval(() => mostrarDiapositiva(diapositivaActual + 1), 6500);
}

document.querySelector(".anterior")?.addEventListener("click", () => {
    mostrarDiapositiva(diapositivaActual - 1);
    iniciarAutoplayHero();
});

document.querySelector(".siguiente")?.addEventListener("click", () => {
    mostrarDiapositiva(diapositivaActual + 1);
    iniciarAutoplayHero();
});

indicadores.forEach((indicador, i) => {
    indicador.addEventListener("click", () => {
        mostrarDiapositiva(i);
        iniciarAutoplayHero();
    });
});

iniciarAutoplayHero();


// ==========================================
// 3. CARRUSEL BIBLIOTECA Y GALERÍA
// ==========================================

function moverLibros(direccion) {
    const track = document.getElementById('carruselLibrosTrack');
    const items = document.querySelectorAll('.libro-card');
    if (!track || items.length === 0) return;

    const estiloTrack = window.getComputedStyle(track);
    const gap = parseFloat(estiloTrack.gap) || 20;
    const anchoPaso = items[0].getBoundingClientRect().width + gap;

    const scrollMaximo = track.scrollWidth - track.clientWidth;
    let nuevoScroll = track.scrollLeft + (direccion * anchoPaso);

    if (nuevoScroll > scrollMaximo + 10 && direccion > 0) {
        nuevoScroll = 0;
    } else if (track.scrollLeft <= 10 && direccion < 0) {
        nuevoScroll = scrollMaximo;
    }

    track.scrollTo({ left: nuevoScroll, behavior: 'smooth' });
}

function moverGaleria(direccion) {
    const track = document.getElementById('carruselGaleriaTrack') || document.querySelector('.galeria-track');
    const items = document.querySelectorAll('.galeria-item');
    if (!track || items.length === 0) return;

    const estiloTrack = window.getComputedStyle(track);
    const gap = parseFloat(estiloTrack.gap) || 20;
    const anchoPaso = items[0].getBoundingClientRect().width + gap;

    const scrollMaximo = track.scrollWidth - track.clientWidth;
    let nuevoScroll = track.scrollLeft + (direccion * anchoPaso);

    if (nuevoScroll > scrollMaximo + 10 && direccion > 0) {
        nuevoScroll = 0;
    } else if (track.scrollLeft <= 10 && direccion < 0) {
        nuevoScroll = scrollMaximo;
    }

    track.scrollTo({ left: nuevoScroll, behavior: 'smooth' });
}


// ==========================================
// 4. MODAL / LIGHTBOX DE GALERÍA
// ==========================================

let escalaZoom = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

function actualizarTransformacionImagen() {
    const modalImg = document.getElementById('modalImagen') || document.getElementById('modalGaleriaImg');
    const modalCaption = document.getElementById('modalPieFoto') || document.getElementById('modalGaleriaPie');
    if (!modalImg) return;

    if (escalaZoom <= 1) {
        escalaZoom = 1;
        posX = 0;
        posY = 0;
        modalImg.style.cursor = 'zoom-in';
        if (modalCaption) {
            modalCaption.style.opacity = '1';
            modalCaption.style.visibility = 'visible';
        }
    } else {
        modalImg.style.cursor = isDragging ? 'grabbing' : 'grab';
        if (modalCaption) {
            modalCaption.style.opacity = '0';
            modalCaption.style.visibility = 'hidden';
        }
    }

    modalImg.style.transform = `translate(${posX}px, ${posY}px) scale(${escalaZoom})`;
    modalImg.style.transition = isDragging ? 'none' : 'transform 0.15s ease-out';
}

function resetearZoomModal() {
    escalaZoom = 1;
    posX = 0;
    posY = 0;
    isDragging = false;
    actualizarTransformacionImagen();
}

function cerrarModalDirecto() {
    const modal = document.getElementById('modalGaleria');
    if (modal) {
        modal.classList.remove('activo');
        document.body.style.overflow = '';
        resetearZoomModal();
    }
}

function cerrarModal(e) {
    if (e.target.id === 'modalGaleria' || e.target.classList.contains('modal-galeria-wrapper')) {
        cerrarModalDirecto();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const itemsGaleria = document.querySelectorAll('.galeria-item');
    const modal = document.getElementById('modalGaleria');
    const modalImg = document.getElementById('modalImagen') || document.getElementById('modalGaleriaImg');
    const modalCaption = document.getElementById('modalPieFoto') || document.getElementById('modalGaleriaPie');

    itemsGaleria.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const titulo = item.querySelector('h4') || item.querySelector('p');
            const etiqueta = item.querySelector('span');

            if (img && modal && modalImg) {
                resetearZoomModal();
                modalImg.src = img.src;
                modalImg.alt = img.alt || 'Imagen de la galería';
                
                if (modalCaption) {
                    let textoPie = "";
                    if (etiqueta) textoPie += `[${etiqueta.innerText.trim()}] `;
                    if (titulo) {
                        let tituloLimpio = titulo.innerText.trim().replace(/\s*\(\d{4}\)/, '');
                        textoPie += tituloLimpio;
                    }
                    modalCaption.innerText = textoPie || img.alt || "";
                }

                modal.classList.add('activo');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    if (modalImg) {
        modalImg.addEventListener('click', (e) => {
            e.stopPropagation();
            if (escalaZoom === 1) {
                escalaZoom = 2.5;
            } else {
                resetearZoomModal();
            }
            actualizarTransformacionImagen();
        });

        modal?.addEventListener('wheel', (e) => {
            if (!modal.classList.contains('activo')) return;
            e.preventDefault();

            const delta = e.deltaY < 0 ? 0.25 : -0.25;
            escalaZoom = Math.min(Math.max(1, escalaZoom + delta), 4);

            if (escalaZoom === 1) {
                resetearZoomModal();
            } else {
                actualizarTransformacionImagen();
            }
        }, { passive: false });

        modalImg.addEventListener('mousedown', (e) => {
            if (escalaZoom <= 1) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            actualizarTransformacionImagen();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            actualizarTransformacionImagen();
        });

        window.mouseup = window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                actualizarTransformacionImagen();
            }
        });

        modalImg.addEventListener('touchstart', (e) => {
            if (escalaZoom <= 1 || e.touches.length !== 1) return;
            isDragging = true;
            startX = e.touches[0].clientX - posX;
            startY = e.touches[0].clientY - posY;
        }, { passive: true });

        modalImg.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            posX = e.touches[0].clientX - startX;
            posY = e.touches[0].clientY - startY;
            actualizarTransformacionImagen();
        }, { passive: true });

        modalImg.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
});


// ==========================================
// 5. VISOR DE PDF Y DESCARGAS
// ==========================================

function abrirVisorPDF(urlPdf, titulo) {
    const modal = document.getElementById('modalVisorPDF') || document.getElementById('modalVisor');
    const iframe = document.getElementById('iframePDF') || document.getElementById('visorIframe');
    const tituloEl = document.getElementById('visorTitulo');

    if (modal && iframe) {
        // Asignamos directamente la ruta al iframe para que cargue en pantalla
        iframe.src = urlPdf;
        if (tituloEl) tituloEl.textContent = titulo;

        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarVisorPDFDirecto() {
    const modal = document.getElementById('modalVisorPDF') || document.getElementById('modalVisor');
    const iframe = document.getElementById('iframePDF') || document.getElementById('visorIframe');

    if (modal && iframe) {
        modal.classList.remove('activo');
        iframe.src = '';
        document.body.style.overflow = '';
    }
}

function cerrarVisorPDF(event) {
    if (event.target.id === 'modalVisorPDF' || event.target.id === 'modalVisor') {
        cerrarVisorPDFDirecto();
    }
}

function descargarForzado(ruta, nombreArchivo) {
    const enlace = document.createElement('a');
    enlace.href = encodeURI(ruta);
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

// Cierre con la tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarModalDirecto();
        cerrarVisorPDFDirecto();
    }
});