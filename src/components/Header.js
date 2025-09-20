import React from 'react'
import Setting from './Settings'

const Header = () => {
  return (
    <header className="mb-4 p-4 bg-white shadow-md rounded-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <span className="inline-block w-8 h-8 bg-blue-500 rounded-lg"></span>
          QuickTemp
        </h1>
        <Setting />
      </div>
    </header>
  )
}

export default Header
