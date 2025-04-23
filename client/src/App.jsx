import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AllRoutes from './Allroutes'
import WeatherNavbar from './layout/Navbar'

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/'; 

  return (
    <>
      {!isLoginPage && <WeatherNavbar />} 
      <AllRoutes />
    </>
  );
}

export default App;
