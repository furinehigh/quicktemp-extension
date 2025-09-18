import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
/* global chrome */

export default function EmailList({ mailbox, onSelectEmail }) {
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5; // Number of emails per page

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
      setCurrentPage(1); // reset to first page when mailbox changes
    });
  };

  useEffect(() => {
    loadEmailsForMailbox(mailbox);
  }, [mailbox]);

  // ✅ Listen for new messages coming from background script
  useEffect(() => {
    const listener = (msg) => {
      if (msg.type === "NEW_MESSAGE") {
        setEmails((prev) => [msg.data, ...prev]);
        setCurrentPage(1); // always go back to page 1 when new mail arrives
        const audio = new Audio("/new-email.mp3");
        audio.play().catch(() => console.log("Autoplay blocked until user interacts."));
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(emails.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentEmails = emails.slice(startIndex, startIndex + perPage);

  return (
    <div className="email-list mt-4 space-y-2">
      {emails.length === 0 && (
        <p className="text-center text-gray-500">No emails yet. No need to refresh.</p>
      )}

      <AnimatePresence>
        {currentEmails.map((email) => (
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
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{email.from || "Unknown"}</p>
                <p className="text-gray-600 truncate text-xs">{email.subject || "(No Subject)"}</p>
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(email.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button
            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`px-2 py-1 text-xs rounded ${
                page === currentPage ? "bg-gray-800 text-white" : "border hover:bg-gray-100"
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
