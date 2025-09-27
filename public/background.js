/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}

let isStorageLocked = false;
const updateQueue = [];

async function updateSavedMessages(changeFunction) {
    return new Promise((resolve, reject) => {
        updateQueue.push({ changeFunction, resolve, reject });

        if (isStorageLocked) {
            console.log("Storage is locked. Queuing update.");
            return;
        }

        processQueue();
    });
}

async function processQueue() {
    if (updateQueue.length === 0) {
        isStorageLocked = false;
        return;
    }

    isStorageLocked = true;
    const { changeFunction, resolve, reject } = updateQueue.shift();

    try {
        const { savedMessages = {} } = await browser.storage.local.get("savedMessages");
        const updatedMessages = changeFunction(savedMessages);

        await browser.storage.local.set({ savedMessages: updatedMessages });

        console.log("Update successful. Unlocking storage.");
        resolve({ success: true });
    } catch (error) {
        console.error("Failed to update storage:", error);
        reject(error);
    } finally {
        processQueue();
    }
}


const extractEmail = (from) => {
    if (from == undefined) {
        return 'no@example.com'
    }
    const match = from.match(/<([^>]+)>/);

    const email = match ? match[1] : null;
    return email
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


                let settings = await browser.storage.local.get('settings')
                settings = settings.settings.Blacklist
                let blacklistSenders = settings.senders

                const data = await res.json();
                const { savedMessages } = await browser.storage.local.get("savedMessages") || { savedMessages: {} };
                if (savedMessages?.[message.address]?.data) {
                    const existingIds = new Set(savedMessages[message.address].data.map(msg => msg.id));
                    data.data = [...savedMessages[message.address].data, ...data.data.filter(msg => !existingIds.has(msg.id))];
                }
                // filtering out emails from blacklisted senders
                data.data = data.data.filter(d => !blacklistSenders.includes(extractEmail(d.from)))
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
                    let { emailCounts = {} } = await browser.storage.local.get("emailCounts");

                    const existingCounts = emailCounts[message.address] || {};

                    const updatedCounts = Object.fromEntries(
                        Object.keys(existingCounts).map((k) => [
                            k,
                            data.data.filter((e) => e.folder.includes(k)).length,
                        ])
                    );

                    await browser.storage.local.set({
                        emailCounts: {
                            ...emailCounts,
                            [message.address]: updatedCounts,
                        },
                    });
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

                const { savedMessages = {} } = await browser.storage.local.get("savedMessages");
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
                const apiResponse = await res.json();
                const fetchedData = apiResponse.data;

                const changeFn = (currentSavedMessages) => {
                    const currentMailboxData = currentSavedMessages?.[message.address]?.data || [];

                    const updatedMailbox = currentMailboxData.map((msg) =>
                        msg.id === message.id ? { ...msg, ...fetchedData } : msg
                    );

                    const updatedMessages = {
                        ...currentSavedMessages,
                        [message.address]: {
                            ...currentSavedMessages[message.address],
                            data: updatedMailbox
                        },
                    };
                    return updatedMessages;
                };

                await updateSavedMessages(changeFn);

                sendResponse({ success: true, data: fetchedData });

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
                const { savedMessages: initialSavedMessages = {} } = await browser.storage.local.get("savedMessages");
                const initialMailboxData = initialSavedMessages?.[message.address]?.data || [];
                const originalEmail = initialMailboxData.find((msg) => msg.id === message.id);

                if (!originalEmail) {
                    throw new Error(`Email with id ${message.id} not found.`);
                }
                const originalFolders = originalEmail.folder;
                const messagesChangeFn = (currentSavedMessages) => {
                    const mailboxData = currentSavedMessages?.[message.address]?.data || [];
                    const cachedIndex = mailboxData.findIndex((msg) => msg.id === message.id);

                    if (cachedIndex === -1) return currentSavedMessages;

                    const cached = mailboxData[cachedIndex];
                    let folders = [...cached.folder];
                    const moveTo = message.folder;

                    const inInbox = folders.includes("Inbox");
                    const inSpam = folders.includes("Spam");
                    const inTrash = folders.includes("Trash");
                    const toSoT = moveTo === "Spam" || moveTo === "Trash";
                    const inSoT = inSpam || inTrash;

                    if (inInbox && toSoT) {
                        folders = folders.filter((f) => f !== "Inbox");
                        folders.unshift(moveTo);
                    } else if (inSoT && moveTo === "Inbox") {
                        folders = folders.filter((f) => f !== "Spam" && f !== "Trash");
                        folders.unshift("Inbox");
                    } else if (moveTo === "Read") {
                        folders = folders.filter((f) => f !== "Unread");
                        folders.push("Read");
                    } else if (moveTo === "Unstarred") {
                        folders = folders.filter((f) => f !== "Starred");
                    } else if (moveTo === "Starred") {
                        folders.push(moveTo);
                    } else {
                        if (!folders.includes(moveTo)) folders.push(moveTo);
                    }

                    const updatedCached = { ...cached, folder: [...new Set(folders)] };
                    const newMailboxData = [...mailboxData];
                    newMailboxData[cachedIndex] = updatedCached;

                    return {
                        ...currentSavedMessages,
                        [message.address]: {
                            ...currentSavedMessages[message.address],
                            data: newMailboxData,
                        },
                    };
                };

                await updateSavedMessages(messagesChangeFn);

                const { emailCounts = {} } = await browser.storage.local.get("emailCounts");
                let emailCountsP = emailCounts[message.address] || {};
                const moveTo = message.folder;

                const incCounts = (f) => { emailCountsP[f] = (emailCountsP[f] || 0) + 1; };
                const decCounts = (f) => { emailCountsP[f] = Math.max((emailCountsP[f] || 0) - 1, 0); };

                const wasInInbox = originalFolders.includes("Inbox");
                const wasInSpam = originalFolders.includes("Spam");
                const wasInTrash = originalFolders.includes("Trash");
                const wasUnread = originalFolders.includes("Unread");
                const wasStarred = originalFolders.includes("Starred");

                if (wasInInbox && (moveTo === "Spam" || moveTo === "Trash")) {
                    decCounts("Inbox");
                }
                if ((wasInSpam || wasInTrash) && moveTo === "Inbox") {
                    if (wasInSpam) decCounts("Spam");
                    if (wasInTrash) decCounts("Trash");
                }
                if (moveTo === "Spam") incCounts("Spam");
                if (moveTo === "Trash") incCounts("Trash");
                if (moveTo === "Inbox") incCounts("Inbox");

                if (wasUnread && moveTo === "Read") {
                    decCounts("Unread");
                }
                if (wasStarred && moveTo === "Unstarred") {
                    decCounts("Starred");
                }
                if (!wasStarred && moveTo === "Starred") {
                    incCounts("Starred");
                }

                await browser.storage.local.set({
                    emailCounts: {
                        ...emailCounts,
                        [message.address]: emailCountsP,
                    },
                });

                sendResponse({ success: true });

            } catch (err) {
                console.error("FOLDER_CHANGE error: ", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true;
    }

    if (message.action === 'getEmailSuggestions') {
        (async () => {
            const { settings = {} } = await browser.storage.local.get('settings')
            const { tempEmail = '' } = await browser.storage.local.get('tempEmail')
            if (settings.Additional.suggestions) {
                sendResponse({ suggestions: [tempEmail] })
            }
        })();
        return true
    }

    if (message.action === `genRandomEmail`) {
        (async () => {
            const domains = ["areueally.info", "junkstopper.info"];

            const rndDomain = domains[Math.floor(Math.random() * domains.length)];
            const tempEmail = randomString(10) + '@' + rndDomain
            await browser.storage.local.set({tempEmail})
            initWebSocket()
            sendResponse({tempEmail})
        })();
        return true
    }

});

