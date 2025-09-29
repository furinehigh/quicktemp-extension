import React, { useEffect, useState, forwardRef, useImperativeHandle, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, OctagonAlert, RotateCcw, Star, Trash } from "lucide-react";
import { deleteMessage, fetchMailbox, moveToFolder, getEmailCounts } from "../utils/api";
import { useToast } from "../contexts/ToastContext";
/* global browser */
let dltEmailId = null;
if (typeof browser === "undefined") {
  /* global chrome */
  var browser = chrome;
}
const EmailList = forwardRef(({ mailbox, onSelectEmail, setLoading }, ref) => {
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("Inbox");
  const [emailCounts, setEmailCounts] = useState({})
  const { addToast } = useToast()
  const perPage = 5;

  useImperativeHandle(ref, () => ({
    refresh: () => {
      refreshCounts()
      fetchMessages()
    },
    clientRefresh: (mailbox) => {
      refreshCounts()
      loadEmailsForMailbox(mailbox)
    }
  }));

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetchMailbox(mailbox, selectedFolder);
      if (res.data) {
        loadEmailsForMailbox(mailbox)
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const refreshCounts = async () => {
    await browser.storage.local.get('emailCounts', (res) => {

      let emailCounts = res?.emailCounts;
      emailCounts = emailCounts[mailbox]

      if (Object.keys(res).length !== 0) {
        setEmailCounts(emailCounts)
      }
    })
  };

  useEffect(() => {
    (async () => {
      await refreshCounts()
    })();
  }, [mailbox, emails])

  const DeleteDialog = ({ emailId, onClose }) => {
    if (!showDeleteDialog) return;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center text-xs justify-center z-50">
        <div className="bg-bg p-4 rounded border border-bbg w-72">
          <p>Are you sure you want to delete this email?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={() => {
                deleteMessage(mailbox, emailId).then(() => {
                  setEmails((prev) => prev.filter((em) => em.id !== emailId));
                  addToast('Email deleted', 'success')
                }).catch((err) => {
                  addToast('Error deleting email', 'error')
                });
                onClose();
              }}
            >
              Delete
            </button>
            <button className="px-4 py-2 bg-bbg rounded" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  const loadEmailsForMailbox = (mb, folder = '') => {
    if (!mb) {
      setEmails([]);
      return;
    }
    browser.storage.local.get(["savedMessages"], (res) => {
      let saved = res.savedMessages?.[mb]?.data || [];
      saved = saved.filter(e => e.folder.includes(folder == '' ? selectedFolder : folder))
      const sorted = [...saved].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      setEmails(sorted);
      setCurrentPage(1);
    });
  };

  useEffect(() => {
    loadEmailsForMailbox(mailbox);
  }, [mailbox]);

  useEffect(() => {
    const listener = (msg) => {
      if (msg.type === "NEW_MESSAGE") {
        setEmails((prev) => [msg.data, ...prev]);
        setCurrentPage(1);
        refreshCounts()
        // im trusting your OS to bug u for me :)
        // const audio = new Audio("/new-email.mp3");
        // audio.play().catch(() => console.warn("Autoplay blocked until user interacts."));
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const totalPages = Math.ceil(emails.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentEmails = emails.slice(startIndex, startIndex + perPage);

  const Folders = ["Inbox", "Unread", "Starred", "Spam", "Trash"];

  const handleFolderChange = async (mailbox, emailId, folder) => {
    const res = await moveToFolder(mailbox, emailId, folder)
    if (res.success) {
      loadEmailsForMailbox(mailbox)
      addToast(`Moved to ${folder}`, 'success')
      refreshCounts()
    }
  }

  return (
    <div className="email-list mt-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-1">
          {Folders.map((Folder) => (
            <button
              key={Folder}
              className={`px-1 py-0.5 rounded text-xs  ${Folder === selectedFolder ? "bg-btnbg text-fg" : "text-fg"
                }`}
              onClick={() => {
                setSelectedFolder(Folder);
                loadEmailsForMailbox(mailbox, Folder);
              }}
            >
              {Folder}
              <span className={`${selectedFolder == Folder ? 'text-fg' : 'text-btnbg'} font-bold ml-1 `}>
                {emailCounts ? emailCounts[Folder] : 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end items-center space-x-1 w-full">
          <button
            className="p-1 rounded-full border border-bbg hover:bg-bbg disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="p-1 rounded-full border border-bbg hover:bg-bbg disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === (totalPages ? totalPages : 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {emails.length === 0 && (
        <p className="text-center text-fg">No emails yet in {selectedFolder}. No need to refresh.</p>
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
          {(currentEmails.filter(e => (e?.folder || []).includes(selectedFolder))).map((email) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group email-item border border-bbg rounded-lg p-3 shadow-sm cursor-pointer hover:bg-bbg overflow-hidden transition-colors duration-200 relative"
              onClick={() => {
                if (email.folder.includes('Unread')) {
                  handleFolderChange(mailbox, email.id, 'Read')
                }
                onSelectEmail(email)
              }}
            >
              <div className="flex justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-fg truncate text-sm">{email.from || "Unknown"}</p>
                  <p className="text-gray-500 truncate text-xs">
                    {email.subject || "(No Subject)"}
                  </p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(email.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
              <motion.div
                className="flex justify-end "
              >
                {email?.folder?.includes('Trash') && <button className="absolute bottom-3 right-[-15px] group-hover:-translate-x-[73px] opacity-0  group-hover:opacity-100 transition duration-200 mt-2 text-xs" onClick={(e) => {
                  e.stopPropagation();
                    handleFolderChange(mailbox, email.id, 'Inbox')
                }}>
                  <RotateCcw size={12} className="text-gray-400 hover:text-green-500 transition duration-300" />
                </button>}
                <button className="absolute bottom-3 right-[-15px] group-hover:-translate-x-7 opacity-0  group-hover:opacity-100 transition duration-200 mt-2 text-xs" onClick={(e) => {
                  e.stopPropagation();
                  if ((email?.folder || []).includes('Trash')) {
                    setShowDeleteDialog(true);
                    dltEmailId = email.id;
                  } else {
                    handleFolderChange(mailbox, email.id, 'Trash')
                  }
                }}>
                  <Trash size={12} className="text-gray-400 hover:text-red-500 transition duration-300" />
                </button>
                <button className={`absolute bottom-3 right-3 group-hover:-translate-x-8 ${(email?.folder || []).includes('Starred') ? 'opacity-100' : 'opacity-0'}  group-hover:opacity-100 transition-transform duration-200 mt-2 text-xs`} onClick={(e) => {
                  e.stopPropagation();
                  if ((email?.folder || []).includes('Starred')) {
                    handleFolderChange(mailbox, email.id, 'Unstarred')
                  } else {
                    handleFolderChange(mailbox, email.id, 'Starred')
                  }
                }}>
                  <Star size={12} className={`text-gray-400 hover:text-yellow-400 transition duration-300 ${(email?.folder || []).includes('Starred') ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
                <button className="absolute bottom-3 right-[-15px] group-hover:-translate-x-11 opacity-0  group-hover:opacity-100 transition duration-200 mt-2 text-xs" onClick={(e) => {
                  e.stopPropagation();
                  if ((email?.folder || []).includes('Spam')) {
                    handleFolderChange(mailbox, email.id, 'Inbox')
                  } else {
                    handleFolderChange(mailbox, email.id, 'Spam')
                  }
                }}>
                  <OctagonAlert size={12} className={`text-gray-400 hover:text-red-500 transition duration-300 ${(email?.folder || []).includes('Spam') ? 'text-red-500' : ''}`} />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      <DeleteDialog emailId={dltEmailId} onClose={() => setShowDeleteDialog(false)} />
    </div>
  );
});

export default EmailList;