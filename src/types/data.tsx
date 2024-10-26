// Define types for city data
type City = {
    city: string;
    lat: number;
    lng: number;
    iso3: string;
    population: number;
    country: string;
    admin_name: string;
  };
  
  type WorldCities = {
    [countryCode: string]: City[];
  };