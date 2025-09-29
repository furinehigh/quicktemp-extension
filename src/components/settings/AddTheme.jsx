import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";
/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
function AddTheme({ isOpen, onClose, updateData, onSubmit }) {
    const [data, setData] = useState({
        bg: "#000000",
        fg: "#ffffff",
        btnbg: "#3b82f6",
        bbg: "#374151",
        logo: '#3b82f6'
    });
    const [noOfYeah, setNoOfYeah] = useState()
    const [showLColor, setShowLColor] = useState(false)
    const [showMsg, setShowMsg] = useState('')

    useEffect(() => {
        if (updateData?.data !== undefined) {
            setData(updateData?.data)
        }
    }, [updateData])

    useEffect(() => {
        browser.storage.local.get('settings', (res) => {
            setNoOfYeah(res?.settings?.noOfYeah)
            if (res?.settings?.noOfYeah > 2) {
                setShowLColor(true)
            }
        })
    }, [])

    const [focused, setFocused] = useState({
        bg: false,
        fg: false,
        btnbg: false,
        bbg: false,
        logo: false
    });

    const handleFieldChange = (name, color) => {
        setData((prev) => ({
            ...prev,
            [name]: color,
        }));
    };

    useEffect(() => {
        (async () => {
            browser.storage.local.get('settings', async (res) => {
                await browser.storage.local.set({ settings: {
                    ...res?.settings,
                    noOfYeah
                }})
            })
        })()
    }, [noOfYeah])
    
    // some fun part
    const handleYeah = () => {
        setNoOfYeah((prev) => prev+1)
        setShowLColor(true)
    }
    const handleNah = () => {
        setShowLColor(false)
        if (noOfYeah === 0) {
            setShowMsg('Figured as much...')
        }
        if (noOfYeah === 1) {
            setShowMsg('Ah now u get it!')
        }
    }

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center text-xs justify-center z-50"
        >
            <div className="bg-bg p-4 rounded border border-bbg w-72 space-y-2">
                <h1 className="text-sm font-bold">{updateData?.id === '' ? 'Add a Custom Theme' : 'Update the Custom Theme'}</h1>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <label className="font-semibold">Background Color</label>
                        <div className="relative">
                            <span
                                tabIndex={0}
                                style={{ backgroundColor: data?.bg }}
                                onClick={() => setFocused({ ...focused, bg: true })}
                                className="w-full h-6 border rounded cursor-pointer block"
                            />
                            {focused.bg && (
                                <div onBlur={() => setFocused({ ...focused, bg: false })} className="absolute top-full left-0 mt-2 z-50">
                                    <HexColorPicker
                                        color={data?.bg}
                                        onChange={(c) => handleFieldChange("bg", c)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold">Text Color</label>
                        <div className="relative">
                            <span
                                tabIndex={0}
                                style={{ backgroundColor: data?.fg }}
                                onClick={() => setFocused({ ...focused, fg: true })}
                                className="w-full h-6 border rounded cursor-pointer block"
                            />
                            {focused.fg && (
                                <div onBlur={() => setFocused({ ...focused, fg: false })} className="absolute top-full left-0 mt-2 z-50">
                                    <HexColorPicker
                                        color={data?.fg}
                                        onChange={(c) => handleFieldChange("fg", c)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold">Button BG Color</label>
                        <div className="relative">
                            <span
                                tabIndex={0}
                                style={{ backgroundColor: data?.btnbg }}
                                onClick={() => setFocused({ ...focused, btnbg: true })}
                                className="w-full h-6 border rounded cursor-pointer block"
                            />
                            {focused.btnbg && (
                                <div onBlur={() => setFocused({ ...focused, btnbg: false })} className="absolute top-full left-0 mt-2 z-50">
                                    <HexColorPicker
                                        color={data?.btnbg}
                                        onChange={(c) => handleFieldChange("btnbg", c)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold">Border Color</label>
                        <div className="relative">
                            <span
                                tabIndex={0}
                                style={{ backgroundColor: data?.bbg }}
                                onClick={() => setFocused({ ...focused, bbg: true })}
                                className="w-full h-6 border rounded cursor-pointer block"
                            />
                            {focused.bbg && (
                                <div onBlur={() => setFocused({ ...focused, bbg: false })} className="absolute top-full left-0 mt-2 z-50">
                                    <HexColorPicker
                                        color={data?.bbg}
                                        onChange={(c) => handleFieldChange("bbg", c)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col col-span-2">
                        <label className="font-semibold">My Identity(Logo duh)</label>
                        <div className="relative">

                            {showLColor ?
                                (<>
                                    <span
                                        tabIndex={0}
                                        style={{ backgroundColor: data?.logo }}
                                        onClick={() => setFocused({ ...focused, logo: true })}
                                        className="w-full h-6 border rounded cursor-pointer block"
                                    />

                                    {focused.logo && (
                                        <div onBlur={() => setFocused({ ...focused, logo: false })} className="absolute top-full left-0 mt-2 z-50">
                                            <HexColorPicker
                                                color={data?.logo}
                                                onChange={(c) => handleFieldChange("logo", c)}
                                            />
                                        </div>
                                    )}
                                </>)
                                : noOfYeah === 0 && showMsg == '' ? (
                                    <div className="flex text-[11px] text-bbg justify-between items-center">
                                        <p>You THINK u can change MEEE, huh?</p>
                                        <div className="flex space-x-2">

                                            <button onClick={handleYeah} className="hover:underline hover:text-btnbg transition duration-100 border-none">Yeah</button>
                                            <button onClick={handleNah} className="hover:underline hover:text-btnbg transition duration-100 border-none ">Nah</button>
                                        </div>
                                    </div>
                                ) : noOfYeah === 1 && showMsg == '' ? (
                                    <div className="flex text-[11px] text-bbg justify-between items-center">
                                        <p>You think this is FUNNY, TRY that AGAIN...</p>
                                        <div className="flex space-x-2">

                                            <button onClick={handleYeah}  className="hover:underline hover:text-btnbg transition duration-100 border-none">Sure is</button>
                                            <button onClick={handleNah} className="hover:underline hover:text-btnbg transition duration-100 border-none ">MB</button>
                                        </div>
                                    </div>
                                ) : showMsg !== '' ? (
                                    <div className="flex text-[11px] text-bbg justify-between items-center">
                                        <p>{showMsg}</p>
                                        <div className="flex space-x-2">

                                            <button onClick={handleYeah}  className="hover:underline hover:text-btnbg transition duration-100 border-none">Changed my mind</button>
                                            
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    <span
                                        tabIndex={0}
                                        style={{ backgroundColor: data?.logo }}
                                        onClick={() => setFocused({ ...focused, logo: true })}
                                        className="w-full h-6 border rounded cursor-pointer block"
                                    />

                                    {focused.logo && (
                                        <div onBlur={() => setFocused({ ...focused, logo: false })} className="absolute top-full left-0 mt-2 z-50">
                                            <HexColorPicker
                                                color={data?.logo}
                                                onChange={(c) => handleFieldChange("logo", c)}
                                            />
                                        </div>
                                    )}</>
                                )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-bbg rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(data, updateData?.id)}
                        className="px-4 py-2 rounded bg-btnbg text-fg"
                    >
                        {updateData?.id === '' ? 'Add' : 'Update'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default AddTheme;
