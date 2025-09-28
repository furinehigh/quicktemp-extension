import React from 'react'
import { motion } from 'framer-motion'

function Search() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
        >
            <div className="p-3 w-full flex flex-col">
                
            </div>
        </motion.div>
    )
}

export default Search