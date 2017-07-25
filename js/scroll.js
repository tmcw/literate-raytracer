// bezier animations
var bez = $.bez([.19,1,.22,1]);
var bezcss = ".19,1,.22,1";
/* Get css3 transition and transform prefixes */
function mg_getProperty(arr0, arr1, arr2){
    var tmp = document.createElement("div");
    for(var i=0, len=arr0.length; i<len; i++){
        tmp.style[arr0[i]] = 800;
        if(typeof tmp.style[arr0[i]] == 'string'){
            return {
                js: arr0[i],
                css: arr1[i],
                jsEnd: arr2[i]
            };
        }
    }
    return null;
}
function mg_getTransition(){
    var arr0 = ["transition", "msTransition", "MozTransition", "WebkitTransition", "OTransition", "KhtmlTransition"];
    var arr1 = ["transition", "-ms-transition", "-moz-transition", "-webkit-transition", "-o-transition", "-khtml-transition"];
    var arr2 = ["transitionend", "MSTransitionEnd", "transitionend", "webkitTransitionEnd", "oTransitionEnd", "khtmlTransitionEnd"];
    return mg_getProperty(arr0, arr1, arr2);
}
function mg_getTransform(){
    var arr0 = ["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform", "KhtmlTransform"];
    var arr1 = ["transform", "-ms-transform", "-moz-transform", "-webkit-transform", "-o-transform", "-khtml-transform"];
    return mg_getProperty(arr0, arr1, []);
}
function mg_getPerspective(){
    var arr0 = ["perspective", "msPerspective", "MozPerspective", "WebkitPerspective", "OPerspective", "KhtmlPerspective"];
    var arr1 = ["perspective", "-ms-perspective", "-moz-perspective", "-webkit-perspective", "-o-perspective", "-khtml-perspective"];
    return mg_getProperty(arr0, arr1, []);
}
var transition = mg_getTransition();
var transform = mg_getTransform();
var perspective = mg_getPerspective();



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