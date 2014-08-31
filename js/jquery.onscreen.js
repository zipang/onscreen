 /**
 * jQuery onScreen

 * @author zipang
 * @copyright 2014 - EIDOLON LABS
 * @url https://github.com/zipang/onscreen
 *
 * Project stretched slides or video with additional content on the screen
 * Include automatic preloading of resources (images) and smooth transitions
 * using CSS3 or JS
 *
 */
;(function($, w, undefined) {

	var $viewport = $(w),
		$EMPTY_SLIDE = $();

	// Initialize
	function Screen(id, zindex) {

		var screenId = (id  || "screen").replace("#", ""),
			$screen = $("#" + screenId);

		if ($screen.length === 0) {
			$screen = $("<div>")
				.attr("id", screenId)
				.css({
					position: "fixed",
					left: 0, top: 0,
					margin: 0, padding: 0,
					overflow: "hidden",
					zIndex: zindex || -999999,
					height: "100%", width: "100%"
				})
				.prependTo("body");
		}
		return $screen;
	}


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

	function cssTransition($screen) {
		var $screen = $screen; // closure
		return function($fromSlide, $toSlide, speed, callback) {
			$.onScreen.transition = true;
			$toSlide.addClass("in");
			$fromSlide.addClass("out");
			$("img", $screen).show();
			$screen.addClass("transition");
			setTimeout(function transitionEnd() {
				$fromSlide.remove();
				$screen.removeClass("transition");
				$toSlide.removeClass("in");
				$.onScreen.transition = false;
				if (typeof callback == "function") requestAnimationFrame(callback);
				$screen.trigger(($toSlide === $EMPTY_SLIDE) ? "emptySlide" : "transitionEnd", $toSlide);
			}, speed);
		}
	}
	function jsTransition($screen) {
		var $screen = $screen; // closure
		return function($fromSlide, $toSlide, speed, callback) {
			$.onScreen.transition = true;
			$fromSlide.fadeOut(speed);
			$("img", $screen).show();
			$toSlide.fadeIn(speed, function() {
				$fromSlide.remove();
				$.onScreen.transition = false;
				// Callback
				if (typeof callback == "function") callback();
				$screen.trigger(($toSlide === $EMPTY_SLIDE) ? "emptySlide" : "transitionEnd", $toSlide);
			});
		}
	}

	// Detect CSS3 transitions detection
	var doc = document,
		docStyle = (doc.body || doc.documentElement).style;
	$.support.transition = (
		"WebkitTransition" in docStyle ||
		"MozTransition" in docStyle ||
		"OTransition" in docStyle ||
		"transition" in docStyle
	);

	/* *
	 *
	 */
	var defaultSettings = {
		stretchMode: "crop",     // Should we occupy full screen width or fit into it?
		centeredX: true,         // Should we center the image on the X axis?
		centeredY: true,         // Should we center the image on the Y axis?
		speed: 1000,             // transition speed after image load (e.g. "fast" or 500)
		useCSSTransitions: true,
		transition: "fade"
	};


	/**
	 * The only public method to call to project an image or a movie
	 * @param {Object} arg, can contain following attributes :
		- source : URL of media to load and display
		- type : Type of media ("image"|"video"). (Default : "image")
		- transition : Name of transition to use. (Default : "fade")
		- stretchMode : How to stretch the media on screen ("adapt"|"fit"|"crop"). (Default : "crop") (cover all the screen)
		- centeredX {Boolean} (Default: true)
		- centeredY {Boolean} (Default: true)
		- content : HTML content to display on top of the image
		- class : Class names to add to the slide
		- callback function to call when slide has been loaded and streched
		@return a promise resolved when the slide has been loaded
	 */
	$.onScreen = function(/* arg */) {

		var arg = arguments[0] || "", $screen,
			src = (typeof arg === "string") ? arg : arg.source,
			mediaType = arg.type || "image",
			plugin = $.onScreen.getPlugin(src), // get the plugin for the corresponding media source
			content = arg.content,
			callback = arg.callback,
			loaded = $.Deferred(); // plugin.load(src)


		if (!arg || $.onScreen.transition) {
			return loaded.reject("Transition in progress").promise(); // don't allow new call before the previous transition is over
		}

		$screen = new Screen(arg.screen, arg.zindex).show();

		// Adjust the projected image when window is resized or orientation has changed (iOS)
		if (!$screen.data("monitored")) {
			$viewport.on("resize", adjustImage($screen));
			$screen.data("monitored", true);
		}

		// Extend the settings with those the user has provided
		var settings = $screen.data("settings") || defaultSettings; // If this has been called once before, use the old settings as the default

		for (var key in defaultSettings) {
			if (arg.hasOwnProperty(key)) settings[key] = arg[key];
		}
		$screen.data("settings", settings);

		if (settings.transition === "fade") { // default fade transition
			settings.transition = (settings.useCSSTransitions && $.support.transition) ?
				cssTransition($screen) : jsTransition($screen);
		}


		// Prepare to delete any old images
		var $oldSlide = $screen.find(".slide"), $newSlide, $imgLoader;

		// Once loaded : insert the slide (bg + content) and launch the transition !
		loaded.then(function($bg, content) {

			$newSlide = ($bg || content)
				? new Slide($bg, content, mediaType)
				: $EMPTY_SLIDE; // an EMPTY jQuery object

			if (settings.class) $newSlide.addClass(settings.class);

			// signal that this slide has been loaded
			// we prepend the image/video so its caption will show below
			$screen
				.prepend($newSlide)
				.trigger("loaded", [arg, $newSlide]);

			if ($oldSlide.length || $newSlide.length) {
				settings.transition($oldSlide, $newSlide, settings.speed, callback);
			}
		});

		if (!src) { // transparent slide !!
			mediaType = "empty";
			$screen.data("image", undefined);
			loaded.resolve(undefined, content);

		} else if (mediaType === "image") {

			$imgLoader = $("<img>")
				.css({
					display: "none",
					zIndex: -999999,
					width: "auto", height: "auto"

				}).on("load", function imageLoaded() {

					$imgLoader.data("format", $imgLoader.width() / $imgLoader.height()); // store the native image format when just loaded
					$screen.data("image", $imgLoader);

					// warn that we have been loaded
					loaded.resolve(adjustImage($screen)(), content);

				}).on("error", function ()  {
					$screen.data("image", undefined);
					loaded.resolve(undefined, content);

				}).appendTo($screen).attr("src", src);

		} else { // how do we preload a video ..?
			loaded.resolve(plugin.load(src, arg), content);
			$screen.data("image", $("iframe", $screen));
		}


		/**
		 * Recenter image/content on screen as needed
		 */
		function adjustImage($screen) {

			var $screen = $screen; // create the closure
			return function() {

				var vW = $viewport.width(), vH = $viewport.height(),
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

	$.extend($.onScreen, {
		getPlugin : function(src, type) {

			var plugins = $.onScreen.plugins,
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
			var plugins = ($.onScreen.plugins === undefined) ? $.onScreen.plugins = {} : $.onScreen.plugins;

			plugins[name] = {
				canHandle: test,
				load: bgFactory
			};
		}
	});


	/**
	 * Adds our only original plugin
	 */
	$.onScreen.addPlugin("image", function test(src) {
		return (/\.(png|jpg|jpeg|gif)$/i).test(src);

	}, function build(src, options) {

	});

	$.onScreen.addPlugin("empty-slide", function test(src) {
		return (typeof src !== "string");

	}, function build(src, options) {

	});


})(window.jQuery || window.Zepto, this);

