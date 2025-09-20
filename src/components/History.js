import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getEmailHistory } from "../utils/api";
/* global browser */
if (typeof browser === "undefined") {
  /* global chrome */
  var browser = chrome;
}

function HistoryModal({ isOpen, onClose, usingEmail }) {
  const [emailHistory, setEmailHistory] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const result = await getEmailHistory();
        setEmailHistory(result || []);
      } catch (err) {
        console.error("Failed to load email history:", err);
        setEmailHistory([]);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-8 top-32 text-xs bg-white border border-gray-300 rounded shadow-md p-4 w-64 z-50">
      <div className="flex justify-between w-full items-center mb-2">
        <h2 className="text-sm font-bold">Email History</h2>
        <button onClick={onClose} className="text-sm text-gray-600">
          <X className="inline" size={16} />
        </button>
      </div>

      <div className="flex flex-col space-y-2 overflow-y-auto max-h-[300px]">
        {emailHistory.length > 0 ? (
          emailHistory.map((h, i) => (
            <div
              key={i}
              className="rounded border border-gray-300 p-1 flex justify-between items-center"
            >
              <p>{h}</p>
              <button
                onClick={() => {
                  onClose();
                  usingEmail(h)
                }}
                type="button"
                className="border border-gray-300 px-1 py-0.5 hover:bg-gray-200"
              >
                Use
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">No history yet</p>
        )}
      </div>
    </div>
  );
}

export default HistoryModal;
