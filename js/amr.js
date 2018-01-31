var sql2;
  var polygon;
  $( document ).ready(function() {
    //Create the leaflet map
    var map = L.map('map', {
      zoomControl: true,
      center: [43.7844,-88.7879],
      zoom: 7
    });
    
    sql2 = new cartodb.SQL({ user: 'nrobson', format: 'geojson' });

    
    
    var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)


//                                             cartocss: '#layer {' +
//                                                 'polygon-fill: #CCCCCC;' +
//                                                 'polygon-opacity: 0.9;' +
//                                                 '::outline {' +
//                                                   'line-color: #FFFFFF;' +
//                                                   'line-width: 1;' +
//                                                   'line-opacity: 0.5;' +
//                                                 '}' +
//                                               '}' +
//                                               '#layer [ cipro09 <= 100] {' +
//                                               'polygon-fill: #50B848;' +
//                                               '}' +
//                                               '#layer [ cipro09 <= 90] {' +
//                                               'polygon-fill: #BCDDA1;' +
//                                               '}' +
//                                               '#layer [ cipro09 <= 80] {' +
//                                               'polygon-fill: #F4E6ED;' +
//                                               '}' +
//                                               '#layer [ cipro09 <= 70] {' +
//                                               'polygon-fill: #EDC1DB;' +
//                                               '}' +
//                                               '#layer [ cipro09 <= 60] {' +
//                                               'polygon-fill: #CF3D96;' +
//                                               '}' +
//                                               '#layer [ cipro09 = 0] {' +
//                                               'polygon-fill: #CCCCCC;' +
//                                               '}' 
//                                           }]
//                                          },{ https: true }).addTo(map);
// });
    
    // Promise for the first layer
    var cipro09 = cartodb.createLayer(map, {
    user_name: 'nrobson',
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
      '#layer [cipro09 <= 100] {' +
        'polygon-fill: #50B848;' +
      '}' +
      '#layer [cipro09 <= 90] {' +
        'polygon-fill: #BCDDA1;' +
      '}' +
      '#layer [cipro09 <= 80] {' +
        'polygon-fill: #F4E6ED;' +
      '}' +
      '#layer [cipro09 <= 70] {' +
        'polygon-fill: #EDC1DB;' +
      '}' +
      '#layer [cipro09 <= 60] {' +
        'polygon-fill: #CF3D96;' +
      '}' +
      '#layer [cipro09 = 0] {' +
        'polygon-fill: #CCCCCC;' +
      '}',
      interactivity: ['cartodb_id', 'year', 'isolates09'],
      layerIndex:1 
    }]
    },{ https: true })
    .addTo(map)
    .done(function(layer) {
      layer.setInteraction(true);
      //layer.bind('featureOver', onPolyOver)
      //layer.bind('featureOut', onPolyOut)
      //layer.bind('featureClick', onPolyClick)
      layer.bind('featureOver',function(e, pos, latlng, data) {
        showFeature(data.cartodb_id)
      });
    })
  
  function onPolyOver(e, latln, pxPos, data, layer){
    console.log(data)
  }
  
  function onPolyOut(e, latln, pxPos, data, layer){
    console.log(data)
  }

  function onPolyClick(e, latln, pxPos, data, layer){
    console.log(data)
  }
  
  function showFeature(cartodb_id) {
    sql2.execute("SELECT the_geom as the_geom from wi_county_bnds WHERE cartodb_id = {{cartodb_id}}", {cartodb_id: cartodb_id} ).done(function(geojson) {
      if (polygon) {
        map.removeLayer(polygon);
      }
      console.log(geojson)
      polygon = L.geoJson(geojson, { 
        style: {
        color: "#000",
        fillColor: "#fff",
        fillOpacity: 0.0,
        weight: 2,
        opacity: 0.65
        }
      }).addTo(map);
    });
  }
  }); // ends on document ready context 
  
  
  //////////////////// Stock code for enabling map queries against CARTO server
  var Map = cdb.core.View.extend({
    initialize: function() {
      //CS: console.log("Map.initialize")
      _.bindAll(this, '_initMap');
      this.filters = this.options.filters;
      this._getVizJson();
      this._bindEvents();
    },

    _getVizJson: function() {
      $.ajax({
      url: 'data.json',
      success: this._initMap,
      error: function() {
        cdb.log.info('problems getting vizjson info, check tools.json url please')
      }
      })
    },

    _initMap: function(data) {
      var self = this;
      cartodb.createVis(this.$el, data.vizjson, {search: true})
      .done(function(vis, layers) {
        self.layers = layers[1];
        self.map = vis.getNativeMap();
        var v = cdb.vis.Overlay.create('search', map.viz, {});
      });
    },

    _bindEvents: function() {
      this.filters.bind('change', this._changeLayerGroup, this);
    },

    _changeLayerGroup: function(layers) {
      var self = this;

      _.each(layers, function(opts, i) {
      var pos = i.split('-')[1];
      var sublayer = self.layers.getSubLayer(pos);

      if (sublayer) {
        sublayer.set(opts);
      }
      });
    }

  })
  //////////////////// More stock code
  var Filters = cdb.core.View.extend({

    initialize: function() {
      //CS: console.log("Filters.initialize")
      _.bindAll(this, 'render');
      this._getActions();
    },

    render: function(data) {
      this.clearSubViews();

      var self = this;

      if (!data.interactions) return false;
      var buttons = data.interactions;

      for (var i = 0, l = buttons.length; i < l; i++) {
      var a = new FiltersItem({ data: buttons[i] });
      a.bind('change', this._triggerChange, this)
      self.addView(a);
      self.$('ul').append(a.render().el);
      }

      return this;
    },

    _triggerChange: function(d) {
      this._setSelectedFilter(d);
      this.trigger('change', d.layers, this);
    },

    _setSelectedFilter: function(d) {
      this.$('ul li a').removeClass('selected');
      this.$('ul li a').each(function(i,a) {
      if ($(a).text() == d.text && $(a).attr('class') == d.className) {
        $(a).addClass('selected')
      }
      })
    },

    _getActions: function() {
      $.ajax({
      url: 'data.json',
      success: this.render,
      error: function() {
        cdb.log.info('oh no!, check your json location or if you are using a web server (Apache?)')
      }
      })
    }
  })
  /////////////////////////////////////////