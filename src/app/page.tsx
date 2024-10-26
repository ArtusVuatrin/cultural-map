import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const Home: NextPage = () => {
  return (
    <div>
      <Map />
    </div>
  );
};

export default Home;
