odoo.define('clarico_shop.stick', function(require) {	
	"use strict";	
	
	require('web.dom_ready');
	var ajax = require('web.ajax');	
	
	$(".quick-view-a").click(function(){
		$(".view-popup-main-div").css("display","block");

			var pid = $(this).attr('data-id');
			ajax.jsonRpc('/productdata', 'call', {'product_id':pid}).then(function(data) {
				$(".view-popup-sub-div").html(data)
				
		});
		$(document).on( 'keydown', function(e){
			if(e.keyCode === 27) {
				$(".view-popup-main-div").css("display","none");
			}
		});
		
		
	});
})

