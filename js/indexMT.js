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
    var ctx = document.getElementById('c'+(1/result.id)).getContext('2d'); 
    var image = ctx.createImageData(result.width, result.height);
    image.data.set(result.pixels);
    ctx.putImageData(image, 0, 0);

    var ct = document.getElementById('c');
    ct.width = result.width;
    ct.height = result.height;
    ct.getContext('2d').putImageData(image, 0, 0);

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
 var c = document.getElementById('c'+pixel),
 width = Math.floor((screen.width * scene.camera.pixel)/10)*10,
 height = Math.floor((screen.height * scene.camera.pixel)/10)*10;
 c.width = width;
 c.height = height;
 c.style.cssText = 'width:100%;height:100%';

 scene.vision = c.getContext('2d').getImageData(0, 0, width, height).data.slice();
 scene.width = width;
 scene.height = height;
 scene.startTime = new Date().getTime(); 
 monWorker.postMessage(scene);
}
