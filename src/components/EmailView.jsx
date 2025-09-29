import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fetchMessage } from "../utils/api";
import DOMPurify from "dompurify";
import { CopyPlus, OctagonAlert, X } from "lucide-react";
/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
export default function EmailView({ email, onClose }) {
    const [fullEmail, setFullEmail] = useState(email);
    const [loading, setLoading] = useState(!email?.html && !email?.text);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!email) return;
        setLoading(true);

        fetchMessage(email.to, email.id)
            .then((data) => setFullEmail((prev) => ({ ...prev, ...data })))
            .catch((err) => console.error("Failed to fetch message:", err))
            .finally(() => setLoading(false));
    }, [email]);

    useEffect(() => {
        if (iframeRef.current && fullEmail?.html) {
            const doc =
                iframeRef.current.contentDocument ||
                iframeRef.current.contentWindow.document;
            doc.open();
            let safeHTML = DOMPurify.sanitize(fullEmail.html, {
                USE_PROFILES: { html: true },
            });

            safeHTML = safeHTML.replace(
                /<a\s/gi,
                '<a target="_blank" rel="noopener noreferrer" '
            );
            doc.write(`
                    <html>
                    <head>
                        <style>
                        body {
                            font-family: system-ui, sans-serif;
                            font-size: 13px;
                            color: #1f2937;
                            margin: 0;
                            padding: 10px;
                            background: white;
                            overflow-y: auto;
                        }
                        ::-webkit-scrollbar {
                            width: 6px;
                        }
                        ::-webkit-scrollbar-thumb {
                            background: #ccc;
                            border-radius: 3px;
                        }
                        ::-webkit-scrollbar-track {
                            background: #f9f9f9;
                        }
                        </style>
                    </head>
                    <body>${safeHTML}</body>
                    </html>
                `);
            doc.close();
        }
    }, [fullEmail]);

    const openInNewWindow = () => {
        const popupWidth = 800;
        const popupHeight = 600;

        const left = Math.round(window.screenX + (window.outerWidth - popupWidth) / 4);
        const top = Math.round(window.screenY + (window.outerHeight - popupHeight) / 2);


        const emailHtml = fullEmail?.html || '';
        const emailText = fullEmail?.text || 'No content available.';

        const popupUrl = new URL(browser.runtime.getURL('popup.html'));
        popupUrl.searchParams.append('subject', email.subject || '(No Subject)');
        popupUrl.searchParams.append('from', email.from);
        popupUrl.searchParams.append('to', email.to);
        popupUrl.searchParams.append('html', encodeURIComponent(emailHtml));
        popupUrl.searchParams.append('text', emailText);

        browser.windows.create({
            url: popupUrl.href,
            type: "popup",
            width: popupWidth,
            height: popupHeight,
            top,
            left
        });
    };



    if (!email) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[1001]"
        >
            <div className="bg-bg rounded border border-bbg p-3 w-full h-[400px] flex flex-col">
                {/* Header */}
                {email.folder.includes('Spam') && <div className="flex items-center space-x-2 p-2 mb-1 bg-gray-400 text-white text-xs">
                    <OctagonAlert size={16} className="inline text-red-500" />
                    <p>This message was either marked as Spam by your spam filtering script or you.</p>
                </div>}
                <div className="flex justify-between items-center mb-1">
                    <h2 className="font-semibold text-sm leading-tight truncate pr-2">
                        {email.subject || "(No Subject)"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openInNewWindow}
                            className=" text-xs"
                            title="Open in New Window"
                        >
                            <CopyPlus size={14} className="inline" />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-sm"
                        >
                            <X size={16} className="inline" />
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 leading-snug">
                    <span className="font-medium">From:</span> {email.from}
                </p>
                <p className="text-xs text-gray-500 leading-snug mb-2">
                    <span className="font-medium">To:</span> {email.to}
                </p>

                <div className="border-t pt-2 flex-1 min-h-[200px]">
                    {loading ? (
                        <p className="text-center text-gray-400 text-sm">
                            Loading message...
                        </p>
                    ) : fullEmail?.html ? (
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full min-h-[250px] border-0 rounded-md"
                            style={{
                                scrollbarWidth: "thin",
                            }}
                            sandbox="allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                        />
                    ) : (
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                            {fullEmail?.text || "No content available."}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
