/* global chrome */
const API_KEY='2a6819691fmshb9cf5179a87ac31p145ea2jsn136a1fc2af63'
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "FETCH_MAILBOX") {
    try {
      const res = await fetch(
        `https://temp-mail-maildrop1.p.rapidapi.com/mailbox/${message.address}`,
        {
          headers: {
            "x-rapidapi-host": "temp-mail-maildrop1.p.rapidapi.com",
            "x-rapidapi-key": API_KEY,
          },
        }
      );
      console.log(res);
      const data = await res.json();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  return true; // keep message channel open for async response
});
