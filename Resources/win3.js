//
//	Recording
//
win3.backgroundColor = '#333';

var titleLabel = Titanium.UI.createLabel({
    color:'#333333',
    height:18,
    width:210,
    top:10,
    text:'Record',
    textAlign:'center',
    font:{fontFamily:'Arial',fontSize:20,fontWeight:'bold'},
    shadowColor:'#eee',shadowOffset:{x:0,y:1}
});
win3.setTitleControl(titleLabel);

//	To affect where the POST operation for the PHP page will be executed, change the URL here.
var posturl="http://thematterofmemory.com/thematterofmemory_scripts/uploadaudio.php";

//Creation of a new Directory to store both GPS and audio files. Will check if directory exists.
var newDir = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'mydir');
if (newDir.exists('mydir')){
Titanium.API.info('Directory already exists');
} else {
newDir.createDirectory();
Titanium.API.info('Path to newdir: ' + newDir.nativePath);
};

//
//	Recording Audio Global Identifiers
//

Titanium.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_PLAY_AND_RECORD;
var recording = Ti.Media.createAudioRecorder();
var file;
var sound;
var audioName = 'recording';
var newAudiofile = 'recording.mp4';
var file_recorded = Titanium.Filesystem.getFile(newDir.nativePath, newAudiofile);
upload_audio = file_recorded.read();

// Countdown Timer
var countDown =  function( m , s, fn_tick, fn_end  ) {
	return {
		total_sec:m*60+s,
		timer:this.timer,
		set: function(m,s) {
			this.total_sec = parseInt(m)*60+parseInt(s);
			this.time = {m:m,s:s};
			return this;
		},
		start: function() {
			var self = this;
			this.timer = setInterval( function() {
				if (self.total_sec) {
					self.total_sec--;
					self.time = { m : parseInt(self.total_sec/60), s: (self.total_sec%60) };
					if (self.total_sec < 70 && self.total_sec >= 60){
						self.time = { m : parseInt(self.total_sec/60), s: "0" + (self.total_sec%60) };
					}
					if (self.total_sec < 10) {
						self.time = { m : parseInt(self.total_sec/60), s: "0" + (self.total_sec%60) };
					}
					fn_tick();
				}
				else {
					self.stop();
					fn_end();
				}
				}, 1000 );
			return this;
		},
		stop: function() {
			clearInterval(this.timer)
			this.time = {m:0,s:0};
			this.total_sec = 0;
			return this;
		}
	}
}

var my_timer = new countDown(0,15, 
		function() {
			display_lbl.text = my_timer.time.m+" : "+my_timer.time.s;
		},
		function() {
			alert("The time is up!");
		}
	);

var display_lbl =  Titanium.UI.createLabel({
	text:"2 : 00",
	height:80,
	width:320,
	top:100,
	left:0,
	color:'#fff',
	borderRadius:10,
	backgroundColor:'#000',
	font:{
		fontSize:70,
		fontWeight:'bold'
	},
	textAlign:'center'
});
	my_timer.set(0,15);
	

// default compression is Ti.Media.AUDIO_FORMAT_LINEAR_PCM
// default format is Ti.Media.AUDIO_FILEFORMAT_CAF

// this will give us a wave file with µLaw compression which
// is a generally small size and suitable for telephony recording
// for high end quality, you'll want LINEAR PCM - however, that
// will result in uncompressed audio and will be very large in size

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// In addition, for the "createAudioPlayer()" function to read any audio created through Titanium. It seems	//
// that the audio needs to have ACC - format, and MP4 - fileformat. Otherwise it will NOT read correctly	//
// and return "Parse Errors" within the player. This has been my experience.								//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

recording.compression = Ti.Media.AUDIO_FORMAT_AAC; //Was Ti.Media.AUDIO_FORMAT_ULAW
recording.format = Ti.Media.AUDIO_FILEFORMAT_MP4; //Was Ti.Media.AUDIO_FILEFORMAT_WAVE

//
//	Geolocation Global Identifiers
//
var uploadGPS = '';
var updatedLocation;
var updatedLatitude;
var latitude;
var longitude;
var coordinates = 'coordinates';

/*
Titanium.Geolocation.purpose = "Recieve User Location";
Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;
//	Set Distance filter. This dictates how often an event fires based on the distance the device moves. This value is in meters. 50 meters = 33 feet.
Titanium.Geolocation.distanceFilter = 10;
*/
//	Getting the files - GPS
var gps_recorded = Titanium.Filesystem.getFile(newDir.nativePath, "coordinates.JSON");
//	Loading file into a variable
var uploadGPS = gps_recorded.read();
//Outputting Variable into Titanium GUI for debugging
Titanium.API.info(uploadGPS);

