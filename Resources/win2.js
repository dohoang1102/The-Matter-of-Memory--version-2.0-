/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	The followin2g script showcases the Map Google API and current position of the user.						  //
//	There is also a listener event that will change the way the map behaves in accordance to					  //
//	the GPS location of the user by shifting the view to their location on "eventListener('location')"			  //
//																												  //
//	The PHP script will update the annotations on the map of the most up to date locations of other recordings.   //
//																												  //
//	Hector Leiva - 2011 - 2012																					  //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
win2.backgroundColor = 'black';
Ti.include('currentLocation.js');

// Global Listener
Ti.App.addEventListener('location.updated', function(coords){
	Ti.API.debug(JSON.stringify(coords));
	Ti.API.info('from Global eventlistener :' + JSON.stringify(coords.longitude));
	var latitude = JSON.stringify(coords.latitude);
	var longitude = JSON.stringify(coords.longitude);
});

Ti.App.addEventListener('current.position', function(coords){
	Ti.API.info('from Global eventlistener & current position longitude: ' + JSON.stringify(coords.longitude));
	Ti.API.info('from Global eventListener & current position latitude : ' + JSON.stringify(coords.latitude));
	var currentLatitude = JSON.stringify(coords.latitude);
	var currentLongitude = JSON.stringify(coords.longitude);
});

var detail_win2 = Titanium.UI.createWindow({
	title:'Map View', 
	backgroundColor:'#999', 
	barColor: '#999999'
});

//	create the label - Introduction
var titleLabel = Titanium.UI.createLabel({
    color:'#333333',
    height:18,
    width:210,
    top:10,
    text:'Map',
    textAlign:'center',
    font:{fontFamily:'Arial',fontSize:20,fontWeight:'bold'},
    shadowColor:'#eee',shadowOffset:{x:0,y:1}
});
win2.setTitleControl(titleLabel);

//
//	Globally Declared Variables
//

//	Variables that are needed to accept the incoming JSON data and create arrays needed to make map annotations
var incomingData;
var recorded = [];
var plotPoints;
var updateAnnotations;
var uploadGPS = '';
var annotations = [];
var myLabels = [];
var title;
var data = [];
var easyClock = [];
var audioURL = [];
var miniMapLatitude = [];
var miniMapLongitude = [];
var streamPlayerurl = 'http://thematterofmemory.com/thematterofmemory_scripts/';
var url = "http://thematterofmemory.com";

//	Activity Indicator
var activityIndicator = Titanium.UI.createActivityIndicator({ 
	color: 'white',
	height:"auto",
	width:"auto",
	message: "Now loading...",
	style:Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN
});

var activityBlackView = Ti.UI.createView({
	color: 'black',
	height: "auto",
	width: "auto"
});

detail_win2.add(activityIndicator);

// Button so user manually refreshes the map for memory locations
/*
var searchButton = Titanium.UI.createButtonBar({
	labels:['Search this area for memory locations'],
	backgroundColor:'#666',
	width:250
});
*/

// Create audio streaming player
// load from remote url
var sound = Titanium.Media.createAudioPlayer({
	url: url,
	allowBackground: true,
	preload:false
});

//
//	BUTTONS FOR STREAMING
//

//
//	PLAY
//
var playButton = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.PLAY,
	left:30,
	enabled:true
	});
playButton.addEventListener('click', function()
{
	sound.start(); //sound.play();

});

//
//	PAUSE
//
var pauseButton = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.PAUSE,
	enabled:true
});
pauseButton.addEventListener('click', function()
{
	sound.pause();
});

//
//	REWIND
//
var rewindButton = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.REWIND,
	left:50,
	enabled:true
});
rewindButton.addEventListener('click', function()
{
	sound.stop();
});

var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

