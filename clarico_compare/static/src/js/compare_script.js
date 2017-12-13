odoo.define('clarico_compare.wish', function(require) {
	"use strict";
	require('web.dom_ready');
	var base = require('web_editor.base');
	var ajax = require('web.ajax');
	var utils = require('web.utils');
	var core = require('web.core');
	var _t = core._t;
	var url=""
		
	
	$(".wish_icon_wrap[disabled]").each(function(){
		$(this).find("i").removeClass("fa fa-heart-o").addClass("fa fa-heart inwish")
	})
	$(".wish_icon_wrap,.disabled").click(function(){
		$(this).find("i").removeClass("fa fa-heart-o").addClass("fa fa-heart inwish")
	})
	
})


$(window).load(function(){
	var compare_count_span = $(".compare-count-span").html();
	
	if(compare_count_span > 3){
		$('.compare_slider_main > .owl-carousel').owlCarousel({
			loop:true,
			margin:10,
		    nav:true,
		    autoplay:false,
		    autoplayTimeout:3000,
		    autoplayHoverPause:true,
		    responsiveClass:true,
		    
		    responsive:{
		        0:{
		            items:1
		        },
		        700:{
		            items:2
		        },
		        1000:{
		            items:3
		        }
		    }
		  });
	}else{
		if ($(window).width() > 800) {
			$(".owl-carousel").css("display","block");
			$(".compare_main").addClass("non-carousel");
		}else{
			$(".compare_main").removeClass("non-carousel");
			$('.compare_slider_main > .owl-carousel').owlCarousel({
				loop:true,
				margin:10,
			    nav:true,
			    autoplay:false,
			    autoplayTimeout:3000,
			    autoplayHoverPause:true,
			    responsiveClass:true,
			    
			    responsive:{
			        0:{
			            items:1
			        },
			        700:{
			            items:2
			        },
			        1000:{
			            items:3
			        }
			    }
			  });
		}
		
	}
})
