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

    // ✅ NEW HANDLER: Fetch specific email by ID
    if (message.type === "FETCH_EMAIL") {
        (async () => {
            try {
                if (!message.address || !message.id) throw new Error("Missing address or id");

                // Check if cached
                const { savedMessages } = (await chrome.storage.local.get("savedMessages")) || { savedMessages: {} };
                const cached = savedMessages?.[message.address]?.data?.find((m) => m.id === message.id);

                if (cached && cached.body) {
                    sendResponse({ success: true, data: cached });
                    return;
                }

                // Fetch from API
                const res = await fetch(
                    `https://${API_HOST}/mailbox/${message.address}/${message.id}`,
                    {
                        headers: {
                            "x-rapidapi-host": API_HOST,
                            "x-rapidapi-key": API_KEY,
                        },
                    }
                );

                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                const fullEmail = await res.json();

                // Merge back into storage
                if (savedMessages?.[message.address]?.data) {
                    const idx = savedMessages[message.address].data.findIndex((m) => m.id === message.id);
                    if (idx > -1) {
                        savedMessages[message.address].data[idx] = {
                            ...savedMessages[message.address].data[idx],
                            ...fullEmail,
                        };
                    } else {
                        savedMessages[message.address].data.push(fullEmail);
                    }
                } else {
                    savedMessages[message.address] = { data: [fullEmail], timestamp: Date.now() };
                }

                await chrome.storage.local.set({ savedMessages });

                sendResponse({ success: true, data: fullEmail });
            } catch (error) {
                console.error("Background FETCH_EMAIL error:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true;
    }
});



async function showNotification(email) {
  const title = "📧 New Email Received!";
  const message = `From: ${email.from}\nSubject: ${email.subject}`;

  if (chrome?.notifications) {
    // ✅ Use Chrome extension API
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/icon-128.png",
      title,
      message,
      priority: 2,
    });
  } 
}

let socket;

async function initWebSocket() {
    const result = await chrome.storage.local.get("tempEmail");
    const email = result.tempEmail;
    if (!email) return;

    socket = new WebSocket(`wss://ws.junkstopper.info?mailbox=${email}`);


    socket.onopen = () => console.log("WebSocket connected");
    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        const result = await chrome.storage.local.get("savedMessages");
        const savedMessages = result.savedMessages || {};

        if (data.mailbox && savedMessages[data.mailbox]?.data) {
            const existingIds = new Set(savedMessages[data.mailbox].data.map(msg => msg.id));
            if (!existingIds.has(data.id)) {
                savedMessages[data.mailbox].data.push(data);
            }
        } else if (data.mailbox) {
            savedMessages[data.mailbox] = { data: [data], timestamp: Date.now() };
        }

        await showNotification(data);

        await chrome.storage.local.set({ savedMessages });

        chrome.runtime.sendMessage({ type: "NEW_MESSAGE", data });
    };

    socket.onclose = () => {
        console.log("Socket closed. Reconnecting in 5s...");
        setTimeout(initWebSocket, 5000); // auto-reconnect
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
    };
}

// Open socket when extension loads
initWebSocket();
