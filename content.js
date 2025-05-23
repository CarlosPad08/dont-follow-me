function getInstagramList() {
    let usuarios = [];

    // Detectar si estamos viendo seguidores o seguidos
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) {
        console.log("No se encontró el diálogo de seguidores/seguidos.");
        return { tipoLista: "ninguno", usuarios: [] };
    }

    const heading = dialog.querySelector('div[role="heading"]');
    let tipoLista = 'desconocido';

    if (heading) {
        const texto = heading.innerText.trim().toLowerCase();
        if (texto.includes('seguidos')) tipoLista = 'seguidos';
        else if (texto.includes('seguidores')) tipoLista = 'seguidores';
    }

    dialog.querySelectorAll('a.x1i10hfl').forEach(user => {
        const username = user.innerText.trim();
        if (username) {
            usuarios.push(username);
        }
    });

    return { tipoLista, usuarios };
}

// Guardar una lista en el almacenamiento persistente
function saveListToStorage(listName, listData) {
    return new Promise((resolve) => {
        chrome.storage.local.get('savedLists', (result) => {
            const savedLists = result.savedLists || {};
            savedLists[listName] = {
                tipoLista: listData.tipoLista,
                usuarios: listData.usuarios,
                timestamp: new Date().toISOString()
            };
            
            chrome.storage.local.set({ savedLists }, () => {
                console.log(`Lista "${listName}" guardada correctamente`);
                resolve(true);
            });
        });
    });
}

// Recuperar todas las listas guardadas
function getAllSavedLists() {
    return new Promise((resolve) => {
        chrome.storage.local.get('savedLists', (result) => {
            resolve(result.savedLists || {});
        });
    });
}

// Borrar todas las listas guardadas
function clearAllSavedLists() {
    return new Promise((resolve) => {
        chrome.storage.local.remove('savedLists', () => {
            console.log("Todas las listas han sido borradas");
            resolve({ success: true });
        });
    });
}

// Escuchar mensajes del background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getList") {
        const resultado = getInstagramList();
        sendResponse(resultado);
    } 
    else if (request.action === "saveList") {
        saveListToStorage(request.listName, request.listData)
            .then(() => sendResponse({ success: true }));
        return true; // Indica que la respuesta es asíncrona
    }
    else if (request.action === "getSavedLists") {
        getAllSavedLists()
            .then(lists => sendResponse(lists));
        return true; // Indica que la respuesta es asíncrona
    }
    else if (request.action === "clearSavedLists") {
        clearAllSavedLists()
            .then(result => sendResponse(result));
        return true; // Indica que la respuesta es asíncrona
    }
});
