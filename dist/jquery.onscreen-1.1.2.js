/**
 * $.onScreen - v1.1.2 - Wed Jan 27 2016 10:59:14 GMT+0100 (CET)

 * @author zipang (EIDOLON LABS)
 * @url http://github.com/zipang/onscreen
 * @copyright (2016) EIDOLON LABS

 * Project images or video full screen or on any HTML element
 * Supports additional HTML content
 * Automatic preloading of resources (images) 
 * Smooth transitions using CSS3 or JS 
 */
 ;(function($, w, undefined) {

	var $viewport = $(w), doc = document,
		docStyle = (doc.body || doc.documentElement).style,
		$EMPTY_SLIDE = $(),
		_DEFAULTS = { // Default settings values
			screen: "#screen",       // That's the default ID of the screen when not passed
			stretchMode: "crop",     // Should we occupy full screen width or fit into it?
			centeredX: true,         // Should we center the image on the X axis?
			centeredY: true,         // Should we center the image on the Y axis?
			transitionSpeed: 1000,   // transition speed after image load (e.g. "fast" or 500)
			transition: "fade",
			newSlide: {opacity: 0},
			useCSSTransitions: (     // Check support for CSS3 transitions
				"WebkitTransition" in docStyle ||
				"MozTransition" in docStyle ||
				"OTransition" in docStyle ||
				"transition" in docStyle
			)
		};

	/**
	 * @constructor Initialize the screen to project on
	 */
	function Screen(screen, params) {
		var screenId = (typeof screen === "string" ? screen.replace(/^#/, "") : _DEFAULTS.screen),
			$screen = $(screen || "#" + screenId);

		if ($screen.length === 1) {
			return $screen;

		} else { // doesn't exist : create the default page screen
			return $("<div>")
				.attr("id", screenId)
				.css({
					position: "fixed",
					left: 0, top: 0,
					margin: 0, padding: params.padding || 0,
					overflow: "hidden",
					zIndex: params.zindex || -999999,
					height: "100%", width: "100%"
				})
				.prependTo("body");
		}
	}

	/**
	 * Create the div.slide element that'll receive the image and content
	 */
	function Slide($bg, content, type) {
		var $slide;

		if ($bg) {
			if (content) {
				// insert image into a frame to superpose some content over
				$slide = $("<div>").append($bg).append($(content));

			} else {
				$slide = $bg;
			}
		} else {
			return $("<div>").append($(content || ""));
		}

		return $slide.addClass("slide " + type);
	}

	if (!w.requestAnimationFrame) { // a dummy shim for our sole purpose
		w.requestAnimationFrame = function(fn) {
			setTimeout(fn, 10);
		}
	}

	/**
	 * CSS Transition will apply the 'in' and 'out' classes to slides that must transition
	 * the 'transition' class will be applied to the screen element
	 */
	function cssTransition($screen) {
		var $screen = $screen; // closure
		return function($fromSlide, $toSlide, speed, callback) {
			$toSlide.addClass("in");
			$fromSlide.addClass("out");
			$("img", $screen).show();
			$screen.addClass("transition");
			setTimeout(function transitionEnd() {
				$fromSlide.remove();
				$screen.removeClass("transition");
				$toSlide.removeClass("in");
				if (typeof callback == "function") requestAnimationFrame(callback);
				$screen.trigger(($toSlide === $EMPTY_SLIDE) ? "emptySlide" : "transitionEnd", $toSlide);
			}, speed);
		}
	}
	function jsTransition($screen) {
		var $screen = $screen; // closure

		return function($fromSlide, $toSlide, speed, callback) {

			// Prepare fadein
			$("*", $toSlide).show(); // FIX the slides with inner content not displaying

			$fromSlide.fadeOut(speed);

			$toSlide.fadeIn(speed, function() {
				$fromSlide.remove();
				// Callback
				if (typeof callback == "function") callback();
				$screen.trigger(($toSlide === $EMPTY_SLIDE) ? "emptySlide" : "transitionEnd", $toSlide);
			});
		}
	}

	/**
	 * The only public method to call to project an image or a movie
	 * @param {Object} params, can contain following attributes :
		- source (required) : URL of media to load and display
		- type : Type of media ("image"|"video"). (Default : "image")
		- transition : Name of transition to use. (Default : "fade")
		- stretchMode : How to stretch the media on screen ("adapt"|"fit"|"crop"). (Default : "crop") (cover all the screen)
		- padding {String} : The CSS padding property to define the active zone of the screen. (Default: "0" no padding)
		- centeredX {Boolean} (Default: true)
		- centeredY {Boolean} (Default: true)
		- content : HTML content to display on top of the image
		- class : Class names to add to the slide
		- callback function to call when slide has been loaded and streched
		@return a promise resolved when the slide has been loaded
	 */
	function onScreen(/* params | src, displayOptions */) {

		var $screen,
			arg1 = arguments[0] || "",
			params = arg1.source ? arg1 : arguments[1] || {},
			src = (typeof arg1 === "string") ? arg1 : params.source,
			mediaType = params.type || "image",
			plugin = onScreen.getPlugin(src), // get the plugin for the corresponding media source
			content = params.content,
			callback = params.callback,
			loaded = $.Deferred(); // plugin.load(src)


		if (!src) return loaded.reject("Invalid Params : No source").promise();

		if (src === "settings") { // settings redefinitions
			$.extend(_DEFAULTS, params);
			return loaded.resolve(_DEFAULTS);;
		}

		$screen = new Screen(params.screen, params);

		// Adjust the projected image when window is resized or orientation has changed (iOS)
		if (!$screen.data("monitored")) {
			$viewport.on("resize", adjustImage($screen));
			$screen.data("monitored", true);
		}

		// Extend the settings with those the user has provided
		var settings = $screen.data("settings") || _DEFAULTS; // If this has been called once before, use the old settings as the default

		$.extend(settings, params);

		if (settings.transition === "fade") {
			// init default fade transition
			settings.transition = settings.useCSSTransitions ? cssTransition($screen) : jsTransition($screen);
		}

		$screen.data("settings", settings);

		// Prepare to delete any old images
		var $oldSlide = $screen.find(".slide"), $newSlide;

		// Once loaded : insert the slide (bg + content) and launch the transition !
		loaded.then(function($bg, content) {

			$newSlide = ($bg || content)
				? new Slide($bg, content, mediaType)
				: $EMPTY_SLIDE; // an EMPTY jQuery object

			// Warning : the 'class' keyword is reserved and throws an Exception in IE7, 8..
			if (settings["class"] || settings.className) $newSlide.addClass(settings["class"] || settings.className);
			if (!settings.useCSSTransitions && settings.newSlide) $newSlide.css(settings.newSlide);

			$screen
				.prepend($newSlide)
				// signal that this slide has been loaded
				.trigger("loaded", [params, $newSlide]);

			if ($oldSlide.length || $newSlide.length) {
				settings.transition($oldSlide, $newSlide, settings.transitionSpeed, callback);
			}
		});

		if (!src) { // transparent slide !!
			mediaType = "empty";
			$screen.data("image", undefined);
			loaded.resolve(undefined, content);

		} else if (mediaType === "image") {

			if (typeof src === "string") {
				var $img = $("<img>").css({
					display: "none",
					zIndex: -999999,
					width: "auto", height: "auto"
				});

				$img.on("load", function imageLoaded() {

					$screen
						.data("image", $img)
						.append(// store the native image format when just loaded
							$img.data("format", $img.width() / $img.height())
						);

					// warn that we have been loaded
					loaded.resolve(adjustImage($screen)(), content);

				}).on("error", function ()  {
					$screen.data("image", undefined);
					loaded.resolve(undefined, content);

				}).attr("src", src);

			} else { // <img> allready
				$screen.data("image", src);
				src.data("format", src.width() / src.height()); // store the native image format when just loaded
				src.removeAttr("style").appendTo($screen);
				loaded.resolve(adjustImage($screen)(), content);
			}

		} else { // how do we preload a video ..?
			loaded.resolve(plugin.load(src, params), content);
			$screen.data("image", $("iframe", $screen));
		}


		/**
		 * Recenter image/content on screen as needed
		 */
		function adjustImage($screen) {

			var $screen = $screen; // create the closure
			return function() {

				var vW = $screen.width(), // - $screen.css("paddingLeft") - $screen.css("paddingRight"),
					vH = $screen.height(), // - $screen.css("paddingTop") - $screen.css("paddingBottom"),
					$image = $screen.data("image");

				if (!$image) return;

				// try the usual stretch on $image's width
				var imgRatio  = $image.data("format"),
					imgWidth  = vW,
					imgHeight = imgWidth / imgRatio;

				if (settings.stretchMode == "crop") {

					if (imgHeight < vH) { // stretch the other way
						imgHeight = vH;
						imgWidth  = imgHeight * imgRatio;
					}
				} else if (settings.stretchMode == "adapt") {

					if (imgRatio < 1) { // $image in portrait mode : stretch the other way
						imgHeight = vH;
						imgWidth  = imgHeight * imgRatio;
					}
				} else { // fit

					if (imgHeight > vH) {
						imgHeight = vH;
						imgWidth  = imgHeight * imgRatio;
					}
				}

				var position = {position: "absolute", left: 0, top: 0};

				// Center as needed
				if (settings.centeredY) {
					$.extend(position, {top: ((vH - imgHeight) / 2) + "px"});
				}

				if (settings.centeredX) {
					$.extend(position, {left: ((vW - imgWidth) / 2) + "px"});
				}

				return $image.width(imgWidth).height(imgHeight).css(position);
			}
		} // adjustImage

		// To act as soon as the image is loaded
		return loaded.promise();
	};

	$.extend(onScreen, {
		_plugins: {},
		getPlugin : function(src, type) {

			var plugins = onScreen._plugins,
				plugin, pluginName;

			if (type && plugins[type]) return plugins[type];

			// try each registered plugin to handle the source
			for (pluginName in plugins) {
				plugin = plugins[pluginName];

				if (plugin.canHandle(src)) return plugin;
			}

			return undefined;
		},
		addPlugin : function(name, test, bgFactory) {
			var testMethod = (test instanceof RegExp) ?
				function(src) {
					return test.test(src);
				} : test;
			onScreen._plugins[name] = {
				canHandle: testMethod,
				load: bgFactory
			};
			return onScreen;
		}
	});


	/**
	 * Adds our only original plugin
	 */
	onScreen.addPlugin("image", function test(src) {
		if (typeof src === "string") {
			return /\.(png|jpg|jpeg|gif)$/i.test(src);

		} else if ($(src).prop("tagName") === "IMG") {
			return true;
		}
	}, function build(src) {
		return src;
	});

	$.onScreen = onScreen;

})(window.jQuery || window.Zepto, window);


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
			if (typeof slide === "object") {
				onScreen(slide.src, $.extend({}, settings, slide));

			} else { // string
				onScreen(slide, settings);
			}

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

 