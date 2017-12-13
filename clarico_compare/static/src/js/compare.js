odoo.define('clarico_compare.compare', function (require) {
"use strict";

require('web.dom_ready')
var ajax = require('web.ajax');
var core = require('web.core');
var utils = require('web.utils');
var Widget = require('web.Widget');
var website = require('web_editor.base');
var website_sale_utils = require('website_sale.utils');
var _t = core._t;

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
dispcompare()


$('.oe_website_sale .o_add_compare, .oe_website_sale .o_add_compare_dyn').click(function (e){
	$.getScript('/website_sale_comparison/static/src/js/website_sale_comparison.js', function(data, textStatus,jqxhr ) {
		$('.cus_theme_loader_layout').removeClass('hidden');
		var count = comparelist_product_ids.length;
		if(count >= 4){
			$(".compare_max_limit").css("visibility","visible");
			setTimeout(function(){
				$(".compare_max_limit").css("visibility","hidden");
			}, 2000);
		}		
		dispcompare()
    });
})
$('.compare_remove').click(function (e){
	$('.cus_theme_loader_layout').removeClass('hidden');
	console.log(comparelist_product_ids)
	comparelist_product_ids = _.without(comparelist_product_ids, $(this).data('product_product_id'));
	console.log(comparelist_product_ids)
	document.cookie = 'comparelist_product_ids=' + JSON.stringify(comparelist_product_ids) + '; path=/';
	if(comparelist_product_ids.length == 0)
		window.location.href = '/shop'
	window.location.href = '/shop/compare/?products='+comparelist_product_ids.toString()
})
});
