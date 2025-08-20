import { AiOutlineWifi , AiFillCamera } from "react-icons/ai"; 

import { useState ,React } from 'react';

const Navbar = () => {
  return (
    <div className='w-screen h-12 flex items-center justify-between bg-white p-2  '>
      <div className="flex items-center gap-2"> 
            <AiFillCamera className="text-green-500 text-2xl"/>
            <h1>Selfikiosk</h1>
      </div>
      <div className="flex items-center gap-2">
        <AiOutlineWifi className="text-green-500 text-2xl"/>
        <h1>En ligne</h1>
      </div>
    </div>
  )
}

export default Navbar
