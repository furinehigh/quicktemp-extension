/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}

const API_KEY = '2a6819691fmshb9cf5179a87ac31p145ea2jsn136a1fc2af63'
const API_HOST = "temp-mail-maildrop1.p.rapidapi.com";

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
                        method: "GET",
                    }
                );

                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }

                const data = await res.json();
                const { savedMessages } = await browser.storage.local.get("savedMessages") || { savedMessages: {} };
                if (savedMessages?.[message.address]?.data) {
                    const existingIds = new Set(savedMessages[message.address].data.map(msg => msg.id));
                    data.data = [...savedMessages[message.address].data, ...data.data.filter(msg => !existingIds.has(msg.id))];
                }
                browser.storage.local.set({
                    savedMessages: {
                        [message.address]: { data: {
                            ...data.data,
                            folder: ['All']
                        }, timestamp: Date.now() }
                    }
                });

                const reqData = data.data.filter((m) => m.folder.includes(message.folder) )

                sendResponse({ success: true, data: reqData });
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

                const { savedMessages } = await browser.storage.local.get("savedMessages") || { savedMessages: {} };
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

                const updatedMailbox = mailboxData.map((msg) =>
                    msg.id === message.id ? { ...msg, ...data.data } : msg
                );

                await browser.storage.local.set({
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

                const result = await browser.storage.local.get("savedMessages");
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

                await browser.storage.local.set({
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

        return true;
    }

    if (message.type === "INIT_SOCKET") {
        (async () => {
            try {
                await initWebSocket();

                let emailHistory = [];
                if (message.address) {
                    const result = await browser.storage.local.get("emailHistory");
                    emailHistory = result.emailHistory || [];
                    emailHistory = emailHistory.filter((e) => e !== message.address);
                    emailHistory.unshift(message.address);
                    emailHistory.slice(0,10)
                    await browser.storage.local.set({ emailHistory });
                }

                sendResponse({ success: true });
            } catch (err) {
                console.error("INIT_SOCKET error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true;
    }
    if (message.type === "EMAIL_HISTORY") {
        (async () => {
            try {

                let emailHistory = [];
                const result = await browser.storage.local.get("emailHistory");
                emailHistory = result.emailHistory || [];

                sendResponse({ success: true, data: emailHistory });
            } catch (err) {
                console.error("EMAIL_HISTORY error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true;
    }

    if (message.type === "FOLDER_CHANGE"){
        (async () => {
            try {
                const { savedMessages } = await browser.storage.local.get("savedMessages") || { savedMessages: {} };
                const mailboxData = savedMessages?.[message.address]?.data || [];
                const cached = mailboxData.find((msg) => msg.id === message.id);

                cached.folder = message.folder
            } catch (err) {
                console.error("FOLDER_CHANGE error: ", err)
                sendResponse({success: false, error: err.message})
            }
        })
    }
});


async function showNotification(email) {
    const title = "📧 New Email Received!";
    const message = `From: ${email.from}\nSubject: ${email.subject}`;

    if (browser?.notifications) {
        browser.notifications.create({
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
    const result = await browser.storage.local.get("tempEmail");
    const email = result.tempEmail;
    if (!email) return;

    socket = new WebSocket(`wss://ws.junkstopper.info?mailbox=${email}`);


    socket.onopen = () => console.log("WebSocket connected");
    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        const result = await browser.storage.local.get("savedMessages");
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

        await browser.storage.local.set({ savedMessages });

        browser.runtime.sendMessage({ type: "NEW_MESSAGE", data });
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
