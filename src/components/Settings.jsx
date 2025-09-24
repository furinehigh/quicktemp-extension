import React, { useEffect, useState } from 'react'
import { Settings, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSettings, saveSettings } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import isEqual from "lodash/isEqual";
import { capitalizeFirst } from '../utils/utils'
/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
function Setting() {
    const [open, setOpen] = useState(false)
    const [selectedNav, setSelectedNav] = useState('Layout')
    const [settings, setSettings] = useState({})
    const [currChanges, setCurrChanges] = useState({})
    const [saved, setSaved] = useState(true)
    const [shake, setShake] = useState(false)
    const { addToast } = useToast()

    useEffect(() => {
        try {
            getCurrChanges(async ({ currChanges, firstKey }) => {
                console.log('rh 1')
                if (currChanges !== undefined && navTabs.includes(firstKey)) {
                    console.log('rh 2')
                    setSaved(false)
                    setSelectedNav(capitalizeFirst(firstKey))
                    setCurrChanges(currChanges)
                } else {
                    console.log('rh 3')
                    const res = await getSettings(selectedNav);
                    console.log(res)
                    setSettings(res)
                }
            })
        } catch (e) {
            console.log(e)
            addToast('Error loading settings', 'error')
        }
    }, [selectedNav])

    const handleShake = () => {
        setShake(true)
        setTimeout(() => {
            setShake(false)
        }, 400);
    }

    const getCurrChanges = (cb) => {
        browser.storage.local.get(["currChanges"], (res) => {
            const currChanges = res.currChanges;
            let firstKey;

            if (currChanges !== undefined) {
                firstKey = Object.keys(currChanges).find(
                    key =>
                        currChanges[key] !== null &&
                        currChanges[key] !== undefined &&
                        currChanges[key] !== ""
                );
            }

            console.log("currChanges, firstKey", currChanges, firstKey);
            cb({ currChanges, firstKey });
        });
    };


    useEffect(() => {
        console.log('saving crr changes to local storage')
        browser.storage.local.set({ currChanges })
    }, [currChanges])


    const handleFieldChange = (e) => {
        setSaved(false)
        const field = e.target.name
        let settingChanges = {
            [selectedNav]: {
                [field]: e.target.value
            }
        }
        setCurrChanges(settingChanges)
    }

    const handleChangesSaved = async () => {
        const res = await saveSettings(selectedNav, currChanges[selectedNav])
        setSettings({
            ...settings,
            [selectedNav]: currChanges[selectedNav]
        })

        if (res.success) {
            addToast('Changes saved', 'success')
            setSaved(true)
            setCurrChanges({})
        } else {
            addToast('Error ecc while saving', 'error')
            setSaved(false)
        }
    }

    const handleDiscardChanges = () => {
        setCurrChanges({})
    }

    const handleNavChange = (nav) => {
        if (saved) {
            setCurrChanges({})
            setSelectedNav(nav)
        } else {
            handleShake()
        }
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
                                    onClick={() => handleNavChange(nav)}
                                >
                                    {nav}
                                </button>
                            ))}
                        </div>
                        <div className=' p-2 h-full text-xs'>
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
                                            <textarea rows={10} name='fScript' value={currChanges?.Spam?.fScript || settings?.Spam.fScript} onChange={handleFieldChange} className='w-full max-h-[180px] border border-gray-300 rounded'></textarea>
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
                                        <button onClick={handleDiscardChanges} className='border rounded border-gray-300 py-1 px-2'>Discard</button>
                                        <button onClick={handleChangesSaved} className='border rounded bg-blue-500 text-white py-1 px-2'>Save</button>
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