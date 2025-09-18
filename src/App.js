import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import { fetchMailbox, randomDomain, randomString, domains } from "./utils/api";
import { Check, Copy, RefreshCcw } from "lucide-react";

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(randomString(10) + "@" + randomDomain());
  const [selectedDomain, setSelectedDomain] = useState(randomDomain());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cachedEmail = localStorage.getItem("tempEmail");
    if (cachedEmail) {
      setEmail(cachedEmail);
      setSelectedDomain(cachedEmail.split("@")[1]);
    } else {
      const newEmail = randomString(10) + "@" + randomDomain();
      setEmail(newEmail);
      setSelectedDomain(newEmail.split("@")[1]);
      localStorage.setItem("tempEmail", newEmail);
    }
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

  return (
    <div className="p-4 font-sans min-w-[280px]">
      <Header />
      <div className="flex flex-row justify-between gap-2 items-center">

        <div className="mb-4 flex flex-row items-center w-3/4">
          <input
            id="email"
            type="text"
            value={email.split("@")[0]}
            onChange={(e) => {
              const localPart = e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase();
              const newEmail = localPart + "@" + selectedDomain;
              setEmail(newEmail);
              localStorage.setItem("tempEmail", newEmail);
            }}
            className=" p-1.5 border border-gray-300 rounded-tl-md rounded-bl-md bg-white text-gray-800"
          />

          <select
            value={selectedDomain}
            onChange={(e) => {
              const newEmail = email.split("@")[0] + "@" + e.target.value;
              setSelectedDomain(e.target.value);
              setEmail(newEmail);
              localStorage.setItem("tempEmail", newEmail);
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
            className=" text-sm font-medium py-1 px-2 rounded-md border-1 border-blue-600"
          >
            {copied ? <Check className="inline mr-1" size={16} /> : <Copy className="inline mr-1" size={16} /> }
          </button>
        </div>

      </div>
      <div className="mb-4">

        <button
          onClick={fetchMessages}
          className=" text-sm font-medium py-1 px-2 rounded-md border-1 border-blue-600"
        >
          <RefreshCcw className={`${loading ? 'animate-spin' : ''} mr-1 inline`} size={16} /> Refresh
        </button>

      </div>
      {loading && <p className="mt-3 text-gray-500">Loading...</p>}

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
