// @ts-check

/**
 * Represents a class that can log to something
 * @param {string} logElement ID of Element that should be logged into
 * @param {import('./options').Options} optionsIn Options that are used with this StatusLogger
 * @class
 */
export function StatusLogger(logElement, optionsIn)
{
	var logTo=logElement;

	/**
	 * Sets the status text of this logger
	 * @param {string} text Text to set
	 */
	this.setStatusText = function(text)
	{
		var statusbar = document.getElementById(logTo);
		statusbar.innerHTML=text;
	}
}