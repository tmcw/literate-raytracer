function renderMT(scene) {
 mt(2);
 mt(4);
 mt(8);
 mt(10);
 mt(16);
 mt(32); 
}

function mt(pixel){
var monWorker = new Worker('js/index.js');
monWorker.addEventListener("message", function (event) {
    var result = event.data;    
    try{	 	
    var ct = document.getElementById('c');
    ct.width = result.width;
    ct.height = result.height;
    ct.style.cssText = 'width:100%;height:100%';	
	ct.getContext('2d').putImageData(new ImageData(result.pixels,result.width, result.height), 0, 0);

$('.c'+ (1/result.id) +'.circle').circleProgress({ value: (new Date().getTime() - result.startTime)/1000,  
    fill: {gradient: ['rgba(255,215,0,1)', 'rgba(225,0,0,.8)']}})
   .on('circle-animation-progress', function(event, progress, stepValue) {
   $(this).find('strong').text(String(stepValue.toFixed(2)).substr(0));
});

    }catch(e){
     monWorker.terminate();
    } finally{
     monWorker.terminate();
    }

}, false);

 scene.camera.pixel = 1/pixel;
 var width = Math.floor((screen.width * scene.camera.pixel)/10)*10;
 var height = Math.floor((screen.height * scene.camera.pixel)/10)*10;
 scene.vision = new Uint8ClampedArray((width*height)*4);
 scene.width = width;
 scene.height = height;
 scene.startTime = new Date().getTime(); 
 monWorker.postMessage(scene);
}
