import React from 'react'
import Setting from './Settings'

const Header = ({setTrigger}) => {
  return (
    <header className="mb-2 p-2 bg-bg text-fg rounded flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center ">
          QuickTemp
        </h1>
        <Setting setTrigger={setTrigger}/>
      </div>
    </header>
  )
}

export default Header