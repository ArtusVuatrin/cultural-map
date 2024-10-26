import 'leaflet/dist/leaflet.css';

export default function ArtContentTab( 
    {activeTab, 
     activeSubTab, 
     selectedCity}: 
    {
        activeTab: string;
        activeSubTab: string;
        selectedCity: City|null;} 
    ) {
    return ( selectedCity === null ? <div>Please select a city or country</div> :
        <div>
            Test {activeTab}, {activeSubTab}, <br />
            City : {selectedCity.city} <br />
            Region : {selectedCity.admin_name} <br />
            Country : {selectedCity.country} <br />
        </div>
    );
}
