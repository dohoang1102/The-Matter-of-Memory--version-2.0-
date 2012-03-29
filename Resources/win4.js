/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																																		   //
//	This javascript file will list any returned coordinates that are within range of the user's Latitude and Longitude. The tabelview	   //
//	will be established and the data will be added as long as the user is within the threshold distance of another 'memory'. Afterwards    //
//	it will display the following information on each row.																				   //
//	**Memory																															   //
//	**Timestamp it was added (returns Datetime from MySQL)																				   //
//	Once it returns these values it will become a button that will start the audioplayer and play the returned audio url associated 	   //
//	with those coordinates as a streaming element. It it important to note that it will not download it, because I want to avoid the 	   //
//	user having the ability to listen to the audio whenever they wish.																	   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

win4.backgroundColor = 'black';

var titleLabel = Titanium.UI.createLabel({
    color:'#333333',
    height:18,
    width:210,
    top:10,
    text:'Playback',
    textAlign:'center',
    font:{fontFamily:'Arial',fontSize:20,fontWeight:'bold'},
    shadowColor:'#eee',shadowOffset:{x:0,y:1}
});
win4.setTitleControl(titleLabel);

movingLocation(gpsCallback);

//	Establishes the Table
var tableData = [];
var CustomData = [];
var tableView = Titanium.UI.createTableView({minRowHeight:60});
win4.add(tableView);

//	Establishes the audio components
var stream_url = [];
var audiourls = [];
var streamPlayer = Ti.Media.createAudioPlayer({
	url: 'http://thematterofmemory.com/',
	allowBackground: true,
	preload:false
});

//	Buttons
var reloadButton;
var stop;

//	Global Variables
var incomingData;
var longitude;
var latitude;
var streamPlayerurl = 'http://thematterofmemory.com/thematterofmemory_scripts/';

//	Activity Indicator
var actInd = Titanium.UI.createActivityIndicator({ 
	height:50,
	width:10,
	style:Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN
});

var labelBuffering = Titanium.UI.createLabel({
	text: 'Depending on your connection status, some audio files might take longer to load than others.',
	height:'auto',
	width:'auto',
	textAlign:'center',
	color:'#fff',
	font:{fontSize:12,fontFamily:"Helvetica Neue"},
	bottom:60
});

var PlaystatusLabel = Titanium.UI.createLabel({
	text: '',
	height:'auto',
	width:'auto',
	textAlign:'center',
	color:'#fff',
	font:{fontSize:16,fontFamily:"Helvetica Neue"},
	bottom:160
});

var ProgressLabel = Titanium.UI.createLabel({
	text: '',
	height:'auto',
	width:'auto',
	textAlign:'center',
	color:'#fff',
	font:{fontSize:16,fontFamily:"Helvetica Neue"},
	bottom:120
});

var StatusLabel = Titanium.UI.createLabel({
	text: '',
	height:'auto',
	width:'auto',
	textAlign:'center',
	color:'#fff',
	font:{fontSize:16,fontFamily:"Helvetica Neue"},
	bottom:170
});

var headphones = Titanium.UI.createImageView({
	image:'../images/headphones.png',
	width:250,
	height:250,
	top:20,
	opacity:0.7
});


//	Alerts
var lostSignal = Ti.UI.createAlertDialog({
		title:'Connection Lost',
		message:'Check to see that you have a phone signal or Wi-Fi connection.'
		});

var lostServer = Ti.UI.createAlertDialog({
		title:'Connection Lost',
		message:'There was an issue connecting to the server, please wait and try again.'
		});

//	Off the top we need to create a connection to the server to make sure if there is any data to be created in the rows. So once the
//	"getCurrentPosition()" fires, it will send a call to the server to get any coordinates that match and if they do, to return the audio
//	url those coordinates are in line with.

/////////////////////////////////////////////////////////////////////////////////////////
//																				  	  //
//	The Following Section are for the Buttons to do one of the following: Reload	  //
//																				      //
////////////////////////////////////////////////////////////////////////////////////////

//
//	Reload Button
//
if (Titanium.Platform.name == 'iPhone OS'){
reloadButton = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.REFRESH,
	right:50
	});
win4.setRightNavButton(reloadButton);
}


//
//	Create Table
//

