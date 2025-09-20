import { X } from 'lucide-react';
import React from 'react'
/* global browser */
if (typeof browser === "undefined") {
  /* global chrome */
  var browser = chrome;
}
function HistoryModal({isOpen, onClose, usingEmail}) {
  if (!isOpen) return null;

  const result = browser.storage.local.get(["emailHistory"])
  const history = result.emailHistory || []

  return (
    <div className='absolute right-4 top-12 bg-white border border-gray-300 rounded shadow-md p-4 w-64 z-50'>
      <div className='flex justify-between'>
      <h2 className="text-lg font-bold">Email History</h2>
      <button onClick={onClose} className="mt-2 text-sm text-gray-600">
        <X className='inline' />
      </button>
      </div>

      <div className=''>
        {history.map((h, i) => (
          <div className='rounded border border-gray-300 p-2 flex justify-between'>
            <p>
              {h}
            </p>
            <button onClick={usingEmail(h)} className='border border-gray-300 p-1 hover:bg-gray-200'>
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryModal