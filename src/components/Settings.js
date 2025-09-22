import React, {useState} from 'react'
import { Settings } from 'lucide-react'

function Setting() {
    const [open, setOpen] = useState(false)

    const toggleOpen = () => {
        setOpen(!open)
    }

    return (
        <div>
            <Settings size={20} className="inline mr-2 text-gray-600 hover:rotate-45 transition-transform duration-200 cursor-pointer" onClick={toggleOpen} />
            {open && (
                <div className="absolute right-4 top-12 bg-white border border-gray-300 rounded shadow-md p-4 w-64 z-50">
                    <div className=''>
                    <h3 className="text-lg font-semibold mb-2">Settings</h3>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Setting