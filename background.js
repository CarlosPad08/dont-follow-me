// Escucha los mensajes que vienen del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeInstagram") {
        // Buscar la pestaña activa del navegador
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            // Enviar mensaje a content.js
            chrome.tabs.sendMessage(activeTab.id, { action: "getList" }, (response) => {
                // Responder al popup
                sendResponse(response);
            });
        });

        // true permite que sendResponse sea asíncrono
        return true;
    }
});
