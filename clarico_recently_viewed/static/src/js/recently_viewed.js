$(document).ready(function(){
	$('.owl-carousel.recentbx').owlCarousel({
	 
		loop:false,
	    margin:10,
	    nav:true,
	    autoplay:true,
	    autoplayTimeout:3000,
	    autoplayHoverPause:true,
	    
	    responsive:{
	        0:{
	            items:1
	        },
	        500:{
	            items:2
	        },
	        800:{
	        	items:3
	        },
	        1000:{
	            items:4
	        }
	    }
  });
	
});
	
