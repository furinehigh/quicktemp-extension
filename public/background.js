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
                        [message.address]: {
                            data: data.data.map((e) => ({
                                ...e,
                                folder: (e?.folder || []).length !== 0 ? e?.folder : ['All', 'Unread']
                            })), timestamp: Date.now()
                        }
                    }
                });

                const reqData = data.data.filter((m) => (m?.folder || []).includes(message.folder))

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
                        method: 'GET'
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
                    emailHistory.slice(0, 10)
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

    if (message.type === "FETCH_SETTINGS") {
        (async () => {
            try {

                let settings = {};
                const result = await browser.storage.local.get("settings");
                settings = result.settings || {};
                settings = settings[message.tab]

                sendResponse({ success: true, data: settings });
            } catch (err) {
                console.error("FETCH_SETTINGS error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true;
    }

    if (message.type === "SAVE_SETTINGS") {
        (async () => {
            try {

                let settings = {};
                const result = await browser.storage.local.get("settings");
                settings = result.settings || {};
                await browser.storage.local.set({
                    settings: {
                        ...settings,
                        [message.tab]: message.settings
                    }
                })

                sendResponse({ success: true });
            } catch (err) {
                console.error("SAVE_SETTINGS error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true;
    }

    if (message.type === "FOLDER_CHANGE") {
        (async () => {
            try {
                const { savedMessages } = await browser.storage.local.get("savedMessages") || { savedMessages: {} };
                const mailboxData = savedMessages?.[message.address]?.data || [];
                const cachedIndex = mailboxData.findIndex((msg) => msg.id === message.id);

                if (cachedIndex === -1) return;

                let cached = mailboxData[cachedIndex];

                let folders = cached.folder;
                const inAll = folders.includes("All");
                const inSpam = folders.includes("Spam");
                const inTrash = folders.includes("Trash");

                const moveTo = message.folder;
                const toSoT = moveTo === "Spam" || moveTo === "Trash";
                const inSoT = inSpam || inTrash;

                if (inAll && toSoT) {
                    const idx = folders.indexOf("All");
                    if (idx !== -1) folders[idx] = moveTo;
                } else if (inSoT && moveTo === "All") {
                    folders = folders.filter((f) => f !== "Spam" && f !== "Trash");
                    folders.unshift("All");
                } else if (moveTo === 'Read') {
                    const idx = folders.indexOf("Unread");
                    if (idx !== -1) folders[idx] = moveTo;
                } else if (moveTo === 'Unstarred') {
                    const idx = folders.indexOf("Starred");
                    if (idx !== -1) folders[idx] = moveTo;
                } else {
                    folders.push(moveTo);
                }

                cached = { ...cached, folder: [...new Set(folders)] };
                const newMailboxData = [...mailboxData]
                newMailboxData[cachedIndex] = cached;

                const updatedMessages = {
                    ...savedMessages,
                    [message.address]: {
                        ...savedMessages[message.address],
                        data: newMailboxData
                    }
                }
                await browser.storage.local.set({ savedMessages: updatedMessages })
                sendResponse({ success: true })
            } catch (err) {
                console.error("FOLDER_CHANGE error: ", err)
                sendResponse({ success: false, error: err.message })
            }
        })();

        return true;
    }
});


async function showNotification(email) {
    const title = "📧 New Email Received!";
    const message = `From: ${email.from}\nSubject: ${email.subject}`;

    if (browser?.notifications) {
        browser.notifications.create({
            type: "basic",
            iconUrl: "icon61.png",
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

    socket = new WebSocket(`wss://fh.ws.junkstopper.info?mailbox=${email}`);


    socket.onopen = () => console.log("WebSocket connected");
    socket.onmessage = async (event) => {
        let data = JSON.parse(event.data);

        const result = await browser.storage.local.get("savedMessages");
        const savedMessages = result.savedMessages || {};
        data = {...data, folder: ['All', 'Unread']}

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