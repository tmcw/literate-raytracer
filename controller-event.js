
var l = $(".example7a-inside").length;
$('#example7a-click-dragIn').css("height",80*(l));

var example7a = new Mg({
  reference:"example7a",
  totalItems:l,
  click:{
    activated:[0],
    cycle:true,
    prevSteps:2, nextSteps:2,
    lastToSteps:true,
    dragIsVertical:true
  }
});

example7a.click.dragMove = function(){
  var path = $("#"+this.reference+"-click-dragIn");
  if(transition){
    path.css(transition.css, transform.css+" 0s");
    path.css(transform.css, "translateY("+this.dragPosition+"px)");
  }else{
    path.clearQueue().stop().animate({top:this.dragPosition},{queue:true, duration:0, specialEasing: {top:bez}});
  }
}
example7a.click.dragRelease = function(){
  var path = $("#"+this.reference+"-click-dragIn");
  if(transition){
    path.css(transition.css, transform.css+" 1.2s cubic-bezier("+bezcss+") 0s");
    path.css(transform.css, "translateY("+this.dragPosition+"px)");
  }else{
    path.clearQueue().stop().animate({top:this.dragPosition},{queue:true, duration:1200, specialEasing: {top:bez}});
  }
}
example7a.click.scrollClick = function(){
  var path = $("#"+this.reference+"-click-scrollIn");
  path.addClass("active");
}
example7a.click.scrollMove = function(){
  var path = $("#"+this.reference+"-click-scrollIn");
  if(transition){
    path.css(transition.css, transform.css+" 0s");
    path.css(transform.css, "translateX("+this.scrollPosition+"px)");
  }else{
    path.clearQueue().stop().animate({left:this.scrollPosition},{queue:true, duration:0, specialEasing: {left:bez}});
  }
}
example7a.click.scrollRelease = function(){
  var path = $("#"+this.reference+"-click-scrollIn");
  path.removeClass("active");
  if(transition){
    path.css(transition.css, transform.css+" 1.2s cubic-bezier("+bezcss+") 0s");
    path.css(transform.css, "translateX("+this.scrollPosition+"px)");
  }else{
    path.clearQueue().stop().animate({left:this.scrollPosition},{queue:true, duration:1200, specialEasing: {left:bez}});
  }
}

example7a.init();

