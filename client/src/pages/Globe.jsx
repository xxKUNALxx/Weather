import { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';

export default function WorldInfoGlobe() {
  const [countries, setCountries] = useState({ features: [] });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null);
  const globeRef = useRef();

    console.log(weatherData);
  // Define capital cities coordinates for better accuracy
  const capitalCoordinates = {
    // Format: ISO code: [longitude, latitude]
    IND: [77.2090, 28.6139], // New Delhi, India
    USA: [-77.0369, 38.9072], // Washington D.C., United States
    CAN: [-75.6972, 45.4215], // Ottawa, Canada
    BRA: [-47.9292, -15.7801], // Brasília, Brazil
    AUS: [149.1300, -35.2809], // Canberra, Australia
    RUS: [37.6173, 55.7558], // Moscow, Russia
    CHN: [116.4074, 39.9042], // Beijing, China
    GBR: [-0.1278, 51.5074], // London, United Kingdom
    DEU: [13.4050, 52.5200], // Berlin, Germany
    FRA: [2.3522, 48.8566], // Paris, France
    JPN: [139.6917, 35.6895], // Tokyo, Japan
    // Add more capitals as needed
  };

  useEffect(() => {
    // Fetch countries data from a reliable source
    fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        // Process data to ensure all required fields are present
        const enhancedData = {
          ...data,
          features: data.features.map(feature => {
            // Get ISO code for the country
            const isoCode = feature.properties.ISO_A3;
            
            // Use capital city coordinates for key countries, or calculate centroid
            let centroid;
            if (isoCode && capitalCoordinates[isoCode]) {
              centroid = {
                lng: capitalCoordinates[isoCode][0],
                lat: capitalCoordinates[isoCode][1]
              };
            } else {
              // Calculate a rough centroid from the first polygon
              if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
                const coords = feature.geometry.type === 'MultiPolygon' 
                  ? feature.geometry.coordinates[0][0] 
                  : feature.geometry.coordinates[0];
                
                if (coords && coords.length > 0) {
                  // Calculate average lat/lng from polygon points
                  const sumCoords = coords.reduce((acc, coord) => {
                    return [acc[0] + coord[0], acc[1] + coord[1]];
                  }, [0, 0]);
                  
                  centroid = {
                    lng: sumCoords[0] / coords.length,
                    lat: sumCoords[1] / coords.length
                  };
                }
              }
            }
            
            // Ensure country name is present
            const name = feature.properties.NAME || feature.properties.name || feature.properties.ADMIN || "Unknown";
            
            // Fix and standardize population and GDP data
            const population = feature.properties.POP_EST || feature.properties.pop_est || null;
            const gdp = feature.properties.GDP_MD_EST || feature.properties.gdp_md_est || null;
            
            // Add continent and region if missing
            const continent = feature.properties.CONTINENT || feature.properties.continent || "N/A";
            const region = feature.properties.REGION_UN || feature.properties.region_un || "N/A";
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                NAME: name,
                POP_EST: population,
                GDP_MD_EST: gdp,
                CONTINENT: continent,
                REGION_UN: region,
                centroid
              }
            };
          })
        };
        setCountries(enhancedData);
      });
  }, []);

  useEffect(() => {
    // Auto-rotate globe with smoother settings
    if (globeRef.current) {
      // Configure globe for smooth appearance
      globeRef.current.controls().enableDamping = true;
      globeRef.current.controls().dampingFactor = 0.2;
      globeRef.current.controls().rotateSpeed = 0.7;
      globeRef.current.controls().zoomSpeed = 0.8;
      
      if (!selectedCountry) {
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.3; // Slower for smoother rotation
      } else {
        globeRef.current.controls().autoRotate = false;
      }
    }
  }, [selectedCountry]);

  // Updated to use OpenWeatherMap API
  const getWeatherData = async (lat, lng) => {
    setLoading(true);
    try {
      const apiKey = "6f9f2e1957a21a69443f8be62020314f";
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
      );
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCountryClick = (country) => {
    setSelectedCountry(country);
    
    if (country.properties.centroid) {
      const { lat, lng } = country.properties.centroid;
      
      getWeatherData(lat, lng);
      
      // Focus globe on clicked country with smoother animation
      globeRef.current.pointOfView({
        lat,
        lng,
        altitude: 1.8 // Slightly higher altitude for better view
      }, 1500); // Longer duration for smoother animation
    }
  };

  const handleCountryHover = (country) => {
    if (country) {
      setHoverInfo(country);
    } else {
      setHoverInfo(null);
    }
  };

  const refreshData = () => {
    if (selectedCountry && selectedCountry.properties.centroid) {
      const { lat, lng } = selectedCountry.properties.centroid;
      getWeatherData(lat, lng);
    }
  };

  // Updated for OpenWeatherMap weather icon codes
  const getWeatherIcon = (weatherId) => {
    if (!weatherId && weatherId !== 0) return '❓';
    
    // Weather condition codes: https://openweathermap.org/weather-conditions
    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) return '⚡';
    // Drizzle
    if (weatherId >= 300 && weatherId < 400) return '🌦️';
    // Rain
    if (weatherId >= 500 && weatherId < 600) return '🌧️';
    // Snow
    if (weatherId >= 600 && weatherId < 700) return '❄️';
    // Atmosphere (fog, mist, etc)
    if (weatherId >= 700 && weatherId < 800) return '🌫️';
    // Clear
    if (weatherId === 800) return '☀️';
    // Clouds
    if (weatherId > 800 && weatherId < 900) return '☁️';
    
    return '❓';
  };

  // Country data fallbacks - important data for major countries in case API data is incomplete
  const countryData = {
    // Format: ISO code: { name, population, gdp, continent, region }
    IND: { 
      name: "India", 
      population: 1380004385, 
      gdp: 3176295, 
      continent: "Asia", 
      region: "Southern Asia" 
    },
    USA: { 
      name: "United States", 
      population: 331002651, 
      gdp: 21433226, 
      continent: "North America", 
      region: "Northern America" 
    },
    CHN: { 
      name: "China", 
      population: 1439323776, 
      gdp: 14342903, 
      continent: "Asia", 
      region: "Eastern Asia" 
    }
    // Add more countries as needed
  };

  // Get country information, using fallbacks if needed
  const getCountryInfo = (country) => {
    const properties = country.properties;
    const isoCode = properties.ISO_A3;
    
    // Check if we have fallback data for this country
    const fallback = isoCode && countryData[isoCode];
    
    return {
      name: properties.NAME || (fallback ? fallback.name : "Unknown"),
      population: properties.POP_EST || (fallback ? fallback.population : null),
      gdp: properties.GDP_MD_EST || (fallback ? fallback.gdp : null),
      continent: properties.CONTINENT || (fallback ? fallback.continent : "N/A"),
      region: properties.REGION_UN || (fallback ? fallback.region : "N/A"),
      isoCode: properties.ISO_A3 || ""  // Changed to ISO_A3 for accurate flag display
    };
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="bg-slate-800 bg-opacity-80 backdrop-blur-sm text-white p-4 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">World Info Globe</h1>
        </div>
        
        {selectedCountry && (
          <button 
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md flex items-center gap-2 shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
            onClick={refreshData}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9C19.9828 7.56678 19.1209 6.2766 17.9845 5.27501C16.8482 4.27341 15.4745 3.60122 14 3.34527C12.5255 3.08932 11.0097 3.26253 9.6342 3.84167C8.25868 4.42081 7.07456 5.37787 6.21 6.6M3.51 15C4.01716 16.4332 4.87905 17.7234 6.01543 18.725C7.1518 19.7266 8.52547 20.3988 10 20.6547C11.4745 20.9107 12.9903 20.7375 14.3658 20.1583C15.7413 19.5792 16.9254 18.6221 17.79 17.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        )}
      </header>
      
      {/* Layout with globe and info panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Globe container with improved visual quality */}
        <div className="flex-1 relative">
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png" // Added bump mapping for texture
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            polygonsData={countries.features}
            polygonCapColor={() => 'rgba(200, 200, 200, 0.7)'}
            polygonSideColor={() => 'rgba(150, 150, 150, 0.2)'}
            polygonStrokeColor={() => '#111'}
            polygonAltitude={0.01}
            atmosphereColor="rgb(65, 105, 225)" // Blue atmosphere glow
            atmosphereAltitude={0.15}
            polygonLabel={() => ''} // Remove default label, we'll use hover info
            onPolygonClick={handleCountryClick}
            onPolygonHover={handleCountryHover}
          />
        </div>
        
        {/* Hover tooltip for countries - adds interactivity */}
        {hoverInfo && !selectedCountry && (
          <div 
            className="absolute bg-slate-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: '50%',
              bottom: '10%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              minWidth: '200px',
              textAlign: 'center',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <div className="font-bold text-lg mb-1">{hoverInfo.properties.NAME}</div>
            <div className="text-sm text-gray-300">{hoverInfo.properties.CONTINENT}</div>
            <div className="mt-2 text-xs">Click for more information</div>
          </div>
        )}
        
        {/* Info panel - slide in from right with animation */}
        <div 
          className={`bg-slate-800 bg-opacity-95 backdrop-blur-sm text-white overflow-y-auto shadow-lg transition-all duration-500 ease-in-out ${
            selectedCountry ? 'w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'
          }`}
        >
          {selectedCountry && (() => {
            const info = getCountryInfo(selectedCountry);
            return (
              <div className="p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{info.name}</h2>
                  
                  {/* Country Flag - Fixed URL format for proper display */}
                  {/* <div className="w-16 h-10 overflow-hidden rounded shadow-md transform hover:scale-105 transition-transform duration-300">
                    <img 
                      src={`https://flagcdn.com/w160/${(info.isoCode || '').toLowerCase()}.png`}
                      alt={`Flag of ${info.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/160/100";
                        e.target.alt = "Flag not available";
                      }}
                    />
                  </div> */}
                </div>
                
                <div className="space-y-6">
                  {/* Country Info */}
                  <div className="bg-slate-700 p-4 rounded-lg shadow-md transform transition-all duration-300 hover:shadow-lg">
                    <h3 className="font-semibold mb-3 border-b border-slate-500 pb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 10V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Country Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Population:</span>
                        <span>{info.population?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">GDP (USD):</span>
                        <span>${info.gdp?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Continent:</span>
                        <span>{info.continent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Region:</span>
                        <span>{info.region}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Weather Info - Updated for OpenWeatherMap API */}
                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-slate-300">Loading weather data...</span>
                    </div>
                  ) : weatherData ? (
                    <div className="bg-slate-700 p-4 rounded-lg shadow-md transform transition-all duration-300 hover:shadow-lg">
                      <h3 className="font-semibold mb-3 border-b border-slate-500 pb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.34315 19.5565C3.21895 16.4323 3.21895 11.3677 6.34315 8.24347C9.46734 5.11928 14.5319 5.11928 17.6561 8.24347C20.7803 11.3677 20.7803 16.4323 17.6561 19.5565C14.5319 22.6807 9.46734 22.6807 6.34315 19.5565Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Current Weather
                      </h3>
                      <div className="space-y-4">
                        <div className="flex flex-col items-center py-3 bg-gradient-to-b from-slate-600 to-slate-700 rounded-lg">
                          <div className="text-5xl mb-2">
                            {weatherData.weather && weatherData.weather[0] ? 
                              getWeatherIcon(weatherData.weather[0].id) : '❓'}
                          </div>
                          <div className="text-4xl font-bold">
                            {weatherData.main ? `${Math.round(weatherData.main.temp)}°C` : 'N/A'}
                          </div>
                          <div className="text-xl mt-1 text-slate-300">
                            {weatherData.weather && weatherData.weather[0] ? 
                              weatherData.weather[0].description : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-600 p-3 rounded-md hover:bg-slate-500 transition-colors duration-300">
                            <div className="text-slate-300 text-sm">Humidity</div>
                            <div className="font-semibold">
                              {weatherData.main ? `${weatherData.main.humidity}%` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-slate-600 p-3 rounded-md hover:bg-slate-500 transition-colors duration-300">
                            <div className="text-slate-300 text-sm">Wind</div>
                            <div className="font-semibold">
                              {weatherData.wind ? `${Math.round(weatherData.wind.speed)} m/s` : 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-600 p-3 rounded-md hover:bg-slate-500 transition-colors duration-300">
                            <div className="text-slate-300 text-sm">Feels Like</div>
                            <div className="font-semibold">
                              {weatherData.main ? `${Math.round(weatherData.main.feels_like)}°C` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-slate-600 p-3 rounded-md hover:bg-slate-500 transition-colors duration-300">
                            <div className="text-slate-300 text-sm">Pressure</div>
                            <div className="font-semibold">
                              {weatherData.main ? `${weatherData.main.pressure} hPa` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-700 p-4 rounded-lg text-center shadow-md">
                      <svg className="w-12 h-12 mx-auto text-slate-400 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>Weather data not available</p>
                      <button 
                        onClick={refreshData}
                        className="mt-3 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-sm transition-colors duration-300"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      setSelectedCountry(null);
                      setWeatherData(null);
                      globeRef.current?.pointOfView({}, 1500);
                    }}
                    className="w-full py-3 bg-slate-600 hover:bg-slate-500 rounded-md transition-all duration-300 transform hover:scale-105 flex justify-center items-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Globe
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* Floating help indicator */}
      {!selectedCountry && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-700 bg-opacity-80 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
          Click on a country to view details
        </div>
      )}
    </div>
  );
}