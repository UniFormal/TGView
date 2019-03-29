/**
 * Sets the current browser location to given url
 * @param curLoc URL to set location to 
 */
export function setLocation(curLoc: string): void {
	try {
		history.pushState(null, document.title, curLoc);
	} catch (e) {
		location.hash = '#' + curLoc;
	}
}

/**
 * This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
 * Adam Cole, 2011-Sept-14
 * HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 * @returns {string} 
 */
export function rainbow(numOfSteps: number, step: number): string {
	let r = 0;
	let g = 0;
	let b = 0;
	
	const h = step / numOfSteps;
	const i = ~~(h * 6);
	const f = h * 6 - i;
	const q = 1 - f;
	switch (i % 6) {
		case 0: r = 1; g = f; b = 0; break;
		case 1: r = q; g = 1; b = 0; break;
		case 2: r = 0; g = 1; b = f; break;
		case 3: r = 0; g = q; b = 1; break;
		case 4: r = f; g = 0; b = 1; break;
		case 5: r = 1; g = 0; b = q; break;
	}

	const c = '#' + ('00' + (~ ~(r * 255)).toString(16)).slice(-2) + ('00' + (~ ~(g * 255)).toString(16)).slice(-2) + ('00' + (~ ~(b * 255)).toString(16)).slice(-2);
	return (c);
}


/**
 * Extracts a parameter from a URL by name
 * @param name Name of parameter to extract 
 * @param url URL to extract parameter from, defaults to the current url
 */
export function getParameterByName(name: string, url?: string): string | null {
	if (!url) {
		url = window.location.href;
	}
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
	const results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Given a start point and (possibly negative) length, returns increasing start and end points
 * @param start Starting point
 * @param theLen Length, possibly negative
 */
export function getStartToEnd(start: number, theLen: number): { start: number, end: number } {
	return theLen > 0 ? { start: start, end: start + theLen } : { start: start + theLen, end: start };
}