//
//	SOUND EVENTS
//
sound.addEventListener('complete', function()
{
	Titanium.API.info('COMPLETE CALLED');
});
sound.addEventListener('resume', function()
{
	Titanium.API.info('RESUME CALLED');
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
		
//	Start by creating the Map with these current coordinates.
var mapView = Titanium.Map.createView({
    mapType: Titanium.Map.STANDARD_TYPE,
    animate:true,
    regionFit:false,
    userLocation:true,
});

// Create an event where once the map loads or if the region changes, to bring up a search button that will look on the map for near-by annotations. To
// load it from just the map loading would cause too many calls if you are zoomed in - maybe overloading the amount of requests.
mapView.addEventListener('complete', function(e){
	Ti.API.info('mapView completed.');
});

mapView.addEventListener('error', function(e) {
	Ti.API.info('error');
	Ti.API.info(e);
});

/*	Getting a location now is in its own file and it is called by using a function onto the page. 
 *	Below is an example of setting the Map View to run everytime there is a movement on the screen.
 *	There are two functions that call for the location services. This is required or else the function
 *	will only work for one of the calls. That is why there is a gpsCallback & gpsAnnotations function
 *	running at the same time.
 */

movingLocation(gpsCallback);
movingLocation(gpsAnnotations);

// To center the map whenever there is movement from the user. Helpful if the user is travelling at higher speeds, will continue to the center the map.
function gpsCallback(_coords){
	Ti.API.info('win2.js gpsCallback(_coords) function affecting mapView.setLocation({}); Latitude: ' + _coords.latitude + ' Longitude: ' + _coords.longitude);
		mapView.setLocation({
		latitude: _coords.latitude,
		longitude: _coords.longitude,
		animate: true
	});
}

//	This function will run though the 'annotations' array() and remove them from the mapView. Then will set them to an empty array.
function removeAnnotations(){
    for (i=annotations.length-1;i>=0;i--) {
        mapView.removeAnnotation(annotations[i]);
    }
    annotations = [];
}

function gpsAnnotations(_coords){
	removeAnnotations();
	var geturl="http://thematterofmemory.com/thematterofmemory_scripts/memorymappingcoordinates.php?latitude=" + _coords.latitude + "&longitude=" + _coords.longitude;
	Titanium.API.info('Region Changed: ' + geturl);
	
	var xhr = Titanium.Network.createHTTPClient();
	xhr.open('GET', geturl, false);
	xhr.onerror = function()
		{
			Ti.API.info('There was an error trying to connect to the server.')
				};
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Upon getting a server response, the function will make that response equal to an array and run through the array until the response is empty.	 //
	//	For each latitude and longitude value that is returned from the server, they will be a latitude and longitude value to set for the annotations.	 //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	xhr.onload = function(){
	Titanium.API.info('From win2.js & The Matter of Memory.com: ' + this.responseText);
	incomingData = JSON.parse(this.responseText);
	displayItems(incomingData);
	for (var i = 0; i < incomingData.length; i++){
	recorded = incomingData[i];
		plotPoints = Titanium.Map.createAnnotation({
		latitude: recorded.Latitude,
		longitude: recorded.Longitude,
		miniMapLatitude: recorded.Latitude,
		miniMapLongitude: recorded.Longitude,
		title: 'Memory',
		subtitle: 'Click to listen',
		date: recorded.easytime,
		easyClock: recorded.easyclock,
		audioURL: recorded.AudioURL,
		rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE,
		animate:true
		});
	plotPoints.pincolor = Titanium.Map.ANNOTATION_GREEN;
	mapView.addAnnotation(plotPoints);
	annotations.push(plotPoints);
		}; // end of for loop
		
	//Ti.API.info('clock label: ' + recorded.easyclock);
	
	var positionLeft = 10;
		
   	dateLabel = Titanium.UI.createLabel({
    text: title,
    color:'#ffffff',
    height: 'auto',
    width: 'auto',
    font:{fontFamily:'Arial',fontSize:20,fontWeight:'bold'},
    top: '5%',
    left: positionLeft,
    textAlign: 'TEXT_ALIGNMENT_LEFT'
    });
    
    clockLabel = Titanium.UI.createLabel({
    text: title,
    color:'#ffffff',
    height: 'auto',
 	font:{fontFamily:'Arial',fontSize:'25%',fontWeight:'bold'},
    top: '17%',
    left: positionLeft,
    textAlign: 'TEXT_ALIGNMENT_LEFT'
    });
    
	}; // end of xhr.onload()

	xhr.send();
};

//	This is needed for the error within Titanium Mobile that when removeing the 'regionChanged' event listener. It will freeze the map.
//mapView.addEventListener('singletap', function(){
//	searching();
//});

mapView.addEventListener('click', function(e) {
    if (e.clicksource == 'rightButton') {
    Ti.API.info('mapView was clicked');

	//calls the 'date' array from when the annotations was being created and will substitute the 'text' field
	//within the 'dateLabel'. It will be replaced everytime without overlap.
	dateLabel.text = e.annotation.date;
	clockLabel.text = e.annotation.easyClock;

	//	Create Stream Player
	sound.url = streamPlayerurl + e.annotation.audioURL;
    
    //the window adds the date.
    detail_win2.add(dateLabel);
    detail_win2.add(clockLabel);
    
    detail_win2.setToolbar([playButton,flexSpace,pauseButton,flexSpace,rewindButton], {translucent:true});

	var miniPlotPoints = Titanium.Map.createAnnotation({
	latitude: e.annotation.latitude,
	longitude: e.annotation.longitude,
	title: 'Memory',
	animate:true
	});
	
	miniPlotPoints.pincolor = Titanium.Map.ANNOTATION_GREEN;

	var mapMiniView = Ti.Map.createView({
	bottom: '13%',
	height: '50%',
	width: '98%',
	userLocation: false,
	mapType: Ti.Map.STANDARD_TYPE,
	animate: false,
	regionFit: true,
	borderColor: 'black',
	borderWidth: 3,
	region: {latitude: e.annotation.miniMapLatitude, longitude: e.annotation.miniMapLongitude, latitudeDelta: 0.0001, longitudeDelta: 0.0001}
	});
	
	mapMiniView.addAnnotation(miniPlotPoints);
	detail_win2.add(mapMiniView);

	tabGroup.activeTab.open(detail_win2,{animated:true})
    }
});

detail_win2.addEventListener('close', function()
{
	detail_win2.remove(dateLabel);
	detail_win2.remove(clockLabel);
	sound.stop();
	Ti.API.info('detail_win2 has closed.');
});

sound.addEventListener('change',function(e)
{
    Ti.API.info('State: ' + e.description + ' (' + e.state + ')');
    if (e.description == 'waiting_for_data'){
		activityIndicator.show();
    	Ti.API.info('Waiting for data.');
    } else {
    	activityIndicator.hide();
    }
});

//searchButton.addEventListener('click', region_changing);
win2.add(mapView);
win2.add(activityIndicator);
//win2.setToolbar([flexSpace,searchButton,flexSpace]);

Ti.App.addEventListener('pause', function(e) {
    // app is paused during phone call, so pause the stream
    sound.setPaused(true);
    // you could also use streamer.pause()
});

Ti.App.addEventListener('resume', function(e) {
    // app resumes when call ends, so un-pause the stream
    sound.setPaused(false);
    // or use streamer.start()
});