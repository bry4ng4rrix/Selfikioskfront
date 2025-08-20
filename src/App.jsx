import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Router , Routes ,Route } from 'react-router-dom'
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router >
      <div>
        <Routes>

        </Routes>
      </div>
    
    </Router>
  )
}

export default App
