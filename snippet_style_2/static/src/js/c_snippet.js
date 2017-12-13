// Set the date we're counting down to
var countDownDate = new Date("july 29, 2018 7:30:00").getTime();

// Update the count down every 1 second
var x = setInterval(function() {
	
	// Get todays date and time
	var now = new Date().getTime();
	
	// Find the distance between now an the count down date
	var distance = countDownDate - now;// Time calculations for days, hours, minutes and seconds
	
	
	if (distance > 0) {
			var days = Math.floor(distance / (1000 * 60 * 60 * 24));
			var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((distance % (1000 * 60)) / 1000);
			
			if ((seconds+'').length == 1) {
				seconds = "0" + seconds;
			}
			if ((days+'').length == 1) {
				days = "0" + days;
			}
			if ((hours+'').length == 1) {
				hours = "0" + hours;
			}
			if ((minutes+'').length == 1) {
				minutes = "0" + minutes;
			}
	
	}
	// If the count down is over, write some text
	if (distance <= 0) 
	{
		clearInterval(x);
		seconds = "00" ;
		days = "00";
		minutes = "00";
		hours = "00";
	}
	 
	
	if($(".snippet_right_timer_div").length > 0)
	{
		// Output the result in an element with id="date_timer"
		document.getElementById("days").innerHTML =days;
		document.getElementById("d_lbl").innerHTML ="days";
		document.getElementById("hours").innerHTML =hours;
		document.getElementById("h_lbl").innerHTML ="hours";
		document.getElementById("minutes").innerHTML =minutes;
		document.getElementById("m_lbl").innerHTML ="minutes";
		document.getElementById("seconds").innerHTML =seconds;
		document.getElementById("s_lbl").innerHTML ="seconds";
		
	}

	
	}, 1000);
