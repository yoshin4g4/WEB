odoo.define('wishlist.wishscript', function(require) {
"use strict";
require('web.dom_ready');
var base = require('web_editor.base');
var ajax = require('web.ajax');
var rpc = require('web.rpc');
var utils = require('web.utils');
var core = require('web.core');
var _t = core._t;
		
		var remove_product_ids =[];
		$(".remove2wish").click(function()
		{
			var current=$(this);
			var pid = current.attr('data-id');
			
			// Browser		
			navigator.sayswho= (function(){
			var ua= navigator.userAgent, tem,
			M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
			if(/trident/i.test(M[1])){
				tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
				return 'IE '+(tem[1] || '');
			}
			if(M[1]=== 'Chrome'){
			tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
			if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
			}
			M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
			if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
			return M.join(' ');
			})();
			
			var name= navigator.sayswho
			var bnm=name.toLowerCase().split('safari')
			if(name.toLowerCase() == "ie 11")
			{
					ajax.jsonRpc('/remove_wishlist_product', 'call', {'product_id' : pid}).then(function(data) 
					{
					
					$('.product[data-id='+pid+']').css("display","none")	
					if(data.wishcount==0)
						$(".wish_count").css("display","none !important");
					else
						$(".wish_count").css("display","inline-block");
					$('.wish_count').html(data.wishcount)
					
					});
				}
			if(bnm.length > 1)
				{
					ajax.jsonRpc('/remove_wishlist_product', 'call', {'product_id' : pid}).then(function(data) 
					{
					
					$('.product[data-id='+pid+']').css("display","none")	
					if(data.wishcount==0)
						$(".wish_count").css("display","none !important");
					else
						$(".wish_count").css("display","inline-block");
					$('.wish_count').html(data.wishcount)
					
					});
				}
			else
			{
					var current_product_name=current.attr('data-name');
			
					remove_product_ids.push(pid);
					var self_undo = $(".undo[data-id='" + pid + "']");
					self_undo.css("visibility","visible").after().html('<span class="undo-span"><i class="fa fa-undo" aria-hidden="true"></i> Undo &nbsp </span>'  + ' " ' + current_product_name + ' " ' );
					$(".remove2wish[data-id='" + pid + "']").css("display","none");
					$(".add-to-cart[data-id='" + pid + "']").css("display","none");
					$(".undo_opacity[data-id='" + pid + "']").css("opacity","0.3")
			}
			
			
		});
		$(window).bind('beforeunload', function(){  
			if(remove_product_ids.length > 0){
				
				ajax.jsonRpc('/remove_wishlist_product', 'call', {'product_id' : remove_product_ids}).then(function(data) 
				{
					
					
					
				});
			}
		});
		
		$(".clear_wishlist").click(function(e){
		        var wish = [];
		        $('.o_comparelist_table tr').each(function(){
		        	var tr= $(this);
		        	if(tr.data('wish-id')){
		        		wish.push(tr.data('wish-id'))	
		        	}
		        });
		        rpc.query({
		                model: 'product.wishlist',
		                method: 'write',
		                args: [wish, { active: false }],
		            })
		            .then(function(){
		                window.location.reload()
		            });
		});
		
		$(".undo").click(function()
		{
			var current=$(this);
			var pid = current.attr('data-id');
			remove_product_ids.splice($.inArray(pid, remove_product_ids),1);
			
			$(".undo[data-id='" + pid + "']").css("visibility","hidden");
			$(".remove2wish[data-id='" + pid + "']").css("display","block");
			$(".add-to-cart[data-id='" + pid + "']").css("display","block");
			$(".undo_opacity[data-id='" + pid + "']").css("opacity","1")
		});
		
});
