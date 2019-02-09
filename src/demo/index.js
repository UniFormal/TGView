/**
 * @file
 * 
 * The main entry point for the TGView demo
 */

// create an element and append it to the body
const element = document.createElement('div');
element.innerHTML = 'Loading TGView...';
element.setAttribute('id', 'tgViewMainEle');
element.setAttribute('class', 'ui-form');
element.setAttribute('style', 'cursor: auto; overflow:hidden;');
document.body.append(element);

Promise.all([
    import('../').then(e => e.default),
    // Load all of the required CSS
    import('../css/styles.css'),
    // <link href="deps/fontawesome/css/font-awesome.min.css" rel="stylesheet" />
    import('vis/dist/vis.min.css'),
    //  <link href="deps/jqueryui/jquery-ui.min.css" rel="stylesheet" type="text/css">
    import('jstree/dist/themes/default/style.min.css'),
]).then(([TGView]) => {
    // once the window has loaded
    window.onload = function() {
        const instance = new TGView({
            prefix: 'test',
            mainContainer: 'tgViewMainEle',
            serverBaseURL: 'https://mmt.mathhub.info/'
        });
    }
});
