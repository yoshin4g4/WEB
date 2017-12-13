 odoo.define('rate.rating', function(require) {
	"use strict";
	
	require('web.dom_ready')
	var rate = require('rate.getrate');
	rate.get_stars()
})
