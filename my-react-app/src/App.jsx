import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
     <div className="container">
      <div className="parent">
        <div className="card">
          <div className="content-box">
            <span className="card-title">3D Card</span>
            <p className="card-content">
             My name AARON LUIS M. NICOLAS, I am 21 years old and I am from the philippines and I am currently studying
             bachelor of science in information technology at Divine Word College of Laoag and im in my 4rd year college
              (2025-2026) academic year.
            </p>
            <span className="see-more">See More</span>
          </div>
          <div className="date-box">
            <span className="month">JUNE</span>
            <span className="date">21</span>
          </div>
        </div>
      </div>
    </div>
    );
  }

export default App
