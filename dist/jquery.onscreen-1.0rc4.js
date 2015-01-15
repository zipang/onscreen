/**
 * $.onScreen - v1.0rc4 - Thu Jan 15 2015 03:06:41 GMT+0100 (CET)

 * @author zipang (EIDOLON LABS)
 * @url http://github.com/zipang/onscreen
 * @copyright (2015) EIDOLON LABS

 * Project images or video full screen or on any HTML element
 * Supports additional HTML content
 * Automatic preloading of resources (images) 
 * Smooth transitions using CSS3 or JS 
 */
 ;(function($, w, undefined) {

	var $viewport = $(w),
		$EMPTY_SLIDE = $();

	// Initialize the screen to project on
	function Screen(screen, params) {
		var screenId = (typeof screen === "string" ? screen : _DEFAULTS.screen).replace(/^#/, ""),
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

		if ($bg) {
			if (content) {
				// insert image into a frame to superpose some content over
				return $("<div>").addClass("slide").addClass(type).append($bg).append($(content));

			} else {
				return $bg.addClass("slide").addClass(type).show();
			}
		} else {
			return $("<div>").addClass("slide").addClass(type).append($(content || ""));
		}
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

			$fromSlide.animate({opacity: 0}, speed);

			$toSlide
				.animate({opacity: 1}, {
					duration: speed,
					start: function() {
						$toSlide.css("display", "block");
					},
					complete : function() {
						$fromSlide.remove();
						// Callback
						if (typeof callback == "function") callback();
						$screen.trigger(($toSlide === $EMPTY_SLIDE) ? "emptySlide" : "transitionEnd", $toSlide);
					}
				});
		}
	}

	// Support for CSS3 transitions detection
	var doc = document,
		docStyle = (doc.body || doc.documentElement).style;
	$.support.transition = (
		"WebkitTransition" in docStyle ||
		"MozTransition" in docStyle ||
		"OTransition" in docStyle ||
		"transition" in docStyle
	);

	var _DEFAULTS = {
		screen: "#screen",				 // That's the default ID of the screen when not passed
		stretchMode: "crop",     // Should we occupy full screen width or fit into it?
		centeredX: true,         // Should we center the image on the X axis?
		centeredY: true,         // Should we center the image on the Y axis?
		transitionSpeed: 1000,   // transition speed after image load (e.g. "fast" or 500)
		useCSSTransitions: true,
		transition: "fade"
	};


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

		$screen = new Screen(params.screen, params).show();

		// Adjust the projected image when window is resized or orientation has changed (iOS)
		if (!$screen.data("monitored")) {
			$viewport.on("resize", adjustImage($screen));
			$screen.data("monitored", true);
		}

		// Extend the settings with those the user has provided
		var settings = $screen.data("settings") || _DEFAULTS; // If this has been called once before, use the old settings as the default

		$.extend(settings, params);
		$screen.data("settings", settings);

		if (settings.transition === "fade") { // default fade transition
			settings.transition = (settings.useCSSTransitions && $.support.transition) ?
				cssTransition($screen) : jsTransition($screen);
		}


		// Prepare to delete any old images
		var $oldSlide = $screen.find(".slide"), $newSlide;

		// Once loaded : insert the slide (bg + content) and launch the transition !
		loaded.then(function($bg, content) {

			$newSlide = ($bg || content)
				? new Slide($bg, content, mediaType)
				: $EMPTY_SLIDE; // an EMPTY jQuery object

			// Warning : the 'class' keyword is reserved and throws an Exception in IE7, 8..
			if (settings["class"] || settings.className) $newSlide.addClass(settings["class"] || settings.className);

			// signal that this slide has been loaded
			$screen
				.append($newSlide)
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
				var $imgLoader = $("<img>").css({
					display: "none",
					zIndex: -999999,
					width: "auto", height: "auto"
				});

				$imgLoader.on("load", function imageLoaded() {

					$imgLoader.data("format", $imgLoader.width() / $imgLoader.height()); // store the native image format when just loaded
					$screen.data("image", $imgLoader);

					// warn that we have been loaded
					loaded.resolve(adjustImage($screen)(), content);

				}).on("error", function ()  {
					$screen.data("image", undefined);
					loaded.resolve(undefined, content);

				}).appendTo($screen).attr("src", src);

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

})(window.jQuery || window.Zepto, this);


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
		function displaySlide(index, options) {

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

			return onScreen(slides[currentIndex], options);
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

/* YOUTUBE PLUGIN FOR jQuery onScreen
  EXAMPLE
  *	YOUTUBE SHARE URL :
	http://youtu.be/xA8W4xbVylw
  * GENERATED PLAYER
	<div class="video-container">
		<iframe src="//www.youtube.com/embed/xA8W4xbVylw?rel=0"
			width="853" height="480" frameborder="0" allowfullscreen>
		</iframe>
	</div>
*/
(function($) {

	// DEFAULT VALUES
	var PLAYER_WIDTH  = 640,
		PLAYER_HEIGHT = 480;

	/**
	 * Detect a VIMEO URL
	 */
	function detectYoutubeSource(src) {
		return (src && /youtu/gi.test(src));
	}

	function extractVideoId(youtubeShareUrl) {
		/* We will not receive the watch?v= kind of URLs
		   They have been transformed into standard share URLs
		if (youtubeUrl.indexOf("watch?v=") !== -1) {
			// that's the page URL !
			return youtubeUrl.split("watch?v=").pop();
		} */
		return youtubeShareUrl.split("/").pop(); // extract last member
	}

	/**
	 * This is the iframe source URL
	 */
	function generatePlayerURL(videoId, options) {
		var url    = "//www.youtube.com/embed/" + videoId,
			params = ["rel=0&showinfo=0"];// don't show related videos and top title/info bar

		// Automatically launch video
		if (options.autoplay) params.push("autoplay=1");

		return [url, params.join("&")].join("?");
	}

	/**
	 * Build the player for the requested youtube URL
	 */
	function generatePlayer(src, options) {

		options = options || {};

		// extract params passed in the URL like : ?width=640&height=480
		if (src.indexOf("?") !== -1) {

			var parts = src.split("?"),
				params = parts[1].split("&");

			$.each(params, function(i, paramExpr) {
				var pparts = paramExpr.split("="),
					paramKey = pparts[0],
					paramValue = pparts[1];

				if (paramKey === "v") { // that's the video id !
					// reforge the real share URL
					parts[0] = "http://youtu.be/" + paramValue;

				} else { // some additional params..
					// note that parameters passed through the option object are
					// prevalent upon thouse found in the URL
					if (!options[paramKey]) options[paramKey] = paramValue;
				}
			});

			src = parts[0];
		}

		var videoId   = extractVideoId(src),
			playerUrl = generatePlayerURL(videoId, options),
			width     = options.width  || PLAYER_WIDTH,
			height    = options.height || PLAYER_HEIGHT,
			format    = width/height;

		var $iframe   = $("<iframe>")
				.attr("src", playerUrl)
				.attr("width", width)
				.attr("height", height)
				.attr("frameborder", 0)
				.attr("allowfullscreen", "0")
				.data("format", format),
			$container = $("<div>")
				.attr("class", "video-container"),
			$embed = $("<div>")
				.attr("class", "embed-responsive")
			;

		return $container.append($embed.append($iframe));

}

	if ($ && $.onScreen) $.onScreen.addPlugin("youtube", detectYoutubeSource, generatePlayer);

})(window.jQuery || window.Zepto);

/* VIMEO PLUGIN FOR jQuery onScreen
  EXAMPLE
  *	VIMEO URL :
	http://vimeo.com/85970315
  * GENERATED PLAYER
	<div class="video-container">
		<iframe src="//player.vimeo.com/video/85970315?title=0&amp;byline=0&amp;portrait=0&amp;loop=1;color=000000;"
			class="vimeo-video" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen="" frameborder="0"
			height="540" width="960"></iframe>
	</div>
*/
(function($) {

	// DEFAULT VALUES
	var PLAYER_WIDTH = 640,
		PLAYER_HEIGHT = 480;

	/**
	 * Detect a VIMEO URL
	 */
	function detectVimeoSource(src) {
		return (src && src.indexOf("vimeo.com") !== -1);
	}

	function extractVideoId(vimeoUrl) {
		return vimeoUrl.split("/").pop(); // extract last member
	}

	/**
	 * This is the iframe source URL
	 */
	function generateVimeoPlayerURL(videoId, options) {
		var params = [], url = "//player.vimeo.com/video/" + videoId;

		// Hide the video title unles options.title=true
		if (!options.title) params.push("title=0");
		// Hide the 'Made By' line unless options.byline=true
		if (!options.byline) params.push("byline=0");
		// Hide the author's logo unless options.portrait=true
		if (!options.portrait) params.push("portrait=0");
		// choose the letters colors in the player's controls
		if (options.color) params.push("color=" + options.color);

		// Automatically launch video
		if (options.autoplay) params.push("autoplay=1");

		return [url, params.join("&")].join("?");
	}

	/**
	 * Build the player for the requested vimeo URL
	 */
	function generateVimeoPlayer(src, options) {

		options = options || {};

		// extract params passed in the URL like : ?width=640&height=480
		if (src.indexOf("?") !== -1) {

			var parts = src.split("?"),
				params = parts[1].split("&");

			$.each(params, function(i, param) {
				var pparts = param.split("=");
				if (!options[pparts[0]]) options[pparts[0]] = pparts[1];
			});

			src = parts[0];
		}

		var videoId   = extractVideoId(src),
			playerUrl = generateVimeoPlayerURL(videoId, options),
			width     = options.width  || PLAYER_WIDTH,
			height    = options.height || PLAYER_HEIGHT,
			format    = width/height;

		var $iframe   = $("<iframe>")
				.attr("src", playerUrl)
				.attr("width", width)
				.attr("height", height)
				.attr("frameborder", 0)
				.attr("allowfullscreen", "0")
				.data("format", format),
			$container = $("<div>")
				.attr("class", "video-container"),
			$embed = $("<div>")
				.attr("class", "embed-responsive")
			;

		return $container.append($embed.append($iframe));

	}

	if ($ && $.onScreen) $.onScreen.addPlugin("vimeo", detectVimeoSource, generateVimeoPlayer);

})(window.jQuery || window.Zepto);

 