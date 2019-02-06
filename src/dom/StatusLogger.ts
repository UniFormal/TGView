import { Options } from "../options";

/**
 * Represents a class that can log to something
 * @param logElement ID of Element that should be logged into
 * @param optionsIn Options that are used with this StatusLogger
 * @class
 */
export default class StatusLogger {
	constructor(logElement: string, optionsIn: Options)
	{
		this.logTo = logElement;
	}

	private logTo: string;
	setStatusText(text: string) {
		var statusbar = document.getElementById(this.logTo);
		if (!statusbar) return;
		statusbar.innerHTML=text;
	}

	setStatusCursor(cursor: 'wait' | 'auto'){
		// TODO: Set the cursor only for the mainElement
		document.body.style.cursor = cursor || "auto";
	}
}