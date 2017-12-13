odoo.define('pricefilter.filter', function(require) {
	"use strict";
	require('web.dom_ready');
	var base = require('web_editor.base');
	var ajax = require('web.ajax');
	var utils = require('web.utils');
	var core = require('web.core');
	var _t = core._t;
	
	$('form.js_attributes').submit(function(){
    $(this).find('input[name], select[name]').each(function(){
			if (!$(this).val()){
				$(this).removeAttr('name');
			}
		});
	});
	
	$('form.js_attributes input#price_range_min_value').on('change',
		function(event) {
			if (!event.isDefaultPrevented()) {
				return false;
			}
		});

	$('form.js_attributes input#price_range_max_value').on('change',
		function(event) {
			if (!event.isDefaultPrevented()) {
				return false;
			}
		});

	
	/*---------------setting up variables for price slider and calling price slider function------------------------*/
	var price_slider_min = $("#price_slider_min").val();
	var price_sldier_max_val = $("#price_slider_max").val();
	var price_from = $("#price_range_min_value").val();
	var price_to = $("#price_range_max_value").val();
	
	$("#price_slider").ionRangeSlider({
		min : price_slider_min,
		max : price_sldier_max_val,
		from : price_from,
		to : price_to,
		type : "double",
	
	});

	/*--------------------on click of button the price slider values will set in text box on clicking on submit it will be submitted--------------------*/
	$("#price_slider_form").click(function() {
	
		$("#price_slider").ionRangeSlider({
			min : price_slider_min,
			max : price_sldier_max_val,
			from : price_from,
			to : price_to,
			type : "double",
	
		});
	})
	$(".irs-slider").click(function() {
		var irs_from = $(".irs-from").text().toString();
		var irs_to = $(".irs-to").text().toString();
		var trim_from = irs_from.split(" ").join("");
		var trim_to = irs_to.split(" ").join("");
		var price_from_slider = $('#price_range_min_value').val(trim_from);
		var price_to_slider = $('#price_range_max_value').val(trim_to);
		$("#price_slider").ionRangeSlider({
			min : price_slider_min,
			max : price_sldier_max_val,
			from : price_from_slider,
			to : price_to_slider,
			type : "double",
	
		});
	});
	/*---------------------validation (if any one of the input fields are not filled on clicking on button validatoin will bw applied------------------*/
	$("#price_slider_form").click(function() {
		if ($("#price_range_min_value").val() == 0)
			return false
		else
			return true
	});
	
	$("#price_slider_form").click(function() {
		if ($("#price_range_max_value").val() == 0)
			return false
		else
			return true
	});

	/*----------------------------it will check if the entered value if number or not if not returns false----------------------------*/
	$("#price_range_min_value").keypress(function(e) {
		if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
			return false;
		}
	});
	$("#price_range_max_value").keypress(function(e) {
		if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
			return false;
		}
	});
	/*--------------------------This will range the text box value to the min and max value of the price range if entered greater than this it will automatically adjust to the min and max value-----------------*/
	$(function() {
		$("#price_range_min_value").change(function() {
	
			var min = parseInt($(this).attr('min'));
	
			if ($(this).val() < min) {
				$(this).val(min);
			}
		});
	
		$("#price_range_max_value").change(function() {
			var max = parseInt($(this).attr('max'));
			if ($(this).val() > max) {
				$(this).val(max);
			}
	
		});
	});
});