function displayItems() {
	//	Clear the entire tableView
	tableView.setData([]);
	try {
		for (var i = 0; i < incomingData.length; i++){
			CustomData = incomingData[i];
			Titanium.API.info(CustomData.easytime);
	
	// Create a vertical layout view to hold all the info
		var row = Titanium.UI.createTableViewRow({
			hasChild:true,
			backgroundColor:'#999'
		});
	// Takes easytime data from mySQL database and populates it as a label
		var easyTime = Titanium.UI.createLabel({
			text: CustomData.easytime,
			font: {fontSize:16,fontWeight:'bold'},
			width: 'auto',
			textAlign:'left',
			bottom: 25,
			left:10,
			color:'#fff'
			});
		
		var easyClock = Titanium.UI.createLabel({
			text: CustomData.easyclock,
			font: {fontSize:14,fontWeight:'bold'},
			width: 'auto',
			textAlign:'left',
			top:15,
			left:10,
			color:'#fff'
			});

	//	Declare variable "stream_URL" as an array that when "while loop" continues to fill array with audio URL location
		var stream_url = CustomData.AudioURL;
		var dataTimestamp = CustomData.Timestamp;
		var dataClock = CustomData.easyclock;
		row.add(easyTime);
		row.add(easyClock);
		row.className = 'audiourl';
		row.thisStream = stream_url;
		row.dataTimestamp = dataTimestamp;
		row.dataeasyclock = dataClock;
		//audiourls = CustomData.AudioURL;			
		tableView.appendRow(row,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
		//tableData.push(row);
	}; //end of For loop
	
	} catch(err) {
			setTimeout(function(){
				lostServer.show();
			},1000);
			
			setTimeout(function(){
				lostServer.hide();
			},3000);
			Titanium.API.info(err.error);
		}
		//tableView.setData(tableData);
}; //end of function Display Items


function reloadSend(){
	try{
		reloadButton.hide();
		win4.rightNavButton = null;
	
		//	Activity Indicator
		win4.add(actInd);
		actInd.show();
	
		// Begin the "Get data" request
		setTimeout(function(){
			function gpsCallback(_coords){
			var xhr = Titanium.Network.createHTTPClient();
			xhr.setTimeout(20000);
			var geturl="http://thematterofmemory.com/thematterofmemory_scripts/memorycoordinates.php?latitude=" +  _coords.latitude + "&longitude=" + _coords.longitude;
			xhr.open('GET', geturl, false);
			xhr.onerror = function(e){
		//	When there is an error, remove all links to the server to prevent from crashing
			tableView.setData([]);
		//	Display Error Alert
			Titanium.UI.createAlertDialog({title:'Connection Lost!', message:'Check to see that you have a phone signal or wireless connection.'}).show();
			Titanium.API.info('IN ERROR' + e.error);
		//	Remove all reloading indicators
			actInd.message = null;
			actInd.hide();
			win4.setRightNavButton(reloadButton);
			}; //end onerror
///////////////////////////////////////////////////////////////////
			xhr.onload = function(){
				actInd.message = null;
				actInd.hide();
				Titanium.API.info(this.responseText);
				incomingData = JSON.parse(this.responseText);
				displayItems(incomingData);
				}; //end of onload
			xhr.send();
			Titanium.API.info('Reload Button has been pressed!');
			win4.setRightNavButton(reloadButton);
			} //end of gpsCallback()
		}, 1500); //Time out function will wait 1.5 seconds before executing a request to the server.
	} catch(e) {
			setTimeout(function(){
				lostServer.show();
			},1000);
			
			setTimeout(function(){
				lostServer.hide();
			},3000);
			Titanium.API.info(e.error);
	}
} //	end of reloadSend

//
//	Get Moving Location - This fires within every 30 meters
//

	function gpsCallback(_coords){
	Ti.API.info('Latitude from MemoryPlayback : ' + _coords.latitude);
	Ti.API.info('Longitude from MemoryPlayback : ' + _coords.longitude);
	//	Clear the entire table view
	var timeout = 0;
	
	tableView.setData([]);
	var geturl="http://thematterofmemory.com/thematterofmemory_scripts/memorycoordinates.php?latitude=" + _coords.latitude + "&longitude=" + _coords.longitude;
	// Begin the "Get data" request
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onerror = function(){
			if(timeout%2){
				Titanium.UI.createAlertDialog({title:'Connection Lost', message:'Check to see that you have a phone signal or wireless connection.'}).show();
				return;
			}
			timeout++;
		}; //end of onerror
		xhr.setTimeout(20000);
		xhr.onload = function(){
		Titanium.API.info('this is the this response: ' + this.responseText);
		incomingData = JSON.parse(this.responseText);
		displayItems(incomingData);
		}; //end of onload
		xhr.open('GET', geturl, false);
		xhr.send();
};
if (Titanium.Platform.name == 'iPhone OS'){	
reloadButton.addEventListener('click', reloadSend);
}
//
//	TableView Event Listener
//

tableView.addEventListener('click', function(e){

	Titanium.API.info('item index clicked :'+e.index);
	Ti.API.info("Row object  = "+e.row);
	Ti.API.info('http://thematterofmemory.com/thematterofmemory_scripts/'+e.rowData.thisStream);
	
	//	When table view is hit, create a view that renders the rest of the options visible, but to focus on the buttons bar at the bottom.
	
	//
	//	Done System Button
	//
	var buttonDone = Titanium.UI.createButton({
	    systemButton:Titanium.UI.iPhone.SystemButton.DONE,
		right:50,
		enable: true
		});
	win4.setRightNavButton(buttonDone);
	
	//	Hides the toolbar to prevent people from switching to other tabs to record while playing
	tabGroup.animate({bottom:-50, duration:200});
	
	//	Create view that will block out the other Table options
	var view = Titanium.UI.createView({
		backgroundColor:'black',
		width: 320,
		height: 460,
		opacity: 0.9
		});
	win4.add(view);
	
	//	Activity Indicator
	win4.add(actInd);
	actInd.show();

	win4.add(labelBuffering);
	win4.add(PlaystatusLabel);
	win4.add(ProgressLabel);

	//	Create Stream Player
	try {
	streamPlayer.url = streamPlayerurl + e.rowData.thisStream;
	win4.add(headphones);

	} catch (err) {
		setTimeout(function(){
		lostServer.show();
		},1000);
		setTimeout(function(){
		lostServer.hide();
		},3000);
		Titanium.API.info(err.error);
		Ti.API.info('error ' + err);
		win4.remove(labelBuffering);
		win4.remove(PlaystatusLabel);
		win4.remove(ProgressLabel);
		win4.remove(view);
		win4.setToolbar(null, {animated:true});
		buttonDone.hide();
		win4.rightNavButton = null;
		win4.remove(headphones);
		win4.setRightNavButton(reloadButton);
	}
	
	//	Used to keep the buttons spaced apart equally
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																													  	  //
//	The Following Section are for the Buttons to do one of the following: Pause, Play, Rewind, Done						  //
//																													      //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	//
	//	Add Pause Button
	//
	var pauseButton = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.PAUSE,
		enabled:true
	});
	
	pauseButton.addEventListener('click', function() {
		Titanium.API.info('Clicked Pause Button!');
		streamPlayer.pause();
	});
	
	//
	//	Add Play button
	//
	var playButton = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.PLAY,
		left:30,
		enabled:true
	});
		
	//	
	//	Add Rewind button
	//
	var rewindButton = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.REWIND,
		left:50,
		enabled:true
	});
	
	/////////////////////////////////////////////////////////
	//													  //
	//	The Following Section are for the Button Events	  //
	//												      //
	////////////////////////////////////////////////////////
	
	//	
	//	Play EventListener
	//
	playButton.addEventListener('click', function() {
		Ti.API.info('Clicked Play Button!');
		streamPlayer.start();
		//soundPlayer.play();
		//progressBar.max = soundPlayer.duration;
	});
	
	rewindButton.addEventListener('click', function() {
		Titanium.API.info('Clicked Rewind Button!');
		streamPlayer.stop();
		streamPlayer.start();

	});
	
	//
	//	WHEN 'DONE' BUTTON IS PRESSED
	//
	buttonDone.addEventListener('click', function(){
		setTimeout(function(){
		Titanium.API.info('Pressed Done Button!');
		win4.remove(labelBuffering);
		win4.remove(PlaystatusLabel);
		win4.remove(ProgressLabel);
		win4.remove(view);
		win4.setToolbar(null, {animated:true});
		buttonDone.hide();
		win4.rightNavButton = null;
		win4.remove(headphones);
		win4.setRightNavButton(reloadButton);
		streamPlayer.stop();
		
		tabGroup.animate({bottom:0,duration:500});
		},200);
	});
	
		
	//	This sets the toolbar at the button and locations of where the buttons are
	win4.setToolbar([playButton,flexSpace,pauseButton,flexSpace,rewindButton], {translucent:true});
	
	//	This is all that is needed to show an activity indicator when loading an audio file.
	if(win4.setToolbar){
		win4.remove(actInd);
		actInd.hide();
	}

	
});