// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup();


//
// create base UI tab and root window
//

var win1 = Titanium.UI.createWindow({  
    backgroundColor:'#000000',
    barColor: '#999999'
});
var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Introduction',
    window:win1
});

Ti.include('win1.js');
//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({  
    backgroundColor:'#000000',
    barColor: '#999999'
});
var tab2 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Map',
    window:win2
});

Ti.include('win2.js');


var win3 = Titanium.UI.createWindow({  
    backgroundColor:'#000000',
    barColor: '#999999'
});
var tab3 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Record',
    window:win3
});
Ti.include('win3.js');
win3.add(label3);


var win4 = Titanium.UI.createWindow({  
    backgroundColor:'#000000',
    barColor: '#999999'
});
var tab4 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Playback',
    window:win4
});

Ti.include('win4.js');
win4.add(label4);
//
//  add tabs
//
tabGroup.addTab(tab1);  
tabGroup.addTab(tab2);
tabGroup.addTab(tab3);
tabGroup.addTab(tab4);

// open tab group
tabGroup.open();
