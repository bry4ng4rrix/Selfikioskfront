import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './page/home'
import Capture from './page/capture'
import Navbar from './components/navbar'
import Login from './page/admin/login'
import Protected from './page/admin/protected';
import Admin from './page/admin/home'
import Fonds from './page/admin/fonds';
import Captures from './page/admin/capture';
import Config from './page/admin/config';
function App() {
  

  return (
    <BrowserRouter >
      <div className="min-h-screen w-full h-screen bg-blue-100 text-gray-800">
               <Navbar />
       
        <Routes>
             
              <Route path="/" element={<Home />} />
              <Route path="/capture" element={<Capture/>} />
              <Route path="/admin/login" element={<Login/>} />


             <Route element={<Protected/>}>
                <Route path='/admin' element={<Admin/>} /> 
                <Route path='/admin/Fonds' element={<Fonds/>} /> 
                <Route path='/admin/Capture' element={<Captures/>} /> 
                <Route path='/admin/config' element={<Config/>} /> 

             </Route> 
        </Routes>
        
      </div>
    
    </BrowserRouter>
  )
}

export default App
