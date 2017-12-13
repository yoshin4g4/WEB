$(".zoomed_image_on_screen").css("display","none")
if($(window).width() < 1200)
{                     
	$("body").removeClass("image_zoom");
}
else
{
setTimeout(function(){
	$(".image_zoom").click(function(){
	$('body').css('position','fixed')
	$(".zoomed_image_on_screen").css("display","block")
	$('.zooming_image_screen').attr('src', $(this).children("img").attr('src'));
	var a = $(window).height();
	$(".zooming_image_screen_o").css({"position":"relative","overflow":"hidden","white-space":"nowrap","height":a})
	var $gal = $(".zooming_image_screen_o"),
	galW = $gal.outerHeight(true),
	galSW = $gal[0].scrollHeight,
	wDiff = (galSW/galW)-1, // widths difference ratio
	mPadd = 10, // Mousemove Padding
	damp = 20, // Mousemove response softness
	mX = 0, // Real mouse positionm
	X2 = 0, // Modified mouse position
	posX = 0,
	mmAA = galW-(mPadd*1), // The mousemove available area
	mmAAr = (galW/mmAA); // get available mousemove fidderence ratio
		$gal.mousemove(function(e) {
			mX = e.pageY - $(this).parent().offset().top - this.offsetTop;
			mX2 = Math.min( Math.max(0, mX-mPadd), mmAA ) * mmAAr;
			});
		setInterval(function(){
			posX += (mX2 - posX) / damp; // zeno's paradox equation "catching delay"
			$gal.scrollTop(posX*wDiff);
			},10);
		});

	$(".p_class_cross_image").click(function(){
		$('body').css('position','relative')
		$(".zoomed_image_on_screen").css("display","none");
	});
	$(document).keyup(function(e) {
	    if (e.which == 27) {
	    	$('body').css('position','relative')
	        $(".zoomed_image_on_screen").css("display","none");
	    }
	});
	$(".ref_imgs").click(function(){
		var image_class = $(this).parents('.div_parent_zoom_class').children('.zooming_image_screen_o');
		image_class = this	
		$('.zooming_image_screen').attr('src', $(this).children("img").attr('src'));
	});
	
},1000)

		   }


	


