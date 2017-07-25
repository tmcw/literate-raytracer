
 var objet = function() {
   this.posXcam= scene.camera.point.x,
   this.posYcam= scene.camera.point.y,
   this.posZcam= scene.camera.point.z,
   this.posXlook= scene.camera.vector.x,
   this.posYlook= scene.camera.vector.y,
   this.posZlook= scene.camera.vector.z,

   this.posXlum= scene.lights[0].x,
   this.posYlum= scene.lights[0].y,
   this.posZlum= scene.lights[0].z,
   
   this.colorCercle1 = [ scene.objects[0].color.x, scene.objects[0].color.y, scene.objects[0].color.z ],
   this.specularCercle1 = scene.objects[0].specular,  
   this.lambertCercle1 = scene.objects[0].lambert,  
   this.ambientCercle1 = scene.objects[0].ambient,  
   this.radiusCercle1 = scene.objects[0].radius,     

   this.activeSpecular=activeSpecular,  
   this.activeLambert=activeLambert,  
   this.activeAmbient=activeAmbient,   
   this.activeSurface=activeSurface,
   this.activeIntersect=activeIntersect,
this.activeNoTraitement=activeNoTraitement
   };
      
   var obj = new objet();
   var gui = new dat.GUI({  load: JSON });
   gui.remember(obj);

   var maj  = function(value) { 
   scene.camera.point.x = obj.posXcam;
   scene.camera.point.y = obj.posYcam;
   scene.camera.point.z = obj.posZcam;
   scene.camera.vector.x = obj.posXlook;
   scene.camera.vector.y = obj.posYlook;
   scene.camera.vector.z = obj.posZlook;

   scene.lights[0].x =  obj.posXlum;
   scene.lights[0].y =  obj.posYlum;
   scene.lights[0].z =  obj.posZlum;

   scene.objects[0].color.x = obj.colorCercle1[0];
   scene.objects[0].color.y = obj.colorCercle1[1];
   scene.objects[0].color.z = obj.colorCercle1[2];
   scene.objects[0].specular = obj.specularCercle1;  
   scene.objects[0].lambert = obj.lambertCercle1;  
   scene.objects[0].ambient = obj.ambientCercle1;  
   scene.objects[0].radius = obj.radiusCercle1; 

  
   scene.camera.pixel = 16; 
   render(scene);
   }

   var maj2  = function(value) {  
   
    var time =  new Date().getTime(); 
    try{   
      renderMT(scene);
     } catch(e){
      scene.camera.pixel = 1; 
      render(scene);  
     }
 
    var now = new Date().getTime(),
    dt = now - time; 

    $('.c.circle').circleProgress({ value: dt/1000,  fill: {gradient: ['rgba(175,175,175,.8)', 'rgba(225,225,225,.8)']}})
    .on('circle-animation-progress', function(event, progress, stepValue) {
      $(this).find('strong').text(String(stepValue.toFixed(2)).substr(0));
    });
   
   }
   
      var maj3  = function(value) {  
   	activeSpecular=obj.activeSpecular; 
	activeLambert=obj.activeLambert; 
	activeAmbient=obj.activeAmbient; 
	activeSurface=obj.activeSurface; 
	activeIntersect=obj.activeIntersect; 
		activeNoTraitement=obj.activeNoTraitement; 
    var time =  new Date().getTime(); 

      scene.camera.pixel = 1; 
      render(scene);  

 
    var now = new Date().getTime(),
    dt = now - time; 

    $('.c.circle').circleProgress({ value: dt/1000,  fill: {gradient: ['rgba(175,175,175,.8)', 'rgba(225,225,225,.8)']}})
    .on('circle-animation-progress', function(event, progress, stepValue) {
      $(this).find('strong').text(String(stepValue.toFixed(2)).substr(0));
    });
   
   }
   
   f = gui.addFolder('Mouvement');
   f.add(obj, "posXcam").min(-100).max(100).onChange(maj).onFinishChange(maj2);   
   f.add(obj, "posYcam").min(-100).max(100).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posZcam").min(-100).max(100).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posXlook").min(-100).max(100).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posYlook").min(-100).max(100).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posZlook").min(-100).max(100).onChange(maj).onFinishChange(maj2);
   f.close();
   f = gui.addFolder('lumiere position');
   f.add(obj, "posXlum").min(-255).max(255).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posYlum").min(-255).max(255).onChange(maj).onFinishChange(maj2);
   f.add(obj, "posZlum").min(-255).max(255).onChange(maj).onFinishChange(maj2);
   f.close();
   f = gui.addFolder('sphere1');
   f.addColor(obj,"colorCercle1").onChange(maj).onFinishChange(maj2);
   f.add(obj, "specularCercle1").min(0).max(2).onChange(maj).onFinishChange(maj2);
   f.add(obj, "lambertCercle1").min(0).max(2).onChange(maj).onFinishChange(maj2);
   f.add(obj, "ambientCercle1").min(0).max(2).onChange(maj).onFinishChange(maj2);
   f.add(obj, "radiusCercle1").min(0).max(500).onChange(maj).onFinishChange(maj2);
   f.close();
   f = gui.addFolder('Surface');
   f.add(obj,"activeSpecular").onChange(maj3);
   f.add(obj, "activeLambert").onChange(maj3);
   f.add(obj, "activeAmbient").onChange(maj3);
   f.add(obj, "activeSurface").onChange(maj3);
   f.add(obj, "activeIntersect").onChange(maj3);
   f.add(obj, "activeNoTraitement").onChange(maj3);   
   f.open();

