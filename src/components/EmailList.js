import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
/* global chrome */

export default function EmailList({ mailbox, onSelectEmail }) {
  const [emails, setEmails] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // Show first 5 emails

  // Load emails from chrome storage
  const loadEmailsForMailbox = (mb) => {
    if (!mb) {
      setEmails([]);
      return;
    }
    chrome.storage.local.get(["savedMessages"], (res) => {
      const saved = (res.savedMessages?.[mb]?.data) || [];
      const sorted = [...saved].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      setEmails(sorted);
    });
  };

  useEffect(() => {
    loadEmailsForMailbox(mailbox);
  }, [mailbox]);

  // ✅ Listen for new messages coming from background script
  useEffect(() => {
    const listener = (msg) => {
      if (msg.type === "NEW_MESSAGE") {
        // Prepend the new message
        setEmails((prev) => [msg.data, ...prev]);
        // Play notification sound
        const audio = new Audio("/new-email.mp3");
        audio.play().catch(() => {
          console.log("Autoplay blocked until user interacts.");
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className="email-list mt-4 space-y-2">
      {emails.length === 0 && (
        <p className="text-center text-gray-500">No emails yet</p>
      )}

      <AnimatePresence>
        {emails.slice(0, visibleCount).map((email) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="email-item border rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectEmail(email)}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-gray-800">{email.from || "Unknown"}</p>
                <p className="text-gray-600 truncate">{email.subject || "(No Subject)"}</p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(email.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {visibleCount < emails.length && (
        <button
          className="mt-3 text-sm w-full py-2 border rounded-lg hover:bg-gray-100"
          onClick={() => setVisibleCount((prev) => prev + 5)}
        >
          Load More
        </button>
      )}
    </div>
  );
}
