import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fetchMessage } from "../utils/api";

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
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            doc.open();
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
          <body>${fullEmail.html}</body>
        </html>
      `);
            doc.close();
        }
    }, [fullEmail]);

    if (!email) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
        >
            <div className="bg-white rounded-2xl shadow-lg p-3 max-w-lg w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-1">
                    <h2 className="font-semibold text-sm leading-tight">
                        {email.subject || "(No Subject)"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black text-sm"
                    >
                        ✕
                    </button>
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
                        <p className="text-center text-gray-400 text-sm">Loading message...</p>
                    ) : fullEmail?.html ? (
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full min-h-[250px] border-0 rounded-md"
                            style={{
                                scrollbarWidth: "thin",
                            }}
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
