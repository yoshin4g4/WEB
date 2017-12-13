odoo.define('clarico_cart.cart', function (require) {
    "use strict";

    require('web.dom_ready');
    var core = require('web.core');
    var ajax = require('web.ajax');
    var _t = core._t;
    
    if ($(window).width() > 1200) {
    var shopping_cart_link = $('#header-cart');
    var shopping_cart_link_counter;
    shopping_cart_link.popover({
        trigger: 'manual',
        animation: true,
        html: true,
        title: function () {
            return _t("My Cart");
        },
        container: 'body',
        placement: 'auto',
        template: '<div class="popover mycart-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
    }).on("mouseenter",function () {
        var self = this;
        clearTimeout(shopping_cart_link_counter);
        shopping_cart_link.not(self).popover('hide');
        shopping_cart_link_counter = setTimeout(function(){
            if($(self).is(':hover') && !$(".mycart-popover:visible").length)
            {
                $.get("/shop/cart", {'type': 'popover'})
                    .then(function (data) {
                        $(self).data("bs.popover").options.content =  data;
                        $(self).popover("show");
                        $(".popover").on("mouseleave", function () {
                            $(self).trigger('mouseleave');
                        });

                        //Remove product 
                        $(".remove-product-popover").click(function(){
                        	var order_id = $(this).attr("data-order");
                        	var product_id = $(this).attr("data-product");
                        	$('.cus_theme_loader_layout').removeClass('hidden');
                        	
                        	ajax.jsonRpc("/shop/cart/update_json", 'call', {
                        		'line_id': parseInt(order_id,10),
                                'product_id': parseInt(product_id, 10),
                                'set_qty': 0	
                            }).then(function (data){
                            	$(".row.cart_line[data-id='"+product_id+"']").css("display","none");
                            	$('.cus_theme_loader_layout').addClass('hidden');
                            	               				
                            	//cart total count json
                            	ajax.jsonRpc("/shop/cart/total_count", 'call', {
                            	}).then(function (values){
                            		if (values.cart_qty_total){
                            			var total_amount=values.cart_total_amount;
                            			var subtotal_amount = values.cart_subtotal_amount;
                            			if($(".cart-update-text").length > 0){
                            				var total_amount = values.cart_total_amount;
                            				$(".my_cart_quantity").replaceWith('<span class="my_cart_quantity">'+values.cart_qty_total+'</span>');
                            				$(".cart-header-total").replaceWith('<span class="cart-header-total">'+total_amount.toFixed(2)+' '+ values.currency_symbol +'</span>');
                            				$("#order_total_untaxed span.oe_currency_value").replaceWith('<span class="oe_currency_value">'+subtotal_amount.toFixed(2)+'</span>');
                            				$("#order_total span.oe_currency_value").replaceWith('<span class="oe_currency_value">'+total_amount.toFixed(2)+'</span>');
                            				$(".view-cart-btn").replaceWith('<a class="view-cart-btn btn btn-primary" href="/shop/cart">View Cart ('+ values.cart_qty_total +' items)</a>');
                            			}
                            		}
                            		else{
                            			$(".my_cart_quantity").replaceWith('<span class="my_cart_quantity label"> 0 </span>');
                            			$(".cart-header-total").replaceWith('<span class="cart-header-total">0.00 '+ values.currency_symbol +'</span>');
                            			$(".popover-content").replaceWith('<div class="popover-content"><div class="well well-lg">Your cart is empty!</div></div>');
                            		}
                            	});
                        })
                    });
                })
            }
        }, 100);
    }).on("mouseleave", function () {
        var self = this;
        setTimeout(function () {
            if (!$(".popover:hover").length) {
                if(!$(self).is(':hover')) {
                   $(self).popover('hide');
                }
            }
        }, 1000);
    })
    }
});

odoo.define('website_sale.clear_cart', function (require) {
	"use strict";
	
	require('web.dom_ready');
	var ajax = require('web.ajax');
	
	$(".clear_shopping_cart").click(function (event) {
		event.preventDefault();
	 	ajax.jsonRpc("/shop/clear_cart", 'call', {})
            .then(function (data) {
            	window.location.reload(true);
        });
	});
	
	if($('#hiddencount').val() == "0"){
		$("#cart_total, .cart-total-heading").css("display","none");
		$("#right_column").css("display","none");
		$(".wizard-main-ul").css("display","none");
		$('.cart_margin_class').css("margin-top","0px");
	}
	$('#cart_total').removeClass('col-sm-4 col-sm-offset-8 col-xs-12');
	$('button.btn-primary').addClass('common-btn');
	//$('button.btn-primary > span').css('font-family','oswald-regular');
	$('#cart_total').removeClass('col-sm-4 col-sm-offset-8 col-xs-12');
	
	
});
