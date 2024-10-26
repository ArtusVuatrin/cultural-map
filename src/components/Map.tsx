'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L, { LatLngBounds, GeoJSON } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ArtContentTab from './ArtContentTab';

export default function Map() {
  const [worldCities, setWorldCities] = useState<WorldCities>({});
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autocompleteResults, setAutocompleteResults] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [activeTab, setActiveTab] = useState<'Region' | 'Country' | 'City'>('Region');
  const [activeSubTab, setActiveSubTab] = useState<'Books' | 'Movies' | 'Art'>('Books');

  const mapRef = useRef<L.Map | null>(null);
  const cityMarkersRef = useRef<L.Marker[]>([]);

  const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const blueIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    // Fetch city data
    fetch('/worldcities.json')
      .then((response) => response.json())
      .then((data: WorldCities) => setWorldCities(data))
      .catch((error) => console.error('Error loading city data:', error));

    // Fetch country GeoJSON data
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error('Error loading geojson data:', error));
  }, []);

  // Function to show cities based on country code and bounds
  const showCitiesInBounds = (countryCode: string, bounds: LatLngBounds, map: L.Map) => {
    if (!worldCities[countryCode]) return;
  
    // Remove all previous markers
    cityMarkersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    cityMarkersRef.current = []; // Clear the reference array
  
    const cities = worldCities[countryCode];
    const topCities = cities.filter(city => 
      bounds.contains([city.lat, city.lng])
    ).slice(0, 10);
  
    topCities.forEach((city: City) => {
      const marker = L.marker([city.lat, city.lng], {
        icon: selectedMarker && selectedMarker.getLatLng().equals([city.lat, city.lng]) ? redIcon : blueIcon,
      }).addTo(map);
  
      // Immediately add marker to cityMarkersRef after adding to the map
      cityMarkersRef.current.push(marker);
  
      // Set up the click event for each marker
      marker.on('click', () => {
        map.setView([city.lat, city.lng], Math.max(10, map.getZoom()));
        setSelectedMarker(marker);
        setSelectedCity(city);
  
        // Update info box with city details
        const infoBox = document.getElementById('info-box');
        if (infoBox) {
          infoBox.innerHTML = `<b>${city.city}</b><br>Population: ${city.population}<br><b>Region</b>: ${city.admin_name}<br><b>Country</b>: ${city.country}`;
        }
      });
      const p = new L.Popup({ autoClose: false, closeOnClick: false, closeButton: false })
                .setContent(city.city)
                .setLatLng([city.lat, city.lng]);
      marker.bindPopup(p).addTo(map);
      if (marker && map.hasLayer(marker)) {
        marker.on('mouseover', function (e) {
          if (marker && marker.getPopup()) 
            marker.openPopup();
        });
        marker.on('mouseout', function (e) {
          if (marker && marker.getPopup()) 
            marker.closePopup();
        });
      }
    });
  };

  const handleCountryClick = (feature: any, layer: any, map: L.Map) => {
    const countryName = feature.properties.name;
    const countryCode = feature.id;  // Assuming the GeoJSON uses ISO country codes (e.g., "JP" for Japan)
    const infoBox = document.getElementById('info-box');
    if (infoBox) {
      infoBox.innerHTML = "You selected: " + countryName;
    }
    // Zoom to the country bounds
    map.fitBounds(layer.getBounds());
    // Set the selected country code
    setSelectedCountryCode(countryCode);
    // Display cities for the selected country within the bounds
    showCitiesInBounds(countryCode, map.getBounds(), map);
  };

  // Custom component to handle the country click and map interaction
  const MapWithGeoJSON = () => {
    const map = useMap();
    mapRef.current = map;

    useEffect(() => {
      if (geoJsonData) {
        const countriesLayer = new GeoJSON(geoJsonData, {
          style: {
            weight: 2,
            opacity: 1,
            fillOpacity: 0,
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', () => handleCountryClick(feature, layer, map));
          },
        });

        countriesLayer.addTo(map);
      }
    }, [geoJsonData, map]);

    return null;
  };

  // Handle map movement and recompute city markers when the map moves
  const RecomputeCitiesOnMove = () => {
    const map = useMap();

    useMapEvent('moveend', () => {
      if (selectedCountryCode) {
        showCitiesInBounds(selectedCountryCode, map.getBounds(), map);
      }
    });

    return null;
  };

  // Search functionality
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      const results = Object.values(worldCities).flat().filter((city: City) =>
        city.city.toLowerCase().includes(query) || 
        city.admin_name.toLowerCase().includes(query) 
      );
      setAutocompleteResults(results);
    } else {
      setAutocompleteResults([]);
    }
  };

  const handleResultClick = (city: City) => {
    if (mapRef.current) {
      setSearchQuery(city.city);
      setAutocompleteResults([]);
      handleCountryClick({ id: city.iso3, properties: { name: city.country } }, mapRef.current, mapRef.current);
      mapRef.current.setView([city.lat, city.lng], 12);
      showCitiesInBounds(city.iso3, mapRef.current.getBounds(), mapRef.current);
        
      const searchedCityMarker = cityMarkersRef.current.find(marker => marker.getLatLng().equals([city.lat, city.lng]))
      if (searchedCityMarker) {
        setSelectedMarker(searchedCityMarker);
        setSelectedCity(city);
        setTimeout(function (){
            searchedCityMarker.fire('click');
        }, 300);
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
    {/* Map Section (30% width) */}
    <div style={{ flex: '0 0 30%', position: 'relative' }}>
      <div id="info-box" style={{ position: 'absolute', top: '150px', left: '10px', zIndex: 1000, backgroundColor: 'white', color:'black', padding: '10px', border: '1px solid black' }}>
        Click on a country to display its main cities and zoom in.
      </div>

      <MapContainer style={{ height: '100vh', width: '100%' }} center={[20, 0]} zoom={2}>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={handleSearch} 
          placeholder="Search for a city or country" 
          style={{ position: 'absolute', top: '110px', left: '10px', zIndex: 1000, width: '250px', padding: '5px', backgroundColor: 'white', color:'black', border: '1px solid black' }} 
        />

        {autocompleteResults.length > 0 && (
          <div id="autocomplete-results" style={{ position: 'absolute', top: '140px', left: '10px', zIndex: 1001,color:'black', backgroundColor: 'white', border: '1px solid black', maxHeight: '200px', overflowY: 'auto' }}>
            {autocompleteResults.map((city, index) => (
              <div 
                key={index} 
                onClick={() => handleResultClick(city)} 
                style={{ padding: '5px', color:'black', cursor: 'pointer', borderBottom: '1px solid black' }}
              >
                {city.city}, ({city.admin_name}), {city.country}

              </div>
            ))}
          </div>
        )}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapWithGeoJSON />
        <RecomputeCitiesOnMove />
      </MapContainer>
    </div>

      {/* Modal Section (70% width) */}
    <div style={{ flex: '1', backgroundColor: '#f0f0f0', color:'black', padding: '20px' }}>
      {/* Main Tabs */}
      <div>
        <button onClick={() => setActiveTab('Region')} style={{ marginRight: '10px' }}>Region</button>
        <button onClick={() => setActiveTab('Country')} style={{ marginRight: '10px' }}>Country</button>
        <button onClick={() => setActiveTab('City')}>City</button>
      </div>

      {/* Sub Tabs */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setActiveSubTab('Books')} style={{ marginRight: '10px' }}>Books</button>
        <button onClick={() => setActiveSubTab('Movies')} style={{ marginRight: '10px' }}>Movies</button>
        <button onClick={() => setActiveSubTab('Art')}>Art</button>
      </div>

      {/* Content Display Based on Active Tab */}
      <div style={{ marginTop: '20px' }}>
        { selectedCountryCode &&
          <ArtContentTab activeTab={activeTab} activeSubTab={activeSubTab} selectedCity={selectedCity} />
        }
      </div>
    </div>
  </div>
  );
}