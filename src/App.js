import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import EmailList from "./components/EmailList";
import EmailView from "./components/EmailView";
import { fetchMailbox, randomDomain, randomString, domains, initWebSocket } from "./utils/api";
import { Check, Copy, History, RefreshCcw, Shuffle } from "lucide-react";
import HistoryModal from "./components/History";
/* global browser */
if (typeof browser === "undefined") {
  /* global chrome */
  var browser = chrome;
}
function App() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(randomString(10) + "@" + randomDomain());
  const [selectedDomain, setSelectedDomain] = useState(randomDomain());
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const eListRef = useRef(null);

  const handleOpenHistory = () => {
    setShowHistory(true);
  }

  const handleRefresh = () => {
    if (eListRef.current) {
      eListRef.current.refresh();
    }
  }

  useEffect(() => {
    browser?.storage?.local?.get?.("tempEmail", async (res) => {
      const cachedEmail = res.tempEmail;
      if (cachedEmail) {
        setEmail(cachedEmail);
        setSelectedDomain(cachedEmail.split("@")[1]);
      } else {
        const newEmail = randomString(10) + "@" + randomDomain();
        setEmail(newEmail);
        setSelectedDomain(newEmail.split("@")[1]);
        browser.storage.local.set({ tempEmail: newEmail });
      }
    });
  }, []);



  const handleRandomEmail = () => {
    const newEmail = randomString(10) + "@" + randomDomain();
    setEmail(newEmail);
    setSelectedDomain(newEmail.split("@")[1]);
    browser.storage.local.set({ tempEmail: newEmail });
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
              browser.storage.local.set({ tempEmail: newEmail });
              initWebSocket(newEmail);
            }}
            className="p-1.5 w-full border border-gray-300 rounded-tl-md rounded-bl-md bg-white text-gray-800"
          />
          <select
            value={selectedDomain}
            onChange={(e) => {
              const newEmail = email.split("@")[0] + "@" + e.target.value;
              setSelectedDomain(e.target.value);
              setEmail(newEmail);
              browser.storage.local.set({ tempEmail: newEmail });
              initWebSocket(newEmail);
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
          onClick={handleRefresh}
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
        <button
          onClick={handleOpenHistory}
          disabled={loading}
          className="text-sm py-0.5 px-1.5 rounded-md border border-gray-300 flex flex-row items-center"
        >
          <History className="mr-1 inline" size={16} /> History
        </button>
      </div>

      <EmailList mailbox={email} onSelectEmail={setSelectedEmail} setLoading={setLoading} ref={eListRef} />

      <EmailView email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        
      {showHistory && <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} usingEmail={setSelectedEmail} />}
    </div>
  );
}

export default App;
