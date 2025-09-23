import React, { useEffect, useState } from 'react'
import { Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSettings } from '../utils/api'
import { useToast } from '../contexts/ToastContext'

function Setting() {
    const [open, setOpen] = useState(false)
    const [selectedNav, setSelectedNav] = useState('Spam')
    const [settings, setSettings] = useState({})
    const [saved, setSaved] = useState(true)
    const [shake, setShake] = useState(false)
    const { addToast } = useToast()

    useEffect(() => {
        (async () => {
            try {
                const res = await getSettings();
                console.log(res)
                setSettings(res)
            } catch (e) {
                addToast('Error loading settings', 'error')
            }
        })();
    }, [])

    const handleShake = () => {
        setShake(true)
        setTimeout(() => {
            setShake(false)
        }, 10);
    }


    const handleFieldChange = (e) => {
        const field = e.target.name
        setSaved(false)
    }

    const navTabs = [
        'Layout',
        'Spam',
        'Blacklist',
        'Trash'
    ]

    return (
        <div>
            <Settings size={20} onClick={() => setOpen(true)} className="inline mr-2 text-gray-600 hover:rotate-45 transition-transform duration-200 cursor-pointer" />
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
                >
                    <div className="bg-white rounded shadow-md p-3 w-full h-[400px] flex flex-col overflow-hidden relative">

                        <div className='flex  justify-between items-center'>
                            <h3 className="text-lg font-semibold mb-2">Settings</h3>
                            <X className='inline' onClick={() => {
                                if (saved) setOpen(false)
                                else handleShake()
                            }} size={16} />
                        </div>
                        <div className="flex space-x-2 mb-2">
                            {navTabs.map((nav) => (
                                <button
                                    key={nav}
                                    className={`px-2 py-1 rounded text-xs border-1 border-gray-300 ${nav === selectedNav ? "bg-blue-500 text-white" : "text-gray-700"
                                        }`}
                                    onClick={() => {
                                        if (saved) setSelectedNav(nav); else handleShake()
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
                                            <p className='text-gray-500'>Edit this script to customize spam filtering</p>
                                        </div>
                                        <div className=''>
                                            <textarea rows={10} name='fScript' value={settings?.spam?.fScript} onChange={handleFieldChange} className='w-full max-h-[180px] border border-gray-300 rounded'></textarea>
                                            <p className='text-gray-500 text-[10px]'>
                                                <strong>from</strong> : Email from, {' '}
                                                <strong>subject</strong> : Email subject, {' '}
                                                <strong>html</strong> : Email HTML Code, {' '}
                                                <strong>text</strong> : Email Text
                                            </p>

                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>

                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {!saved &&
                                <motion.div
                                    initial={{ opacity: 0, y: '100%' }}
                                    animate={{ opacity: 100, y: '0%' }}
                                    exit={{ opacity: 0, y: '100%' }}
                                    className={`${shake ? 'animate-shake' : ''} absolute bottom-0 z-50 p-2 mx-auto space-x-4 bg-white text-xs flex justify-between items-center rounded-t-md border border-b-0`}>
                                    <div>Unsaved changes</div>
                                    <div className='flex space-x-2 '>
                                        <button onClick={() => setSaved(true)} className='border rounded border-gray-300 py-1 px-2'>Discard</button>
                                        <button onClick={() => setSaved(true)} className='border rounded bg-blue-500 text-white py-1 px-2'>Save</button>
                                    </div>
                                </motion.div>
                            }
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default Setting