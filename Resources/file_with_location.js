//
//	file with location.js
//

function currentLocation(_callback) {
	//make the API call
	Ti.Geolocation.getCurrentPosition(function(e) {
		// do this when you have a position
		if(e.error){
			Ti.API.error('Can not get your current location: ' + e.error);
			
			if (_callback) {
				_callback(null);
			}
			return;
		}

	//	got the location information
	Ti.App.info('got a location', JSON.stringify(e));
	
	//	fire and event containing the location information
	Ti.App.fireEvent('location.updated',e.coords);
	
	if (_callback) {
		_callback(e.coords);
	}
});
}