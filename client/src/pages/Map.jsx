import React from 'react';

const Map = () => {
  return (
    <div className="w-screen h-screen">
      <iframe
        title="Windy Map"
        className="w-full h-full border-none"
        src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=wind&product=&level=surface&lat=17.384&lon=78.458"
        frameBorder="0"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default Map;
