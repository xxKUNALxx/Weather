import { useState, useEffect, useRef } from 'react';
import { CloudSun, LogIn, Upload } from 'lucide-react';
import * as THREE from 'three';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; 


export default function WeatherLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');
  const mountRef = useRef(null);
  const requestRef = useRef(null);
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      // For Google OAuth, you might need to send this token to your backend
      // to verify and create a session
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Approach 1: If your backend supports Google OAuth token verification
      const response = await api.post('/users/oauth/google', {
        credential: credentialResponse.credential
      });
      
      // Store tokens returned from your backend
      if (response.data.data.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('weatherSphereUser', JSON.stringify(response.data.data.user));
        navigate('/home');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to authenticate with Google');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/users/login', {
        email,
        password
      });
      
      // Store tokens and user data
      if (response.data.data) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('weatherSphereUser', JSON.stringify(response.data.data.user));
        navigate('/home');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Setup the 3D scene
  useEffect(() => {
    // Only initialize once and when the mount ref is available
    if (!mountRef.current) return;

    // Clean up any existing scene to prevent duplicates
    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    // Setup Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.2;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Earth mesh
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: createEarthTexture(),
      bumpMap: createBumpMap(),
      bumpScale: 0.05,
      specularMap: createSpecularMap(),
      specular: new THREE.Color(0x333333),
      shininess: 15
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Clouds
    const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.6,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);
    cloudsRef.current = clouds;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 2, 5);
    const blueLight = new THREE.PointLight(0x4466cc, 0.6);
    blueLight.position.set(-5, -2, -5);
    
    scene.add(ambientLight, directionalLight, blueLight);

    // Add stars
    scene.add(createStars());

    // Variables for rotation
    let autoRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    // Mouse movement handler
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      
      targetRotationY = mouseX * 0.5;
      targetRotationX = mouseY * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start the animation loop
    startAnimation();

    // Function to start animation that can be called externally
    function startAnimation() {
      // Cancel any existing animation frame before starting a new one
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      
      // Animation loop
      const animate = () => {
        requestRef.current = requestAnimationFrame(animate);
        
        // Auto rotation
        autoRotationY += 0.002;
        
        // Earth rotation: base rotation + mouse-influenced rotation
        if (earthRef.current) {
          earthRef.current.rotation.y = autoRotationY;
          earthRef.current.rotation.x += (targetRotationX - earthRef.current.rotation.x) * 0.05;
          earthRef.current.rotation.y += (targetRotationY - earthRef.current.rotation.y) * 0.05;
        }
        
        // Cloud rotation: slightly faster than earth
        if (cloudsRef.current) {
          cloudsRef.current.rotation.y = autoRotationY * 1.2;
          cloudsRef.current.rotation.x = earth.rotation.x;
        }
        
        // Atmosphere follows earth rotation
        atmosphere.rotation.x = earth.rotation.x;
        atmosphere.rotation.y = earth.rotation.y;
        
        renderer.render(scene, camera);
      };

      animate();
    }

    // Clear everything on unmount
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Clean up Three.js resources
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      // Dispose geometries and materials
      [earthGeometry, atmosphereGeometry, cloudGeometry].forEach(geo => geo.dispose());
      [earthMaterial, atmosphereMaterial, cloudMaterial].forEach(mat => {
        if (mat.map) mat.map.dispose();
        if (mat.bumpMap) mat.bumpMap.dispose();
        if (mat.specularMap) mat.specularMap.dispose();
        mat.dispose();
      });
    };
  }, []);

  // Handle page visibility changes to restart animation when tab becomes active
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // Page is hidden, optionally pause animation
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      } else {
        // Page is visible again, restart animation if needed
        if (!requestRef.current && earthRef.current && rendererRef.current && sceneRef.current) {
          // Restart animation
          let autoRotationY = earthRef.current.rotation.y;
          let targetRotationX = 0;
          let targetRotationY = 0;
          
          const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            
            // Auto rotation
            autoRotationY += 0.002;
            
            // Earth rotation
            if (earthRef.current) {
              earthRef.current.rotation.y = autoRotationY;
              earthRef.current.rotation.x += (targetRotationX - earthRef.current.rotation.x) * 0.05;
              earthRef.current.rotation.y += (targetRotationY - earthRef.current.rotation.y) * 0.05;
            }
            
            // Cloud rotation
            if (cloudsRef.current) {
              cloudsRef.current.rotation.y = autoRotationY * 1.2;
              if (earthRef.current) {
                cloudsRef.current.rotation.x = earthRef.current.rotation.x;
              }
            }
            
            // Render scene
            rendererRef.current.render(sceneRef.current, rendererRef.current.camera);
          };
          
          animate();
        }
      }
    }
    
    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle hot module replacement in development
    if (process.env.NODE_ENV === 'development') {
      const handleFocus = () => {
        if (!requestRef.current && earthRef.current && rendererRef.current && sceneRef.current) {
          // Same restart logic as in visibility change
          let autoRotationY = earthRef.current.rotation.y;
          let targetRotationX = 0;
          let targetRotationY = 0;
          
          const animate = () => {
            requestRef.current = requestAnimationFrame(animate);
            
            // Auto rotation
            autoRotationY += 0.002;
            
            // Earth rotation
            if (earthRef.current) {
              earthRef.current.rotation.y = autoRotationY;
              earthRef.current.rotation.x += (targetRotationX - earthRef.current.rotation.x) * 0.05;
              earthRef.current.rotation.y += (targetRotationY - earthRef.current.rotation.y) * 0.05;
            }
            
            // Cloud rotation
            if (cloudsRef.current) {
              cloudsRef.current.rotation.y = autoRotationY * 1.2;
              if (earthRef.current) {
                cloudsRef.current.rotation.x = earthRef.current.rotation.x;
              }
            }
            
            // Render scene
            if (rendererRef.current && sceneRef.current) {
              rendererRef.current.render(sceneRef.current, rendererRef.current.camera);
            }
          };
          
          animate();
        }
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Create Earth texture programmatically
  function createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Ocean background
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#0a2d54');
    oceanGradient.addColorStop(0.5, '#1a4d7c');
    oceanGradient.addColorStop(1, '#2980b9');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple continents
    ctx.fillStyle = '#2ecc71';
    
    // North America
    drawContinent(ctx, 250, 180, 150, 170);
    
    // South America
    drawContinent(ctx, 370, 450, 100, 150);
    
    // Europe and Africa
    drawContinent(ctx, 580, 300, 140, 200);
    
    // Asia
    drawContinent(ctx, 750, 250, 200, 150);
    
    // Australia
    drawContinent(ctx, 800, 450, 100, 80);
    
    // Ice caps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height, 200, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  // Helper to draw continent shapes
  function drawContinent(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Create bump map for terrain
  function createBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add terrain variations
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 4;
      const brightness = Math.floor(Math.random() * 80 + 20);
      
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  // Create specular map
  function createSpecularMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Land is dark (less reflection), water is bright (more reflection)
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Oceans (brighter)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Continents (darker)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    
    // Draw continents similar to main texture
    drawContinent(ctx, 250, 180, 150, 170); // North America
    drawContinent(ctx, 370, 450, 100, 150); // South America
    drawContinent(ctx, 580, 300, 140, 200); // Europe and Africa
    drawContinent(ctx, 750, 250, 200, 150); // Asia
    drawContinent(ctx, 800, 450, 100, 80);  // Australia
    
    // Ice caps
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height, 200, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  // Create cloud texture
  function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Transparent background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create cloud patterns
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 15 + Math.random() * 40;
      
      // Main cloud
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Smaller cloud puffs
      for (let j = 0; j < 5; j++) {
        const puffX = x + (Math.random() - 0.5) * size * 2;
        const puffY = y + (Math.random() - 0.5) * size * 2;
        const puffSize = size * 0.5;
        
        ctx.beginPath();
        ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  // Create stars
  function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      
      // Keep stars away from center
      if (Math.sqrt(x*x + y*y + z*z) < 100) continue;
      
      starPositions.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 2,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Points(starGeometry, starMaterial);
  }

    // Signup form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    avatar: null
  });
  
 // Handle form input changes
 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};


  // Handle file upload for avatar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };



  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Create FormData object to send files
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      
      // Append avatar file if it exists
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      
      // Send registration request
      const response = await api.post('/users/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // If registration successful, log in automatically
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        // Automatically login after registration
        const loginResponse = await api.post('/users/login', {
          email: formData.email,
          password: formData.password
        });
        
        // Store tokens and user data
        if (loginResponse.data.data) {
          localStorage.setItem('accessToken', loginResponse.data.data.accessToken);
          localStorage.setItem('refreshToken', loginResponse.data.data.refreshToken);
          localStorage.setItem('weatherSphereUser', JSON.stringify(loginResponse.data.data.user));
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Globe Container */}
      <div ref={mountRef} className="absolute inset-0" />
      {!showSignup && (
        <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
          <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-lg bg-white/10 shadow-2xl border border-white/20">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <CloudSun size={32} className="text-white" />
              </div>
              
              {/* Welcome text */}
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to WeatherSphere</h1>
              <p className="text-blue-200 mb-8 text-center">Forecast the future, prepare for today</p>
              
              {/* Display error if any */}
              {error && (
                <div className="w-full p-3 mb-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm">
                  {error}
                </div>
              )}
              
              {/* Form */}
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-white/30 text-blue-500 focus:ring-blue-400" />
                    <span className="ml-2 text-sm text-blue-100">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-blue-300 hover:text-blue-200 transition duration-200">Forgot password?</a>
                </div>
                
                <button
                  onClick={handleLogin}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg shadow-blue-900/30 transition duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn size={18} className="mr-2" />
                      Sign In
                    </>
                  )}
                </button>
                
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-white/20 absolute w-full"></div>
                  <span className="bg-transparent px-3 text-blue-200 relative">or</span>
                </div>
                
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => setError('Google authentication failed')}
                  />
                </div>
              </div>
              
              <p className="mt-8 text-sm text-blue-200">
                Don't have an account? <button onClick={() => setShowSignup(true)} className="text-sm text-blue-300 hover:text-blue-200 font-medium">Sign up</button>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Signup Container - shown when showSignup is true */}
      {showSignup && (
        <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
          <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-lg bg-white/10 shadow-2xl border border-white/20">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <CloudSun size={32} className="text-white" />
              </div>
              
              {/* Welcome text */}
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
              <p className="text-blue-200 mb-8 text-center">Join WeatherSphere today</p>
              
              {/* Display error if any */}
              {error && (
                <div className="w-full p-3 mb-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm">
                  {error}
                </div>
              )}
              
              {/* Signup Form */}
              <form onSubmit={handleSignup} className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Username</label>
                  <input
                    type="text"
                    name="username"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                  />
                </div>
              
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-100">Profile Picture</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer border-white/20 bg-white/5 hover:bg-white/10">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="text-blue-300 mb-2" />
                        <p className="text-sm text-blue-200">
                          {formData.avatar ? formData.avatar.name : "Upload avatar image"}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        name="avatar" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange} 
                        required
                      />
                    </label>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg shadow-blue-900/30 transition duration-200 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Create Account'
                  )}
                </button>
                
                <p className="mt-6 text-sm text-blue-200 text-center">
                  Already have an account? <button type="button" onClick={() => setShowSignup(false)} className="text-sm text-blue-300 hover:text-blue-200 font-medium">Sign in</button>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}