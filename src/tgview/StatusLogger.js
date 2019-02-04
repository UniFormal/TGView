export default function StatusLogger(logElement)
{
	var logTo=logElement;

	this.setStatusText = function(text)
	{
		var statusbar = document.getElementById(logTo);
		statusbar.innerHTML=text;
	}
}