var xhr = Titanium.Network.createHTTPClient();


//	Activity Indicator
var actInd = Titanium.UI.createActivityIndicator({ 
	height:50,
	width:10,
	bottom:10,
	style:Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN
});

//	View to stop anyone from submitting when they are recording
var view = Titanium.UI.createView({
	backgroundColor:'black',
	width: 320,
	height: 480,
	opacity: 0.5,
	bottom:0
});

//	Progress Bar
var progressBar = Titanium.UI.createProgressBar({
	width:250,
	min:0,
	max:1,
	value:0,
	color:'#fff',
	message:'Uploading ... Please Be Patient.',
	font:{fontSize:12, fontWeight:'bold'}
});

//	Timeout Indicators
var firstAlertTO;
var secondAlertTO;
var lastAlertTO;

//
//	Timeout - Functions and alerts
//

var alertB = Ti.UI.createAlertDialog({
		title:'Timelimit',
		message:'You have reached the recording limit.'
});
		
var successDisplay = Ti.UI.createAlertDialog({
		title:'Success', 
		message:'Your audio has been uploaded to the server'
});
		
var lostSignal = Ti.UI.createAlertDialog({
		title:'Connection Lost',
		message:'Check to see that you have a phone signal or Wi-Fi connection.'
});

var lostServer = Ti.UI.createAlertDialog({
		title:'Timed Out',
		message:'There was an issue connecting to the server, please wait and try again.'
});


//
//	HTTPClient "Payload" Global Identifiers
//

