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

const randomString = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const domains = ["arrangewith.me", "areueally.info", "junkstopper.info"];

const randomDomain = () => {
    return domains[Math.floor(Math.random() * domains.length)];
};

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("You need to allow notifications to receive email alerts.");
  }
}


export { fetchMailbox, randomString, randomDomain, domains, requestNotificationPermission };