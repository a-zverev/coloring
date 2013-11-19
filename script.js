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
	function getXmlHttp(){
		var xmlhttp;
		try {
			xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (E) {
				xmlhttp = false;
			}
		}
		if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
			xmlhttp = new XMLHttpRequest();
		}
		return xmlhttp;	
	}

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
		console.log(sourceImage.width);
		try {
			dctx.drawImage(sourceImage, 0, 0);
			data.image.pixels = dctx.getImageData(0, 0, dataCanvas.width, dataCanvas.height);
		} catch (e) {
			console.log(e);
		}
	}

	// Loading palette
	var xmlHttp = new getXmlHttp();
	console.log(undefined);
	xmlHttp.open('GET', 'legend_example.icxleg', true);
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200) {
				var responseXML = (new DOMParser()).parseFromString(xmlHttp.responseText, 'text/xml');
				console.log({Pa:responseXML});
				var paletteNodes = responseXML.firstChild.firstElementChild.childNodes;
				var palette = [];
				console.log(paletteNodes);
				for (var i = 0; i < paletteNodes.length; i++) {
					if (paletteNodes[i].nodeType == 3)
						continue;
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

function render(canvas, data) {
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

	var ctx = canvas.getContext('2d');
	var palette = data.palette;
	var pixels = data.image.pixels.data;

	palette = fixPalette(palette);
	
	for (var i = 0; i < pixels.length; i += 4) {
		var brightness = pixels[i];
		if(typeof palette[brightness] == "undefined")
			continue;
		pixels[i] = palette[brightness].r;
		pixels[i+1] = palette[brightness].g;
		pixels[i+2] = palette[brightness].b;
	}
	canvas.width = data.image.width;
	canvas.height = data.image.height;
	ctx.putImageData(data.image.pixels, 0, 0);
}

bindReady(function() {
	var canvas = document.getElementById('main-canvas');
	if (typeof canvas.getContext !== "function") {
		//throw { message: "canvas is not supported" };
		console.log("canvas is not supported");
	} else {
		console.log("loading...");
		loadData(function(data) {
			console.log("drawing...");
			render(canvas, data);
		});
	}
});