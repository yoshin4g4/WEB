$(document).ready(function(){
	
	if($('div').hasClass('oe_list'))
		{
		$("div").find(".main").addClass("main_list");
		$("div").find("#products_grid").addClass("main_listid");
		$("div").find(".right-cnt-maxW").addClass("right-cnt-maxW_list");
	//	$("div").find(".products-grid-main").removeClass("main_list_grid");
		$("div").find(".in-stock").addClass("in_stock_list");
		$("div").find(".warning").addClass("warning_list");
		$("div").find(".product-name-h5").addClass("product-name-h5_list");
		$("div").find(".product-des").addClass("product-des_list");
		$("div").find(".oe_subdescription").addClass("oe_subdescription_list")
		$(".menu-filter").unbind("click"); 
		$('.menu-filter').css("display","none");
		if ($(window).width() > 900) {
			$('#products_grid_before').removeClass('mCustomScrollbar').removeAttr('data-mcs-theme');
		}
		//Off product hover effect in list view
		$(".itemscope-main").children(".product-des").removeClass("right-animation");
		$(".itemscope-main").off('mouseenter');
		$(".itemscope-main").off('mouseleave');
	}
	//screen 900 to hide filter
	
	if ($(window).width() < 900) {
		$('.menu-filter').css("display","block");
		$('#products_grid_before').css("display","none");
		$('.main_listid').css("cssText", "width: 100% !important;");
	}

//Push toggle for filter option

	$('.menu-filter').click(function(){
		$("#products_grid_before").addClass('list_products_grid_before');
			$("#products_grid_before").css({"width":"300px","transition":"0.5s"});
			$("#wrapwrap").css({"margin-left":"300px","transition":"0.5s"});
			$('body').css("overflow-x","hidden");
			$(".main-header-maxW").addClass("transparent");
			$('.header_btn_style').css('opacity','0.1 !important');
			$('#products_grid_before').css("display","block");
	});
	$('.mobile-view-filter-close-btn').click(function(){
		$("#products_grid_before").removeClass('list_products_grid_before');
		$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
		$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
		$(".main-header-maxW").removeClass("transparent");
		$('.header_btn_style').css('opacity','1');
		$('#products_grid_before').css("display","none");
	});
});

$(window).load(function(){
	var filter_label = $('.main_list').parent().find('.view-as-div').css("margin-left","0px");
	var filter_label = $('.main_list').parent().find('label.view-label').addClass('filter-label-alignment');
})
$(document).mouseup(function (e){
    var container = $("#products_grid_before");
    if (!container.is(e.target) && container.has(e.target).length === 0){
    	if( $("#products_grid_before").css('width') == '300px' || $("#products_grid_before").css('width') == '250px') {
    		$("#products_grid_before").removeClass('list_products_grid_before');
    		$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
			$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
			$(".main-header-maxW").removeClass("transparent");
			$('.header_btn_style').css('opacity','1');
			$('#products_grid_before').css("display","none");
		}		    
    }
    
});
