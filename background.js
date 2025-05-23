chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeInstagram") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            
            // Check if we're on Instagram
            if (!activeTab.url.includes("instagram.com")) {
                sendResponse({
                    error: true,
                    message: "Esta extensión solo funciona en Instagram"
                });
                return;
            }

            // Forward the message to content script
            chrome.tabs.sendMessage(
                activeTab.id, 
                { action: "getList" }, 
                (contentResponse) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({
                            error: true,
                            message: "No se pudo comunicar con Instagram"
                        });
                    } else {
                        // Save the list automatically using content script's storage functions
                        if (contentResponse && contentResponse.tipoLista !== "ninguno") {
                            chrome.tabs.sendMessage(
                                activeTab.id,
                                {
                                    action: "saveList",
                                    listName: contentResponse.tipoLista,
                                    listData: contentResponse
                                }
                            );
                        }
                        sendResponse(contentResponse);
                    }
                }
            );
        });
        return true; // Keep the message channel open for async response
    }
});
