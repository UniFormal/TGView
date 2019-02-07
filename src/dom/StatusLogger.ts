import { Configuration } from "../Configuration";
import DOMConstruct from "./DOMConstruct";

/**
 * Represents a class that can log to something
 * @param logElement ID of Element that should be logged into
 * @param optionsIn Options that are used with this StatusLogger
 * @class
 */
export default class StatusLogger {
	constructor(private dom: DOMConstruct, logElementId: string)
	{
		this.statusbar = this.dom.getElementById(logElementId);
	}

	private statusbar: HTMLElement;
	destroy() {
		// reset the cursor of the status bar
		this.setStatusCursor('auto');
	}

	setStatusText(text: string) {
		this.statusbar.innerHTML=text;
	}

	setStatusCursor(cursor: 'wait' | 'auto'){
		this.dom.mainElement.style.cursor = cursor || "auto";
	}
}