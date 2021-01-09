
export const displayMap = locations => {

    mapboxgl.accessToken = 'pk.eyJ1IjoicGFyaWNoYXlwYWkiLCJhIjoiY2tqZ29xMXlpM3d6cDJ4bnY2aGRzNmp4OCJ9.Db1D_cBQXn9wwny7yrDyzw';
    
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/parichaypai/ckjgp95r4739j19mmw5p4nmyj',
        scrollZoom: false
        // center: [-118.113491, 34.111745],
        // zoom: 4,
        // interaction: false
    }); 
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        // Create Marker
        const ele = document.createElement('div');
        ele.className = 'marker';
        
        // Add Marker
        new mapboxgl.Marker({
            element: ele,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        
        // Add a popup
        new mapboxgl.Popup({
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);
        
        // Extends map bounds, includes current locations
        bounds.extend(loc.coordinates);
    });
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    })
}