import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";

function AddTheme({ isOpen, onClose, updateData, onSubmit }) {
    const [data, setData] = useState({
        bg: "#000000",
        fg: "#ffffff",
        btnbg: "#3b82f6",
        bbg: "#374151",
    });

    useEffect(() => {
        console.log(updateData?.data)
        if (updateData?.data !== undefined) {
            setData(updateData?.data)
        }
    }, [updateData])


    const [focused, setFocused] = useState({
        bg: false,
        fg: false,
        btnbg: false,
        bbg: false,
    });

    const handleFieldChange = (name, color) => {
        setData((prev) => ({
            ...prev,
            [name]: color,
        }));
    };

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
