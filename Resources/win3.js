//
//	Recording
//
win3.backgroundColor = 'black';

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

//	Getting the files - GPS
var gps_recorded = Titanium.Filesystem.getFile(newDir.nativePath, "coordinates.JSON");
//	Loading file into a variable
var uploadGPS = gps_recorded.read();
//Outputting Variable into Titanium GUI for debugging
Titanium.API.info(uploadGPS);

// Begin the network request

var xhr = Titanium.Network.createHTTPClient();