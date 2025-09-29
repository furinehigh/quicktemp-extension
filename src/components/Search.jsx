import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchIcon, Trash, Star, OctagonAlert } from 'lucide-react'
import { moveToFolder, deleteMessage } from '../utils/api'
import { useToast } from '../contexts/ToastContext';
/* global browser */
let dltEmailId = null;
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
function Search({ onSelectEmail, mailbox }) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [emails, setEmails] = useState([])
    const [result, setResult] = useState([])
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [searchMode, setSearchMode] = useState('')
    const { addToast } = useToast()

    const loadEmailsForMailbox = (mb) => {
        if (!mb) {
            setEmails([]);
            return;
        }
        browser.storage.local.get(["savedMessages"], (res) => {
            let saved = res.savedMessages?.[mb]?.data || [];
            const sorted = [...saved].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
            setEmails(sorted);
        });
    };

    useEffect(() => {
        loadEmailsForMailbox(mailbox);
    }, [mailbox]);

    const handleSearch = () => {
        if (!searchQuery || searchMode !== 'enter') return;
        const rslt = emails.filter(e => (e?.text || '').includes(searchQuery) || (e?.subject || '').includes(searchQuery) || (e?.from || '').includes(searchQuery))
        setResult(rslt)
    }

    useEffect(() => {
        if (searchMode === 'auto') {
            if (searchQuery !== '') {
                const rslt = emails.filter(e => (e?.text || '').includes(searchQuery) || (e?.subject || '').includes(searchQuery) || (e?.from || '').includes(searchQuery))
                setResult(rslt)
            } else {
                setResult([])
            }
        }
    }, [searchQuery, emails])

    useEffect(() => {
        browser.storage.local.get('settings', (res) => {
            let settings = res.settings
            setSearchMode(settings.Additional.searchMode || 'auto')
            console.log(settings.Additional.searchMode)
        })
    }, [open])

    const handleFolderChange = async (mailbox, emailId, folder) => {
        const res = await moveToFolder(mailbox, emailId, folder)
        if (res.success) {
            loadEmailsForMailbox(mailbox)
            addToast(`Moved to ${folder}`, 'success')
            if (searchMode == 'enter'){
                handleSearch()
            }
        }
    }

    const DeleteDialog = ({ emailId, onClose }) => {
        if (!showDeleteDialog) return;
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center text-xs justify-center z-[1002]">
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
    return (
        <div>
            {open &&
                <div className=' '>
                    <motion.input
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '90%', opacity: 1 }}
                        className='bg-bg text-fg border border-bbg z-[100] text-sm rounded p-2 pr-24 outline-none focus:outline-none focus:ring-0 absolute top-[24px] left-5'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search'
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch()
                            }
                        }}
                    />
                    <span className='pointer-events-none text-[10px] text-fg bg-bbg rounded px-0.5 absolute right-14 z-[1000] opacity-70 translate-y-[7px]'>{searchMode === 'auto' ? 'Auto Mode' : 'Enter Mode'}</span>
                </div>
            }
            <SearchIcon size={20} onClick={() => {
                if (open) handleSearch()
                else setOpen(true)
            }} className={`${open ? 'absolute z-[1000] translate-x-3  top-[33px]' : ''} transition-transform duration-500 inline text-fg cursor-pointer`} />
            {open &&
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    >
                    </motion.div>
                    <div className='absolute top-20 w-[90%] z-[1000] left-5'>

                        {result.length === 0 && (
                            <p className="text-center text-gray-500">No emails found with your query</p>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="space-y-2"
                            >
                                {(result || []).map((email) => (
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
                                            <button className="absolute bottom-3 right-[-15px] group-hover:-translate-x-7 opacity-0  group-hover:opacity-100 transition duration-200 mt-2 text-xs" onClick={(e) => {
                                                e.stopPropagation();
                                                if ((email?.folder || []).includes('Trash')) {
                                                    setShowDeleteDialog(true);
                                                    dltEmailId = email.id;
                                                } else {
                                                    handleFolderChange(mailbox, email.id, 'Trash')
                                                }
                                            }}>
                                                <Trash size={12} className={`text-gray-400 hover:text-red-500 ${(email?.folder || []).includes('Trash') ? 'text-red-500' : ''} transition duration-300`} />
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
                </>

            }
        </div>
    )
}

export default Search