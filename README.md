$.onScreen (jQuery Plugin)
==========================

> _Isn't life a series of images that change as they repeat themselves?_  
Andy Warhol


## Purpose

* Control slides projection (Media + overlays) on the page background or on any element of your page with a large choice of settings (stretch, padding).
* Dynamically resize and reposition the image when screen is resized or rotated.
* Any further call on the same screen element will display a nice transition that can be controlled by JavaScript or CSS3 animations.

```js
// Load and display a streched background image (no container specified)
$.onScreen("img/background.jpg");
```

## Extensible with plugins.

What media can be displayed and how they are displayed is the matter of integrating the plugins you need.
The first plugin  functionality is offered byt the image plugin is an image stretcher plugin that allow deferred loading of images, 
thus reproducing all the functionality of backstretch.  
Further plugins allready allow to display : transparent slide, video slides (Vimeo, Youtube..)

## Slideshow.

A basic slideshow plugin is offered that just takes a list of media sources and can be controlled with the keyboard.

