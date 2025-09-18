import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import { fetchMailbox, randomDomain, randomString, domains, requestNotificationPermission } from "./utils/api";
import { Check, Copy, RefreshCcw, Shuffle } from "lucide-react";
/* global chrome */
function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(randomString(10) + "@" + randomDomain());
  const [selectedDomain, setSelectedDomain] = useState(randomDomain());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chrome?.storage?.local?.get?.("tempEmail", async (res) => {
      await requestNotificationPermission();
      const cachedEmail = res.tempEmail;
      if (cachedEmail) {
        setEmail(cachedEmail);
        setSelectedDomain(cachedEmail.split("@")[1]);
      } else {
        const newEmail = randomString(10) + "@" + randomDomain();
        setEmail(newEmail);
        setSelectedDomain(newEmail.split("@")[1]);
        chrome.storage.local.set({ tempEmail: newEmail });

      }
      
        const result = await chrome.storage.local.get("savedMessages");
        const savedMessages = result.savedMessages || {};
        if (savedMessages[cachedEmail || email]?.data) {
          setEmails(savedMessages[cachedEmail || email].data);
        }
    });
  }, []);

  useEffect(() => {
    // Listen for new message notifications from background
    const listener = (msg) => {
      if (msg.type === "NEW_MESSAGE") {
        setEmails((prev) => [msg.data, ...prev]); // prepend new mail
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);


  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetchMailbox(email);
      setEmails(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRandomEmail = () => {
    const newEmail = randomString(10) + "@" + randomDomain();
    setEmail(newEmail);
    setSelectedDomain(newEmail.split("@")[1]);
    chrome.storage.local.set({ tempEmail: newEmail });
    setEmails([]);
  }

  return (
    <div className="p-4 font-sans min-w-[280px]">
      <Header />
      <div className="flex flex-row justify-between space-x-1 items-center">

        <div className="flex flex-row items-center w-3/4">
          <input
            id="email"
            type="text"
            value={email.split("@")[0]}
            onChange={(e) => {
              const localPart = e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase();
              const newEmail = localPart + "@" + selectedDomain;
              setEmail(newEmail);
              chrome.storage.local.set({ tempEmail: newEmail });
            }}
            className=" p-1.5 border border-gray-300 rounded-tl-md rounded-bl-md bg-white text-gray-800"
          />

          <select
            value={selectedDomain}
            onChange={(e) => {
              const newEmail = email.split("@")[0] + "@" + e.target.value;
              setSelectedDomain(e.target.value);
              setEmail(newEmail);
              chrome.storage.local.set({ tempEmail: newEmail });
            }}
            className="border py-1.5 border-gray-300 rounded-tr-md rounded-br-md border-l-0 bg-white"
          >
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                @{domain}
              </option>
            ))}
          </select>
        </div>
        <div className="">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch (err) {
                console.error("Failed to copy: ", err);
              }
            }}
            className=" text-sm py-0.5 px-1.5 rounded-md border-1 border-gray-600"
          >
            {copied ? <Check className="inline mr-1" size={16} /> : <Copy className="inline mr-1" size={16} />}
          </button>
        </div>

      </div>
      <div className="mb-4 flex flex-row justify-center items-center space-x-1">

        <button
          onClick={fetchMessages}
          disabled={loading}
          className=" text-sm py-0.5 px-1.5 rounded-md border-1 border-gray-600 flex flex-row items-center"
        >
          <RefreshCcw className={`${loading ? 'animate-spin' : ''} mr-1 inline`} size={16} /> Refresh
        </button>
        <button
          onClick={handleRandomEmail}
          disabled={loading}
          className=" text-sm py-0.5 px-1.5 rounded-md border-1 border-gray-600 flex flex-row items-center"
        >
          <Shuffle className={` mr-1 inline`} size={16} /> Random
        </button>

      </div>

      <ul className="mt-3 space-y-2">
        {emails.length === 0 && !loading && (
          <li className="text-gray-400">No emails found.</li>
        )}
        {emails.map((mail, i) => (
          <li key={i} className="border rounded-lg p-2 shadow-sm">
            <span className="font-semibold">{mail.from}</span>: {mail.subject}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
