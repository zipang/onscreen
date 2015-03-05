(function($, w, undefined) {

	var onScreen = $.onScreen;

	if (!onScreen) return;

	var _DEFAULTS = {
		autoplay: true,
		screen: "#screen",
		slideDuration: 4000,
		transitionSpeed: 1500,
		keyControls: true, // support default key pressed actions
		videoPlayer: {
			bgcolor: "black",
			width: 960,
			height: 540,
			autoplay: 1,
			color: "111"
		}
	};

	function SlideShow(slides, options) {

		var settings = $.extend({}, SlideShow.defaults, options),
			len = slides.length,
			currentIndex = 0,
			autoplay = settings.autoplay;

		/**
		 * Go to the specified slide, or to the next one
		 */
		function displaySlide(index) {

			if (typeof index === "string" && index === "last") {
				currentIndex = len - 1;

			} else if (typeof index === "string" && index === "fist") {
				currentIndex = 0;

			} else if (index === undefined || index < 0 || index >= len) {
				// invalid value > auto play
				currentIndex = (currentIndex + 1) % len;

			} else {
				currentIndex = index;
			}

			// Program next slide
			displaySlide.future = (autoplay) ? setTimeout(function () {
				requestAnimationFrame(displaySlide);
			}, settings.slideDuration) : 0;

			// display the new slide
			var slide = slides[currentIndex];
			onScreen(typeof slide === "string" ? slide : slide.src, settings);

			// dispatch slide events as requested
			if (settings.events) $(settings.screen).trigger("slide", slides[currentIndex]);
		}



		function stop() {
			autoplay = false;
			clearTimeout(displaySlide.future);
		}
		function play() {
			autoplay = true;
			displaySlide();
		}
		function next(evt) {
			stop();
			displaySlide(currentIndex + 1);
			if (evt) evt.preventDefault();
		}
		function previous(evt) {
			stop();
			displaySlide(currentIndex ? currentIndex - 1 : len - 1);
			if (evt) evt.preventDefault();
		}

		function playPause() {
			(autoplay) ? stop() : play();
		}

		// Keyboard Handler
		function keyHandler(evt) {
			switch (evt.keyCode) {
				case 37: // LEFT
					previous();
					break;
				case 39: // RIGHT
					next();
					break;
				case 32: // SPACE
					playPause();
			}
		}

		if (settings.keyControls) $(document).on("keydown", keyHandler);

		onScreen("settings", settings); // this first call just sets the defaults settings

		displaySlide(0);

		return { // return the interface
			stop: stop,
			play: play,
			playPause: playPause,
			displaySlide: displaySlide,
			previous: previous,
			next: next
		};
	}

	SlideShow.defaults = _DEFAULTS;

	// Redefine $.onScreen to handle an array of slides
	$.onScreen = function(slides, options) {
		if ($.isArray(slides)) {
			return new SlideShow(slides, options);

		} else {
			onScreen(slides, options);
		}
	}
	$.extend($.onScreen, {
		_plugins: onScreen._plugins,
		getPlugin: onScreen.getPlugin,
		addPlugin: onScreen.addPlugin
	});


})(window.jQuery || window.Zepto, this);
