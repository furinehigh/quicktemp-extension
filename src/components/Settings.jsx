import React, { useEffect, useRef, useState } from 'react'
import { Moon, Pen, Plus, Settings, Sun, SunMoon, Trash, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSettings, saveSettings } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import isEqual from "lodash/isEqual";
import { capitalizeFirst, checkEmailValidity, checkJSONValidity } from '../utils/utils'
import AddTheme from './settings/AddTheme'

/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
function Setting({ setTrigger }) {
    const [open, setOpen] = useState(false)
    const [selectedNav, setSelectedNav] = useState('Layout')
    const [settings, setSettings] = useState({})
    const [currChanges, setCurrChanges] = useState({})
    const [saved, setSaved] = useState(true)
    const [shake, setShake] = useState(false)
    const [error, setError] = useState('')
    const [openThemeAdd, setOpenThemeAdd] = useState(false)
    const [themeUpdateData, setThemeUpdateData] = useState({ id: '', data: undefined })
    const [bLEmail, setBLEmail] = useState('')
    const { addToast } = useToast()

    useEffect(() => {
        try {
            getCurrChanges(async ({ currChanges, firstKey }) => {
                if (currChanges !== undefined && navTabs.includes(firstKey)) {
                    setSaved(false)
                    setSelectedNav(capitalizeFirst(firstKey))
                    setCurrChanges(currChanges)
                } else {
                    const res = await getSettings(selectedNav);
                    setSettings(res)
                }
            })
        } catch (e) {
            console.error(e)
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

            cb({ currChanges, firstKey });
        });
    };


    useEffect(() => {
        browser.storage.local.set({ currChanges })
    }, [currChanges])


    const handleRulesChange = (e) => {
        const parsed = checkJSONValidity(e.target.value)
        if (parsed === true) {
            setError('')
        } else {
            setError(parsed)
        }
        let settingChanges = {
            [selectedNav]: {
                jRules: e.target.value
            }
        }
        if (isEqual(settingChanges, { [selectedNav]: settings[selectedNav] })) {
            setSaved(true)
            setCurrChanges({})
        } else {
            setSaved(false)
            setCurrChanges(settingChanges)
        }
    }

    const handleAddTheme = async (data, updateId) => {
        let Layout;
        if (updateId == '') {
            Layout = {
                theme: settings[selectedNav].theme,
                customTheme: {
                    ...settings[selectedNav].customTheme,
                    [crypto.randomUUID()]: data
                }
            }
        } else {
            Layout = {
                theme: settings[selectedNav].theme,
                customTheme: {
                    ...settings[selectedNav].customTheme,
                    [updateId]: data
                }
            }
        }
        const res = await saveSettings(selectedNav, Layout)
        setSettings({
            ...settings,
            [selectedNav]: Layout
        })

        if (res.success) {
            if (updateId === '') addToast('Custom theme added', 'success')
            else addToast('Custom theme updated', 'success')
            setOpenThemeAdd(false)
        }
    }

    const handleSelectTheme = async (name) => {
        let Layout = {
            ...settings.Layout,
            theme: {
                ...settings.Layout.theme,
                active: name
            }
        }

        if (name === settings.Layout.theme.active) {
            setSaved(true)
            setCurrChanges({})
        } else {

            setCurrChanges((prev) => ({
                ...prev,
                Layout
            }))
            setSaved(false)
        }
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
            setTrigger(Date.now())
        } else {
            addToast('Error ecc while saving', 'error')
            setSaved(false)
        }
    }

    const handleDiscardChanges = () => {
        setCurrChanges({})
        setError('')
        setSaved(true)
    }

    const handleNavChange = (nav) => {
        if (saved) {
            setCurrChanges({})
            setSelectedNav(nav)
            setError('')
        } else {
            handleShake()
        }
    }

    const handleThemeDelete = async (name) => {
        let newData = settings[selectedNav]
        if (newData.theme.active === name) {
            addToast(`Can't delete, this theme is in use`, 'error')
            return;
        }
        delete newData.customTheme[name]
        const res = await saveSettings(selectedNav, newData)
        setSettings({
            ...settings,
            [selectedNav]: newData
        })

        if (res.success) {
            addToast('Custom theme deleted', 'success')
        }
    }

    const handleThemeUpdate = (id, data) => {
        setThemeUpdateData({ id, data })
        setOpenThemeAdd(true)
    }

    // blacklist stuff
    const handleAddBL = async () => {
        let senders = settings[selectedNav]?.senders || []
        if (!checkEmailValidity(bLEmail)) {
            setError('Invalid email')
            return;
        }
        if (senders.includes(bLEmail)) {
            addToast('Sender allready exists', 'error')
            setError('')
            return;
        } else {
            setError('')
            senders.push(bLEmail)
        }

        const res = await saveSettings(selectedNav, { senders })
        setSettings({
            ...settings,
            [selectedNav]: {
                senders
            }
        })

        if (res.success) {
            addToast('Sender blacklisted', 'success')
            setBLEmail('')
        }
    }

    const removeBLSender = async (email) => {
        let senders = settings[selectedNav]?.senders || []

        senders = senders.filter(e => e !== email)

        const res = await saveSettings(selectedNav, { senders })
        setSettings({
            ...settings,
            [selectedNav]: {
                senders
            }
        })

        if (res.success) {
            addToast('Sender removed', 'success')
        }
    }

    // additional stuffs
    const handleChangeSugg = (value) => {
        let Additional = {
            ...settings.Additional,
            suggestions: value
        }
        if (isEqual(Additional, settings.Additional)) {
            setSaved(true)
            setCurrChanges({})
        } else {

            setCurrChanges((prev) => ({
                ...prev,
                Additional
            }))
            setSaved(false)
        }
    }
    const handleChangeCExt = (value) => {
        let Additional = {
            ...settings.Additional,
            codeExtraction: value
        }
        if (isEqual(Additional, settings.Additional)) {
            setSaved(true)
            setCurrChanges({})
        } else {

            setCurrChanges((prev) => ({
                ...prev,
                Additional
            }))
            setSaved(false)
        }
    }
    const handleChangeSMode = (value) => {
        let Additional = {
            ...settings.Additional,
            searchMode: value
        }
        if (isEqual(Additional, settings.Additional)) {
            setSaved(true)
            setCurrChanges({})
        } else {

            setCurrChanges((prev) => ({
                ...prev,
                Additional
            }))
            setSaved(false)
        }
    }

    const navTabs = [
        'Layout',
        'Spam',
        'Blacklist',
        'Additional'
    ]

    return (
        <div>
            <Settings size={20} onClick={() => setOpen(true)} className="inline mr-2 text-fg hover:rotate-45 transition-transform duration-200 cursor-pointer" />
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
                >
                    <div className="bg-bg rounded border border-bbg p-3 w-full h-[400px] flex flex-col overflow-hidden relative">

                        <div className='flex  justify-between items-center'>
                            <h3 className="text-lg font-semibold mb-2">Settings</h3>
                            <button className='inline text-fg' onClick={() => {
                                if (saved) setOpen(false)
                                else handleShake()
                            }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex space-x-2 mb-2">
                            {navTabs.map((nav) => (
                                <button
                                    key={nav}
                                    className={`px-2 py-1 rounded text-xs border-1 border-bbg ${nav === selectedNav ? "bg-btnbg text-fg" : "text-fg"
                                        }`}
                                    onClick={() => handleNavChange(nav)}
                                >
                                    {nav}
                                </button>
                            ))}
                        </div>
                        <div className=' p-2 h-full text-xs overflow-y-auto'>
                            {selectedNav == 'Spam' ? (
                                <div className='flex flex-col space-y-2'>
                                    <div className='border border-bbg rounded space-y-2 p-2'>
                                        <div>
                                            <h1 className='text-sm font-bold'>
                                                Spam Filter
                                            </h1>
                                            <p className='text-gray-500'>Edit or add new JSON rules to customize spam filtering. You can go nuts!!</p>
                                        </div>
                                        <div className=''>
                                            <textarea rows={10} name='jRules' value={(Object.keys(currChanges).length === 0 || currChanges == undefined) ? settings?.Spam?.jRules : currChanges?.Spam?.jRules} onChange={(e) => {
                                                handleRulesChange(e)
                                            }} className='outline-none focus:outline-none focus:ring-0 w-full max-h-[180px] border border-bbg rounded bg-bg text-fg bg-opacity-70'></textarea>

                                            {error && <p className='text-red-400 my-1'>{error}</p>}
                                            <p className='text-gray-500 text-[10px]'>
                                                <strong>from</strong> : Email from, {' '}
                                                <strong>subject</strong> : Email subject, {' '}
                                                <strong>html</strong> : Email HTML Code, {' '}
                                                <strong>text</strong> : Email plain text
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedNav == 'Layout' ? (
                                <div className='flex flex-col space-y-2'>
                                    <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center'>
                                            <div className=''>
                                                <h1 className='text-sm font-bold'>Theme</h1>
                                                <p className='text-gray-500'>Choose your preferred theme</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center'>
                                                <button onClick={() => handleSelectTheme('dark')} className={`${(Object.keys(currChanges?.Layout?.theme || {}).length !== 0 ? currChanges?.Layout?.theme?.active == 'dark' : settings?.Layout?.theme?.active == 'dark') ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    <Moon size={14} />
                                                </button>
                                                <button onClick={() => handleSelectTheme('light')} className={`${(Object.keys(currChanges?.Layout?.theme || {}).length !== 0 ? currChanges?.Layout?.theme?.active == 'light' : settings?.Layout?.theme?.active == 'light') ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    <Sun size={14} />
                                                </button>
                                                <button onClick={() => handleSelectTheme('system')} className={`${(Object.keys(currChanges?.Layout?.theme || {}).length !== 0 ? currChanges?.Layout?.theme?.active == 'system' : settings?.Layout?.theme?.active == 'system') ? 'bg-bbg' : ''} p-1 `}>
                                                    <SunMoon size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center w-full'>
                                            <div className='w-2/3'>
                                                <h1 className='text-sm font-bold'>Custom Theme</h1>
                                                <p className='text-gray-500'>Create your custom theme</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center gap-1 flex-wrap p-1'>
                                                {(Object.entries(settings?.Layout?.customTheme || {})).map(([n, t]) => (
                                                    <div className='relative group'>
                                                        <div key={n} onClick={() => handleSelectTheme(n)}
                                                            style={{ borderColor: t.bbg }}
                                                            className={`${(Object.keys(currChanges?.Layout?.theme || {}).length !== 0
                                                                ? currChanges?.Layout?.theme?.active == n
                                                                : settings?.Layout?.theme?.active == n)
                                                                ? 'border-2' : ''} grid grid-cols-2 gap-0 border cursor-pointer`}>
                                                            <div style={{ backgroundColor: t.bg }} className='w-1.5 h-1.5'></div>
                                                            <div style={{ backgroundColor: t.fg }} className='w-1.5 h-1.5'></div>
                                                            <div style={{ backgroundColor: t.btnbg }} className='w-1.5 h-1.5'></div>
                                                            <div style={{ backgroundColor: t.bbg }} className='w-1.5 h-1.5'></div>
                                                        </div>
                                                        <AnimatePresence>
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 20 }}
                                                                className='absolute right-[-20px] z-50 hidden group-hover:flex items-center bg-bg text-fg border border-bbg rounded-lg p-0.5'>
                                                                <button onClick={() => handleThemeUpdate(n, t)} className=' px-0.5 py-0.5 transition duration-200 hover:bg-bbg border-r border-r-bbg rounded-tl-lg rounded-bl-lg'>
                                                                    <Pen size={14} />
                                                                </button>
                                                                <button onClick={() => handleThemeDelete(n, t)} className=' px-0.5 py-0.5 transition duration-200 text-red-500 hover:bg-bbg rounded-tr-lg rounded-br-lg'>
                                                                    <Trash size={14} />
                                                                </button>
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                                {(Object.values(settings?.Layout?.customTheme || {})).length < 17 && <button onClick={() => {
                                                    setThemeUpdateData({ id: '', data: undefined })
                                                    setOpenThemeAdd(true)
                                                }} className={`border border-bbg bg-bg p-1`}>
                                                    <Plus size={10} />
                                                </button>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center'>
                                            <div className=''>
                                                <h1 className='text-sm font-bold'>Layout</h1>
                                                <p className='text-gray-500'>Choose your preferred layout</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center'>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            ) : selectedNav == 'Blacklist' ? (
                                <div className='flex flex-col space-y-2'>
                                    <div className='border border-bbg rounded space-y-2 p-2'>
                                        <div>
                                            <h1 className='text-sm font-bold'>
                                                Blacklist senders
                                            </h1>
                                            <p className='text-gray-500'>Add all the senders you don't want to recieve emails from</p>
                                        </div>
                                        <div className='flex justify-center space-x-2'>
                                            <input onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleAddBL()
                                                }
                                            }} placeholder='pls@blacklist.me' name='senders' value={bLEmail} onChange={(e) => { setBLEmail(e.target.value) }} className='outline-none focus:outline-none focus:ring-0 w-full max-h-[180px] border border-bbg rounded bg-bg text-fg bg-opacity-70 p-1' />
                                            <button onClick={handleAddBL} className='border rounded border-bbg bg-btnbg text-fg px-1 py-0.5'>Add</button>
                                        </div>
                                        {error && <p className='text-red-400'>{error}</p>}
                                    </div>
                                    {(settings[selectedNav]?.senders.length == 0 || settings[selectedNav] == undefined) && <p className='text-center w-full'>No sender is blacklisted yet.</p>}
                                    <div className='space-y-2'>
                                        {(settings[selectedNav]?.senders || []).map((e, i) => (
                                            <div className='px-2 py-1 border border-bbg bg-bg rounded flex justify-between items-center'>
                                                <p className='text-opacity-70'>{e}</p>
                                                <button onClick={() => removeBLSender(e)} className=''>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : selectedNav == 'Additional' ? (
                                <div className='flex flex-col space-y-2'>
                                    <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center'>
                                            <div className=''>
                                                <h1 className='text-sm font-bold'>Email Suggestions</h1>
                                                <p className='text-gray-500'>Do you want your temp email to be shown below email fields?</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center'>
                                                <button onClick={() => handleChangeSugg(true)} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.suggestions == true : settings?.Additional?.suggestions == true) ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    Yes
                                                </button>
                                                <button onClick={() => handleChangeSugg(false)} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.suggestions == false : settings?.Additional?.suggestions == false) ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center'>
                                            <div className=''>
                                                <h1 className='text-sm font-bold'>OTP Extraction</h1>
                                                <p className='text-gray-500'>Do you want auto extraction of your verification codes form your emails?</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center'>
                                                <button onClick={() => handleChangeCExt(true)} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.codeExtraction == true : settings?.Additional?.codeExtraction == true) ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    Yes
                                                </button>
                                                <button onClick={() => handleChangeCExt(false)} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.codeExtraction == false : settings?.Additional?.codeExtraction == false) ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='border rounded border-bbg p-2'>
                                        <div className='flex justify-between items-center'>
                                            <div className=''>
                                                <h1 className='text-sm font-bold'>Search Mode</h1>
                                                <p className='text-gray-500'>Does your potato PC lags? if yes go for search on 'Enter'.</p>
                                            </div>
                                            <div className='border rounded border-bbg flex items-center'>
                                                <button onClick={() => handleChangeSMode('auto')} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.searchMode == 'auto' : settings?.Additional?.searchMode == 'auto') ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    Auto
                                                </button>
                                                <button onClick={() => handleChangeSMode('enter')} className={`${(Object.keys(currChanges?.Additional || {}).length !== 0 ? currChanges?.Additional?.searchMode == 'enter' : settings?.Additional?.searchMode == 'enter') ? 'bg-bbg' : ''} border-r border-r-bbg p-1`}>
                                                    Enter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div></div>
                            )}
                        </div>
                        <AnimatePresence>
                            {!saved &&
                                <motion.div
                                    initial={{ opacity: 0, y: '100%' }}
                                    animate={{ opacity: 100, y: '0%' }}
                                    exit={{ opacity: 0, y: '100%' }}
                                    className={`${shake ? 'animate-shake' : ''} absolute bottom-0 z-50 p-2 mx-auto space-x-4 bg-bg text-xs flex justify-between items-center rounded-t-md border border-b-0 border-bbg`}>
                                    <div>Unsaved changes</div>
                                    <div className='flex space-x-2 '>
                                        <button onClick={handleDiscardChanges} className='border rounded border-bbg py-1 px-2'>Discard</button>
                                        <button onClick={handleChangesSaved} disabled={error !== ''} className='border rounded bg-btnbg text-fg py-1 px-2 disabled:opacity-50'>Save</button>
                                    </div>
                                </motion.div>
                            }
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
            <AddTheme isOpen={openThemeAdd} onClose={() => setOpenThemeAdd(false)} onSubmit={handleAddTheme} updateData={themeUpdateData} />
        </div>
    )
}

export default Setting