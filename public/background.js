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

        return true;
    }

    if (message.type === "FETCH_MESSAGE") {
        (async () => {
            try {
                if (!message.address || !message.id) throw new Error("Missing params");

                const { savedMessages } = await chrome.storage.local.get("savedMessages") || { savedMessages: {} };
                const mailboxData = savedMessages?.[message.address]?.data || [];
                const cached = mailboxData.find((msg) => msg.id === message.id);

                if (cached?.html || cached?.text) {
                    sendResponse({ success: true, data: cached });
                    return;
                }

                const res = await fetch(
                    `https://${API_HOST}/mailbox/${message.address}/message/${message.id}`,
                    {
                        headers: {
                            "x-rapidapi-host": API_HOST,
                            "x-rapidapi-key": API_KEY,
                        },
                    }
                );

                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const data = await res.json();

                // Update cached storage with full message body
                const updatedMailbox = mailboxData.map((msg) =>
                    msg.id === message.id ? { ...msg, ...data.data } : msg
                );

                await chrome.storage.local.set({
                    savedMessages: {
                        ...savedMessages,
                        [message.address]: { data: updatedMailbox, timestamp: Date.now() },
                    },
                });

                sendResponse({ success: true, data: data.data });
            } catch (err) {
                console.error("FETCH_MESSAGE error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true;
    }

    if (message.type === "DELETE_MESSAGE") {
        (async () => {
            try {
                if (!message.address || !message.id) throw new Error("Missing params");

                const result = await chrome.storage.local.get("savedMessages");
                const savedMessages = result.savedMessages || {};
                const mailboxData = savedMessages[message.address]?.data || [];

                const res = await fetch(
                    `https://${API_HOST}/mailbox/${message.address}/message/${message.id}`,
                    {
                        headers: {
                            "x-rapidapi-host": API_HOST,
                            "x-rapidapi-key": API_KEY,
                        },
                        method: "DELETE",
                    }
                );

                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const updatedMailbox = mailboxData.filter((msg) => msg.id !== message.id);

                await chrome.storage.local.set({
                    savedMessages: {
                        ...savedMessages,
                        [message.address]: {
                            data: updatedMailbox,
                            timestamp: Date.now(),
                        },
                    },
                });

                sendResponse({ success: true });
            } catch (err) {
                console.error("DELETE_MESSAGE error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // keep the message channel open
    }

});



async function showNotification(email) {
    const title = "📧 New Email Received!";
    const message = `From: ${email.from}\nSubject: ${email.subject}`;

    if (chrome?.notifications) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "logo192.png",
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
