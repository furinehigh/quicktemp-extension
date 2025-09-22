import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, CircleX, Info } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToast] = useState([])

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now()
        setToast((prev) => [...prev, { id, message, type }])

        setTimeout(() => {
            setToast((prev) => prev.filter(t => t.id !== id))
        }, duration)
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-1 space-y-2 z-50 text-xs">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{x: '100%'}}
                            key={toast.id}
                            className={`px-4 py-2 rounded shadow-md transition-all bg-white text-black flex items-center`}
                        >
                            <span className="mr-2">
                                {toast.type == 'info' ? <Info className="inline" size={13} />
                                    : toast.type === 'success' ? <CircleCheck className="inline" size={13} />
                                        : <CircleX className="inilne" size={13} />}
                            </span>
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(){
    return useContext(ToastContext)
}