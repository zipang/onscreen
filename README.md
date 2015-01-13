$.onScreen (jQuery Plugin)
==========================

> _Isn't life a series of images that change as they repeat themselves?_  
Andy Warhol


## Quick Presentation

1. Basic
  * Project slides (Medias + overlays) on the page background or on _any element_ of your page with a large choice of settings (fullscreen, stretch mode, padding).
  * Wait for images to be loaded to display them with a nice customizable animation effect (fadein is the default)
  * Dynamically resize and reposition the image when screen is resized or rotated.

2. Plugins

  * What medias can be displayed and how they are displayed is the matter of integrating the plugins you need.
  * The basic included plugin is the image plugin (think : backstretch).  
    Further plugins allready allow to display : transparent slide, video slides (Vimeo, Youtube..)
  * A basic slideshow plugin is offered that just takes a list of media sources and can be controlled with the keyboard.

## Code Examples

```js
// Load and display a streched background image 
// (no container specified >> the projections applies itself on the page body for a 'fullscreen projection effect')
$.onScreen("img/fullscreen-background.jpg");

// Load and display 2 fitting images on alternates screens
$.onScreen("img/slide1.jpg", {screen: "#screen1", stretchMode: "fit"});
$.onScreen("img/slide2.jpg", {screen: "#screen2", stretchMode: "adapt"});

// Project an animated slide with a video and html overlay content
$.onScreen({
  source: "http://youtu.be/9bZkp7q19f0", 
  content: "<h2>Moving Images</h2>"
});
```


