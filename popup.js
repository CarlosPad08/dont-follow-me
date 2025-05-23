let seguidores = [];
let seguidos = [];

// Función para actualizar el estado de los checkboxes
function actualizarCheckboxes() {
    document.getElementById("followers").checked = seguidores.length > 0;
    document.getElementById("followings").checked = seguidos.length > 0;
    
    // Actualizar el botón de comparar
    document.getElementById("compareBtn").disabled = !(seguidores.length > 0 && seguidos.length > 0);
}

// Función para verificar si estamos en Instagram
function verificarSiEsInstagram(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) {
            callback(false);
            return;
        }
        
        const esInstagram = tabs[0].url && tabs[0].url.includes("instagram.com");
        callback(esInstagram);
    });
}

// Función para cargar las listas guardadas al iniciar
function cargarListasGuardadas() {
    // Primero comprobamos si estamos en Instagram
    verificarSiEsInstagram((esInstagram) => {
        if (!esInstagram) {
            document.getElementById("status").innerText = "❌ Esta extensión solo funciona en Instagram";
            document.getElementById("extractBtn").disabled = true;
            return;
        }
        
        document.getElementById("extractBtn").disabled = false;
        
        // Intentamos cargar desde almacenamiento sin depender de la página actual
        chrome.storage.local.get('savedLists', (result) => {
            const savedLists = result.savedLists || {};
            
            if (Object.keys(savedLists).length > 0) {
                // Buscar las listas de seguidores y seguidos
                for (const key in savedLists) {
                    const lista = savedLists[key];
                    if (lista.tipoLista === "seguidores") {
                        seguidores = lista.usuarios;
                        console.log("Cargada lista de seguidores:", seguidores.length);
                    } else if (lista.tipoLista === "seguidos") {
                        seguidos = lista.usuarios;
                        console.log("Cargada lista de seguidos:", seguidos.length);
                    }
                }
                
                // Actualizar los checkboxes
                actualizarCheckboxes();
                
                // Actualizar mensaje de estado según las listas disponibles
                if (seguidores.length > 0 && seguidos.length > 0) {
                    document.getElementById("status").innerText = 
                        `Listas cargadas: seguidores (${seguidores.length}), seguidos (${seguidos.length}) ✔️`;
                } else if (seguidores.length > 0) {
                    document.getElementById("status").innerText = 
                        `Lista de seguidores cargada (${seguidores.length}) ✔️`;
                } else if (seguidos.length > 0) {
                    document.getElementById("status").innerText = 
                        `Lista de seguidos cargada (${seguidos.length}) ✔️`;
                } else {
                    document.getElementById("status").innerText = 
                        "No hay listas guardadas. Extrae una lista primero.";
                }
            } else {
                document.getElementById("status").innerText = 
                    "No hay listas guardadas. Extrae una lista primero.";
            }
        });
    });
}

document.getElementById("extractBtn").addEventListener("click", () => {
    verificarSiEsInstagram((esInstagram) => {
        if (!esInstagram) {
            document.getElementById("status").innerText = "❌ Esta extensión solo funciona en Instagram";
            return;
        }
        
        // Ahora sabemos que estamos en Instagram, procedemos a extraer la lista
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id, 
                { action: "getList" }, 
                (response) => {
                    const status = document.getElementById("status");
                    
                    if (chrome.runtime.lastError) {
                        status.innerText = "❌ No se pudo comunicar con Instagram";
                        return;
                    }
                    
                    if (!response) {
                        status.innerText = "❌ No se pudo obtener la respuesta.";
                        return;
                    }
                    
                    if (response && response.tipoLista && response.tipoLista !== "ninguno" && response.usuarios) {
                        console.log("Tipo de lista:", response.tipoLista);
                        console.log("Usuarios:", response.usuarios);
                        
                        if (response.tipoLista === "seguidores") {
                            seguidores = response.usuarios;
                            status.innerText = `Lista de seguidores almacenada (${seguidores.length}) ✔️`;
                        } else if (response.tipoLista === "seguidos") {
                            seguidos = response.usuarios;
                            status.innerText = `Lista de seguidos almacenada (${seguidos.length}) ✔️`;
                        }
                        
                        // Guardar la lista en el almacenamiento
                        chrome.storage.local.get('savedLists', (result) => {
                            const savedLists = result.savedLists || {};
                            savedLists[response.tipoLista] = {
                                tipoLista: response.tipoLista,
                                usuarios: response.usuarios,
                                timestamp: new Date().toISOString()
                            };
                            
                            chrome.storage.local.set({ savedLists }, () => {
                                console.log(`Lista "${response.tipoLista}" guardada correctamente`);
                            });
                        });
                        
                        // Actualizar los checkboxes
                        actualizarCheckboxes();
                    } else {
                        status.innerText = "❌ No se detectó una lista de seguidores o seguidos. Asegúrate de abrir primero el diálogo correspondiente en Instagram.";
                    }
                }
            );
        });
    });
});

document.getElementById("compareBtn").addEventListener("click", () => {
    const result = document.getElementById("result");

    if (seguidores.length === 0 || seguidos.length === 0) {
        result.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error: Necesitas cargar ambas listas primero</div>`;
        return;
    }

    const setSeguidos = new Set(seguidos);
    const setSeguidores = new Set(seguidores);

    const noMeSiguen = [...setSeguidos].filter(usuario => !setSeguidores.has(usuario));
    
    // Crear contenido HTML estructurado para los resultados
    let htmlContent = `
        <div class="result-header">
            <span class="result-count">${noMeSiguen.length}</span>
            <span class="result-title">Usuarios que sigues pero no te siguen</span>
        </div>
        <div class="user-list">`;
    
    if (noMeSiguen.length > 0) {
        noMeSiguen.forEach(usuario => {
            htmlContent += `
                <div class="user-item">
                    <span class="user-name"><i class="fas fa-user"></i> ${usuario}</span>
                </div>`;
        });
    } else {
        htmlContent += `<div class="empty-list">¡Genial! Todos los usuarios que sigues te siguen de vuelta.</div>`;
    }
    
    htmlContent += `</div>`;
    result.innerHTML = htmlContent;
});

// Función para borrar listas guardadas
function borrarListasGuardadas() {
    // Borrar directamente del almacenamiento sin depender de la página actual
    chrome.storage.local.remove('savedLists', () => {
        if (chrome.runtime.lastError) {
            console.error("Error al borrar las listas:", chrome.runtime.lastError);
            document.getElementById("status").innerText = "❌ Error al borrar las listas";
            return;
        }
        
        // Reiniciar variables
        seguidores = [];
        seguidos = [];
        
        // Actualizar UI
        document.getElementById("status").innerText = "Listas borradas correctamente ✓";
        document.getElementById("result").innerText = "";
        
        // Actualizar checkboxes
        actualizarCheckboxes();
        
        console.log("Listas borradas correctamente");
    });
}

// Añadir event listener al botón de borrar
document.getElementById("clearBtn").addEventListener("click", borrarListasGuardadas);

// Cargar las listas guardadas al abrir el popup
document.addEventListener('DOMContentLoaded', cargarListasGuardadas);
