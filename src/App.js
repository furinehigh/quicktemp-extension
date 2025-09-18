import React, { useState } from "react";
import Header from "./components/Header";
import { fetchMailbox, randomDomain, randomString } from "./utils/api";

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(randomString(10) + "@" + randomDomain());

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetchMailbox(email);
      const data = await res.json();
      setEmails(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 font-sans min-w-[280px]">
      <Header />
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700" htmlFor="email">
          Temporary Email Address
        </label>
        <input
          id="email"
          type="text"
          value={email}
          readOnly
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-800"
        />
      </div>
      <button
        onClick={fetchMessages}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
      >
        Fetch Messages
      </button>

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
