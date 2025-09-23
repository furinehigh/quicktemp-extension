import React, { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { motion } from 'framer-motion'

function Setting() {
    const [open, setOpen] = useState(false)
    const [selectedNav, setSelectedNav] = useState('Spam')

    const toggleOpen = () => {
        setOpen(!open)
    }

    const navTabs = [
        'Interface',
        'Spam',
        'Blacklist',
        'Trash'
    ]

    return (
        <div>
            <Settings size={20} className="inline mr-2 text-gray-600 hover:rotate-45 transition-transform duration-200 cursor-pointer" onClick={toggleOpen} />
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
                >
                    <div className="bg-white rounded shadow-md p-3 w-full h-[400px] flex flex-col">

                        <div className='flex  justify-between items-center'>
                            <h3 className="text-lg font-semibold mb-2">Settings</h3>
                            <X className='inline' onClick={() => setOpen(false)} size={16} />
                        </div>
                        <div className="flex space-x-2 mb-2">
                            {navTabs.map((nav) => (
                                <button
                                    key={nav}
                                    className={`px-2 py-1 rounded text-xs border-1 border-gray-300 ${nav === selectedNav ? "bg-blue-500 text-white" : "text-gray-700"
                                        }`}
                                    onClick={() => {
                                        setSelectedNav(nav);
                                    }}
                                >
                                    {nav}
                                </button>
                            ))}
                        </div>
                        <div className='border rounded p-2 h-full border-gray-300 text-xs'>
                            {selectedNav == 'Spam' ? (
                                <div className='flex flex-col space-y-2'>
                                    <div className='border border-gray-300 space-y-2 p-2'>
                                        <div>
                                            <h1 className='text-sm font-bold'>
                                                Spam Filter
                                            </h1>
                                            <p className='text-gray-500'>Edit this script to perform spam filtering</p>
                                        </div>
                                        <div className=''>
                                            <textarea rows={10} className='w-full max-h-[180px] border border-gray-300 rounded'></textarea>
                                            <p className='text-gray-500 text-[10px]'>
                                                <strong>&#123;from&#125;</strong> : Email from, {' '}
                                                <strong>&#123;subject&#125;</strong> : Email subject, {' '}
                                                <strong>&#123;html&#125;</strong> : Email HTML Code, {' '}
                                                <strong>&#123;text&#125;</strong> : Email Text
                                            </p>

                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>

                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default Setting