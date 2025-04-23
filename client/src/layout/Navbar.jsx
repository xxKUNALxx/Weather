import { useState, useEffect } from 'react';
import { Sun, Map, Globe, Upload, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';

export default function WeatherNavbar() {
  const [activeTab, setActiveTab] = useState('weather');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Set active tab based on current location
  useEffect(() => {
    if (location.pathname === '/home') setActiveTab('weather');
    else if (location.pathname === '/map') setActiveTab('map');
    else if (location.pathname === '/globe') setActiveTab('globe');
    else if (location.pathname === '/upload') setActiveTab('upload');
  }, [location]);

  // Hide navbar on login page
  if (location.pathname === '/') return null;

  const user = JSON.parse(localStorage.getItem('weatherSphereUser'));
  const isAdmin = user?.isAdmin;
  const isPolicymaker = user?.policyMaker;
  console.log('User data from localStorage:', user);
console.log('isAdmin value:', user?.isAdmin);
  
  const tabs = [
    { id: 'weather', label: 'Weather', icon: <Sun size={18} />, path: '/home' },
    { id: 'map', label: 'Map', icon: <Map size={18} />, path: '/map' },
    { id: 'globe', label: 'Globe', icon: <Globe size={18} />, path: '/globe' },
    ...(isAdmin || isPolicymaker
      ? [{ id: 'upload', label: 'Upload', icon: <Upload size={18} />, path: '/upload' }]
      : [])
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (profileMenuOpen) setProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  // Handle Logout
  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-2 rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              WeatherApp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <Link
                  to={tab.path}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                  }`}
                >
                  <span className={`mr-2 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Button (Desktop) */}
          <div className="hidden md:block relative profile-menu-container">
            <button
              onClick={toggleProfileMenu}
              className="flex items-center px-3 py-2 rounded-full bg-blue-800 hover:bg-blue-700 transition-colors shadow-md"
            >
              <User className="h-5 w-5 text-blue-200" />
              <span className="ml-2 font-medium text-sm">Profile</span>
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-blue-800 ring-1 ring-black ring-opacity-5 z-10 transform transition-all duration-200 ease-out">
                <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-blue-100 hover:bg-blue-700">
                  <User className="h-4 w-4 mr-2" />
                  Your Profile
                </Link>
                {/* <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-blue-100 hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link> */}
                <div className="border-t border-blue-700 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-100 hover:bg-blue-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleProfileMenu}
              className="p-2 rounded-full bg-blue-800 hover:bg-blue-700 shadow-md"
            >
              <User className="h-5 w-5 text-blue-200" />
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md bg-blue-800 hover:bg-blue-700 shadow-md"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-blue-200" /> : <Menu className="h-5 w-5 text-blue-200" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu - Slide down animation */}
      <div 
        className={`md:hidden transform transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-3 pt-2 pb-4 space-y-1 bg-blue-800/90 backdrop-blur-sm shadow-lg">
          {tabs.map((tab) => (
            <Link
              to={tab.path}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Profile Menu - Slide down animation */}
      <div 
        className={`md:hidden transform transition-all duration-300 ease-in-out ${
          profileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-3 pt-2 pb-4 space-y-1 bg-blue-800/90 backdrop-blur-sm shadow-lg">
          <Link 
            to="/profile" 
            className="flex items-center px-4 py-3 text-sm text-blue-100 hover:bg-blue-700 rounded-md"
            onClick={() => setProfileMenuOpen(false)}
          >
            <User className="h-4 w-4 mr-3" />
            Your Profile
          </Link>
          <Link 
            to="/settings" 
            className="flex items-center px-4 py-3 text-sm text-blue-100 hover:bg-blue-700 rounded-md"
            onClick={() => setProfileMenuOpen(false)}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Link>
          <div className="border-t border-blue-700 my-1"></div>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center px-4 py-3 text-sm text-blue-100 hover:bg-blue-700 rounded-md"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}