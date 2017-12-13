odoo.define('quickview.quickview', function(require) {	
	"use strict";	
	
	require('web.dom_ready');	
	var qview = require('quickview.gets_product');
	$(".quick-view-a").click(function(){ 
			$('.cus_theme_loader_layout').removeClass('hidden');
			var pid = $(this).attr('data-id');
			qview.get_quickview(pid)
			
	});
})
