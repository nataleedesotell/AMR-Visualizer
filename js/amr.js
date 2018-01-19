//GLOBAL VARIABLES

var legend; //set up legend, static SVG for every view of the map
var SQL = new cartodb.SQL({user: 'nrobson', format: 'geojson'});
var polygon;


$( document ).ready(function() {
  //Create the leaflet map
  var map = L.map('map', {
    zoomControl: true,
    center: [44.7844,-89.7879],
    zoom: 7
  });

  var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  //CIPRO 2009 LAYER
  var cipro09 = cartodb.createLayer(map, {user_name: 'nrobson',
                                          type: 'cartodb',
                                          sublayers: [{
                                            sql: 'SELECT * FROM wi_counties_amr_2009',
                                            cartocss: '#layer {' +
                                                'polygon-fill: #CCCCCC;' +
                                                'polygon-opacity: 0.9;' +
                                                '::outline {' +
                                                  'line-color: #FFFFFF;' +
                                                  'line-width: 1;' +
                                                  'line-opacity: 0.5;' +
                                                '}' +
                                              '}' +
                                              '#layer [ cipro09 <= 100] {' +
                                              'polygon-fill: #50B848;' +
                                              '}' +
                                              '#layer [ cipro09 <= 90] {' +
                                              'polygon-fill: #BCDDA1;' +
                                              '}' +
                                              '#layer [ cipro09 <= 80] {' +
                                              'polygon-fill: #F4E6ED;' +
                                              '}' +
                                              '#layer [ cipro09 <= 70] {' +
                                              'polygon-fill: #EDC1DB;' +
                                              '}' +
                                              '#layer [ cipro09 <= 60] {' +
                                              'polygon-fill: #CF3D96;' +
                                              '}' +
                                              '#layer [ cipro09 = 0] {' +
                                              'polygon-fill: #CCCCCC;' +
                                              '}' 
                                          }]
                                         },{ https: true }).addTo(map);
});