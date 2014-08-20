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
					options[paramKey] = paramValue;
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
