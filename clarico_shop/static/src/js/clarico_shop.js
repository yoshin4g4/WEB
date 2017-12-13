$(document).ready(function(){ 
	//Hover on product
	if ($(window).width() > 1000) {
		$(".itemscope-main").mouseenter(function(){
		    $(this).children(".product-des").css("display", "block");
		    $(this).children(".oe_product_image").css({"opacity":"0.2","transition":"1s"});
		    $(this).children(".product-des").addClass("right-animation");
		});
		$(".itemscope-main").mouseleave(function(){
			$(this).children(".product-des").css("display", "none");
		    $(this).children(".oe_product_image").css("opacity","1");
		    $(this).children(".product-des").removeClass("right-animation").css('transition','2s');
		});
	
	}
	
	// for show tab
	var p_c=$(".p_Count").attr("data-id");
	if(p_c<20)
	{  
		$(".filter-show").addClass("show_inactive")
	}
	$(".ppg_show").click(function()
	{
		var show_ppg=$(this).attr("data-id");
		var url =document.URL
		if((url.indexOf("ppg=16") >= 0))
		{
				var url = url.replace("ppg=16", "");
		}
		else if((url.indexOf("ppg=20") >= 0))
		{
				var url = url.replace("ppg=20", "");
		}
		if (url.indexOf('?') == -1)
			window.location.href = url+"?ppg="+show_ppg;
		if (!(url.indexOf('?') == -1))
			window.location.href = url+"&ppg="+show_ppg;
	});

	//Push toggle for filter option
	$('.menu-filter').click(function(){
		$("#products_grid_before").css({"width":"300px","transition":"0.5s"});
		$("#wrapwrap").css({"margin-left":"300px","transition":"0.5s"});
		$('body').css("overflow-x","hidden");
		$(".main-header-maxW").addClass("transparent");
		$('.header_btn_style').css('opacity','0.1 !important');
	});
	$('.mobile-view-filter-close-btn').click(function(){
		$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
		$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
		$(".main-header-maxW").removeClass("transparent");
		$('.header_btn_style').css('opacity','1');
	});
	
	// Breadcrumb in category page
	$( ".all-category-div ul li" ).each(function() {
		var current_li= $(this);
		if ( current_li.hasClass( "active" ) ) {
			/*var c = current_li.find("a:first-child");*/
			var c = current_li.find("a");
			if(c.html() == "All Products"){
				$(".select-nevigation-home").html("Home");
			}
			else{
				$(".select-nevigation-home").html("Home");
				$(".select-nevigation-span").html("/");
				$(".select-nevigation-child").html(c.html());
			}
	    }
	});
	
	/* changing the sequence of clikcked checkbox of attribute to first level*/
	$("form.js_attributes input:checked").each(function(){ 
		var self=$(this)        	
		var curr_parent=self.parent();        	
		var curr_att=curr_parent.find("label"); 
		var curr_main_parent = $(curr_att).closest("ul");
		var first_li = $(curr_main_parent).find("li").first();
		
		
		//Move li
		var curr_att_li = $(curr_att).closest( "li" );
		$(first_li).before(curr_att_li);
		
		//For color selection
		var self_color=$(curr_parent).closest("div").parents().first();
		var self_main_div = $(self_color).closest("div").parents().eq(0).closest("div").find("div").first();
		
		$(self_main_div).before(self_color);
	});
	
	// Show clear all link when any attribute is selected
	var $new_class_variant = $(".clear-all-variant")
	if($new_class_variant){
		$(".clear-all-variant").click(function(){
			var self=$(this)
			var curent_div = $(self).next("div");
			
			$(curent_div).find("input:checked").each(function(){
				$(this).removeAttr("checked");
			});
			$("form.js_attributes input").closest("form").submit();
		});
	}
	//Stick Filter view section
		var login_class = $('#oe_main_menu_navbar');
		var login_class_height = login_class.height();
		var navBox = $('.navbar-top-collapse').height();
		var total_height = login_class_height + navBox;
		
		if(login_class)
		{
			$rightBox = $('.view-as');
			//var navPos = parseInt($rightBox.offset().top);
			var navPos;
			$(window).scroll(function() {
				var scrollPos = $(this).scrollTop();
				if (scrollPos >= navPos) {
					$('.view-as').css("top", + total_height);
					$('.view-as').css("padding-top","20px");
					$('.view-as').addClass("filter-stick");
				}
				else {
					$('.view-as').removeClass("filter-stick");
					$('.view-as-maxW').css("padding-top","6px");
				}
			});
		}
});

/* on clicking at any portion of document the filter section will be closed*/
$(document).mouseup(function (e){
    var container = $("#products_grid_before");
    if (!container.is(e.target) && container.has(e.target).length === 0){
    	if( $("#products_grid_before").css('width') == '300px' || $("#products_grid_before").css('width') == '250px') {
			$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
			$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
			$(".main-header-maxW").removeClass("transparent");
			$('.header_btn_style').css('opacity','1');
		}		    
    }
});

/* Odoo Base js for replacing category collapsable icon from '>' to '+'*/
odoo.define('website_sale.website_sale_category', function (require) {
    "use strict";
    
    var base = require('web_editor.base');

    if(!$('#o_shop_collapse_category').length) {
        return $.Deferred().reject("DOM doesn't contain '#o_shop_collapse_category'");
    }

    $('#o_shop_collapse_category').on('click', '.fa-plus',function(){
        $(this).parent().siblings().find('.fa-minus:first').click();
        $(this).parents('li').find('ul:first').show('normal');
        $(this).toggleClass('fa-minus fa-plus');
    });

    $('#o_shop_collapse_category').on('click', '.fa-minus',function(){
        $(this).parent().find('ul:first').hide('normal');
        $(this).toggleClass('fa-minus fa-plus');
    });
});

// Show clear all link when any attribute is selected on load
$(window).load(function(){
	$("form.js_attributes input:checked").each(function(){ 
		var self=$(this)        	
		var curr_parent=self.parent();        	
		var curr_att=curr_parent.find("label"); 
		var curr_main_parent = $(curr_att).closest("li").parents().eq(1).find('a.clear-all-variant');;
		
		//For Checkbox
		var first_li = $(curr_main_parent).find("a.clear-all-variant");
		
		//For Color
		var self_color = $(curr_parent).closest("div").parents().eq(2).find('a.clear-all-variant');
		first_li.css("display","block");
		self_color.css("display","block");
	});
	
	//hide view filter option in list, left and right sidebar
	$(".main_listid").parent().find(".main_list").find(".apply-filter").addClass("filter_none");
	$(".main_left_grid").parent().find(".main_left").find(".apply-filter").addClass("filter_none");
	$(".main_right_grid").parent().find(".main_right").find(".apply-filter").addClass("filter_none");
});

//Added Custom Scrollbar Js
if($(window).width() > 1000)
{
		var script=document.createElement('script');
	    script.type='text/javascript';
	    script.src="/clarico_shop/static/src/js/jquery.mCustomScrollbar.concat.min.js";
	    $("head").append(script);
}
		
		
				
				
		
		
		
		
		
