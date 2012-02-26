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

var label3 = Titanium.UI.createLabel({
	color:'#999',
	text:'Record',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});