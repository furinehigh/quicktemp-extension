/* global chrome */

const fetchMailbox = (address) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: "FETCH_MAILBOX", address },
            (response) => {
                if (response?.success) resolve(response);
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const fetchMessage = (address, id) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
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
        chrome.runtime.sendMessage(
            { type: "DELETE_MESSAGE", address, id },
            (response) => {
                if (response?.success) resolve();
                else reject(response?.error || "Unknown error");
            }
        );
    });
};

const initWebSocket = () => {
    chrome.runtime.sendMessage({ type: "INIT_SOCKET" }, (response) => {
        if (!response?.success) {
            console.error("Failed to initialize WebSocket");
        }
    });
};

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


export { fetchMailbox, randomString, randomDomain, domains, fetchMessage, deleteMessage, initWebSocket };