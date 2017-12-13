$(document).ready(function(){
	if($('div').hasClass('oe_shop_right'))
		{
		$("div").find(".main").addClass("main_right");
		$("div").find("#products_grid").addClass("main_right_grid");
		$("div").find(".right-cnt-maxW").addClass("right-cnt-maxW_right");
	//	$("div").find(".products-grid-main").removeClass("main_right_grid");
		$(".menu-filter").unbind("click"); 
		$('.menu-filter').css("display","none");
		$("div").find(".right-cnt-maxW").removeClass("right-cnt-maxW");
		if ($(window).width() > 900) {
				$('#products_grid_before').removeClass('mCustomScrollbar').removeAttr('data-mcs-theme');
			}
	}
		
	//screen 900 to hide filter
	if ($(window).width() < 900) {
		$('.menu-filter').css("display","block");
		$('#products_grid_before').css("display","none");
		$('.main_right_grid').css("cssText", "width: 100% !important;");
	}
	
	if( $(".css_editable_display").css('display') == 'block') {
		$('.view-as').css('display','none');
	}
})
$(window).load(function(){
	//var filter_label = $('.main_right').parent().find('.view-as-div').css("margin-left","0px");
	var filter_label = $('.main_right').parent().find('label.view-label').addClass('filter-label-alignment');
	
})
//Push toggle for filter option
$(document).ready(function() {
	$('.menu-filter').click(function(){
		$("#products_grid_before").addClass('right_products_grid_before');
		$("#products_grid_before").css({"width":"300px","transition":"0.5s"});
		$("#wrapwrap").css({"margin-left":"300px","transition":"0.5s"});
		$('body').css("overflow-x","hidden");
		$(".main-header-maxW").addClass("transparent");
		$('.header_btn_style').css('opacity','0.1 !important');
		$('#products_grid_before').css("display","block");
	});
	$('.mobile-view-filter-close-btn').click(function(){
		$("#products_grid_before").removeClass('right_products_grid_before');
		$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
		$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
		$(".main-header-maxW").removeClass("transparent");
		$('.header_btn_style').css('opacity','1');
		$('#products_grid_before').css("display","none");
	});
});
$(document).mouseup(function (e){
    var container = $("#products_grid_before");
    if (!container.is(e.target) && container.has(e.target).length === 0){
    	if( $("#products_grid_before").css('width') == '300px' || $("#products_grid_before").css('width') == '250px') {
    		$("#products_grid_before").removeClass('right_products_grid_before');
    		$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
			$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
			$(".main-header-maxW").removeClass("transparent");
			$('.header_btn_style').css('opacity','1');
			$('#products_grid_before').css("display","none");
		}		    
    }
    
});
