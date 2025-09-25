import React, { useState } from 'react'
import { motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';

function AddTheme({ isOpen, onClose, onSubmit }) {
    const [data, setData] = useState({
        bg: '#000000',
        fg: '#ffffff',
        btnbg: '#3b82f6',
        bbg: '#374151'
    })
    const [focused, setFocused] = useState({
        bg: false,
        fg: false,
        btnbg: false,
        bbg: false
    })

    const handleFieldChange = (name, color) => {
        let data = {
            ...data,
            [name]: color
        }
        setData(data)
    }

    if (!isOpen) return;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center text-xs justify-center z-50">
            <div className="bg-bg p-4 rounded border border-bbg w-72 space-y-2">
                <h1 className='text-sm font-bold'>Add a Custom Theme</h1>
                <div className='grid grid-cols-2 gap-2'>
                    <div className='relative'>
                        <label id='bg' className='font-semibold'>
                            Background Color
                        </label>
                        <span
                            tabIndex={0}
                            style={{ backgroundColor: data.bg }}
                            onBlur={() => setFocused({ ...focused, bg: false })}
                            onClick={() => setFocused({ ...focused, bg: true })}
                            className="w-full h-4 p-2 border rounded cursor-pointer"
                        />

                        {focused.bg && (
                            <HexColorPicker
                                color={data.bg}
                                onChange={(c) => handleFieldChange("bg", c)}
                                className="p-1.5 w-full border rounded bg-bg absolute"
                            />
                        )}

                    </div>
                </div>
                <div className='flex justify-end space-x-2'>
                    <button onClick={onClose} className='px-4 py-2 bg-bbg rounded '>Cancel</button>
                    <button onClick={() => onSubmit(data)} className='px-4 py-2 rounded bg-blue-500 text-white'>Submit</button>
                </div>
            </div>
        </motion.div>
    )
}

export default AddTheme
