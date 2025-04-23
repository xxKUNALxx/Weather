


import { useState, useEffect } from 'react';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, 
  Eye, Umbrella, Thermometer, Clock, Calendar, Search, MapPin, Sunrise, Sunset,
  ChevronRight, RefreshCcw, AlertTriangle, Moon, BarChart
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState({ hourly: [], daily: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
    country: 'US'
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [view, setView] = useState('hourly');
  const [units, setUnits] = useState('metric');
  const [refreshing, setRefreshing] = useState(false);
  const [tempRange, setTempRange] = useState({ min: 0, max: 0 });

  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'km/h' : 'mph';
  const speedConversion = units === 'metric' ? 1 : 0.621371; // km/h to mph

  useEffect(() => {
    fetchWeatherData();
  }, [location, units]);

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch forecast data from Open Meteo
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,pressure_msl,visibility,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,weather_code,is_day&temperature_unit=${units === 'metric' ? 'celsius' : 'fahrenheit'}&wind_speed_unit=${units === 'metric' ? 'kmh' : 'mph'}&timezone=auto&current_weather=true`;
      
      const forecastRes = await fetch(forecastUrl);
      const forecastData = await forecastRes.json();

      if (!forecastData) {
        throw new Error("Failed to fetch forecast data");
      }

      console.log("Forecast data:", forecastData);
      
      // Process current weather
      const currentWeather = {
        temperature: forecastData.current_weather.temperature,
        weatherCode: forecastData.current_weather.weathercode,
        windSpeed: forecastData.current_weather.windspeed,
        windDirection: forecastData.current_weather.wind_direction,
        isDay: forecastData.current_weather.is_day === 1,
        time: new Date(forecastData.current_weather.time)
      };

      console.log(currentWeather.windSpeed);
      // Get the current hour index to fetch additional data
      const currentTime = new Date(forecastData.current_weather.time);
      const hourlyTimes = forecastData.hourly.time.map(time => new Date(time));
      // console.log(hourlyTimes);
      const currentHourIndex = hourlyTimes.findIndex(time => 
        time.getFullYear() === currentTime.getFullYear() &&
        time.getMonth() === currentTime.getMonth() &&
        time.getDate() === currentTime.getDate() &&
        time.getHours() === currentTime.getHours()
      );

      // Add additional data to current weather
      if (currentHourIndex >= 0) {
        currentWeather.humidity = forecastData.hourly.relative_humidity_2m[currentHourIndex];
        currentWeather.precipitation = forecastData.hourly.precipitation[currentHourIndex];
        currentWeather.precipitationProbability = forecastData.hourly.precipitation_probability[currentHourIndex];
        currentWeather.pressure = forecastData.hourly.pressure_msl[currentHourIndex];
        currentWeather.visibility = forecastData.hourly.visibility[currentHourIndex] / 1000; // m to km
        currentWeather.cloudCover = forecastData.hourly.cloud_cover[currentHourIndex];
      }

      // Create a complete current weather object
      const weather = {
        main: {
          temp: currentWeather.temperature,
          humidity: currentWeather.humidity || 0,
          pressure: currentWeather.pressure || 0,
          feels_like: currentWeather.temperature // approximation, Open Meteo doesn't provide feels_like
        },
        weather: [{
          id: currentWeather.weatherCode,
          main: getWeatherCondition(currentWeather.weatherCode),
          description: getWeatherDescription(currentWeather.weatherCode),
          icon: getWeatherIcon(currentWeather.weatherCode, currentWeather.isDay)
        }],
        wind: {
          speed: currentWeather.windSpeed,
          deg: currentWeather.windDirection
        },
        visibility: (currentWeather.visibility || 10) * 1000, // km to m
        clouds: {
          all: currentWeather.cloudCover || 0
        },
        name: location.name,
        sys: {
          country: location.country,
          sunrise: new Date(forecastData.daily.sunrise[0]).getTime() / 1000,
          sunset: new Date(forecastData.daily.sunset[0]).getTime() / 1000
        }
      };

      setWeather(weather);
      
      // Process hourly forecast (next 24 hours)
      const hourlyData = forecastData.hourly.time.slice(0, 24).map((time, i) => ({
        time: new Date(time).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        temp: forecastData.hourly.temperature_2m[i],
        feels: forecastData.hourly.temperature_2m[i], // approximation
        humidity: forecastData.hourly.relative_humidity_2m[i],
        description: getWeatherCondition(forecastData.hourly.weather_code[i]),
        icon: getWeatherIcon(forecastData.hourly.weather_code[i], forecastData.hourly.is_day[i]),
        weatherCode: forecastData.hourly.weather_code[i],
        pop: forecastData.hourly.precipitation_probability[i] / 100 || 0,
        wind: forecastData.hourly.wind_speed_10m[i],
        pressure: forecastData.hourly.pressure_msl[i]
      }));

      // Get today's min and max temperature
      setTempRange({
        min: forecastData.daily.temperature_2m_min[0],
        max: forecastData.daily.temperature_2m_max[0],
      });
      
      // Process daily forecast
      const dailyData = forecastData.daily.time.map((time, i) => ({
        day: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: forecastData.daily.temperature_2m_max[i],
        low: forecastData.daily.temperature_2m_min[i],
        humidity: 0, // Daily humidity not available in Open Meteo
        weatherCode: forecastData.daily.weather_code[i],
        description: getWeatherCondition(forecastData.daily.weather_code[i]),
        icon: getWeatherIcon(forecastData.daily.weather_code[i], 1), // Use day icon for daily forecast
        pop: forecastData.daily.precipitation_probability_max[i] / 100 || 0,
      }));
      
      setForecast({ 
        hourly: hourlyData.slice(0, 25), 
        daily: dailyData.slice(0, 7) 
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError(`Could not fetch weather data for "${location.name}". Please check the location and try again.`);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchSearchResults(searchInput);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation({
      name: selectedLocation.name,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      country: selectedLocation.country,
    });
    setSearchInput('');
    setShowSearchResults(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWeatherData().finally(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  // Convert Open Meteo weather codes to weather conditions
  const getWeatherCondition = (code) => {
    // Based on WMO weather codes: https://open-meteo.com/en/docs
    if (code === 0) return 'Clear';
    if (code === 1) return 'Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Cloudy';
    if ([45, 48].includes(code)) return 'Fog';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Unknown';
  };

  // Get more detailed weather descriptions
  const getWeatherDescription = (code) => {
    // Based on WMO weather codes
    if (code === 0) return 'clear sky';
    if (code === 1) return 'mainly clear';
    if (code === 2) return 'partly cloudy';
    if (code === 3) return 'overcast';
    if (code === 45) return 'fog';
    if (code === 48) return 'depositing rime fog';
    if (code === 51) return 'light drizzle';
    if (code === 53) return 'moderate drizzle';
    if (code === 55) return 'dense drizzle';
    if (code === 56) return 'light freezing drizzle';
    if (code === 57) return 'dense freezing drizzle';
    if (code === 61) return 'slight rain';
    if (code === 63) return 'moderate rain';
    if (code === 65) return 'heavy rain';
    if (code === 66) return 'light freezing rain';
    if (code === 67) return 'heavy freezing rain';
    if (code === 71) return 'slight snow fall';
    if (code === 73) return 'moderate snow fall';
    if (code === 75) return 'heavy snow fall';
    if (code === 77) return 'snow grains';
    if (code === 80) return 'slight rain showers';
    if (code === 81) return 'moderate rain showers';
    if (code === 82) return 'violent rain showers';
    if (code === 85) return 'slight snow showers';
    if (code === 86) return 'heavy snow showers';
    if (code === 95) return 'thunderstorm';
    if (code === 96) return 'thunderstorm with slight hail';
    if (code === 99) return 'thunderstorm with heavy hail';
    return 'unknown';
  };

  // Get icon code for weather condition
  const getWeatherIcon = (code, isDay) => {
    const day = isDay === 1;
    
    // Clear
    if (code === 0) return day ? 'clear-day' : 'clear-night';
    if (code === 1) return day ? 'partly-cloudy-day' : 'partly-cloudy-night';
    if (code === 2) return day ? 'partly-cloudy-day' : 'partly-cloudy-night';
    if (code === 3) return 'cloudy';
    
    // Fog
    if ([45, 48].includes(code)) return 'fog';
    
    // Drizzle
    if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
    
    // Rain
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
    
    // Snow
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    
    // Thunderstorm
    if ([95, 96, 99].includes(code)) return 'thunderstorm';
    
    return 'cloudy'; // Default
  };

  // Get weather icon component based on condition code
  const getWeatherIconComponent = (condition, isDay) => {
    const iconSize = 24;
    
    switch (condition?.toLowerCase()) {
      case 'thunderstorm':
        return <CloudLightning size={iconSize} className="text-yellow-500" />;
      case 'drizzle':
      case 'rain':
        return <CloudRain size={iconSize} className="text-blue-400" />;
      case 'snow':
        return <CloudSnow size={iconSize} className="text-blue-100" />;
      case 'fog':
        return <CloudFog size={iconSize} className="text-gray-400" />;
      case 'clear':
        return isDay 
          ? <Sun size={iconSize} className="text-yellow-400" />
          : <Moon size={iconSize} className="text-blue-200" />;
      case 'partly cloudy':
        return <Cloud size={iconSize} className="text-gray-400" />;
      case 'cloudy':
        return <Cloud size={iconSize} className="text-gray-400" />;
      default:
        return <Cloud size={iconSize} className="text-gray-400" />;
    }
  };

  // Format timestamp to human-readable time
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calculate percentage for temperature range visualization
  const calculateTempPercentage = (temp, min, max) => {
    if (min === max) return 50; // Default to middle if range is 0
    const range = max - min;
    const position = temp - min;
    return Math.min(100, Math.max(0, (position / range) * 100));
  };

  if (loading && !weather) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-pulse text-xl">Loading weather data...</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-red-400 flex items-center gap-2 p-4 bg-gray-800 rounded-lg">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold">Weather Dashboard</h1>
          {refreshing ? (
            <RefreshCcw size={20} className="ml-3 animate-spin text-blue-400" />
          ) : (
            <RefreshCcw 
              size={20} 
              className="ml-3 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors"
              onClick={handleRefresh}
            />
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex-grow relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.length > 2) {
                      fetchSearchResults(e.target.value);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  placeholder="Search location..."
                  className="bg-gray-800 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1 rounded-md"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div 
                    key={index}
                    className="p-2 hover:bg-gray-700 cursor-pointer flex items-center"
                    onClick={() => handleLocationSelect(result)}
                  >
                    <MapPin size={16} className="mr-2 text-blue-400" />
                    <div>
                      <span className="block">{result.name}</span>
                      <span className="text-xs text-gray-400">
                        {result.admin1 && `${result.admin1}, `}{result.country}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="bg-gray-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="metric">°C</option>
            <option value="imperial">°F</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      
      {weather && (
        <>
          {/* Current Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Main weather card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Current Weather</h2>
                <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="text-6xl mr-6">
                    {getWeatherIconComponent(weather.weather[0].main, weather.weather[0].icon.includes('day'))}
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold">{weather.main.temp}{temperatureUnit}</h3>
                    <p className="text-gray-400 capitalize">{weather.weather[0].description}</p>
                    <p className="text-blue-400 flex items-center gap-1 mt-1">
                      <MapPin size={16} />
                      {weather.name}, {weather.sys.country}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex items-center">
                    <Thermometer size={16} className="mr-2 text-red-400" />
                    <span className="text-sm">Feels: {weather.main.feels_like}{temperatureUnit}</span>
                  </div>
                  <div className="flex items-center">
                    <Wind size={16} className="mr-2 text-blue-300" />
                    <span className="text-sm">{weather.wind.speed} {speedUnit}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets size={16} className="mr-2 text-blue-400" />
                    <span className="text-sm">{weather.main.humidity}%</span>
                  </div>
                  <div className="flex items-center">
                    <Eye size={16} className="mr-2 text-gray-400" />
                    <span className="text-sm">{(weather.visibility / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Min-Max & Sunrise-Sunset */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Today's Range</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Min Temp</span>
                    <span className="font-semibold">{tempRange.min}{temperatureUnit}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" 
                      style={{ width: `${calculateTempPercentage(tempRange.min, tempRange.min - 5, tempRange.max + 5)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Max Temp</span>
                    <span className="font-semibold">{tempRange.max}{temperatureUnit}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" 
                      style={{ width: `${calculateTempPercentage(tempRange.max, tempRange.min - 5, tempRange.max + 5)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Sunrise size={18} className="text-yellow-500 mr-2" />
                      <span>Sunrise</span>
                    </div>
                    <span>{formatTime(weather.sys.sunrise)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center">
                      <Sunset size={18} className="text-orange-400 mr-2" />
                      <span>Sunset</span>
                    </div>
                    <span>{formatTime(weather.sys.sunset)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Weather Details */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Air Conditions</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Umbrella size={18} className="text-blue-400 mr-2" />
                    <span className="text-gray-400">Precipitation</span>
                  </div>
                  <span className="font-semibold">
                    {forecast.hourly[0]?.pop ? (forecast.hourly[0].pop * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart size={18} className="text-purple-400 mr-2" />
                    <span className="text-gray-400">Pressure</span>
                  </div>
                  <span className="font-semibold">{weather.main.pressure} hPa</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets size={18} className="text-blue-400 mr-2" />
                    <span className="text-gray-400">Humidity</span>
                  </div>
                  <span className="font-semibold">{weather.main.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind size={18} className="text-green-400 mr-2" />
                    <span className="text-gray-400">Wind</span>
                  </div>
                  <span className="font-semibold">
                    {weather.wind.speed} {speedUnit} {weather.wind.deg && `(${getWindDirection(weather.wind.deg)})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Toggle & Chart */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Forecast</h2>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  className={`px-4 py-1 rounded-md ${view === 'hourly' ? 'bg-blue-600' : ''}`}
                  onClick={() => setView('hourly')}
                >
                  <Clock size={16} className="inline mr-1" /> Hourly
                </button>
                <button
                  className={`px-4 py-1 rounded-md ${view === 'daily' ? 'bg-blue-600' : ''}`}
                  onClick={() => setView('daily')}
                >
                  <Calendar size={16} className="inline mr-1" /> Daily
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={view === 'hourly' ? forecast.hourly : forecast.daily}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey={view === 'hourly' ? 'time' : 'day'} 
                    stroke="#9CA3AF"
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                    formatter={(value, name) => {
                      if (name.includes('Temperature') || name.includes('Temp')) {
                        return [`${value}${temperatureUnit}`, name];
                      }
                      if (name === 'Humidity (%)') {
                        return [`${value}%`, name];
                      }
                      if (name === 'Wind') {
                        return [`${value} ${speedUnit}`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={view === 'hourly' ? 'temp' : 'high'} 
                    name={`Temperature (${temperatureUnit})`}
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {view === 'daily' && (
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      name={`Min Temp (${temperatureUnit})`}
                      stroke="#60A5FA" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    name="Humidity (%)" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {view === 'hourly' && (
                    <Line 
                      type="monotone" 
                      dataKey="wind" 
                      name={`Wind (${speedUnit})`}
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly/Daily Forecast Cards */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6">{view === 'hourly' ? 'Hourly' : 'Daily'} Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {(view === 'hourly' ? forecast.hourly : forecast.daily).map((item, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-gray-400 mb-1">{view === 'hourly' ? item.time : `${item.day}, ${item.date}`}</p>
                  <div className="text-2xl my-2">
                    {getWeatherIconComponent(item.description, item.icon?.includes('day'))}
                  </div>
                  <p className="font-bold capitalize">
                    {view === 'hourly' 
                      ? `${item.temp}${temperatureUnit}` 
                      : `${item.high}/${item.low}${temperatureUnit}`
                    }
                  </p>
                  <div className="flex items-center justify-center mt-2 text-xs text-blue-300">
                    {item.humidity && (
                      <>
                        <Droplets size={12} className="mr-1" />
                        <span>{typeof item.humidity === 'number' ? item.humidity.toFixed(0) : item.humidity}%</span>
                      </>
                    )}
                    {item.pop > 0 && (
                      <>
                        <Umbrella size={12} className="ml-2 mr-1" />
                        <span>{(item.pop * 100).toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        
        </>
      )}
    </div>
  );
}

// Helper function to convert wind degrees to cardinal direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}