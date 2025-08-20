import { AiOutlineCamera } from "react-icons/ai"; 
import React from 'react'
import { Link } from "react-router";




const Home = () => {
  return (
    <div className='h-screen  flex justify-center items-center'>
      
      <div className='bg-white min-w-96 w-1/2 h-1/2 m-5   p-5 rounded-xl shadow-lg'>
        <div className="flex flex-col items-center justify-between h-full">
          <div className='h-32 w-32 bg-blue-100 rounded-full flex items-center justify-center m-5'>
            <AiOutlineCamera className="h-1/2 w-1/2 text-blue-500"/>
          </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold m-2">Bienvenue au Kiosque Selfie</h1> 
                <div className="text-center text-gray-600 m-2">
               Prenez votre selfie avec des fonds personnalisés et recevez-le instantanément !
                </div>  
            </div>
              <Link to="/capture" className="bg-blue-500 hover:bg-blue-950  text-white p-3  rounded-lg flex items-center gap-2 m-5">
               <AiOutlineCamera className="h-5 w-5"/> Commencer</Link>
            <div>
              <ul className="list-disc text-gray-600">
                <li>Gratuit et instantané</li>
                <li>Fonds personnalisés disponibles</li>
                <li>Envoi par SMS ou email</li>
              </ul>
            </div>


        </div>
      </div>
    </div>
  )
}

export default Home
