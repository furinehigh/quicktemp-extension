/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
const fetchMailbox = (address, folder) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(
            { type: "FETCH_MAILBOX", address, folder },
            (response) => {
                if (response?.success) resolve(response);
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const fetchMessage = (address, id) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(
            { type: "FETCH_MESSAGE", address, id },
            (response) => {
                if (response?.success) resolve(response.data);
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const deleteMessage = (address, id) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(
            { type: "DELETE_MESSAGE", address, id },
            (response) => {
                if (response?.success) resolve();
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const moveToFolder = (address, id, folder) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage(
            { type: "FOLDER_CHANGE", address, id, folder },
            (response) => {
                if (response?.success) resolve(response);
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const initWebSocket = (address) => {
    browser.runtime.sendMessage({ type: "INIT_SOCKET", address }, (response) => {
        if (!response?.success) {
            return response?.error
        }
    });
};

const getEmailHistory = () => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({ type: "EMAIL_HISTORY" }, (response) => {
            if (response?.success) {
                resolve(response.data)
            }
            else reject(response?.error || 'Unknown error');
        });
    })
};

const getSettings = (tab) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({ type: "FETCH_SETTINGS", tab }, (response) => {
            if (response?.success) {
                resolve(response.data)
            }
            else reject(response?.error || 'Unkown error')
        })
    })
}

const saveSettings = (tab, settings) => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({ type: "SAVE_SETTINGS", tab, settings }, (response) => {
            if (response?.success) {
                resolve(response)
            }
            else reject(response?.error || 'Unkown error')
        })
    })
}

const getEmailCounts = () => {
    return new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: "EMAIL_COUNTS"}, (response) => {
            if (response?.success) resolve(response?.data)
                else reject(response?.error || 'Unkown error')
        })
    })
}

const randomString = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const domains = ["areueally.info", "junkstopper.info"];

const randomDomain = () => {
    return domains[Math.floor(Math.random() * domains.length)];
};


export {
    fetchMailbox, randomString,
    randomDomain, domains,
    fetchMessage, deleteMessage, 
    initWebSocket, getEmailHistory,
    moveToFolder, getSettings,
    saveSettings, getEmailCounts
};