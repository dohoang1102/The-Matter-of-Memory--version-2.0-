/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	The followin2g script showcases the Map Google API and current position of the user.							  //
//	There is also a listener event that will change the way the map behaves in accordance to					  //
//	the GPS location of the user by shifting the view to their location on "eventListener('location')"			  //
//																												  //
//	The PHP script will update the annotations on the map of the most up to date locations of other recordings.   //
//																												  //
//	Hector Leiva - 2012																							  //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
//	Globally Declared Variables
//

//	The coordinate variables that will constantly change throughout eventlisteners inside the script
var latitude;
var longitude;
//	These are the global variables are to calculate the region changes
var regionLatitude;
var regionLongitude;

//	Variables that are needed to accept the incoming JSON data and create arrays needed to make map annotations
var incomingData;
var recorded = [];
var plotPoints;
var updateAnnotations;
var uploadGPS = '';
var annotations = [];

//	Activity Indicator
var actInd = Titanium.UI.createActivityIndicator({ 
	height:50,
	width:10,
	style:Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN
});

// Button so user manually refreshes the map for memory locations
var searchButton = Titanium.UI.createButtonBar({
	labels:['Search this area for memory locations'],
	backgroundColor:'#666',
	width:250
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

//	Alerts
var lostSignal = Ti.UI.createAlertDialog({
		title:'Connection Lost',
		message:'Check to see that you have a phone signal or Wi-Fi connection.'
		});

var lostServer = Ti.UI.createAlertDialog({
		title:'Timed Out',
		message:'There was an issue connecting to the server, please wait and try again.'
		});
		
//
//	Begin Geo Location
//

Titanium.Geolocation.purpose = "Recieve User Location";
Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;
//	Set Distance filter. This dictates how often an event fires based on the distance the device moves. This value is in meters. 10 meters = 33 feet.
Titanium.Geolocation.distanceFilter = 10;

//	Start by creating the Map with these current coordinates.
var mapView = Titanium.Map.createView({
    mapType: Titanium.Map.STANDARD_TYPE,
    animate:true,
    region: {latitudeDelta:0.1, longitudeDelta:0.1}, //latitude:39.30109620906199 longitude:-76.60234451293945
    regionFit:true,
    userLocation:true,
    visible: true
});

//
//  SHOW CUSTOM ALERT IF DEVICE HAS GEO TURNED OFF
//

if (Titanium.Geolocation.locationServicesEnabled)
{
	Ti.Geolocation.purpose = 'Get Current Location';
	Ti.Geolocation.addEventListener('location', function(e) {
		if (e.error) {
			Ti.API.error('Can not get your current location: ' + e.error);
		} else {
			Ti.API.info(e.coords);
			Ti.App.info('got your location', JSON.stringify(e));
			Ti.App.fireEvent('location.updated', e.coords);
		}
	});
	} else {
	Titanium.UI.createAlertDialog({title:'Geolocation Off', message:'Your device has location services turned off - please turn it on.'}).show();
}; //end of Alert to see if you have geolocaiton turned on.

///////////////////////////////////////////////////////////////////////

//
//	If location changes within 30m in any direction. Grab current coordinates, send HTTPClient request to server and redraw Map Annotations, update Map with annotations.
//

var geo_listener = function(e){
try {
	//	With the Geolocation triggered from a change in 100 meters, Geolocation will find out the user's coordinates and set them to the global variables.
		latitude = e.coords.latitude; 
		longitude = e.coords.longitude;
	//	This variable will be set to react to the new region. This includes the updated Latitude and Longitude coordinate of the user and to 'animate' to the new location.
	//	The delta values will affect how 'zoomed' the map will reset itself for the user.
		mapView.setLocation({
		latitude: latitude,
		longitude: longitude,
		animate: true
		});
	
		Ti.App.fireEvent('setLocationEvent', {
		latitude: latitude,
		longitude: longitude
		});
	} catch (err) {
		setTimeout(function(){
		lostServer.show();
		},2000);
		setTimeout(function(){
		lostServer.hide();
		},5000);
	}
};

Titanium.Geolocation.addEventListener('location', geo_listener);


//	This function will run though the 'annotations' array() and remove them from the mapView. Then will set them to an empty array.
function removeAnnotations(){
    for (i=annotations.length-1;i>=0;i--) {
        mapView.removeAnnotation(annotations[i]);
    }
    annotations = [];
}

var searching = function(e) {
	regionLatitude = e.latitude;
	regionLongitude = e.longitude;
	Ti.API.info("latitude from regionChanged : " + regionLatitude);
	Ti.API.info("longitude from regionChanged : "+ regionLongitude);
	win2.setToolbar([flexSpace,searchButton,flexSpace]);
};

var region_changing = function(){	
	Ti.API.info('from region_changing latitude :' + regionLatitude);
	Ti.API.info('from region_changing longitude :' + regionLongitude);
	var timeout = 0;
	
	//	Create view that will block out the other Table options
	var view = Titanium.UI.createView({
		backgroundColor:'black',
		width: 320,
		height: 460,
		opacity: 0.9
		});
	win2.add(view);
	
	win2.add(actInd);
	actInd.show();
	win2.setToolbar(null,{animated:true});
	//	Remove any previously set up annotations
	removeAnnotations();
	//	Contact server
	var geturl="http://thematterofmemory.com/thematterofmemory_scripts/mappingcoordinates.php?latitude=" + regionLatitude + "&longitude=" + regionLongitude;
	Titanium.API.info('Region Changed: ' + geturl);
	
	var xhr = Titanium.Network.createHTTPClient();
	xhr.open('GET', geturl, false);
	xhr.onerror = function()
		{
			win2.remove(actInd);
			actInd.hide();
			win2.remove(view);
			//win2.setToolbar([flexSpace,searchButton,flexSpace]);
		if (timeout%2)
		{
			setTimeout(function(){
				lostSignal.show();
			},3000);
			
			setTimeout(function(){
				lostSignal.hide();
			},7000);
			
		Titanium.API.info('IN ERROR' + e.error);
		return;
		}
		timeout++;
				};
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Upon getting a server response, the function will make that response equal to an array and run through the array until the response is empty.	 //
	//	For each latitude and longitude value that is returned from the server, they will be a latitude and longitude value to set for the annotations.	 //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	xhr.onload = function(){
		win2.remove(actInd);
		actInd.hide();
		win2.remove(view);
		win2.setToolbar([flexSpace,searchButton,flexSpace]);	
	Titanium.API.info('From Map_view.js & The Matter of Memory.com: ' + this.responseText);
	incomingData = JSON.parse(this.responseText);
	for (var i = 0; i < incomingData.length; i++){
	recorded = incomingData[i];
		plotPoints = Titanium.Map.createAnnotation({
		latitude: recorded.Latitude,
		longitude: recorded.Longitude,
		title: 'Memory',
		animate:true
		});
		plotPoints.pincolor = Titanium.Map.ANNOTATION_GREEN;
	
	mapView.addAnnotation(plotPoints);
	annotations.push(plotPoints);
		}; // end of for loop
	}; // end of xhr.onload()

	xhr.send();
	};

//	This is needed for the error within Titanium Mobile that when removeing the 'regionChanged' event listener. It will freeze the map.
mapView.addEventListener('singletap', function(){
	searching();
});

searchButton.addEventListener('click', region_changing);

win2.add(mapView);
//win2.setToolbar([flexSpace,searchButton,flexSpace]);

//
//	This Geolocation function will only fire the first time the App is opened, afterwards the other eventlistener will handle the updates.
//
Titanium.Geolocation.getCurrentPosition(function(e){
	regionLatitude = e.coords.latitude;
	regionLongitude = e.coords.longitude;
	//region_changing();
	});