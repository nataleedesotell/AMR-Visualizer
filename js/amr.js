var sql2;
  var polygon;
  $( document ).ready(function() {
    //Create the leaflet map
    var map = L.map('map', {
      zoomControl: true,
      center: [43.7844,-88.7879],
      zoom: 7
    });
    
    var info = L.control({ position: 'topleft' });


    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); 
        this.update('2009','Ciprofloxacin');
        return this._div;
    };
    // This part should change based on what the user is viewing
    // Example: "Ciprofloxacin resistance in 2009" or "Levoflovain susceptibility in 2013"
    // method that we will use to update the control based on feature properties passed
    info.update = function (code, title) {
        this._div.innerHTML = Mustache.render('<h4>AMR Viz {{code}} - {{title}}</h4>',{ code:code, title:title });
    };

    info.addTo(map);



    sql2 = new cartodb.SQL({ user: 'nrobson', format: 'geojson' });
    
    var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    var cip09 = cartodb.createLayer(map, {
    user_name: 'nrobson',
    type: 'cartodb',
    sublayers: [{
      sql: 'SELECT * FROM amrviz',
      cartocss: '#layer {' +
        'polygon-fill: #CCCCCC;' +
        'polygon-opacity: 0.9;' +
        '::outline {' +
        'line-color: #FFFFFF;' +
        'line-width: 1;' +
        'line-opacity: 0.5;' +
        '}' +
      '}' +
      '#layer [cip09 <= 100] {' +
        'polygon-fill: #50B848;' +
      '}' +
      '#layer [cip09 <= 90] {' +
        'polygon-fill: #BCDDA1;' +
      '}' +
      '#layer [cip09 <= 80] {' +
        'polygon-fill: #F4E6ED;' +
      '}' +
      '#layer [cip09 <= 70] {' +
        'polygon-fill: #EDC1DB;' +
      '}' +
      '#layer [cip09 <= 60] {' +
        'polygon-fill: #CF3D96;' +
      '}' +
      '#layer [cip09 = 0] {' +
        'polygon-fill: #CCCCCC;' +
      '}',
      interactivity: ['cartodb_id', 'isol09'],
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
    sql2.execute("SELECT * from amrviz WHERE cartodb_id = {{cartodb_id}}", {cartodb_id: cartodb_id} 
    // The below line was used in the previous example, it explicitly calls 
    //for only the_geom (which is the geometry object), thus no other attributes 
    //were returned. Open the console to see the object that is returned, it will 
    //now include all attribute values for the table at the "features" > "0" > "properties" position.
    //The old SQL call... sql2.execute("SELECT SELECT the_geom from wi_county_bnds 
    //WHERE cartodb_id = {{cartodb_id}}", {cartodb_id: cartodb_id}
    
  ).done(function(geojson) {
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
      }).addTo(map).bindPopup("<b>" + geojson.features["0"].properties.cip09 + "% susceptibility </br></b>" + geojson.features["0"].properties.name + " county").openPopup();
    });
  }
  }); // ends on document ready context 

  
  
  // Stock code for enabling map queries against CARTO server
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
  // More stock code
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