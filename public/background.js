/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}

async function getActiveTabId() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
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
                                folder: (e?.folder || []).length !== 0 ? e?.folder : ['Inbox', 'Unread']
                            })), timestamp: Date.now()
                        }
                    }
                });

                const reqData = data.data.filter((m) => (m?.folder || []).includes(message.folder))
                if (data.data.length) {
                    console.log('updating email counts from fetch mailbox listener')
                    let emailCounts = await browser.storage.local.get('emailCounts')
                    emailCounts = emailCounts.emailCounts || {}
                    let emailCountsP = emailCounts[message.address]
                    emailCountsP.Inbox = data.data.length
                    emailCountsP.Unread = data.data.length
                    await browser.storage.local.set({
                        emailCounts: {
                            ...emailCounts,
                            [message.address]: emailCountsP
                        }
                    })
                }

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

                let emailCounts = await browser.storage.local.get('emailCounts')
                emailCounts = emailCounts.emailCounts || {}
                emailCounts[message.address].Trash = (emailCounts[message.address].Trash || 1) - 1

                await browser.storage.local.set({ emailCounts })

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

    if (message.type === 'EMAIL_COUNTS') {
        (async () => {
            try {
                let counts = {
                    Inbox: 0,
                    Unread: 0,
                    Starred: 0,
                    Spam: 0,
                    Trash: 0
                }
                const result = await browser.storage.local.get('emailCounts')
                let emailCounts = result.emailCounts || {};
                emailCounts = emailCounts[message.address] || counts

                if (Object.keys(result).length !== 0) {
                    counts = emailCounts
                }

                sendResponse({ success: true, data: counts })
            } catch (e) {
                console.error('EMAIL_COUNTS error: ', e)
                sendResponse({ success: false, error: e.message })
            }
        })();

        return true
    }

    if (message.type === "FETCH_SETTINGS") {
        (async () => {
            try {

                let settings = {};
                const result = await browser.storage.local.get("settings");
                settings = result.settings || {};
                settings = {
                    [message.tab]: settings[message.tab]
                }
                console.log('from bg.js', message.tab, settings[message.tab])

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
                let emailCounts = await browser.storage.local.get('emailCounts')
                emailCounts = emailCounts.emailCounts || {}
                let emailCountsP = emailCounts[message.address]

                if (cachedIndex === -1) return;

                let cached = mailboxData[cachedIndex];

                let folders = cached.folder;
                const inInbox = folders.includes("Inbox");
                const inSpam = folders.includes("Spam");
                const inTrash = folders.includes("Trash");

                const moveTo = message.folder;
                const toSoT = moveTo === "Spam" || moveTo === "Trash";
                const inSoT = inSpam || inTrash;

                const incCounts = (f) => {
                    emailCountsP[f] = (emailCountsP[f] || 0) + 1
                }

                const decCounts = (f) => {
                    emailCountsP[f] = (emailCountsP[f] || 0) - 1
                }

                if (inInbox && toSoT) {
                    const idx = folders.indexOf("Inbox");
                    if (idx !== -1) folders[idx] = moveTo;
                    decCounts('Inbox')
                    incCounts(moveTo)
                } else if (inSoT && moveTo === "Inbox") {
                    folders = folders.filter((f) => f !== "Spam" && f !== "Trash");
                    folders.unshift("Inbox");
                    decCounts(moveTo)
                    incCounts('Inbox')
                } else if (moveTo === 'Read') {
                    const idx = folders.indexOf("Unread");
                    if (idx !== -1) folders[idx] = moveTo;
                    decCounts('Unread')
                    incCounts('Read')
                } else if (moveTo === 'Unstarred') {
                    const idx = folders.indexOf("Starred");
                    if (idx !== -1) folders[idx] = moveTo;
                    decCounts('Starred')
                    incCounts('Unstarred')
                } else {
                    folders.push(moveTo);
                    incCounts(moveTo)
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
                await browser.storage.local.set({
                    emailCounts: {
                        ...emailCounts,
                        [message.address]: emailCountsP
                    }
                })
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

        const isSpam = await spamFilter(data.html, data.from, data.text, data.subject)
        let counts = await browser.storage.local.get('emailCounts')
        counts = counts.emailCounts || {}
        let countsP = counts[data.mailbox]

        countsP.Unread = (countsP.Unread || 0) + 1;

        if (isSpam) {
            countsP.Spam = (countsP.Spam || 0) + 1;
        } else {
            countsP.Inbox = (countsP.Inbox || 0) + 1;
        }
        await browser.storage.local.set({
            emailCounts: {
                ...counts,
                [data.mailbox]: countsP
            }
        })
        data = { ...data, folder: isSpam ? ['Spam', 'Unread'] : ['Inbox', 'Unread'] }

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

// open socket when extension loads up
initWebSocket();

const spamFilter = async (html, from, text, subject) => {
    let settings = await browser.storage.local.get("settings");
    settings = settings.settings || {};
    console.log(settings.Spam?.jRules)
    const jRules = JSON.parse(settings.Spam?.jRules || "");

    if (!jRules) return false;

    return applySpamRules({ html, from, text, subject }, jRules);
};

function applySpamRules(ctx, rules) {
    for (const rule of rules) {
        if (ctx[rule.field]?.includes(rule.includes)) {
            return rule.return;
        }
    }
    return false;
}

async function initExtension() {
    let counts = {
        Inbox: 0,
        Unread: 0,
        Starred: 0,
        Spam: 0,
        Trash: 0,
        Read: 0,
        Unstarred: 0
    }
    let res = await browser.storage.local.get('emailCounts')
    const resE = await browser.storage.local.get("tempEmail");
    const email = resE.tempEmail;
    let result = res?.emailCounts || { [email]: undefined }
    result = result[email] || undefined
    if (result === undefined || Object.keys(result).length == 0) {
        await browser.storage.local.set({
            emailCounts: {
                ...res?.emailCounts || {},
                [email]: counts
            }
        })
    }

    let s = {
        Layout: {
            theme: {
                light: {
                    bg: '#ffffff',
                    fg: '#000000',
                    btnbg: '#3b82f6',
                    bbg: '#d1d5db'
                },
                dark: {
                    bg: '#000000',
                    fg: '#ffffff',
                    btnbg: '#3b82f6',
                    bbg: '#374151'
                },
                active: 'light'
            },
            customTheme:{
                0: {
                    bg: '#000000',
                    fg: '#ffffff',
                    btnbg: '#3b82f6',
                    bbg: '#374151'
                }
            }
        },
        Spam: {
            jRules: `[
      { "field": "html", "includes": "free", "return": true },
      { "field": "from", "includes": "scammer", "return": true }
]`
        }
    }

    let settings = await browser.storage.local.get('settings')
    settings = settings.settings || {}
    if (settings === undefined || Object.keys(settings).length == 0) {
        await browser.storage.local.set({ settings: s })
    }
}

initExtension()