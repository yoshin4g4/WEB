odoo.define('quickview.gets_product', function(require) {	
	"use strict";	
	
	var ajax = require('web.ajax');		
	var utils = require('web.utils');
	var website_sale_utils = require('website_sale.utils');
	
	 // add website_sale & wishlist , compare and rating script for quick view
	 function addScript()
	 { 
		var scriptsale=document.createElement('script');	    
		scriptsale.type='text/javascript';	    
		scriptsale.src="/website_sale/static/src/js/website_sale.js";
	    var scriptwish=document.createElement('script');	    

	    $("head").append(scriptsale)
	  }
		
		function close_quickview()
		{   
			$("script[src='/website_sale/static/src/js/website_sale.js']").remove()
			$("script[src='/clarico_rating/static/src/js/rating_script.js']").remove()
		}
		
		var comparelist_product_ids = JSON.parse(utils.get_cookie('comparelist_product_ids') || '[]');
	    function dispcompare()
	    {
	     	comparelist_product_ids = JSON.parse(utils.get_cookie('comparelist_product_ids') || '[]');
	     	$('.o_product_circle').text(comparelist_product_ids.length)
	     	$('.o_compare').attr('href', '/shop/compare/?products='+comparelist_product_ids.toString());
	     	 $('.cus_theme_loader_layout').addClass('hidden');
	    }
		
		function get_quickview(pid)
		{
				pid=pid;
				ajax.jsonRpc('/productdata', 'call', {'product_id':pid}).then(function(data) 
				{
					
				$(".mask_cover").append(data)
				$(".mask").fadeIn();
				$('.cus_theme_loader_layout').addClass('hidden');
				$(".mask_cover").css("display","block");
		    	addScript();
			var compare_script=document.createElement('script');	    
     	    compare_script.type='text/javascript';	    
     	    compare_script.src="/website_sale_comparison/static/src/js/website_sale_comparison.js";	
	    $("script[src='/website_sale_comparison/static/src/js/website_sale_comparison.js']").remove()
     	    $("head").append(compare_script);
		    	
		    	// rating
				if($( ".product_quick_view_class" ).find( "q_rating-block" ))
		  {	 var rating_script=document.createElement('script');
     	    rating_script.type='text/javascript';
     	    rating_script.src="/clarico_rating/static/src/js/rating_script.js";
     	    $("head").append(rating_script);
		  }
	    	// for compare

				if($(".product_quick_view_class").find(".o_add_compare_dyn")) {
                    dispcompare()

                    $('.oe_website_sale .o_add_compare, .oe_website_sale .o_add_compare_dyn').click(function (e) {
                        $.getScript('/website_sale_comparison/static/src/js/website_sale_comparison.js', function (data, textStatus, jqxhr) {
                            $('.cus_theme_loader_layout').removeClass('hidden');
                            var count = comparelist_product_ids.length;
                            if (count >= 4)
                                $(".compare_max_limit").css({"visibility": "visible", "z-index": "9999"});
                            setTimeout(function () {
                                $(".compare_max_limit").css("visibility", "hidden");
                            }, 2000);

                            dispcompare()
                        });
                    })
                }

		    	$(".close_btn").click(function()
		    	{
		    		close_quickview()
		    		$('.mask_cover').empty(data);
		    	});
		    	$(document).on('keydown', function(e)
		    	{
		    		if(e.keyCode === 27) 
		    		{
		    			if(data)
		    			{
		    				close_quickview()
		    				$('.mask_cover').empty(data);
		    			}
		    		}
		    	});
		    	
		    	if($(".product_quick_view_class").find(".o_add_wishlist_dyn"))
   				{
   		     	    var wishlist_product_ids = ""
   		     	    $.get('/shop/wishlist', {'count': 1}).then(function(res) {
   		     	    	wishlist_product_ids = JSON.parse(res);
   		            });
   		     	    $('.oe_website_sale').on('change', 'input.js_variant_change, select.js_variant_change, ul[data-attribute_value_ids]', function(ev) {
   		     	    	var $ul = $(ev.target).closest('.js_add_cart_variants');
   		     	    	var $parent = $ul.closest('.js_product');
   		     	    	var $product_id = $parent.find('.product_id').first();
   		     	    	var $el = $parent.find("[data-action='o_wishlist']");
   		     	    	if (!_.contains(wishlist_product_ids, parseInt($product_id.val(), 10))) {
   		     	    		$el.prop("disabled", false).removeClass('disabled').removeAttr('disabled');
   		     	    	}
   		     	    	else {
   		     	    		$el.prop("disabled", true).addClass('disabled').attr('disabled', 'disabled');
   		     	    	}
   		     	    });
			  		  	$(".product_quick_view_class .o_add_wishlist_dyn").click(function() {
			  		  	var url =location.pathname;
		    		var log_Status = $("#o_logout").length
		    	    if(log_Status == 0)
		    	    {
		    	       	window.location.href = '/web/login?redirect='+url
		    	    }
		    	    else
		    	    {
			  		var curr_obj = $(this)
   			        var pid = parseInt(curr_obj.parent().find('.product_id').val())
   			        if (!_.contains(wishlist_product_ids, pid)) {
   			              ajax.jsonRpc('/shop/wishlist/add', 'call', {'product_id': pid}).then(function () 
   			              {
   			            	    website_sale_utils.animate_clone($('#my_wish'), curr_obj.closest('form'), 25, 40);
   			               	  	wishlist_product_ids.push(pid);
   			            	  	curr_obj.prop("disabled", true).addClass('disabled');
   			                   	$.get('/shop/wishlist', {'count': 1}).then(function(res) {
   			                		 	$('#my_wish').show();
   						                var wishlist_product_ids = JSON.parse(res);
   						                $('.my_wish_quantity').text(wishlist_product_ids.length);
   						         });
   			                });
   			  		  }
		    	    }
   			  	});
   			}

			});
		}
	$(".quick-view-a").click(function(){ 
			$('.cus_theme_loader_layout').removeClass('hidden');
			var pid = $(this).attr('data-id');
			get_quickview(pid)
			
	});
	
	return{
		get_quickview:get_quickview
	};
})
