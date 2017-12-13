odoo.define('product_static_carousel.snippets.animation', function (require)
{
'use strict';
var ajax = require('web.ajax');
var core = require('web.core');
var base = require('web_editor.base');
var utils = require('web.utils');
var animation = require('website.content.snippets.animation');
var website_sale_utils = require('website_sale.utils');
var no_of_product;
var qweb = core.qweb;

animation.registry.js_get_static_objects = animation.Class.extend
({
    selector : ".js_get_static_objects",
    start: function()
    {
      this.redrow();
    },
    stop: function(){
      this.clean();
    },

    redrow: function(debug)
    {
      this.clean(debug);
      this.build(debug);
    },

    clean:function(debug){
      this.$target.empty();
    },
    
    build: function(debug)
    {
    	
    	var self = this,
    	filter_id  = self.$target.data("filter_static_by_filter_id"),
        sale_label = self.$target.data("sale_label"),
        get_rating = self.$target.data("get_rating"),
    	template = self.$target.data("template");
    	$("#wait").css("display", "block");
        if(!template) template = 'clarico_product_multi_carousel.clarico_product_multi_carousel_static_carousel_snippet_heading';
        if(!sale_label)sale_label = 0;
        if(!get_rating)get_rating = 0;
        if(!filter_id)filter_id = false;
        var rpc_end_point = '/ecommerce_static_product_carousel_snippets/render';
        
        function ratingEnable()
        { 	
      	  if($( "div" ).hasClass( "product_carousel_rating" ))
  		  {	 var rating_script=document.createElement('script');	    
         	    rating_script.type='text/javascript';	    
         	    rating_script.src="/clarico_rating/static/src/js/rating_script.js";
         	    $("head").append(rating_script);
  		  }
        }
        
        var comparelist_product_ids = JSON.parse(utils.get_cookie('comparelist_product_ids') || '[]');
        function dispcompare()
        {
        	comparelist_product_ids = JSON.parse(utils.get_cookie('comparelist_product_ids') || '[]');
        	var count = comparelist_product_ids.length;
        	$('.o_product_circle').text(comparelist_product_ids.length)
        	$('.o_compare').attr('href', '/shop/compare/?products='+comparelist_product_ids.toString());
        	$('.cus_theme_loader_layout').addClass('hidden');
        	if(count > 0){
        		$('.o_product_circle').text(comparelist_product_ids.length)
        	}else if(count == 0){
        		$('.o_product_circle').text("");
        	}
        }
        function addScript()
    	 { 
    	   
        	if(get_rating==0)
			 {   			 
			 	self.$target.find('.product_carousel_rating').css("display","none")
			 }
			
		  else
			{
				if($('script[src="/clarico_rating/static/src/js/rating_script.js"]').length > 0)
				{	console.log('rating script is already added')
					$("script[src='/clarico_rating/static/src/js/rating_script.js']").remove()
				}
				ratingEnable()
				self.$target.find('.product_carousel_rating').css("display","block")
			}
			
  	    	// for label
			if(sale_label==0)
				self.$target.find('.label-block').css("display","none")
			else
				self.$target.find('.label-block').css("display","block")
				
				
			if($("body").find(".quick-view-a"))
			{
				var qview = self.$target.find(".quick-view-a")
	  		qview.click(function() {
  			$('.cus_theme_loader_layout').removeClass('hidden');
	   		var pid = $(this).attr('data-id');
	   		ajax.jsonRpc('/productdata', 'call', {'product_id':pid}).then(function(data) 
	   		{	
	   				$(".mask_cover").append(data)
	   				$(".mask").fadeIn();
	   				$('.cus_theme_loader_layout').addClass('hidden');
	   				$(".mask_cover").css("display","block");
	   				    	
	   				var sale_script=document.createElement('script');	    
	   		     	sale_script.type='text/javascript';	    
	   		     	sale_script.src="/website_sale/static/src/js/website_sale.js";	
	   		     	$("script[src='/website_sale/static/src/js/website_sale.js']").remove()
	   		     	$("head").append(sale_script);
	   						
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
	   					var id = self.$target.attr('id')
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
	   				if($("body").find(".o_add_compare"))
	   		  		{
	   					var compare_script=document.createElement('script');	    
			     	    compare_script.type='text/javascript';	    
			     	    compare_script.src="/website_sale_comparison/static/src/js/website_sale_comparison.js";	
						$("script[src='/website_sale_comparison/static/src/js/website_sale_comparison.js']").remove()
			     	    $("head").append(compare_script);
	   					
	   				  dispcompare()
	   				  
	   			      $(".oe_website_sale .o_add_compare,.oe_website_sale .o_add_compare_dyn").click(function (e){
	   			      	$.getScript('/website_sale_comparison/static/src/js/website_sale_comparison.js', function(data, textStatus,jqxhr ) {
	   			      		$('.cus_theme_loader_layout').removeClass('hidden');
	   			      		var count = comparelist_product_ids.length;
	   			      		if(count >= 4)
	   			      			$(".compare_max_limit").css("visibility","visible");
	   			    			setTimeout(function(){
	   			    				$(".compare_max_limit").css("visibility","hidden");
	   			    			}, 2000);
	   			      		dispcompare()
	   			          });
	   			      });
	   		  		}
	   			$(".close_btn").click(function()
	   			{
	   			   		//close_quickview()
	   			   		$('.mask_cover').empty(data);
	   			});
	   			$(document).on('keydown', function(e)
	   			{
	   			   		if(e.keyCode === 27) 
	   			   		{
	   			   			if(data)
	   			   			{
	   			   				//close_quickview()
	   			   				$('.mask_cover').empty(data);
	   			   			}
	   			   		}
	   			});
	   		})
	  	})
		}

		if($("body").find(".o_add_wishlist"))
  		{ 
  		  	// for wish
  		  	var wish = self.$target.find(".o_add_wishlist")
  		  	wish.click(function() {
  		  		var url =location.pathname;
  		  		var log_Status = $("#o_logout").length
  		  		if(log_Status == 0)
  		  		{
  		  			window.location.href = '/web/login?redirect='+url
  		  		}
  		  		else
  		  		{
  		  		var curr_obj = $(this)
  		  		website_sale_utils.animate_clone($('#my_wish'), curr_obj.closest('form'), 25, 40);
  		  		var pid = parseInt($(this).attr('data-product-product-id'),10);
  		  		ajax.jsonRpc('/shop/wishlist/add', 'call', {
                     'product_id': pid
  		  		}).then(function () {
                  	 curr_obj.off("click");
                   	 curr_obj.css("display","none")
                   	 $("body").find(".o_add_wishlist_inwish[data-product-product-id='" + pid + "']").css("display","block")
                   	 $("body").find("a.o_add_wishlist[data-product-product-id='" + pid + "']").css("display","none")
                   	 $.get('/shop/wishlist', {'count': 1}).then(function(res) {
                   		 	$('#my_wish').show();
			                var wishlist_product_ids = JSON.parse(res);
			                $('.my_wish_quantity').text(wishlist_product_ids.length);
			         });
                 });
  		  		}
             });
  		}
  		  // for compare
		if($("body").find(".o_add_compare"))
  		{
		  dispcompare()
		  
		  var compare = self.$target.find(".o_add_compare")
	      compare.click(function (e){
	      	$.getScript('/website_sale_comparison/static/src/js/website_sale_comparison.js', function(data, textStatus,jqxhr ) {
	      		$('.cus_theme_loader_layout').removeClass('hidden');
	      		var count = comparelist_product_ids.length;
	      		if(count >= 4)
	      			$(".compare_max_limit").css("visibility","visible");
	    			setTimeout(function(){
	    				$(".compare_max_limit").css("visibility","hidden");
	    			}, 2000);
	      		dispcompare()
	          });
	      });
  		}
	}
  		  
  		

        
        ajax.jsonRpc(rpc_end_point, 'call', {'template': template,'filter_id': filter_id,}).then(function(objects) 
        {
        	$(objects).appendTo(self.$target);
        	self.$target.find(".filter_static_title:first").addClass("active_tab")
        	var temp_id=self.$target.find(".filter_static_title:first").attr("data-id")
        	if(!temp_id)temp_id = false;
        	ajax.jsonRpc('/static_product_data', 'call', {'template': template,'temp_filter_id': temp_id,}).then(function(data) 
    		{	
        		var cont_tab=(self.$target).find(".contenttab")
        		$(cont_tab).html(data);
        		addScript()
        		$('.cus_theme_loader_layout').addClass('hidden');
        		self.$target.find("div[class='fun_slide_class']").removeClass("fun_slide_class").addClass('non')
     	  })
     	  $(".filter_static_title").click(function()
    	  {
				$('.cus_theme_loader_layout').removeClass('hidden');
    			var curr_tag=$(this);
    			var curr_tag_id=curr_tag.attr("data-id");
    			$(".filter_static_title").removeClass("active_tab")
    			curr_tag.addClass("active_tab")
    			ajax.jsonRpc('/static_product_data', 'call', {'template': template,'temp_filter_id': curr_tag_id}).then(function(data) 
    			{
    				
    				$('.cus_theme_loader_layout').addClass('hidden');
    				var cont_tab=(self.$target).find(".contenttab")
    				$(cont_tab).html(data);
    				addScript()
    				self.$target.find("div[class='fun_slide_class']").removeClass("fun_slide_class").addClass('non');
        			$(".non").addClass("zoom-animation");
    				setTimeout(function(){
    					$(".non").removeClass("zoom-animation");
    				},500);

    		  })
    	})	  	    
    }).then(function(){
  	  self.loading(debug);
    }).fail(function(e) {
      
    });
    },
    loading: function(debug){
    	//function to hook things up after build    	
    }
    
	});
});
