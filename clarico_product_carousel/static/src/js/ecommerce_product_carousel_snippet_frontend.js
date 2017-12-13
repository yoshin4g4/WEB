odoo.define('clarico_product_carousel.snippets.animation', function (require) {
'use strict';
// First Execute
var ajax = require('web.ajax');
var core = require('web.core');
var base = require('web_editor.base');
var utils = require('web.utils');
var animation = require('website.content.snippets.animation');
var website_sale_utils = require('website_sale.utils');
var no_of_product;
var qweb = core.qweb;
/*-------------------------------------------------------------------------*/
animation.registry.js_get_objects = animation.Class.extend({
    selector : ".js_get_objects",

    start: function(){
      this.redrow();
    },
    stop: function(){
      this.clean();
    },

    redrow: function(debug){
      this.clean(debug);
      this.build(debug);
    },

    clean:function(debug){
      this.$target.empty();
    },
    
    
    apply_bxslider:function(debug,objects_in_slide){
    	var self = this;
    	var bxsliderCount = 0;
    	
    	$(".product_carousel_slider").each(function () {
    		
			create_slider(objects_in_slide)
			bxsliderCount++;
    	});
    },
    
    build: function(debug)
    {
	  //$('.cus_theme_loader_layout').removeClass('hidden');
      var self = this,
      limit    = self.$target.data("objects_limit"),
      filter_id  = self.$target.data("filter_by_filter_id"),
      objects_in_slide = self.$target.data("objects_in_slide"),
      c_type = self.$target.data("c_type"),
      sale_label = self.$target.data("sale_label"),
      get_rating = self.$target.data("get_rating"),
      object_name = self.$target.data("object_name"),
      custom_controller = self.$target.data("custom_controller"),
      template = self.$target.data("template");
      $("#wait").css("display", "block");
      self.$target.attr("contenteditable","False");
      if(!objects_in_slide)objects_in_slide = 4;
      if(!c_type)c_type = 0;	
      if(!sale_label)sale_label = 0;
      if(!get_rating)get_rating = 0;
      if(!limit)limit = 10;
      if(!filter_id)filter_id = false;
      if(!template) template = 'clarico_product_carousel.product_carousel_snippet_heading';
	  var rpc_end_point = '/ecommerce_product_carousel_snippets/render';
	  if (custom_controller == '1'){
    	  rpc_end_point='/ecommerce_product_carousel_snippets/render/' + object_name;
      };
	 
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
      
      function ratingEnable()
      { 	
    	  if($( "div" ).hasClass( "product_carousel_rating" ))
		  {	 var rating_script=document.createElement('script');	    
       	    rating_script.type='text/javascript';	    
       	    rating_script.src="/clarico_rating/static/src/js/rating_script.js";
       	    $("head").append(rating_script);
		  }
      }
      
      function addcode()
      {
    	  // for rating
    	  if(get_rating==0)
			 {   			 
			 	self.$target.find('.product_carousel_rating').css("display","none")
			 }
			
		  else
			{
				if($('script[src="/clarico_rating/static/src/js/rating_script.js"]').length > 0)
				{	
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
    	  
    	  // wishlist
    	  if($("body").find(".o_add_wishlist"))
		  { 
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

                 var pid = parseInt($(this).attr('data-product-product-id'),10);
                 ajax.jsonRpc('/shop/wishlist/add', 'call', {
                     'product_id': pid
                 }).then(function () {
                 	 website_sale_utils.animate_clone($('#my_wish'), curr_obj.closest('form'), 25, 40);
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
      ajax.jsonRpc(rpc_end_point, 'call', {
        'template': template,
        'filter_id': filter_id,
        'objects_in_slide' : objects_in_slide,
        'limit': limit,
        'object_name':object_name,
      }).then(function(objects) {
    	  $(objects).appendTo(self.$target);
    	  if(c_type == 1)
    	 {
    		  // For apply bxslider
    		  self.apply_bxslider(objects,objects_in_slide);
    	    
    		  // For display block as option selection
    		  addcode()
			
    	 }
    	  // For Non - slider = Remove fun_slider_class & add non
    	 if(c_type == 0)
     	 {
    		 // For remove bxSlide class and add non
    		 self.$target.find("div[class='owl-carousel']").removeClass("owl-carousel").addClass('product_non_slider');
    		 
    		// For display block as option selection
   		    addcode()      	     		
			
     	 }
      }).then(function(){
    	  self.loading(debug);
      }).fail(function(e) {
        return;
      });
    },
    
    loading: function(debug){
    	//function to hook things up after build    	
    }
});
	
});
