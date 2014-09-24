;(function($, w, undefined) {

	var $viewport = $(w),
		$EMPTY_SLIDE = $();

	// Initialize the screen to project on
	function Screen(screen, params) {

		if (!screen) {
			screen = "#screen";
		} else if (typeof screen === "string") {
			if (screen.indexOf("#") !== 0) screen = "#" + screen; // make it an id
		}
		
		var $screen = $(screen);

		if ($screen.length === 0) { // doesn't exist : create the full page screen
			$screen = $("<div>")
				.attr("id", screen)
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
		return $screen;
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

	/* *
	 *
	 */
	var defaultSettings = {
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
			$.extend(defaultSettings, params);			
			return loaded.resolve(defaultSettings);;
		}

		$screen = new Screen(params.screen, params).show();

		// Adjust the projected image when window is resized or orientation has changed (iOS)
		if (!$screen.data("monitored")) {
			$viewport.on("resize", adjustImage($screen));
			$screen.data("monitored", true);
		}

		// Extend the settings with those the user has provided
		var settings = $screen.data("settings") || defaultSettings; // If this has been called once before, use the old settings as the default

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

