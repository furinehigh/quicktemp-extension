import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import { deleteMessage } from "../utils/api";
/* global chrome */

export default function EmailList({ mailbox, onSelectEmail }) {
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const perPage = 5;

  const deleteDialog = (emailId) => {
    return showDeleteDialog && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center text-xs justify-center z-50">
        <p>Are you sure you want to delete this email?</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => {
              deleteMessage(mailbox, emailId).then(() => {
                setEmails((prev) => prev.filter((em) => em.id !== emailId));
              }).catch((err) => {
                alert("Failed to delete email: " + err);
              });
            }}
          >
            Delete
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </button>
        </div>
      </motion.div>
    );
  };

  // Load emails from chrome storage
  const loadEmailsForMailbox = (mb) => {
    if (!mb) {
      setEmails([]);
      return;
    }
    chrome.storage.local.get(["savedMessages"], (res) => {
      const saved = res.savedMessages?.[mb]?.data || [];
      const sorted = [...saved].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      setEmails(sorted);
      setCurrentPage(1);
    });
  };

  useEffect(() => {
    loadEmailsForMailbox(mailbox);
  }, [mailbox]);

  // Listen for new messages
  useEffect(() => {
    const listener = (msg) => {
      if (msg.type === "NEW_MESSAGE") {
        setEmails((prev) => [msg.data, ...prev]);
        setCurrentPage(1);
        const audio = new Audio("/new-email.mp3");
        audio.play().catch(() => console.log("Autoplay blocked until user interacts."));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const totalPages = Math.ceil(emails.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentEmails = emails.slice(startIndex, startIndex + perPage);

  return (
    <div className="email-list mt-4">
      {/* Pagination Controls - Top Right */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center mb-2 gap-2">
          <button
            className="p-1 rounded-full border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="p-1 rounded-full border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {emails.length === 0 && (
        <p className="text-center text-gray-500">No emails yet. No need to refresh.</p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage} // re-trigger animation on page change
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-2"
        >
          {currentEmails.map((email) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group email-item border rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50 overflow-hidden relative"
              onClick={() => onSelectEmail(email)}
            >
              <div className="flex justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{email.from || "Unknown"}</p>
                  <p className="text-gray-600 truncate text-xs">
                    {email.subject || "(No Subject)"}
                  </p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(email.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <motion.div
                className="flex justify-end "
              >
                <button className="absolute bottom-3 right-[-15px] group-hover:right-3 opacity-0  group-hover:opacity-100 transition duration-200 mt-2 text-xs" onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                  deleteDialog(email.id);
                }}>
                  <Trash size={16} className="text-gray-400 hover:text-red-500 transition duration-300" />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
