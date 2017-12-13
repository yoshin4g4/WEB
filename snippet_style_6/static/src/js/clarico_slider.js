
$(window).load(function(){	  
	 var k=$(window).height();	
	 var header=$("header").height();	 
	 var n1 = k-header;
	
	 $('.slider_back_image').css('height', n1+'px');
	 $('.div_img').css('height', n1+'px');
	 
	 var final=(n1*10)/100;
	 $('.product_image').css('padding-top', final+'px');
	
});
