import React from 'react'
import Setting from './Settings'
import { hasFormSubmit } from '@testing-library/user-event/dist/utils'
import { div } from 'framer-motion/client'

const Header = () => {
  return (
    <header className="mb-2 p-2 bg-white rounded flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center ">
          QuickTemp
        </h1>
        <Setting />
      </div>
    </header>
  )
}

export default Header