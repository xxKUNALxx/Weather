// import React from 'react';
// import { Route, Routes } from 'react-router-dom'; // ✅ no BrowserRouter here
// import WeatherLoginPage from './pages/WeatherLoginPage';
// import WeatherApp from './pages/Home';
// import Map from './pages/Map';
// import ProfilePage from './pages/Profile';
// import WorldInfoGlobe from './pages/Globe';

// const AllRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<WeatherLoginPage />} />
//       <Route path="/home" element={<WeatherApp />} />
//       <Route path="/map" element={<Map />} />
//       <Route path="/profile" element={<ProfilePage/>}/>
//       <Route path="/globe" element={<WorldInfoGlobe/>}/>
//     </Routes>
//   );
// };

// export default AllRoutes;
import React from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import WeatherLoginPage from './pages/WeatherLoginPage';
import WeatherApp from './pages/Home';
import Map from './pages/Map';
import ProfilePage from './pages/Profile';
import WorldInfoGlobe from './pages/Globe';
import Uploadpage from './pages/Uploadpage';

// Protected route component
const ProtectedRoute = () => {
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('accessToken');
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // If authenticated, render the child components
  return <Outlet />;
};

const AllRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<WeatherLoginPage />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<WeatherApp />} />
        <Route path="/map" element={<Map />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/globe" element={<WorldInfoGlobe />} />
        <Route path="/upload" element={<Uploadpage />} />
      </Route>
      
      {/* Redirect any unknown routes to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AllRoutes;