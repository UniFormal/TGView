import TGView from "./src/";

window.onload = function() {
    console.log("loaded", TGView);

    var tgView = new TGView({
       // isMathhub: false, 
       mainContainer: "tgViewMainEle",
       serverBaseURL: 'https://mmt.mathhub.info/',
    });
}