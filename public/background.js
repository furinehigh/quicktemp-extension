/* global chrome */
const API_KEY = '2a6819691fmshb9cf5179a87ac31p145ea2jsn136a1fc2af63'
const API_HOST = "temp-mail-maildrop1.p.rapidapi.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FETCH_MAILBOX") {
        (async () => {
            try {

                if (!message.address) throw new Error("No address provided");

                const res = await fetch(
                    `https://${API_HOST}/mailbox/${message.address}`,
                    {
                        headers: {
                            "x-rapidapi-host": API_HOST,
                            "x-rapidapi-key": API_KEY,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }

                const data = await res.json();
                const { savedMessages } = await chrome.storage.local.get("savedMessages") || { savedMessages: {} };
                // combine new and old messages, avoiding duplicates
                if (savedMessages?.[message.address]?.data) {
                    const existingIds = new Set(savedMessages[message.address].data.map(msg => msg.id));
                    data.data = [...savedMessages[message.address].data, ...data.data.filter(msg => !existingIds.has(msg.id))];
                }
                chrome.storage.local.set({
                    savedMessages: {
                        [message.address]: { data: data.data, timestamp: Date.now() }
                    }
                });

                sendResponse({ success: true, data: data.data });
            } catch (error) {
                console.error("Background fetch error:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true; // ✅ MUST BE OUTSIDE async block
    }
});
