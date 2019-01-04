function StatusLogger(logElement)
{
	var logTo=logElement;

	this.setStatusText = function(text)
	{
		statusbar = document.getElementById(logTo);
		statusBar.innerHTML=text;
	}
}