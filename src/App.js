import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import EmailList from "./components/EmailList";
import EmailView from "./components/EmailView";
import { fetchMailbox, randomDomain, randomString, domains } from "./utils/api";
import { Check, Copy, RefreshCcw, Shuffle } from "lucide-react";
/* global chrome */

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(randomString(10) + "@" + randomDomain());
  const [selectedDomain, setSelectedDomain] = useState(randomDomain());
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    chrome?.storage?.local?.get?.("tempEmail", async (res) => {
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
    });
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
  };

  return (
    <div className="p-4 font-sans w-[400px] h-[550px]">
      <Header />
      <div className="flex flex-row justify-between space-x-1 items-center">
        <div className="flex flex-row items-center w-full">
          <input
            id="email"
            type="text"
            value={email.split("@")[0]}
            onChange={(e) => {
              const localPart = e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase();
              const newEmail = localPart + "@" + selectedDomain;
              setEmail(newEmail);
              chrome.storage.local.set({ tempEmail: newEmail });
            }}
            className="p-1.5 w-full border border-gray-300 rounded-tl-md rounded-bl-md bg-white text-gray-800"
          />
          <select
            value={selectedDomain}
            onChange={(e) => {
              const newEmail = email.split("@")[0] + "@" + e.target.value;
              setSelectedDomain(e.target.value);
              setEmail(newEmail);
              chrome.storage.local.set({ tempEmail: newEmail });
            }}
            className="border py-1.5 w-full border-gray-300 rounded-tr-md rounded-br-md border-l-0 bg-white"
          >
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                @{domain}
              </option>
            ))}
          </select>
        </div>

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
          className="text-sm py-2 px-2 rounded-md border border-gray-300"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <div className="my-4 flex flex-row justify-center items-center space-x-1">
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="text-sm py-0.5 px-1.5 rounded-md border border-gray-300 flex flex-row items-center"
        >
          <RefreshCcw className={`${loading ? "animate-spin" : ""} mr-1 inline`} size={16} /> Refresh
        </button>
        <button
          onClick={handleRandomEmail}
          disabled={loading}
          className="text-sm py-0.5 px-1.5 rounded-md border border-gray-300 flex flex-row items-center"
        >
          <Shuffle className="mr-1 inline" size={16} /> Random
        </button>
      </div>

      {/* Email List */}
      <EmailList mailbox={email} onSelectEmail={setSelectedEmail} />

      {/* Email View Modal */}
      <EmailView email={selectedEmail} onClose={() => setSelectedEmail(null)} />
    </div>
  );
}

export default App;