var postData = {
	"media": upload_audio, //These need to be in double quotes to be accepted in the PHP script
	//"name": audioName, //These need to be in double quotes to be accepted in the PHP script
	"coords": uploadGPS //These need to be in double quotes to be accepted in the PHP script
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Geolocation is triggered within 10 meters. That location is written onto a writeable directory within Titanium Appcelerator's file structure //
//	and have it saved to then be uploaded whenever.																								 //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

movingLocation(gpsCallback);

function gpsCallback(_coords){
	Ti.API.info(' testing : ' + _coords.latitude);
	var datatoWrite = {
	"latitude":latitude,
	"longitude":longitude
	};
	
	//Data to write?
	var newFile = Titanium.Filesystem.getFile(newDir.nativePath,"coordinates.JSON");
	newFile.write(JSON.stringify(datatoWrite));
}

/*
	Ti.App.addEventListener('setLocationEvent', function(event){
	latitude = event.latitude;
	longitude = event.longitude;

	var datatoWrite = {
	"latitude":latitude,
	"longitude":longitude
	};
			//Data to write?
	var newFile = Titanium.Filesystem.getFile(newDir.nativePath,"coordinates.JSON");
	newFile.write(JSON.stringify(datatoWrite));
});

*/	
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																													  	  //
//	The Following Section are for the Buttons to do one of the following: Record, Playback Recording, Submit to Server	  //
//																													      //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
//	Button - Ready to Record
//

var start = Titanium.UI.createButton({	
	backgroundColor:"#990000",
	borderRadius: 7,
	borderWidth: 1,
	borderColor: "#fff",
	style:'none',
	height:40,
	width:190,
	left:30,
	top:30, // top:60
	title:'Record',
	color:"#fff"
});
win3.add(start);

//
//	Label Title - Ready to Record
//
var describeTitle = Titanium.UI.createLabel({
	text: 'Before Recording:',
	left:30,
	top:70,
	width:300,
	textAlign:'left',
	font:{fontSize:14,fontfamily:'Helvetica Neue'},
	height:'auto',
	color:'#CCC'
});
win3.add(describeTitle);

//
//	Label Body - Ready to Record
//
var describeText = Titanium.UI.createLabel({
	text: 'Why is this place important to you?',
	left:30,
	top:85,
	width:300,
	textAlign:'left',
	font:{fontSize:14,fontfamily:'Helvetica Neue'},
	height:'auto',
	color:'#CCC'
});
win3.add(describeText);

//
//	Label for Modal window - Why is this place important to you?
//

var describeTextModal = Titanium.UI.createLabel({
	text: 'Why is this place important to you?',
	top:180,
	width:300,
	textAlign:'center',
	font:{fontSize:18,fontfamily:'Helvetica Neue'},
	height:'auto',
	color:'#CCC'
});

//
//	Button - Playback Recording
//

var playback = Titanium.UI.createButton({
	backgroundColor:"#00cc33",
	borderRadius: 7,
	borderWidth: 1,
	borderColor: "#fff",
	style: "none",
	height:40,
	width:220,
	top:140,
	left:30,
	title:"Playback Recording",
	color:"fff",
	opacity: 0.2
});

win3.add(playback);

//
//	Label: Playback Body
//
var playbackText = Titanium.UI.createLabel({
	text: 'Playback and listen to your memory before submitting.',
	left:30,
	top:180,
	width:250,
	textAlign:'left',
	font:{fontSize:14,fontfamily:'Helvetica Neue'},
	height:'auto',
	color:'#CCC'
});
win3.add(playbackText);

//
//	Button - Submit Recording
//

var upload = Titanium.UI.createButton({
	backgroundColor:"#0066cc",
	borderRadius: 7,
	borderWidth: 1,
	borderColor: "#fff",
	style: "none",
	height:40,
	width:200,
	top:250,
	left:30,
	title:"Submit Memory",
	color:"#fff",
	opacity: 0.2
});

win3.add(upload);

//
//	Label: Submit Recording Body
//
var submitText = Titanium.UI.createLabel({
	text: 'Submit your memory.',
	left:30,
	top:290,
	width:220,
	textAlign:'left',
	font:{fontSize:14,fontfamily:'Helvetica Neue'},
	height:'auto',
	color:'#CCC'
});
win3.add(submitText);

//
//	Label: Warning about Time limit
//

var timeLimit = Titanium.UI.createLabel({
	text: 'There is a limit of 1 minute for recording time.',
	left:30,
	bottom: 20,
	width:270,
	textAlign:'left',
	font:{fontSize:12,fontfamily:'Helvetica Neue',fontWeight:'bold'},
	height:'auto',
	color:'#fff'
});
win3.add(timeLimit);

//
//	Label: Warning about Time Limit - Modal Window
//
var timeLimitModal = Titanium.UI.createLabel({
	text: 'There is a limit of 1 minute for recording time.',
	bottom:50,
	width:300,
	textAlign:'center',
	font:{fontSize:12,fontfamily:'Helvetica Neue',fontWeight:'bold'},
	height:'auto',
	color:'#fff'
});

function stopRecording(){
	file = recording.stop();
	newAudiofile = Titanium.Filesystem.getFile(newDir.nativePath, 'recording.mp4');
	if (newAudiofile.exists()) {
		newAudiofile.deleteFile();
		newAudiofile.write(file.toBlob);
		} else {
		newAudiofile.write(file.toBlob);
		}
	//startLabel.text = 'Ready to Record';
	Ti.Media.stopMicrophoneMonitor();
}

/////////////////////////////////////////////////////////
//													  //
//	The Following Section are for the Button Events	  //
//												      //
////////////////////////////////////////////////////////

//
//	Button - Ready to Record - Event!
//
start.addEventListener('click', function(){
	if (!Ti.Media.canRecord) {
	Ti.UI.createAlertDialog({
	title:'Error!',
	message:'No audio recording hardware is currently connected.'
	}).show();
	};
	
	if (sound && sound.playing){
		Titanium.UI.createAlertDialog({title:'Preview', message:'You are previewing and can not record at this time.'}).show();
		return;
	} else {
		
	var modal = Ti.UI.createWindow({
		navBarHidden:false,
		backgroundColor:'#333',
		barColor: '#CC0000'
	});
	var done = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.DONE
	});
	modal.setRightNavButton(done);
	modal.add(describeTextModal);
	modal.add(timeLimitModal);
	
	my_timer.set(2,00);
	my_timer.start();
	recording.start();
	Ti.Media.startMicrophoneMonitor();
	duration = 0;
	modal.add(display_lbl);
	
	lastAlertTO = setTimeout(function(){
		alertB.show();
		stopRecording();
		modal.close();
	},180000);
	
	done.addEventListener('click',function()
	{
		my_timer.stop();
		modal.close();
		stopRecording();
		clearTimeout(lastAlertTO);
	});
	
	modal.open({modal:true});
	}
	
});


//
//	Button - Playback Recording - Event!
//
	
