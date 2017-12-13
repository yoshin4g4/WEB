$(document).ready(function()
{
	/*view filter click */
	$(".apply-filter").click(function(){
		//$("#products_grid_before").css({"width":"0px","transition":"0.5s"});
		//$("#wrapwrap").css({"margin-left":"0px","transition":"0.5s"});
		$(".main-header-maxW").removeClass("transparent");
		$(".filter-main-div").css("display","block").addClass("zoom-fadein");
	});
	/*close button of view filter*/
	$(".filter-option-close-btn").click(function(){
		$(".filter-main-div").css("display","none");
	})
	
	/* filter-option class set center of screen */
	var winH = $(window).height();
	var winW = $(window).width();
	var $filter_option = $(".filter-option");
	$filter_option.css('top',  winH/2-$filter_option.height()/2);
	$filter_option.css('left', winW/2-$filter_option.width()/2);
	
	$("form.js_attributes input").each(function(){ 
		var curr=$(this)        	
		var curr_parent=curr.parent();        	
		var status=this.checked  
		var val=this.value;
		if(status==true){ 
			$(".no-any-variant").css("display","none");
			$(".clear-all-filter").css("display","block");
			
			var curr_att=curr_parent.find("label").html() 
			if(curr_att){        		
				$(".filter-option").append("<div class='attribute'>" + curr_att + "<a data-id='"+val+"' class='close-btn'>X</a> </div>")        	
			}
			if(!curr_att){        			
				val_name=$(this).attr("title")        			
				$(".filter-option").append("<div class='attribute'>" + val_name + "<a data-id='"+val+"' class='close-btn'>X</a> </div>")        		
				}
			}
		});
		
	// Pricefilter Attribute
		var p_filter = ""
		if($("input[name='min_val']").val())
		{
			p_filter = $("input[name='min_val']").val() 
			if($("input[name='max_val']").val())
			{
				p_filter += "-"+$("input[name='max_val']").val();
				
				$(".no-any-variant").css("display","none");
				$(".clear-all-filter").css("display","block");
				$(".apply-filter").css("display","block");
				$(".clear-pricefilter").css("display","block");
				$(".filter-option").append("<div class='attribute'>" + p_filter + "<a data-id='price' class='close-btn'>X</a> </div>")
			}
		}
		//clear price filter
		$(".clear-pricefilter").click(function(){
			$("input[name='min_val']").val("");
			$("input[name='max_val']").val("");
			$("form.js_attributes input").closest("form").submit();
		})
	
		/* clear particular selected attribute */
		$(".close-btn").click(function(){        			
			var id=$(this).attr("data-id")        			
			if(id){
				if(id == 'price')
				{
					$("input[name='min_val']").val("")
					$("input[name='max_val']").val("")
					$("form.js_attributes input").closest("form").submit();
				}
				else
				{
				$("form.js_attributes input[value="+id+"]").removeAttr("checked");        			
				$("form.js_attributes input").closest("form").submit();
				}
				
			}
			if(!id){        				
				var id=$(this).attr("data-value")        				
				$("form.js_attributes input[value="+id+"]").removeAttr("checked");        				
				$("form.js_attributes input").closest("form").submit();        			
			}
		});
		/*Clear all selected attribute*/
		$(".clear-all-filter").click(function(){
			$("form.js_attributes input").each(function(){        	
				var curr=$(this)
				var status=this.checked
				if(status==true)  {
				curr.removeAttr("checked");
				
				}
			});
			$("input[name='min_val']").val("")
			$("input[name='max_val']").val("")
			$(".clear-all-filter").css("display","none");
			$("form.js_attributes input").closest("form").submit();
			$(".no-any-variant").css("display","block");
		});

});
$(window).load(function(){
	$("form.js_attributes input").each(function(){ 
		var curr=$(this)        	
		var curr_parent=curr.parent();        	
		var status=this.checked  
		var val=this.value;
		if(status==true){ 
			$(".apply-filter").css("display","block");
		}else{
			$(".apply-filter").css("display","none;");
		}
	});
});
/*esc close box*/
$(document).on( 'keydown', function(e){
	if(e.keyCode === 27) {
		$(".filter-main-div").css("display","none");
	}
});
