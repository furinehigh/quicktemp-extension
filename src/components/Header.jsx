import React from 'react'
import Setting from './Settings'
import Search from './Search'

const Header = ({ setTrigger, mailbox, onSelectEmail }) => {
  return (
    <header className="mb-2 p-2 bg-bg text-fg rounded flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center ">
          QuickTemp
        </h1>
        <div className='flex space-x-2'>
          <Search onSelectEmail={onSelectEmail} mailbox={mailbox} />
          <Setting setTrigger={setTrigger} />
        </div>
      </div>
    </header>
  )
}

export default Header