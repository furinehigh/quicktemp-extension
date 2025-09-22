import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fetchMessage } from "../utils/api";
import DOMPurify from "dompurify";
import { CopyPlus, X } from "lucide-react";

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
            const safeHTML = DOMPurify.sanitize(fullEmail.html, {
                USE_PROFILES: { html: true },
            });
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

        const left = window.screenX + (window.outerWidth - popupWidth) / 4;
        const top = window.screenY + (window.outerHeight - popupHeight) / 2;
        const newWin = window.open(
            "about:blank",
            "_blank",
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable,scrollbars`
        );

        if (!newWin) return alert("Popup blocked! Please allow popups.");

        newWin.addEventListener("load", () => {
            const doc = newWin.document;
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${fullEmail.subject || "Email"}</title>
                    <style>
                    body {
                        font-family: system-ui, sans-serif;
                        margin: 0;
                        padding: 1rem;
                        background: white;
                        color: #1f2937;
                        font-size: 14px;
                        overflow-y: auto;
                    }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-thumb { background: #bbb; border-radius: 4px; }
                    ::-webkit-scrollbar-track { background: #f3f3f3; }
                    h1 { font-size: 1.1rem; margin-bottom: .5rem; }
                    .meta { font-size: 12px; color: #555; margin-bottom: 1rem; }
                    </style>
                </head>
                <body>
                    <h1>${fullEmail.subject || "(No Subject)"}</h1>
                    <div class="meta">
                    <p><strong>From:</strong> ${fullEmail.from}</p>
                    <p><strong>To:</strong> ${fullEmail.to}</p>
                    </div>
                    ${fullEmail?.html
                    ? DOMPurify.sanitize(fullEmail.html, { USE_PROFILES: { html: true } })
                    : `<pre style="font-family: monospace; font-size: 14px; white-space: pre-wrap; padding: 1rem;">${fullEmail?.text || "No content available."}</pre>`}
                </body>
                </html>
            `);
            doc.close();
        });
    };



    if (!email) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
        >
            <div className="bg-white rounded shadow-md p-3 w-full h-[400px] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-1">
                    <h2 className="font-semibold text-sm leading-tight truncate pr-2">
                        {email.subject || "(No Subject)"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openInNewWindow}
                            className="text-gray-500 hover:text-black text-xs border px-2 py-0.5 rounded-md"
                            title="Open in New Window"
                        >
                            <CopyPlus size={14} className="inline" />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-black text-sm"
                        >
                            <X size={16} className="inline" />
                        </button>
                    </div>
                </div>

                {/* Meta Info */}
                <p className="text-xs text-gray-500 leading-snug">
                    <span className="font-medium">From:</span> {email.from}
                </p>
                <p className="text-xs text-gray-500 leading-snug mb-2">
                    <span className="font-medium">To:</span> {email.to}
                </p>

                {/* Email Content */}
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
