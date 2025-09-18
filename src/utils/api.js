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

const fetchEmailById = (address, id) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "FETCH_EMAIL", address, id }, (response) => {
            if (response?.success) resolve(response.data);
            else reject(response?.error || "Unknown error");
        });
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


export { fetchMailbox, randomString, randomDomain, domains, fetchEmailById };