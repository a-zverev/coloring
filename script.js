function bindReady(handler) {
	// TODO: cross-browser support
	var called = false;

	function ready() {
		if(called) 
			return;
		called = true;
		handler();
	}

	if(window.addEventListener)
		window.addEventListener('load', ready, false);
	else if(window.attachEvent)
		window.attachEvent('onload', ready);
}

function loadData(handler) {
	// Data to load
	var data = {
		image: {
			width: undefined,
			height: undefined,
			pixels: null
		},
		palette: null
	};
	
	// Loading source image
	var sourceImage = new Image();
	sourceImage.src = 'src_image.png'; 
	sourceImage.onload = function() {
		// Creating a canvas to read image pixels
		var dataCanvas = document.createElement('canvas');
		data.image.width = dataCanvas.width = sourceImage.width;
		data.image.height = dataCanvas.height = sourceImage.height;
		var dctx = dataCanvas.getContext('2d'); 
		dctx.drawImage(sourceImage, 0, 0);
		data.image.pixels = dctx.getImageData(0, 0, dataCanvas.width, dataCanvas.height);
	}

	// Loading palette
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open('GET', 'legend_example.icxleg', true);
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200) {
				var responseXML = (new DOMParser()).parseFromString(xmlHttp.responseText, 'text/xml');
				var paletteNodes = responseXML.children[0].children[0].children;
				var palette = [];
				for (var i = 0; i < paletteNodes.length; i++) {
					var code = ((paletteNodes[i].getElementsByTagName('Part_Red')[0].textContent)/1);
					palette[code] = {
						r: ((paletteNodes[i].getElementsByTagName('Part_Red')[0].textContent)/1),
						g: ((paletteNodes[i].getElementsByTagName('Part_Green')[0].textContent)/1),
						b: ((paletteNodes[i].getElementsByTagName('Part_Blue')[0].textContent)/1)
					};
				}
				data.palette = palette;
			}
		}
	};
	xmlHttp.send(null);

	function isReady() {
		if (data.image.pixels == null || data.palette == null) {
			setTimeout(isReady, 200);
			return;
		}

		handler(data);
	}

	isReady();
}

bindReady(function() {
	var canvas = document.getElementById('main-canvas');
	if (typeof canvas.getContext !== "function")
		throw { messages: "canvas is not supported" };
	var ctx = canvas.getContext('2d');

	function fixPalette(palette) {
		var previous;
		for(var i = 0; i < 256; i++) {
			if(typeof palette[i] == "undefined")
				palette[i] = previous;
			else
				previous = palette[i];
		}
		return palette;
	}

	console.log("loading...");
	loadData(function(data) {
		console.log("drawing...");
		var palette = data.palette;
		var pixels = data.image.pixels.data;
		palette = fixPalette(palette);
		for (var i = 0; i < pixels.length; i+=4) {
			var brightness = pixels[i];
			if(typeof palette[brightness] == "undefined")
				continue;
			pixels[i] = palette[brightness].r;
			pixels[i+1] = palette[brightness].g;
			pixels[i+2] = palette[brightness].b;
			//pixels[i+1] = 76;
			//console.log(pixels[i] + "." + pixels[i+1] + "." + pixels[i+2]);
		}
		canvas.width = data.image.width;
		canvas.height = data.image.height;
		ctx.putImageData(data.image.pixels, 0, 0);
	});
});