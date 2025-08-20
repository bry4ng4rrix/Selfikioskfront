import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './page/home'
import Capture from './page/capture'
import Navbar from './components/navbar'
import Admin from './page/admin/index'
function App() {
  

  return (
    <BrowserRouter >
      <div className="min-h-screen  bg-blue-100 text-gray-800">
        <Navbar />
        <Routes>
             <Route path="/" element={<Home />} />
             <Route path="/capture" element={<Capture/>} />
             <Route path="/admin" element={<Admin/>} />
        </Routes>
      </div>
    
    </BrowserRouter>
  )
}

export default App