playback.addEventListener('click', function(){
if (file == null) 
	{
		Titanium.UI.createAlertDialog({
		title:'Error',
		message:'You need to record something first!'
		}).show();
		return;
	} else {
		if (sound && sound.playing)
		{
			setTimeout(function(){
			tabGroup.animate({bottom:0,duration:500});
			sound.stop();
			sound.release();
			sound = null;
			playbackLabel.text = 'Playback Recording';
			playbackImage.image = '../images/playButtonoff.gif';
		},800);
		} else {
			Ti.API.info("recording file size: "+file.size);
			sound = Titanium.Media.createSound({sound:file});
			sound.addEventListener('complete', function()
				{
				setTimeout(function(){
				tabGroup.animate({bottom:0,duration:500});
				playbackLabel.text = 'Playback Recording';
				playbackImage.image = '../images/playButtonoff.gif';
			},800);
				});
			if(recording.recording){
				Titanium.UI.createAlertDialog({title:'One Moment', message:'You need to complete the recording before previewing.'}).show();
			} else {
			setTimeout(function(){
			tabGroup.animate({bottom:-50, duration:500});
			sound.play();
			playbackLabel.text = 'Stop Playback';
			playbackImage.image = '../images/playButtonon.gif';
		},800);
			}
		}
	}
});

//
//	Function to send to server
//

function sendtoserver() {
//	Create view that will block out the other Table options while sending to the server.
	try {
		var view = Titanium.UI.createView({
			backgroundColor:'black',
			width: 320,
			height: 460,
			opacity: 0.9
			});
		
			win3.add(view);
			//	Activity Indicator
			win3.add(actInd);
			actInd.show();

			//	Progress Bar
			win3.add(progressBar);
			progressBar.show();
			
			tabGroup.animate({bottom:-50, duration:500});
			xhr.onerror = function(e)
			{
				tabGroup.animate({bottom:0,duration:500});
		//	If there is an error in the upload , alert to say "Connection Lost" and restore controls and remove activity indicator
			setTimeout(function(){
				lostServer.show();
				},500);
		
			setTimeout(function(){
				lostServer.hide();
				},3000);
			Titanium.API.info('IN ERROR' + e.error);
			win3.remove(view);
			actInd.hide();
			win3.remove(actInd);
			progressBar.hide();
			progressBar.value = 0;
			win3.remove(progressBar);
		};
	xhr.setTimeout(90000);
	xhr.onload = function(e)
	{
	if (this.status == '404') {
		Ti.API.info('error: http status code ' + this.status);
		tabGroup.animate({bottom:0,duration:500});
		setTimeout(function(){
			lostServer.show(); // was successDisplay.show
			},500);
	
			setTimeout(function(){
				lostServer.hide();
				},3000);
				//	If the upload results in a not found page
		win3.remove(view);
		actInd.hide();
		win3.remove(actInd);
		progressBar.hide();
		progressBar.value = 0;
		win3.remove(progressBar);
		file = null;
	} else {
		Ti.API.info('http status code ' + this.status);
		tabGroup.animate({bottom:0,duration:500});
		setTimeout(function(){
			successDisplay.show();
			},500);
	
			setTimeout(function(){
				successDisplay.hide();
				},3000);
				//	If the upload is successful, alert to say "Success" and restore controls and remove activity indicator
		win3.remove(view);
		actInd.hide();
		win3.remove(actInd);
		progressBar.hide();
		progressBar.value = 0;
		win3.remove(progressBar);
		file = null;
	}
};

xhr.onsendstream = function(e)
{
		progressBar.value = e.progress ;
		Titanium.API.info('ONSENDSTREAM - PROGRESS: ' + e.progress);
};
//	open the client
xhr.open('POST', posturl, false);
xhr.send(postData);

	} catch(e) {
		Ti.API.info("In Error: " + e.error);
		setTimeout(function(){
		lostServer.show();
		},1000);
	
		setTimeout(function(){
		lostServer.hide();
		},3000);
		Titanium.API.info(e.error);
	}

}; // end of Sendtoserver function

//
//	Button - Upload - Event!
//
	
upload.addEventListener('click', function(e){
if (file == null)
	{
		Titanium.UI.createAlertDialog({
		title:'Error',
		message:'You need to record something first!'
		}).show();
		return;
		} else {
			if (sound && sound.playing || recording.recording)
			{
				Titanium.UI.createAlertDialog({title:'To Submit', message:'Make sure to stop recording and stop playback before submitting.'}).show();
					} else if (file != null){
						sendtoserver();
						}
			}
});