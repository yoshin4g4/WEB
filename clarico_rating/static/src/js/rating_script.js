 odoo.define('rate.getrate', function(require) {
	"use strict";
	
	//require('web.dom_ready')
	var base = require('web_editor.base');
	var ajax = require('web.ajax');
	var utils = require('web.utils');
	var core = require('web.core');
	var _t = core._t;
	
	function get_stars()
	{
		var val_ele = $("input[name='rating']");
     	$(val_ele).each(function()
     	{
     			var curr_ele=$(this);
     			var val=curr_ele.attr('data-default');
     			var index = Math.floor(val);
				var decimal = val - index;
     	    	parent=curr_ele.parent()
     	    	parent.find('.stars').find("i:lt("+index+")").removeClass('fa-star-o fa-star-half-o').addClass('fa-star');
     	    	if(decimal){
						parent.find('.stars').find("i:eq("+(index)+")").removeClass('fa-star-o fa-star fa-star-half-o').addClass('fa-star-half-o');
     	    	}
     	 });
    }
	get_stars()
    return {
		get_stars:get_stars
	};
})
