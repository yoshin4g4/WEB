odoo.define('wishlist.wish', function(require) {
	"use strict";
	require('web.dom_ready');
	var base = require('web_editor.base');
	var ajax = require('web.ajax');
	var rpc = require('web.rpc');
	var utils = require('web.utils');
	var core = require('web.core');
	var _t = core._t;
	var url=""
	
	$(".wish_shop_a[disabled]").each(function(){
		$(this).find("i").removeClass("fa fa-heart-o").addClass("fa fa-heart inwish");
	})
	$(".wish_shop_a,.disabled").click(function(){
		$(this).find("i").removeClass("fa fa-heart-o").addClass("fa fa-heart inwish");
		$(this).parents(".itemscope-main").find(".added-wish-item").find(".fa-heart-o").removeClass("fa fa-heart-o").addClass("fa fa-heart inwish");
	})
	
	// shop popout
	
	$(".apply-wishlist").click(function(e)
	{
		e.preventDefault();
		$('.cus_theme_loader_layout').removeClass('hidden');
		ajax.jsonRpc('/wishlist_products_popout', 'call', {}).then(function(data)
		{
			$(".common-continer").html(data);
			$(".common-main-div").css("display","block").addClass("zoom-fadein");
			$('.cus_theme_loader_layout').addClass('hidden');	
		})
		
	});
	
	
	
	$(".common-close-btn").click(function(){
		$(".common-continer").html("");
		$(".common-main-div").css("display","none");
	})
	
	
	
	$(document).on( 'keydown', function(e){
		if(e.keyCode === 27) {
			$(".common-continer").html("");
			$(".common-main-div").css("display","none");
		}
	});
	
	//Claer Wishlist
	$(".clear_wishlist").click(function(e){
        var wish = [];
        $('.table-comparator tr').each(function(){
        	var tr= $(this);
        	if(tr.data('wish-id')){
        		wish.push(tr.data('wish-id'))	
        	}
        });
        ajax.jsonRpc('/clear_wishlist', 'call', {'wish': wish}).then(function () {window.location.reload();});
	});
	
	
	/*$('.my_wish_quantity').on('change', function() {
		var wish_count = $(".my_wish_quantity").html();
		console.log(wish_count)
		if(wish_count > 0){
			console.log($(".my_wish_quantity").html());
			$(".apply-wishlist").css("display","block");
		}
	})*/
})