const randomString = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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
        let settings = await browser.storage.local.get('settings')
        settings = settings.settings.Blacklist
        let blacklistSenders = settings.senders
        if (blacklistSenders.includes(extractEmail(data?.from))) {
            return;
        }

        const result = await browser.storage.local.get("savedMessages");
        const savedMessages = result.savedMessages || {};

        const isSpam = await spamFilter(data.html, data.from, data.text, data.subject)
        let counts = await browser.storage.local.get('emailCounts')
        counts = counts.emailCounts || { [data.mailbox]: {} }
        let countsP = counts[data.mailbox] || {
            Inbox: 0,
            Unread: 0,
            Starred: 0,
            Spam: 0,
            Trash: 0,
            Read: 0,
            Unstarred: 0
        }

        countsP.Unread = (countsP?.Unread || 0) + 1;

        if (isSpam) {
            countsP.Spam = (countsP?.Spam || 0) + 1;
        } else {
            countsP.Inbox = (countsP?.Inbox || 0) + 1;
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
    const jRules = JSON.parse(settings.Spam?.jRules || "");

    if (!jRules) return false;
    const result = applySpamRules({ html, from, text, subject }, jRules);
    return result
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
            customTheme: {
                '3b12f1df-5232-4804-897e-917bf397618a': {
                    bg: '#000000',
                    fg: '#ffffff',
                    btnbg: '#3b82f6',
                    bbg: '#374151'
                }
            }
        },
        Spam: {
            jRules: `[
      { "field": "subject", "includes": "free", "return": true },
      { "field": "from", "includes": "scammer", "return": true }
]`
        },
        Blacklist: {
            senders: []
        },
        Additional: {
            suggestions: true
        }
    }

    let settings = await browser.storage.local.get('settings')
    settings = settings.settings || {}
    if (settings === undefined || Object.keys(settings).length == 0) {
        await browser.storage.local.set({ settings: s })
    }
}

initExtension()