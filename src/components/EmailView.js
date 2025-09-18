import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchEmailById } from "../utils/api";

export default function EmailView({ email, onClose }) {
  const [loading, setLoading] = useState(true);
  const [fullEmail, setFullEmail] = useState(email);

  useEffect(() => {
    if (!email) return;
    setLoading(true);

    (async () => {
      try {
        const fullData = await fetchEmailById(email.mailbox || email.to, email.id);
        setFullEmail(fullData);
      } catch (err) {
        console.error("Failed to fetch email body:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (!email) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
    >
      <div className="bg-white rounded-2xl shadow-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">{fullEmail?.subject || "(No Subject)"}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black text-lg">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          From: <span className="font-medium">{fullEmail?.from}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          To: <span className="font-medium">{fullEmail?.to}</span>
        </p>
        <div className="border-t pt-2 text-gray-800 whitespace-pre-wrap">
          {loading ? (
            <p className="text-gray-400">Loading email...</p>
          ) : fullEmail?.body ? (
            <p>{fullEmail.body}</p>
          ) : (
            <p className="text-gray-400 italic">(No content available)</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
