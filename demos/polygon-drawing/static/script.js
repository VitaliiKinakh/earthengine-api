// Wrap our code in a self-executing anonymous function to isolate scope.
(function() {

  // The client ID from the Google Developers Console.
  var CLIENT_ID = '1089428170757-k1kh33ji91dau7te1fl7bo9qmqdo21ma.apps.googleusercontent.com';

  // The Google Map.
  var map;

  // The Drawing Manager for the Google Map.
  var drawingManager;

  // The Google Map feature for the currently drawn polygon, if any.
  var currentPolygon;

  // The Earth Engine image on the map.
  var image;

  // The scale to use for reduce regions.
  var REDUCTION_SCALE;
  
  // Values for visualisation
  var lat; // lattitude
  var lng; // longitude
  var minValue; // min value for visualisation
  var maxValue; // max value for visualisation

  // Clears the current polygon and cancels any outstanding analysis.
  var clearPolygon = function() {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      currentPolygon = undefined;
    }
    $('.polygon-details .result').empty();
    $('.polygon-details').addClass('hidden');
    drawingManager.setOptions(
        {drawingMode: google.maps.drawing.OverlayType.POLYGON});
  };

  // Sets the current polygon and kicks off an EE analysis.
  var setPolygon = function(newPolygon) {
    clearPolygon();
    currentPolygon = newPolygon;
    $('.polygon-details').removeClass('hidden');
    drawingManager.setOptions({drawingMode: null});
    var eePolygon = ee.Geometry.Polygon(getCoordinates(currentPolygon));
    var mean = image.reduceRegion(
        ee.Reducer.mean(), eePolygon, REDUCTION_SCALE);
    $('.polygon-details .result').text('Loading...');
    mean.getInfo(function(data, error) {
      // Ensure that the polygon hasn't changed since we sent the request.
      if (currentPolygon != newPolygon) return;
      $('.polygon-details .result').text(
          JSON.stringify(data || error, null, ' '));
    });
  };

  // Sets the current polygon and kicks off an EE analysis max.
  var setPolygonMax = function(newPolygon) {
    clearPolygon();
    currentPolygon = newPolygon;
    $('.polygon-details').removeClass('hidden');
    drawingManager.setOptions({drawingMode: null});
    var eePolygon = ee.Geometry.Polygon(getCoordinates(currentPolygon));
    var max = image.reduceRegion(
        ee.Reducer.max(), eePolygon, REDUCTION_SCALE);
    $('.polygon-details .result').text('Loading...');
    max.getInfo(function(data, error) {
      // Ensure that the polygon hasn't changed since we sent the request.
      if (currentPolygon != newPolygon) return;
      $('.polygon-details .result').text(
          JSON.stringify(data || error, null, ' '));
    });
  };
  
  //Sets the current polygon and kicks off an EE analysis min.
   var setPolygonMin = function(newPolygon) {
    clearPolygon();
    currentPolygon = newPolygon;
    $('.polygon-details').removeClass('hidden');
    drawingManager.setOptions({drawingMode: null});
    var eePolygon = ee.Geometry.Polygon(getCoordinates(currentPolygon));
    var min = image.reduceRegion(
        ee.Reducer.min(), eePolygon, REDUCTION_SCALE);
    $('.polygon-details .result').text('Loading...');
    min.getInfo(function(data, error) {
      // Ensure that the polygon hasn't changed since we sent the request.
      if (currentPolygon != newPolygon) return;
      $('.polygon-details .result').text(
          JSON.stringify(data || error, null, ' '));
    });
  };
  
  //Sets the current polygon and kicks off an EE analysis total emmision.
  var setPolygonTotal = function(newPolygon) {
    clearPolygon();
    currentPolygon = newPolygon;
    $('.polygon-details').removeClass('hidden');
    drawingManager.setOptions({drawingMode: null});
    var eePolygon = ee.Geometry.Polygon(getCoordinates(currentPolygon));
    var sum = image.reduceRegion(
        ee.Reducer.sum(), eePolygon, REDUCTION_SCALE);
	//var totalEmission = mean.multiply(numberOfCells);
    $('.polygon-details .result').text('Loading...');
    sum.getInfo(function(data, error) {
      // Ensure that the polygon hasn't changed since we sent the request.
      if (currentPolygon != newPolygon) return;
      $('.polygon-details .result').text(
          JSON.stringify(data || error, null, ' '));
    });
  };
  
  // Extract an array of coordinates for the given polygon.
  var getCoordinates = function(polygon) {
    var points = currentPolygon.getPath().getArray();
    return points.map(function(point) {
      return [point.lng(), point.lat()];
    });
  };
   
  // Main set map function
  var setMap = function(lat, lng, min, max, imageURL, band){
	map.overlayMapTypes.clear();
	map = new google.maps.Map($('.map').get(0), {
		center: { lat: lat,  lng: lng},
		zoom: 6,
		streetViewControl: false
	});
	ee.initialize();
	var img = ee.Image(imageURL);
	image = img.select(band);
	var eeMapConfig = image.getMap({'min': min, 'max': max});
	var eeTileSource = new ee.layers.EarthEngineTileSource(
		'https://earthengine.googleapis.com/map',
		eeMapConfig.mapid, eeMapConfig.token);
	var overlay = new ee.layers.ImageOverlay(eeTileSource);
	drawingManager.setMap(map);
	// Show the EE map on the Google Map.
	map.overlayMapTypes.push(overlay);
  }// end of set map function 

  // Main change function
  $(document).on("click","#submitImage", function(){
		var imageURL = $("#inputImage").val();
		// Change images 
		if(ee.data.getInfo(imageURL))
		{
			// Get image
			var img = ee.Image(imageURL);
			
			// Band names
			var bands = img.bandNames();
			var band = bands.get(0).getInfo();
			
			// Select first band for image 
			img = img.select(band);
			
			// Get coordinates of center
			// Get lattitude
			var latObj = img.geometry().centroid().coordinates().get(0);
			// Get value from centroid 
			latObj.getInfo(function(data, error) {
				lat = parseFloat(JSON.stringify(data));
			});
			
			// Get longitude
			var lngObj = img.geometry().centroid().coordinates().get(1);
			// Get value from centroid
			lngObj.getInfo(function(data, error) {
				lng = parseFloat(JSON.stringify(data));
			});
			
			// Get basic statistic values: min and max
			var max = img.reduceRegion({
				reducer: ee.Reducer.max(),
				geometry: img.geometry(),
				scale: img.projection().nominalScale(),
				maxPixels: 1e9
			}).get(bands.get(0).getInfo());	
			max.getInfo(function(data, error) {
				maxValue = parseFloat(JSON.stringify(data));
			});
			
			var min = img.reduceRegion({
				reducer: ee.Reducer.min(),
				geometry: img.geometry(),
				scale: img.projection().nominalScale(),
				maxPixels: 1e9
			}).get(bands.get(0).getInfo());
			min.getInfo(function(data, error) {
				minValue = parseFloat(JSON.stringify(data));
			});
			// Set redicting scale
			REDUCTION_SCALE = img.projection().nominalScale();
			// Set map
			$(".selectMethod").removeClass("hidden");
			setMap(lng, lat, minValue, maxValue, imageURL, band);
		}else{
			map.overlayMapTypes.clear();
			alert("Error! Try another image!");
		}
	}
  );
  
  // Runs a simple EE analysis and output the results to the web page.
  var loadMap = function() {
	// Create the base Google Map.
	map = new google.maps.Map($('.map').get(0), {
	center: { lat: 0, lng: 0},
    zoom: 7,
    streetViewControl: false
	});

	ee.initialize();
	image = ee.Image(0);
	var eeMapConfig = image.getMap({'min': 0, 'max': 0});
	var eeTileSource = new ee.layers.EarthEngineTileSource(
		'https://earthengine.googleapis.com/map',
		eeMapConfig.mapid, eeMapConfig.token);
	var overlay = new ee.layers.ImageOverlay(eeTileSource);

	// Create a Google Maps Drawing Manager for drawing polygons.
	drawingManager = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.POLYGON,
		drawingControl: false,
		polygonOptions: {
        fillColor: '#ff0000',
        strokeColor: '#ff0000'
		}
	});
	
	//  select function - change text
    $("#alg").change(function(){
	  var str = "";
	  $("#alg option:selected").each(function(){
		  str += $(this).text();
	  });
	  $("#a").text(str);
    });

	// Respond when a new polygon is drawn.
	google.maps.event.addListener(drawingManager, 'overlaycomplete',
		function(event) {
			var v = $("#alg option:checked").val();
			if(v === "mean")
			{
				clearPolygon();
				setPolygon(event.overlay);
			}else 
			if(v === "min")
			{
				clearPolygon();
				setPolygonMin(event.overlay);
			}else 
			if(v === "max")
			{
				clearPolygon();
				setPolygonMax(event.overlay);
			}else
			if(v === "total")
			{
				clearPolygon();
				setPolygonTotal(event.overlay);
			}
		});

	// Clear the current polygon when the user clicks the "Draw new" button.
	$('.polygon-details .draw-new').click(clearPolygon);

	drawingManager.setMap(map);

	// Show the EE map on the Google Map.
	map.overlayMapTypes.push(overlay);
	map.overlayMapTypes.clear();
  }; 

  $(document).ready(function() {
    // Shows a button prompting the user to log in.
    var onImmediateFailed = function() {
      $('.g-sign-in').removeClass('hidden');
      $('.output').text('Please log in to use the app.');
      $('.g-sign-in .button').click(function() {
        ee.data.authenticateViaPopup(function() {
          // If the login succeeds, hide the login button and run the analysis.
          $('.g-sign-in').addClass('hidden');
          loadMap();
        });
      });
    };

    // Attempt to authenticate using existing credentials.
    ee.data.authenticate(CLIENT_ID, loadMap, null, null, onImmediateFailed);
  });
})();
