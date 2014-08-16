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
				options[pparts[0]] = pparts[1];
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
