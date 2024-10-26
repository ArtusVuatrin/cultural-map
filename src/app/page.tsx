import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import 'leaflet/dist/leaflet.css';
import Map from '@/components/Map';

const Home: NextPage = () => {
  return (
    <div>
      <Map />
    </div>
  );
};

export default Home;
