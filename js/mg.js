/**
 * @copyright Copyright (C) 2013-2014 by Riccardo Caroli
 * @version   Minimit Gallery v2.1.2
 * @link      http://github.com/minimit/minimit-gallery
 * @author    Riccardo Caroli http://www.minimit.com
 * @license   Licensed under the MIT license http://www.opensource.org/licenses/mit-license.php
 */
/*
 * Minimit Gallery constructor
 * @function Mg(settings:object)
 *  ------------------- Main settings
 * 	@param settings.reference:string [Required] - gallery reference string
 *  @param settings.totalItems:number [Default:null] - needed only on galleries without items, specify how many items there are inside the gallery
 * 	@param settings.eventName:object [can be multiple] - arguments for event interactions, the name must be the name of a valid Javascript event: click dblclick mousedown mouseup mousemove mouseenter OR mouseover mouseleave OR mouseout touchstart touchend touchcancel touchleave touchmove focus
 *  ------------------- Interaction settings
 *  @param settings.eventName.activated:array [Default:null] - array of numbers for activated items on init
 *  @param settings.eventName.maxActivated:number [Default:1] - maximum amount of activated items - unlimited if Infinity
 *  @param settings.eventName.deactivable:boolean [Default:false] - if the click activated items can be deactivated on click
 *  @param settings.eventName.interactive:boolean [Default:false] - if the items are interactive on click
 *  @param settings.eventName.cycle:boolean [Default:false] - if the activation cyclesx
 *  @param settings.eventName.prevSteps:number [Default:1] - how many to jump on prev
 *  @param settings.eventName.nextSteps:number [Default:1] - how many to jump on next
 *  @param settings.eventName.firstToSteps:boolean [Default:false] - true if the items scrolls all the way on first, false if the items scrolls only to show first
 *  @param settings.eventName.lastToSteps:boolean [Default:false] - true if the items scrolls all the way on last, false if the items scrolls only to show last
 *  ------------------- Multi settings
 *  @param settings.eventName.multiLess:number [Default:0] - how many you want before activated in the multiple data
 *  @param settings.eventName.multiPlus:number [Default:0] - how many you want after activated in the multiple data
 *  @param settings.eventName.multiMode:string [Default:'centered'] - the mode of multi can be 'centered' 'fixed' 'flexible'
 *  @param settings.eventName.fixedLess:number [Default:0] - setting for multiMode 'fixed', number of additional before items on the serie
 *  @param settings.eventName.fixedPlus:number [Default:0] - setting for multiMode 'fixed', number of additional after items on the serie
 *  @param settings.eventName.multiLimit:boolean [Default:true] - if true it decreases multiLess and multiPlus when you have lower item count (limits the multi array to item count)
 *  ------------------- Other arguments
 *  @param settings.eventName.auto:number [Default:null] - milliseconds for automatic gallery
 *  @param settings.eventName.autoSlow:number [Default:null] - milliseconds for automatic gallery pause when user interacts
 *  @param settings.eventName.autoInverse:boolean [Default:false] - false for automatic to next, true for automatic to prev
 *  @param settings.eventName.anchorize:string [Default:false] - if you want to implement url anchors to remember position: false or "useAnchor" or "useLinkHash" or "useLinkUrl"
 *  @param settings.eventName.preventDefault:boolean [Default:false] - if it should prevent other javascript scripts on event
 *  @param settings.eventName.useHrefAnchor:boolean [Default:false] - if you want the href anchor of the item to be the anchor that the event uses
 *  @param settings.eventName.linked:array [Default:null] - object of linked event galleries
 *  @param settings.eventName.linkedmultiply:number [Default:1] - number to multiply the activation of linked galleries
 *  @param settings.eventName.inverse:boolean [Default:false] - if the items count are inversed
 *  ------------------- Scroll and Drag arguments
 *  @param settings.eventName.scrollOnlyTouch:boolean [Default:false] - if the scroll is only on touch
 *  @param settings.eventName.scrollIsVertical:boolean [Default:false] - if the scroll is vertical
 *  @param settings.eventName.scrollInvert:boolean [Default:false] - inverts the scroll
 *  @param settings.eventName.scrollFriction:number [Default:0] - factor of scroll inertia: use a number between 0 and 1
 *  @param settings.eventName.scrollPower:number [Default:0.6] - factor of scroll power: use a number between 0 and 1
 *  @param settings.eventName.scrollFurther:number [Default:0] - factor of elastic scroll further limits: use a number between 0 and 1
 *  @param settings.eventName.scrollFraction:boolean [Default:false] - if true scroll activates onEvent with fractions
 *  @param settings.eventName.scrollWheel:boolean [Default:false] - implement mouse wheel support on scroll
 *  @param settings.eventName.scrollCursorOff:string - what cursor to assign as css style
 *  @param settings.eventName.scrollCursorOn:string - what cursor to assign as css style
 *  @param settings.eventName.dragOnlyTouch:boolean [Default:false] - if the drag is only on touch
 *  @param settings.eventName.dragIsVertical:boolean [Default:false] - if the drag is vertical
 *  @param settings.eventName.dragInvert:boolean [Default:false] - inverts the drag
 *  @param settings.eventName.dragFriction:number [Default:0.85] - factor of drag inertia: use a number between 0 and 1
 *  @param settings.eventName.dragPower:number [Default:0.6] - factor of drag power: use a number between 0 and 1
 *  @param settings.eventName.dragFurther:number [Default:0.2] - factor of elastic drag further limits: use a number between 0 and 1
 *  @param settings.eventName.dragFraction:boolean [Default:false] - if true drag activates onEvent with fractions
 *  @param settings.eventName.dragWheel:boolean [Default:false] - implement mouse wheel support on drag
 *  @param settings.eventName.dragCursorOff:string - what cursor to assign as css style
 *  @param settings.eventName.dragCursorOn:string - what cursor to assign as css style
 *  @param settings.eventName.disableFriction:boolean - true to disable riction animation
 *  @param settings.eventName.rounding:string [Default:'round'] - can be "round" "floor" "ceil", when using scrollFraction or dragFraction you set this to have different this.fraction on events
 */
function Mg(settings) {
	this.events = []; // array of events
	this.setSettings(settings);
}

/*
 * Minimit Gallery Event functions you can to specify, can be multiple
 * @function MgObject.eventName.onEvent()
 * Besides all constructor eventName variables you have also this below
 * 	@variable this.eventType:string - can be "init" "item" "prev" "next" "first" "last" "scroll" "drag" "fraction" "anchor" "reset" or custom
 * 	@variable this.items:documentElements - the javascript documentElements of the gallery
 * 	@variable this.itemsLink:array - list of href anchors for anchorize
 * 	@variable this.totalItems:number - the items count
 * 	@variable this.evnt:string - the event name
 * 	@variable this.reference:string - the gallery reference string
 * 	@variable this.activated:array - array of item numbers activated
 * 	@variable this.deactivated:number - item number deactivated
 * 	@variable this.multiActivated:array - array of item numbers activated with multiLess and multiPlus
 * 	@variable this.multiBeforeIn:array -  array of item numbers activated on left with multiLess and multiPlus
 * 	@variable this.multiBeforeOut:array -  array of item numbers deactivated on left with multiLess and multiPlus
 * 	@variable this.multiAfterIn:array -  array of item numbers activated on right with multiLess and multiPlus
 * 	@variable this.multiAfterOut:array -  array of item numbers deactivated on right with multiLess and multiPlus
 * 	@variable this.direction:number - 0 going left, 1 going right, null for no direction
 * 	@variable this.scrollPosition:number - current position of scroll on Move and Release events
 * 	@variable this.scrollDragged:number - amount dragged on scroll on Move and Release events
 * 	@variable this.dragPosition:number - current position of drag on Move and Release events
 * 	@variable this.dragDragged:number - amount dragged on drag on Move and Release events
 * 	@variable this.startPosX:number - the clientX value when clicking the drag or the scroll
 * 	@variable this.startPosY:number - the clientY value when clicking the drag or the scroll
 *  @variable this.fraction:number - fraction of activation when you use scrollFraction or dragFraction, different values based on settings.eventName.rounding
 */
/*
// example event function
mgObject.click.onEvent = function(){}
// prev next first last event functions
mgObject.click.prevHide = function(){}
mgObject.click.prevShow = function(){}
mgObject.click.nextHide = function(){}
mgObject.click.nextShow = function(){}
mgObject.click.prevClick = function(){}
mgObject.click.nextClick = function(){}
mgObject.click.firstClick = function(){}
mgObject.click.lastClick = function(){}
// scroll and drag event functions
mgObject.click.scrollClick = function(){}
mgObject.click.scrollMove = function(){}
mgObject.click.scrollRelease = function(){}
mgObject.click.dragClick = function(){}
mgObject.click.dragMove = function(){}
mgObject.click.dragRelease = function(){}
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// CORE FUNCTIONS //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Set or update gallery settings
 * @function setSettings(settings)
 * 	@param settings:object - all the settings to activate
 */
Mg.prototype.setSettings = function(settings) {
	var openhandurl = "http://www.google.com/intl/en_ALL/mapfiles/openhand.cur";
	var closedhandurl = "http://www.google.com/intl/en_ALL/mapfiles/closedhand.cur";
	for(var i in settings){
		// if it's an object and not an array
		if(typeof (settings[i]) == "object" && !settings[i].length){
			// if the object setting is new
			if(this[i] == undefined){
				// store array of events name
				var thisEvnt = this[i] = {};
				this.events.push(i);
				// pre-defaults
				thisEvnt.obj = this;
				thisEvnt.evnt = i;
				if(settings.reference){thisEvnt.reference = settings.reference;}
				thisEvnt.inverse = false;
				thisEvnt.anchorize = false;
				thisEvnt.linkedMultiply = thisEvnt.prevSteps = thisEvnt.nextSteps = 1;
				thisEvnt.multiMode = "centered"; thisEvnt.multiLimit = true;
				thisEvnt.fixedLess = thisEvnt.fixedPlus = 0;
				thisEvnt.scrollIsVertical = thisEvnt.dragIsVertical = thisEvnt.scrollInvert = thisEvnt.dragInvert = thisEvnt.scrollFraction = thisEvnt.dragFraction = thisEvnt.scrollWheel = thisEvnt.dragWheel = false;
				thisEvnt.scrollFriction = 0; thisEvnt.dragFriction = 0.85;
				thisEvnt.scrollPower = thisEvnt.dragPower = 0.6;
				thisEvnt.scrollFurther = 0; thisEvnt.dragFurther = 0.2;
				thisEvnt.scrollCursorOff = "url("+openhandurl+"), pointer";	thisEvnt.scrollCursorOn = "url("+closedhandurl+"), pointer";
				thisEvnt.dragCursorOff = "url("+openhandurl+"), move"; thisEvnt.dragCursorOn = "url("+closedhandurl+"), move";
				thisEvnt.rounding = "round";
			}
			var thisEvnt = this[i];
			// store all events settings
			for(var z in settings[i]){thisEvnt[z] = settings[i][z];}
			// post-default
			if(thisEvnt.cycle == undefined){thisEvnt.cycle = false;}
			if(thisEvnt.activated == undefined){thisEvnt.activated = [];}
			if(thisEvnt.activated.length<1){thisEvnt.activated.push(null);}
			thisEvnt.initNum = thisEvnt.activated.slice();
			// register gallery events to array for anchorize
			if("onhashchange" in window){
				this.registerEvent(thisEvnt, window.mg_AnchorEvntsArr, "useAnchor");
				this.registerEvent(thisEvnt, window.mg_HashEvntsArr, "useLinkHash");
			}
			if(!!(window.history && window.history.pushState)){
				this.registerEvent(thisEvnt, window.mg_UrlEvntsArr, "useLinkUrl");
			}
		}else{
			// store all other settings
			this[i] = settings[i];
		}
	}
	this.refreshItems();
	this.initScrollDrag();
};

/*
 * Refresh the items of the gallery
 * @function refreshItems()
 */
Mg.prototype.refreshItems = function() {
	this.items = this.getElementsById(this.reference+"-item-");
	if(this.items.length>0){this.totalItems = this.items.length;}
	// loop events
	var tot = this.totalItems-1;
	var populateHrefAnchors = false;
	for(var i=0, len=this.events.length; i<len; i++){
		var evnt = this.events[i];
		var thisEvnt = this[evnt];
		thisEvnt.totalItems = this.totalItems;
		// fix when multi+1 are more than items
		if(thisEvnt.multiLimit && thisEvnt.multiLess+thisEvnt.multiPlus+1 > tot){thisEvnt.multiLess = Math.floor(tot/2); thisEvnt.multiPlus = Math.ceil(tot/2);}
		// search if it needs HrefAnchor
		if(thisEvnt.anchorize == "useLinkHash" || thisEvnt.anchorize == "useLinkUrl"){
			populateHrefAnchors = true;
		}
	}
	// register href links and titles for event items
	if(populateHrefAnchors){
		this.itemsLink = [];
		for(var i=0, len=this.items.length; i<len; i++){
			var item = this.getElementsById(this.reference+"-item-"+i)[0];
			this.itemsLink.push({href:item.getAttribute("href"), title:item.getAttribute("data-title")});
		}
	}
	this.initEvents();
};

/*
 * Initialize the gallery
 * @function init()
 */
Mg.prototype.init = function(eventType){
	// on reinit
	if(this.inited){
		eventType = "reinit";
	}
	//
	for(var i=0, len=this.events.length; i<len; i++){
		var evnt = this.events[i];
		var thisEvnt = this[evnt];
		// set nocheck
		if(thisEvnt.prevHide != undefined || thisEvnt.prevShow != undefined || thisEvnt.nextHide != undefined || thisEvnt.nextShow != undefined){
			thisEvnt.noCheck = false;
		}else{
			thisEvnt.noCheck = true;
		}
		if(this.inited){
			// init with starting acivated
			for(var z=0, len2=thisEvnt.activatedInit.length; z<len2; z++){
				this.setState(thisEvnt.activatedInit[z], evnt, false, true, true, false, eventType || "init");
			}
		}else{
			// save starting activated and init
			thisEvnt.activatedInit = [];
			for(var z=0, len2=thisEvnt.activated.length; z<len2; z++){
				//this.setState(thisEvnt.activatedInit[z], evnt, true, true, true, false, "anchor");
				thisEvnt.activatedInit[z] = thisEvnt.activated[z];
				this.setState(thisEvnt.activated[z], evnt, false, true, true, false, eventType || "init");
			}
		}
		// start automatic
		if(thisEvnt.auto != undefined){
			this.autoStart(evnt);
		}
	}
	// inited
	this.inited = true;
}

/*
 * Set the gallery state
 * @function setState(num, evnt, alsoLinked, pauseAuto, eventType)
 * 	@param num:number - number to activate
 * 	@param evnt:string - event to change
 * 	@param alsoLinked:boolean - if it propagates to linked
 * 	@param pauseAuto:boolean - if it pauses automatic
 * 	@param eventType:string - can be "init" "item" "prev" "next" "first" "last" "anchor" "scroll" "drag" or custom, when it's a linked call propagation the eventType is preceded by "linked" 
 */
Mg.prototype.setState = function(num, evnt, alsoLinked, alsoScroll, alsoDrag, pauseAuto, eventType){
	var thisEvnt = this[evnt];
	thisEvnt.eventType = eventType;
	thisEvnt.oldNum = thisEvnt.num;
	thisEvnt.oldActivated = thisEvnt.activated;
	if((num != thisEvnt.oldNum || eventType == "reinit") || thisEvnt.deactivable || thisEvnt.num == undefined || thisEvnt.scrollFraction || thisEvnt.dragFraction){
		// anchorize
		if(thisEvnt.anchorize && eventType != "reset" && eventType != "anchor"){
			// make the anchor on the browser
			var tnum = this.makeAnchor(num, evnt, eventType);
			if(tnum != undefined){ // if undefined we stop
				num = parseFloat(tnum); // set the setState event num as the anchor (needed in the case it's a init event)
				alsoLinked = true; // this to make it propagate
			}
		}
		// activation
		thisEvnt.num = num;
		if(eventType != "init" || tnum != undefined){
			thisEvnt.deactivated = this.setActivated(num, evnt); // core function that manages activated and deactivated
		}else{
			if(thisEvnt.activated[0] == null){thisEvnt.activated.splice(0, 1);} // fix remove null activated 
		}
		// multiple
		if(thisEvnt.multiPlus+thisEvnt.multiLess > 0){
			this.setMultiple(evnt, eventType);
		}else{
			thisEvnt.direction = null;
			if(eventType != "init"){
				var dist = this.findNormalDistance(thisEvnt.num, thisEvnt.oldNum);
				thisEvnt.distance = dist;
				if(dist > 0){ // going right
					thisEvnt.direction = 1;
				}else{ // going left
					thisEvnt.direction = 0;
				}
			}
		}
		// others
		if(!thisEvnt.cycle && !thisEvnt.noCheck){this.checkPrevNext(evnt);}
		if(!thisEvnt.deactivable && evnt == "click" && thisEvnt.interactive){
			for(var i=0, len=thisEvnt.activated.length; i<len; i++){
				this.enableTextSelect(document.getElementById(this.reference+"-item-"+thisEvnt.activated[i]), true);
			}
			if(thisEvnt.deactivated != undefined){
				this.disableTextSelect(document.getElementById(this.reference+"-item-"+thisEvnt.deactivated), true);
			}
		}
		// pause automatic
		if(pauseAuto){
			this.autoSlow(evnt);
		}
		// execute event
		if(eventType != "fraction"){thisEvnt.fraction = this.calculateFraction(0, thisEvnt.rounding);}
		if(thisEvnt.onEvent != undefined){
			thisEvnt.onEvent();
		}
		// this eventType check fixes some init problems
		if(eventType != "linkedinit"){
			// propagate to scroll
			var div = thisEvnt.scrollInDiv;
			if(alsoScroll && div){
				this.scRelease(div, num);
			}
			// propagate to drag
			var div = thisEvnt.dragInDiv;
			if(alsoDrag && div && eventType != "linkedinit"){
				this.scRelease(div, num);
			}
		}
		// propagate to linked
		if(alsoLinked){
			for(var i in thisEvnt.linked){
				if(num != undefined){var n = num*thisEvnt.linkedMultiply;}else{var n = num;}
				thisEvnt.linked[i].obj.setState(n, thisEvnt.linked[i].evnt, false, true, true, true, "linked"+eventType);
				/*if(num != undefined && num != null){var n = num*thisEvnt.linkedMultiply;}else{var n = num;}
                thisEvnt.linked[i].obj.setState(n, thisEvnt.linked[i].evnt, false, true, true, true, eventType);*/
			}
		}
	}
};

/*
 * Calculate and return deactivated item, and remove it from activated array
 * @function setActivated(num, evnt)
 * 	@param num:number - number to set
 * 	@param evnt:string - event to change
 */
Mg.prototype.setActivated = function(num, evnt){
	var activated = this[evnt].activated;
	var spliced = null;
	var idx = this.inArray(num, activated);
	if(idx != -1){ // if the num is already on the activated array
		if(this[evnt].deactivable){
			spliced = parseFloat(activated.splice(idx, 1)); // disactivate the activate one
		}
	}else{ // if num wasn't already on the activated array
		if(activated.length >= this[evnt].maxActivated || !this[evnt].maxActivated){ // if activated are more than maxActivated or if maxActivated undefined
			spliced = parseFloat(activated.splice(activated.length-1, 1)); // remove the last
		}
		activated.unshift(num);
	}
	return spliced;
};

/*
 * Initialize and attach events on items and prev next first last
 * @function initEvents()
 */
Mg.prototype.initEvents = function(){
	for(var i=0, len=this.events.length; i<len; i++){
		// init items events
		var evnt = this.events[i];
		thisEvnt = this[evnt];
		if(thisEvnt.interactive){
			for(var z=0, len2=this.totalItems; z<len2; z++){
				var item = this.items[z];
				if(evnt == "click"){this.disableTextSelect(item, true);}
				item.that = this;
				item.evnt = evnt;
				if(!thisEvnt.inverse){
					item.num = z;
				}else{
					item.num = len2-1-z;
				}
				var oldItemEvent = item[this.getEventName(evnt)];
				item[this.getEventName(evnt)] = evnt;
				// register event
				if(oldItemEvent != item[this.getEventName(evnt)]){ // only if the event type is new
					this.addEvent(item, evnt, function(e){ // register event
						var isActivated = this.that.inArray(this.num, this.that[evnt].activated);
						this.that.setState(this.num, this[this.that.getEventName(e.type)], true, true, true, true, "item");
						this.that.stopPropagation(e);
						if(isActivated === false || isActivated == -1){
							// only when not active prevent links
							this.that.preventDefault(e);
							return false;
						}
					}, false);
				}
			}
		}
		// init prev next first last events
		var arr = ["prev","next","first","last"];
		for(var z=0, len2=arr.length; z<len2; z++){
			var item = document.getElementById(this.reference+"-"+evnt+"-"+arr[z]);
			if(item){
				this.disableTextSelect(item, true);
				item.that = this;
				item.evnt = evnt;
				item.call = arr[z];
				var oldItemEvent = item[this.getEventName(evnt)];
				item[this.getEventName(evnt)] = evnt;
				// register event
				if(oldItemEvent != item[this.getEventName(evnt)]){ // only if the event type is new
					this.addEvent(item, "click", function(e){ // register event
						this.that[this.call](this.evnt, true, true, false);
					}, false);
				}
			}
		}
	}
};
/*
 * Init the scroll and drag
 * @function initScrollDrag(onlyrefresh)
 * 	@param onlyrefresh:boolean - if true it only refresh the scroll and drag, if false it init scroll and drag events
 */
Mg.prototype.initScrollDrag = function(onlyrefresh){
	for(var i=0, len=this.events.length; i<len; i++){
		var evnt = this.events[i];
		thisEvnt = this[evnt];
		var arrz = ["scroll","drag"];
		var arry = ["In","Out"];
		for(var z=0, len2=arrz.length; z<len2; z++){
			if(!onlyrefresh){
				thisEvnt[arrz[z]+arry[0]+"Div"] = document.getElementById(this.reference+"-"+evnt+"-"+arrz[z]+arry[0]);
				thisEvnt[arrz[z]+arry[1]+"Div"] = document.getElementById(this.reference+"-"+evnt+"-"+arrz[z]+arry[1]);
			}
			var itemIn = thisEvnt[arrz[z]+arry[0]+"Div"];
			var itemOut = thisEvnt[arrz[z]+arry[1]+"Div"];
			var vertical = thisEvnt[arrz[z]+"IsVertical"];
			if(itemIn && itemOut){
				// fix set display block if item is on display none to retrieve the values
				var itemInDisplay = false;
				var itemOutDisplay = false;
				if(this.getCompStyle(itemIn)['display'] == "none"){
					itemInDisplay = true;
					itemIn.style.display = "block";
				}
				if(this.getCompStyle(itemOut)['display'] == "none"){
					itemOutDisplay = true;
					itemOut.style.display = "block";
				}
				//
				if(z==0){
					var min = itemIn.min = itemOut.min = this.scGetMin(evnt, itemIn, itemOut, vertical, 1);
					var max = itemIn.max = itemOut.max = this.scGetMax(evnt, itemIn, itemOut, vertical, 1);
					// fire release without num
					if(onlyrefresh){
						this.scRelease(itemOut);
					}else if(!thisEvnt.scrollOnlyTouch){
						this.disableTextSelect(itemIn, true);
						this.disableTextSelect(itemOut, true);
					}
				}else{
					if(!vertical){
						var concurrent = Math.round(this.totalItems/(itemIn.offsetWidth/itemOut.offsetWidth));
					}else{
						var concurrent = Math.round(this.totalItems/(itemIn.offsetHeight/itemOut.offsetHeight));
					}
					if(concurrent == 0){concurrent = 0.1;}
					itemIn.concurrent = concurrent;
					var min = itemIn.min = itemOut.min = this.scGetMin(evnt, itemOut, itemIn, vertical, concurrent);
					var max = itemIn.max = itemOut.max = this.scGetMax(evnt, itemOut, itemIn, vertical, concurrent);
					// fire release without num
					if(onlyrefresh){
						this.scRelease(itemIn);
					}else if(!thisEvnt.dragOnlyTouch){
						this.disableTextSelect(itemIn, true);
						this.disableTextSelect(itemOut, false);
					}
				}
				// fix set display none back
				if(itemInDisplay){
					itemIn.style.display = "none";
				}
				if(itemOutDisplay){
					itemOut.style.display = "none";
				}
				// register event
				if(!onlyrefresh){
					this.addScrollDrag(evnt, itemIn, itemOut, min, max, vertical, arrz[z]);
				}
			}
		}
	}
};
/*
 * Refresh scroll and drag, to be used when scroll or drag change width or height
 * @function refreshScrollDrag()
 */
Mg.prototype.refreshScrollDrag = function() {
	this.initScrollDrag(true);
};
/*
 * Manages show hide events
 * @function checkPrevNext(evnt)
 * 	@param evnt:string - event to watch
 */
Mg.prototype.checkPrevNext = function(evnt){
	var thisEvnt = this[evnt];
	// prev
	var target = thisEvnt.num-thisEvnt.prevSteps;
	if(thisEvnt.firstToSteps){
		if(target < 0-thisEvnt.multiLess-thisEvnt.multiPlus){
			thisEvnt.prevIsShown = false;
			if(thisEvnt.prevHide != undefined){thisEvnt.prevHide();}
		}else if(!thisEvnt.prevIsShown){
			thisEvnt.prevIsShown = true;
			if(thisEvnt.prevShow != undefined){thisEvnt.prevShow();}
		}
	}else{
		if(target<0){
			thisEvnt.prevIsShown = false;;
			if(thisEvnt.prevHide != undefined){thisEvnt.prevHide();}
		}else if(!thisEvnt.prevIsShown){
			thisEvnt.prevIsShown = true;
			if(thisEvnt.prevShow != undefined){thisEvnt.prevShow();}
		}
	}
	// next
	var target = thisEvnt.num+thisEvnt.nextSteps;
	if(thisEvnt.lastToSteps){
		if(target > this.totalItems-thisEvnt.multiLess-thisEvnt.multiPlus-1){
			thisEvnt.nextIsShown = false;
			if(thisEvnt.nextHide != undefined){thisEvnt.nextHide();}
		}else if(!thisEvnt.nextIsShown){
			thisEvnt.nextIsShown = true;
			if(thisEvnt.nextShow != undefined){thisEvnt.nextShow();}
		}
	}else{
		if(target>this.totalItems-1){
			thisEvnt.nextIsShown = false;
			if(thisEvnt.nextHide != undefined){thisEvnt.nextHide();}
		}else if(!thisEvnt.nextIsShown){
			thisEvnt.nextIsShown = true;
			if(thisEvnt.nextShow != undefined){thisEvnt.nextShow();}
		}
	}
};

/*
 * Set prev
 * @function prev(evnt, alsoLinked, pauseAuto)
 * 	@param evnt:string - event to change
 * 	@param alsoLinked:boolean - if it propagates to linked
 * 	@param pauseAuto:boolean - if it pauses automatic
 */
Mg.prototype.prev = function(evnt, alsoLinked, pauseAuto, isAuto){
	var thisEvnt = this[evnt];
	var length = this.totalItems;
	var start = 0;
	if(!(thisEvnt.multiMode=='centered' && thisEvnt.cycle==true)){ // if centered and cycle you can't have toSteps
		if(thisEvnt.lastToSteps){length = length+thisEvnt.multiPlus;}
		if(thisEvnt.firstToSteps){start = -thisEvnt.multiLess;}
	}
	var target = thisEvnt.num-thisEvnt.prevSteps;
	//
	if(target<start){ // if target is out of prev bounds
		if((thisEvnt.cycle || isAuto) && thisEvnt.num == start){ // last check to fix prevSteps that jumps first items
			target = length-1;
		}else{
			target = start;
		}
	}
	//
	if(thisEvnt.prevClick != undefined && !isAuto){thisEvnt.prevClick();}
	if(isAuto){var eventType = "automatic";}else{var eventType = "prev";}
	this.setState(target, evnt, alsoLinked, true, true, pauseAuto, eventType);
};

/*
 * Set next
 * @function next(evnt, alsoLinked, pauseAuto)
 * 	@param evnt:string - event to change
 * 	@param alsoLinked:boolean - if it propagates to linked
 * 	@param pauseAuto:boolean - if it pauses automatic
 */
Mg.prototype.next = function(evnt, alsoLinked, pauseAuto, isAuto){
	var thisEvnt = this[evnt];
	var length = this.totalItems;
	var start = 0;
	if(!(thisEvnt.multiMode=='centered' && thisEvnt.cycle==true)){ // if centered and cycle you can't have toSteps
		if(thisEvnt.lastToSteps && thisEvnt.multiPlus){length = length+thisEvnt.multiPlus;}
		if(thisEvnt.firstToSteps && thisEvnt.multiLess){start = -thisEvnt.multiLess;}
	}
	var target = thisEvnt.num+thisEvnt.nextSteps;
	//
	if(target>length-1){ // if target is out of next bounds
		if((thisEvnt.cycle || isAuto) && thisEvnt.num == length-1){ // last check to fix nextSteps that jumps last items
			target = start;
		}else{
			target = length-1;
		}
	}
	//
	if(thisEvnt.nextClick != undefined && !isAuto){thisEvnt.nextClick();}
	if(isAuto){var eventType = "automatic";}else{var eventType = "next";}
	this.setState(target, evnt, alsoLinked, true, true, pauseAuto, eventType);
};

/*
 * Set first
 * @function first(evnt)
 * 	@param evnt:string - event to change
 */
Mg.prototype.first = function(evnt){
	var thisEvnt = this[evnt];
	if(thisEvnt.firstClick != undefined){thisEvnt.firstClick();}
	this.setState(0, evnt, true, true, true, true, "first");
};

/*
 * Set last
 * @function last(evnt)
 * 	@param evnt:string - event to change
 */
Mg.prototype.last = function(evnt){
	var thisEvnt = this[evnt];
	if(thisEvnt.lastClick != undefined){thisEvnt.lastClick();}
	this.setState(this.totalItems-1, evnt, true, true, "last");
};

/*
 * Starts automatic
 * @function autoStart(evnt)
 * 	@param evnt:string - automatic event to start
 */
Mg.prototype.autoStart = function(evnt){
	var that = this; 
	clearInterval(window[this.reference+evnt+"autoInterval"]);
	if(this[evnt].autoInverse){
		window[this.reference+evnt+"autoInterval"] = setInterval(function(){
			that.prev(evnt, true, false, true);
			that.onAutoStart(evnt); // on event
		}, this[evnt].auto);
	}else{
		window[this.reference+evnt+"autoInterval"] = setInterval(function(){
			that.next(evnt, true, false, true);
			that.onAutoStart(evnt); // on event
		}, this[evnt].auto);
	}
	this.onAutoStart(evnt); // on event
};

/*
 * Call onAutoStart
 * @function onAutoStart(evnt)
 * 	@param evnt:string - automatic event to start
 */
Mg.prototype.onAutoStart = function(evnt){
	if(this[evnt].onAutoStart != undefined){
		this[evnt].onAutoStart();
	}
	// add to mg_automaticArr
	var o = {that:this, evnt:evnt}
	var found = false;
	for(var z=0, len2=window.mg_automaticArr.length; z<len2; z++){
		var o2 = window.mg_automaticArr[z];
		if(o2.that.reference == o.that.reference && o2.evnt == o.evnt){
			found = true;
			break;
		}
	}
	if(!found){mg_automaticArr.push(o);}
};

/*
 * Slows automatic
 * @function autoSlow(evnt)
 * 	@param evnt:string - automatic event to slow
 */
Mg.prototype.autoSlow = function(evnt){
	var that = this; 
	clearInterval(window[this.reference+evnt+"autoInterval"]);
	if(this[evnt].autoSlow != undefined){
		if(this[evnt].autoInverse){
			window[this.reference+evnt+"autoInterval"] = setInterval(function(){
				that.prev(evnt, true, false, true);
				that.autoStart(evnt); // normal auto
			}, this[evnt].autoSlow);
		}else{
			window[this.reference+evnt+"autoInterval"] = setInterval(function(){
				that.next(evnt, true, false, true);
				that.autoStart(evnt); // normal auto
			}, this[evnt].autoSlow);
		}
		this.onAutoSlow(evnt); // on event
	}
};

/*
 * Call onAutoSlow
 * @function onAutoSlow(evnt)
 * 	@param evnt:string - automatic event to start
 */
Mg.prototype.onAutoSlow = function(evnt){
	if(this[evnt].onAutoSlow != undefined){
		this[evnt].onAutoSlow();
	}
};

/*
 * Stops automatic
 * @function autoStop(evnt)
 * 	@param evnt:string - automatic event to stop
 */
Mg.prototype.autoStop = function(evnt){
	clearInterval(window[this.reference+evnt+"autoInterval"]);
	// remove from mg_automaticArr
	var o = {that:this, evnt:evnt}
	var found = false;
	for(var z=0, len2=window.mg_automaticArr.length; z<len2; z++){
		var o2 = window.mg_automaticArr[z];
		if(o2.that.reference == o.that.reference && o2.evnt == o.evnt){
			mg_automaticArr.splice(z, 1);
			break;
		}
	}
};

/*
 * Functions to manage automatic intervals on window blur and window focus
 */
window.mg_automaticArr = [];
window.onblur = function(){
	for(var z=0, len2=window.mg_automaticArr.length; z<len2; z++){
		var o = window.mg_automaticArr[z];
		clearInterval(window[o.that.reference + o.evnt + "autoInterval"]);
	}
}
window.onfocus = function(e){
	for(var z=0, len2=window.mg_automaticArr.length; z<len2; z++){
		var o = window.mg_automaticArr[z];
    	o.that.autoStart(o.evnt);
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// MULTIPLE FUNCTIONS ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Set multi data
 * @function setMultiple(evnt, eventType)
 * 	@param evnt:string - event to change
 * 	@param eventType:string - can be "init" "item" "prev" "next" "first" "last" or custom
 */
Mg.prototype.setMultiple = function(evnt, eventType){
	var thisEvnt = this[evnt];
	var target = thisEvnt.num;
	var oldTarget = thisEvnt.oldNum;
	if(target != null || eventType == "init"){ // if null we skip this to keep last multi variables
		
		// variables
		thisEvnt.multiBeforeIn = [];
		thisEvnt.multiBeforeOut = [];
		thisEvnt.multiAfterIn = [];
		thisEvnt.multiAfterOut = [];
		thisEvnt.direction = null;
		// set functions and variables
		if(thisEvnt.multiMode == "centered"){
			var mapType = "mapNumCentered";
			var distType = "nearest";
			var lengthType = "normal";
		}else if(thisEvnt.multiMode == "fixed"){
			var mapType = "mapNumFixed";
			var distType = "serie";
			var lengthType = "serie";
		}else if(thisEvnt.multiMode == "flexible"){
			var mapType = "mapNumFixed";
			var distType = "normal";
			var lengthType = "serie";
			thisEvnt.fixedLess = thisEvnt.multiLess;
			thisEvnt.fixedPlus = thisEvnt.multiPlus;
		}
		// calculate activated
		thisEvnt.multiOldActivated = thisEvnt.multiActivated;
		thisEvnt.multiActivated = this[mapType](target, thisEvnt.multiLess, thisEvnt.multiPlus, this.totalItems, thisEvnt.cycle, thisEvnt.fixedLess, thisEvnt.fixedPlus, thisEvnt.firstToSteps, thisEvnt.lastToSteps);
		// calculate others
		if(eventType != "init" && thisEvnt.multiActivated[0] != thisEvnt.multiOldActivated[0]){
			if(distType == "normal"){
				var dist = this.findNormalDistance(target, oldTarget);
			}else if(distType == "nearest"){
				var dist = this.findNearestDistance(target, oldTarget, this.totalItems, thisEvnt.cycle);
			}else if(distType == "serie"){
				var dist = this.findNormalDistance(target, oldTarget);
			}
			if(lengthType == "normal"){
				var length = dist;
			}else if(lengthType == "serie"){
				var min = thisEvnt.fixedLess;
				var max = this.totalItems-1-thisEvnt.fixedPlus;
				var count = thisEvnt.multiLess+thisEvnt.multiPlus+1;
				var length = count-thisEvnt.fixedPlus-thisEvnt.fixedLess;
				if((target <= min && oldTarget >= max) || (oldTarget <= min && target >= max)){ // if activating on first or on last
					length = this.totalItems-thisEvnt.multiActivated.length; // multiActivated.length instead of count cause when you have empty on fixed
				}else if(Math.abs(dist)>1 && thisEvnt.multiMode == "flexible"){ // fix
					length = length+Math.ceil(Math.abs(dist)/2);
				}
			}
			this.setOthers(thisEvnt, target, oldTarget, dist, length);
			thisEvnt.distance = dist;
		}
		
	}
};

/*
 * Returns a maps a serie of numbers based on +plus -less with num centered, between 0 and max
 * for example with num = 1, less = 2, plus = 2, max = 5, cycle = true the return array is [5, 0, 1, 2, 3]
 * @function mapNumCentered(num, less, plus, max, cycle)
 * 	@param num:number - number
 * 	@param less:number - additional before the num
 * 	@param plus:number - additional after the num
 *	@param max:number - maximum number
 *	@param cycle:boolean - if the values cycle, from max to 0 and vice versa
 */
Mg.prototype.mapNumCentered = function(num, less, plus, max, cycle){
	var arr = [];
	for(var i=-less; i<=plus; i++){
		if(num+i<max || cycle){ // check if num > max we put null because the item doesn't exist, except with cycle
			if(num+i<0 && cycle){
				arr.push(max-(-num-i));
			}else if(num+i>=max && cycle){
				arr.push(num+i-max);
			}else{
				arr.push(num+i);
			}
		}else{
			arr.push(null);
		}
	}
	return arr;
};

/*
 * Returns a maps a serie of numbers based on +plus -less with num inside, between 0 and max
 * for example with num = 6, less = 2, plus = 2, max = 7, cycle = false the return array is [5, 6, 7, null, null]
 * additionally fixedLess and fixedPlus extend inside the serie of items
 * @function mapNumFixed(num, less, plus, max, cycle, fixedLess, fixedPlus)
 * 	@param num:number - number
 * 	@param less:number - additional before the num
 * 	@param plus:number - additional after the num
 *	@param max:number - maximum number
 *	@param cycle:boolean - if the values cycle, from max to 0 and vice versa
 *	@param fixedLess:number - number of additional before items on the serie
 *	@param fixedPlus:number - number of additional after items on the serie
 *  @param firstToSteps:boolean - true if the items scrolls all the way on first, false if the items scrolls only to show first
 *  @param lastToSteps:boolean - true if the items scrolls all the way on last, false if the items scrolls only to show last
 */
Mg.prototype.mapNumFixed = function(num, less, plus, max, cycle, fixedLess, fixedPlus, firstToSteps, lastToSteps){
	var arr = [];
	var count = less+plus+1;
	var nserie = Math.floor((num-fixedLess)/(count-fixedPlus-fixedLess)); // 0 or more is the number of the serie
	var start = nserie*(count-fixedPlus-fixedLess);
	var limit = max-start-fixedLess;
	if(num < count-fixedPlus && !firstToSteps){ // check if first items can be inside next nseries
		var nserie = 0;
		var start = nserie*(count-fixedPlus-fixedLess);
	}else if(fixedPlus >= limit && !lastToSteps){ // check if last items can be inside previous nseries
		start = (nserie-fixedPlus-1+limit)*(count-fixedPlus-fixedLess); // set start before
	}
	for(var i=0, len=count; i<len; i++){
		if(start+i<max){
			arr.push(start+i);
		}
	}
	return arr;
};

/*
 * Set multiAfterIn multiBeforeOut multiBeforeIn multiAfterOut for centered multi
 * @function setOthers(thisEvnt, target, oldTarget, dist)
 * 	@param thisEvnt:object - event object
 * 	@param target:number - target item number
 * 	@param oldTarget:number - old target item number
 *	@param dist:number - distance between target and oldTarget
 *	@param length:number - length used on loops
 */
Mg.prototype.setOthers = function(thisEvnt, target, oldTarget, dist, length){
	if(dist > 0){ // going right
		thisEvnt.direction = 1;
		for(var i=0, len=Math.abs(length); i<len; i++){
			thisEvnt.multiAfterIn.unshift(thisEvnt.multiActivated[thisEvnt.multiOldActivated.length-i-1]);
			thisEvnt.multiBeforeOut.unshift(thisEvnt.multiOldActivated[length-i-1]);
		}
		thisEvnt.multiDeactivated = thisEvnt.multiBeforeOut;
	}else{ // going left
		thisEvnt.direction = 0;
		for(var i=0, len=Math.abs(length); i<len; i++){
			thisEvnt.multiBeforeIn.push(thisEvnt.multiActivated[i]);
			thisEvnt.multiAfterOut.push(thisEvnt.multiOldActivated[thisEvnt.multiOldActivated.length-i-1]);
		}
		thisEvnt.multiDeactivated = thisEvnt.multiAfterOut;
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// MATH FUNCTIONS ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Returns the distance between num and center, with center having the lowest number, based on max and min (ex: 2,1,0,1,2)
 * @function mapDistance(center, num)
 * 	@param center:number - to number
 * 	@param num:number - from number
 */
Mg.prototype.mapDistance = function(center, num){
	return center-num;
};

/*
 * Returns the reverse distance between num and center, with center having the highest number, based on max and min (ex: 0,1,2,1,0)
 * @function mapDistanceReverse(center, num, max, min)
 * 	@param center:number - to number
 * 	@param num:number - from number
 *	@param max:number - max number
 * 	@param min:number - min number
 */
Mg.prototype.mapDistanceReverse = function(center, num, max, min){
	var max_distance = max-min;
	if (num == center){
		return center;
	}else if(num<max_distance/2){
		return -num;
	}else if(num>max_distance/2){
		return (max_distance-num-1);
	}else{
		return max_distance/2;
	}
};

/*
 * Returns the nearest distance between i and z
 * @function findNormalDistance(i, z)
 * 	@param i:number - from number
 * 	@param z:number - to number
 */
Mg.prototype.findNormalDistance = function(i, z){
	return (i-z);
};

/*
 * Returns the nearest distance between i and z, considering values from 0 to max
 * The distance evaluate the nearest considering cycling from 0 to max if cycle is true
 * @function findNearestDistance(i, z, max, cycle)
 * 	@param i:number - from number
 * 	@param z:number - to number
 *	@param max:number - max number of values
 *	@param cycle:boolean - if the values cycle, from max to 0 and vice versa
 */
Mg.prototype.findNearestDistance = function(i, z, max, cycle){
	var maxDist = max/2;
	if(!cycle || (i-z<maxDist && i-z>-maxDist)){ // not cycle or into the max distance limits
		return (i-z);
	}else if(i-z>maxDist){ // if we are going right over the limits
		if(z>i){
			return (-i-(max-z));
		}else{
			return (-z-(max-i));
		}
	}else if(i-z<-maxDist){ // if we are going left over the limits
		if(z>i){
			return (i+(max-z));
		}else{
			return (z+(max-i));
		}
	}
	return 0;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// ANCHORIZE FUNCTIONS //////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Manages url hash changes using registered events
 */
var mg_startingTitle = document.title;
var mg_startingUrl = document.location;
if("onhashchange" in window){

	window.mg_AnchorEvntsArr = [];
	window.mg_HashEvntsArr = [];

	window.onhashchange = function(){
		// loop hash events
		for(var z=0, len2=window.mg_HashEvntsArr.length; z<len2; z++){
			var evnt = window.mg_HashEvntsArr[z];
			var path = evnt.obj;
			var found = false;
			// if we have useLinkHash we can have only an event on anchor
			arr = path.itemsLink;
			for(var i=0, len=arr.length; i<len; i++){
				// get the starting anchor without & anchors
				var href = window.location.hash;
				var anchors = href.split("&");
				// if match
				if(arr[i].href == anchors[0]){
					path.setState(i, evnt.evnt, true, true, true, true, "anchor");
					found = true;
					break;
				}
			}
		}
		// loop anchor events
		for(var z=0, len2=window.mg_AnchorEvntsArr.length; z<len2; z++){
			var evnt = window.mg_AnchorEvntsArr[z];
			var path = evnt.obj;
			var found = false;
			// if standard anchor we can have multiple events on anchor
			var href = window.location.hash.replace("#", "");
			var arr = href.split("&");
			for(var i=0, len=arr.length; i<len; i++){
				var values = arr[i].split("=");
				var re = values[0].split("|");
				var reference = re[0];
				var evnt = re[1];
				if(reference == path.reference){
					var i = parseFloat(values[1]);
					if(i != path[evnt].activated){
						path.setState(i, evnt, true, true, true, true, "anchor");
					}
					found = true;
					break;
				}
			}
		}
	}

}

/*
 * Manages url pushstate changes using registered events
 */
if(!!(window.history && window.history.pushState)){

	mg_UrlEvntsArr = [];
	
	var mg_history = window.history; // firefox fix 
	var mg_pushState = window.history.pushState;
	window.history.pushState = function(state, title, url, skipSetState){
	    window.onpushstate({'state':state, 'title':title, 'url':url}, skipSetState);
	    return mg_pushState.apply(mg_history, arguments);
	}
	function mg_onpushpopstate(state, skipSetState){
		// fix for starting page
		if(!state.state){
			window.history.pushState({'title':mg_startingTitle, 'url':mg_startingUrl}, mg_startingTitle, mg_startingUrl);
		}
		//
		if(!skipSetState){
			// loop registered events
			for(var z=0, len2=window.mg_UrlEvntsArr.length; z<len2; z++){
				var evnt = window.mg_UrlEvntsArr[z];
				var path = evnt.obj;
				var href = state.state["url"];
				arr = path.itemsLink;
				for(var i=0, len=arr.length; i<len; i++){
					if(arr[i].href == href){
						path.setState(i, evnt.evnt, true, true, true, true, "anchor");
						var title = state.state["title"] || path.itemsLink[i].title;
						path.setDocumentTitle(title);
						return true;
					}
				}
			}
		}
	}
	window.onpushstate = function(state, skipSetState){
		mg_onpushpopstate(state, skipSetState);
	}
	window.onpopstate = function(state, skipSetState){
		mg_onpushpopstate(state, skipSetState);
	}

}

/*
 * Makes and manage multiple anchors as key=value
 * @function makeAnchor(value, key, justRead)
 * 	@param value:string - value to store
 * 	@param key:string - key to store
 * 	@variable this.eventType:string - can be "init" "item" "prev" "next" "first" "last" "scroll" "drag" "fraction" or custom
 */
Mg.prototype.makeAnchor = function(value, key, eventType){
	var evnt = this[key];
	var location = window.location.toString();
	var loc = location.substr(0, location.indexOf("#"));
	if(evnt.anchorize == "useLinkHash"){
		// if we have useLinkHash we can have only an event on anchor
		if(eventType == "init"){
			// if init we see if the anchor is on the items list
			var arr = this.itemsLink;
			for(var i=0, len=arr.length; i<len; i++){
				// get the starting anchor without & anchors
				var href = window.location.hash;
				var anchors = href.split("&");
				// if match
				if(arr[i].href == anchors[0]){
					this.setDocumentTitle(arr[i].title);
					// we return the index
					return i;
				}
			}
		}else{
			// else we set the url
			var href = window.location.hash.replace("#", "");
			var anchors = href.split("&");
			if(value == null){
				// if new value is null remove the anchor
				anchors.splice(0, 1);
			}else{
				// else replace the result
				anchors[0] = this.itemsLink[value].href;
			}
			// set the url
			window.location.hash = this.anchorOutput(anchors, "");
		}
	}else if(evnt.anchorize == "useLinkUrl"){
		// if we have useLinkHash we can have only an event on anchor
		if(eventType == "init"){
			// if init we see if the anchor is on the items list
			var arr = this.itemsLink;
			for(var i=0, len=arr.length; i<len; i++){
				if(arr[i].href == window.location || arr[i].href == loc){
					// then we return the index
					return i;
				}
			}
		}else{
			// else we set the url
			var url = this.itemsLink[value].href;
			var title = this.itemsLink[value].title;
			if(window.mg_UrlEvntsArr){ // if browser support
				window.history.pushState({'title':title, 'url':url}, title, url, true);
				this.setDocumentTitle(title);
			}
		}
	}else if(evnt.anchorize == "useAnchor"){
		// if useAnchor we can have multiple events on anchor
		// search if already defined and set found as the position
		var href = window.location.hash.replace("#", "");
		var anchors = href.split("&");
		var found;
		for(var i=0, len=anchors.length; i<len; i++){
			var values = anchors[i].split("=");
			if(values[0] == this.reference+"|"+key){
				found = i;
				break;
			}
		}
		//
		if(eventType == "init"){
			// if init we have to get the anchor value and return it
			if(found != undefined){
				return(values[1]);
			}else{
				return(undefined);
			}
		}else{
			if(found != undefined){
				// if found
				if(value == null){
					// if new value is null remove the anchor
					anchors.splice(found, 1);
				}else{
					// else replace the result
					anchors[found] = this.reference+"|"+key+"="+value;
				}
			}else{
				// if not found add the anchor
				anchors.push(this.reference+"|"+key+"="+value);
			}
			// set the url
			window.location.hash = this.anchorOutput(anchors, "#");
		}
	}
};

/*
Mg.prototype.getAnchor = function(key){
	var anchor = window.location.hash.replace("#", "");
	var arr = anchor.split("&");
	var found;
	for(var i=0, len=arr.length; i<len; i++){
		var values = arr[i].split("=");
		if(values[0] == this.reference+"|"+key){
			found = i;
			break;
		}
	}
	return(values[1]);
};
*/
/*
Mg.prototype.resetAnchor = function(){
	for(var i=0, len=this.events.length; i<len; i++){
		var evnt = this.events[i];
		var thisEvnt = this[evnt];
		if(thisEvnt.anchorize){
			this.setState(undefined, evnt, true, true, true, false, "reset");
			thisEvnt.activated = thisEvnt.initNum.slice();
			this.init(true);
		}
	}
};
*/

/*
 * Return output anchor from an array
 * @function anchorOutput(anchors, output)
 * 	@param anchors:array - anchors array
 * 	@param output:string - starting string for the output
 */
Mg.prototype.anchorOutput = function(anchors, output){
	for(var i=0, len=anchors.length; i<len; i++){
		if(anchors[i] != ""){
			output += anchors[i];
			if(i != anchors.length-1){
				output += "&";
			}
		}
	}
	return output;
};
/*
 * Sets the document title
 * @function setDocumentTitle(title)
 * 	@param title:string - the title to set
 */
Mg.prototype.setDocumentTitle = function(title){
	if(title){
		document.title = title;
	}else{
		document.title = window.mg_startingTitle;
	}
};

/*
 * Remove and add event to array if anchorize match
 * @function registerEvent(evnt, arr, anchorize)
 * 	@param evnt:object - event object
 * 	@param arr:array - array that stores the events
 * 	@param anchorize:string - the type of anchorize of the array
 */
Mg.prototype.registerEvent = function(evnt, arr, anchorize) {
	var found = false;
	for(var i=0, len=arr.length; i<len; i++){
		if(arr[i] == evnt){
			// remove event from array
			if(evnt.anchorize != anchorize){arr.splice(i, 1);}
			// stop searching
			found = true;
			break;
		}
	}
	// add event to array
	if(evnt.anchorize == anchorize && !found){arr.push(evnt);}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// SCROLL DRAG FUNCTIONS //////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Add Javascript events: support mouseenter and mouseleave and fix scope of event handlers 
 * @function addEvent(obj, evnt, fn, useCapture)
 * 	@param obj:documentElement - a single element in a document
 * 	@param evnt:string - event name
 * 	@param fn:function - function to call on event
 * 	@param useCapture:boolean - useCapture indicates if the user wishes to initiate capture
 */
Mg.prototype.addEvent = function(obj, evnt, fn, useCapture){
	if(typeof obj.attachEvent != 'undefined'){ // ie7 ie8 fix
		// utils for attachEvent
		function getEvent(e, boundEl){
			var e = e || window.event;
			if(!e){
				var c = this.getEvent.caller;
				while(c){
					e = c.arguments[0];
					if(e && Event == e.constructor){
						break;
					}
					c = c.caller;
				}
			}
			return e;
		}
		var wrappedFn = function(e){
			return fn.call(obj, getEvent(e, obj));
		}
		// core for attachEvent
		obj.detachEvent("on"+evnt, wrappedFn); 
		obj.attachEvent("on"+evnt, wrappedFn);
	}else{
		// utils for addEventListener
		function mouseEnter(fn){
			return function(evnt){
				var relTarget = evnt.relatedTarget;
				if(this == relTarget || isAChildOf(this, relTarget)){
					return;
				}
				fn.call(obj, evnt);
			}
		}
		function isAChildOf(parent, child){
			if(parent == child){
				return false;
			}
			while(child && child !== parent){
				child = child.parentNode;
			}
			return child == parent;
		}
		// core for addEventListener
		if(evnt == 'mouseenter'){
    		obj.removeEventListener('mouseover', mouseEnter(fn), useCapture);
			obj.addEventListener('mouseover', mouseEnter(fn), useCapture);
		}else if(evnt == 'mouseleave'){
    		obj.removeEventListener('mouseout', mouseEnter(fn), useCapture);
			obj.addEventListener('mouseout', mouseEnter(fn), useCapture);
		}else{
    		obj.removeEventListener(evnt, fn, useCapture);
			obj.addEventListener(evnt, fn, useCapture);
		}
	}
};

/*
 * Add Javascript scroll or drag
 * @function addScrollDrag(evnt, itemIn, itemOut, min, max, vertical, scrollDragStr)
 * 	@param evnt:string - event name
 * 	@param itemIn:documentElement - element that gets dragged
 * 	@param itemOut:documentElement - element that is the bound of the dragged one
 * 	@param min:number - minimum value
 * 	@param mmax:number - maximum value
 * 	@param vertical:boolean - if the drag is vertical
 * 	@param scrollDragStr:boolean - if is scrollDragStred so that you drag itemOut in itemIn bound boxbox
 */
Mg.prototype.addScrollDrag = function(evnt, itemIn, itemOut, min, max, vertical, scrollDragStr){
	function itemInOnMouseDown(e){
		if(!e){e = window.event} // ie fix
		if(e == undefined){ e = {clientX:this.startPosX,clientY:this.startPosY};} // firefox fix when calling from itemOut
		if(e.clientX == undefined){e.clientX = e.touches[0].clientX; e.clientY = e.touches[0].clientY} // touch fix
		var target = this;
		var mg = target.mg;
		var evnt = target.evnt;
		var scrollDragStr = target.scrollDragStr;
		document.t = target;
		document.onmousemove = itemInOnMouseMove; document.onmouseup = itemInOnMouseUp; 
		document.ontouchmove = itemInOnMouseMove; document.ontouchend = itemInOnMouseUp;
		//
		target.style.cursor = mg[evnt][scrollDragStr+"CursorOn"];
		target.time = +new Date();
		target.count = 0;
		target.startPosX = e.clientX;
		target.startPosY = e.clientY;
		//
		var transform = target.mg.getTransform(target);
		if(!target.vertical){
			if(!transform){
				target.offsetPos = target.offsetLeft;
			}else{
				target.offsetPos = transform.left;
			}
			itemIn.swipeDist = target.itemOut.offsetWidth/target.concurrent;
		}else{
			if(!transform){
				target.offsetPos = target.offsetTop;
			}else{
				target.offsetPos = transform.top;
			}
			itemIn.swipeDist = target.itemOut.offsetHeight/target.concurrent;
		}
		// transform fix
		if(target.itemIn.instantOffsetPos){
			target.offsetPos = target.itemIn.instantOffsetPos;
			target.itemIn.instantOffsetPos = null;
		}
		// set nums
		target.num = target.offsetPos;
		target.startnum = target.num;
		//
		target.clicked = true;
		clearTimeout(mg[evnt]["clickedInterval"+scrollDragStr]);
		clearTimeout(mg[evnt]["frictionInterval"+scrollDragStr]);
		if(!e.which || e.which == 1){
			mg.scClick(target);
		}
		// prevent other events to execute
		target.mg.stopPropagation(e);
		// clicking on the drag or scroll it cancels the current focus
		/*
		if(document.activeElement != document.body){ // ie9- because it bugs the window
			document.activeElement.blur();
		}*/
		// remove selection
		if(window.getSelection){
			if(window.getSelection().empty){  // Chrome
				window.getSelection().empty();
			}else if(window.getSelection().removeAllRanges){  // Firefox
				window.getSelection().removeAllRanges();
			}
		}else if(document.selection){  // IE?
			document.selection.empty();
		}
	}
	function itemInOnMouseMove(e){
		if(!e){e = window.event} // ie fix
		if(e.clientX == undefined){e.clientX = e.touches[0].clientX;e.clientY = e.touches[0].clientY;}// touch fix
		else{if("ontouchstart" in window && e.touches[0].clientX == undefined){e.clientX = e.clientY = target.lastClient;}} // android fix
		var target = document.t;
		// set num
		if(!target.vertical){
			var dist = e.clientX-target.startPosX;
			var distOther = e.clientY-target.startPosY;
		}else{
			var dist = e.clientY-target.startPosY;
			var distOther = e.clientX-target.startPosX;
		}
		if(Math.abs(distOther) < Math.abs(dist) && Math.abs(dist) > 10){ // prevent page drag on touch
			var num = target.lastClient = target.offsetPos+dist;
			num = target.mg.scCheckLimits(num, target.isScroll, target.further, target.min, target.max);
			target.count += num-target.num; // build inertia
			target.count *= target.power; // lose power
			target.num = num;
			target.mg.scMove(target, num);
			target.mg.stopPropagation(e);
			target.mg.preventDefault(e);
		}
	}
	function itemInOnMouseUp(e){
		if(!e){e = window.event} // ie fix
		if(e.clientX == undefined){e.clientX = e.changedTouches[0].clientX; e.clientY = e.changedTouches[0].clientY} // touch fix
		else{if("ontouchstart" in window && e.touches[0].clientX == undefined){e.clientX = e.clientY = target.lastClient;}} // android fix		
		var target = document.t;
		var evnt = target.evnt;
		var mg = target.mg;
		var min = target.min;
		var max = target.max;
		var num = target.num;
		document.onmousemove = null; document.onmouseup = null;
		document.ontouchmove = null; document.ontouchend = null;
		//
		target.style.cursor = mg[evnt][target.scrollDragStr+"CursorOff"];
		if(target.clicked){
			// detect movement
			if(!target.vertical){
				var dist = e.clientX-target.startPosX;
				var distOther = e.clientY-target.startPosY;
			}else{
				var dist = e.clientY-target.startPosY;
				var distOther = e.clientX-target.startPosX;
			}
			if(Math.abs(dist) > 30){ // if is movement
				target.onclick=function(){return false;} // disable links on click
				var t = +new Date();
				var f = false;
				if(!target.isScroll){
					if(Math.abs(dist) < target.swipeDist/2 && Math.abs(distOther) < Math.abs(dist)){
						// if swipe and not drag
						var add = Math.abs(max-min)/mg.totalItems;
						if(dist<0){num = num-add;}else{num = num+add;}
					}else{
						// gives friction if dragging inside bound
						if(num<=-min && num>=-max){f = true;}
					}
				}else{
					// gives friction if scrolling inside bound
					if(num>=min && num<=max){f = true;}
				}
				if(f && !mg[evnt].disableFriction){
					itemInOnFriction(target, target.friction, num);
				}else{
					mg.scMove(target, num, true);
					mg.scReleaseFraction(target);
					mg.scRelease(target, num);
				}
				// prevent internal links when dragging
				target.mg.stopPropagation(e);
			}else{ // if it's a click not movement
				target.onclick=function(){} // makes links clickable
				mg.scReleaseFraction(target);
				mg.scRelease(target, num);
			}
			mg[evnt]["clickedInterval"+target.scrollDragStr] = setTimeout(function(){target.clicked = false;}, 113);
		}
	}
	function itemInOnFriction(target, friction, num){
		var evnt = target.evnt;
		var mg = target.mg;
		//
		target.count *= friction; // lose inertia
		var count = target.count;
		num += count; // friction
		target.num = num;
		if(!friction || (count>-1 && count<1)){
			mg.scReleaseFraction(target);
			mg.scRelease(target, num);
		}else{
			mg.scMove(target, num);
			num = mg.scCheckLimits(num, target.isScroll, 0, target.min, target.max);
			mg[evnt]["frictionInterval"+target.scrollDragStr] = setTimeout(function(){itemInOnFriction(target, friction, num);}, 13);
		}
	}
	//
	if(!this[evnt][scrollDragStr+"OnlyTouch"]){
		itemIn.onmousedown = itemIn.ontouchstart = itemInOnMouseDown;
		itemIn.onmouseup = itemIn.ontouchend = itemInOnMouseUp;
	}else{
		itemIn.ontouchstart = itemInOnMouseDown;
		itemIn.ontouchend = itemInOnMouseUp;
	}
	itemIn.evnt = evnt;
	itemIn.mg = this;
	itemIn.itemOut = itemOut;
	itemIn.itemIn = itemIn;
	itemIn.vertical = vertical;
	itemIn.scrollDragStr = scrollDragStr;
	itemIn.wheelnum = 0;
	itemIn.friction = this[evnt][scrollDragStr+"Friction"];
	itemIn.power = this[evnt][scrollDragStr+"Power"];
	itemIn.further = this[evnt][scrollDragStr+"Further"];
	if(!this[evnt][scrollDragStr+"OnlyTouch"]){
		itemIn.style.cursor = itemIn.mg[evnt][scrollDragStr+"CursorOff"];
	}
	//
	if(scrollDragStr != "scroll"){ // if is scroll make itemOut clickable
		itemOut.isScroll = itemIn.isScroll = false;
		if(this[evnt][scrollDragStr+"Wheel"]){
			this.addWheel(itemIn, this.scWheel);
		}
	}else{
		itemOut.isScroll = itemIn.isScroll = true;
		function getOffset(elem){
			var box = elem.getBoundingClientRect();
			return box ? {top:box.top, left:box.left} : {top:0, left:0};
		}
		function itemOutOnMouseDown(e){
			if(!e){e = window.event} // ie fix
			if(e.clientX == undefined){e.clientX = e.touches[0].clientX;e.clientY = e.touches[0].clientY;}// touch fix
			var target = this;
			//
			if(this == target && !target.itemIn.clicked){ // filter out other element over target, and ipad fix touchend fires
				if(!target.vertical){
					var num = e.clientX-getOffset(target).left-target.itemIn.offsetWidth/2;
				}else{
					var num = e.clientY-getOffset(target).top-target.itemIn.offsetHeight/2;
				}
				target.itemIn.startPosX = e.clientX;
				target.itemIn.startPosY = e.clientY;
				num = target.mg.scCheckLimits(num, target.isScroll, 0, target.min, target.max);
				target.itemIn.instantOffsetPos = num; // transform fix
				target.mg.scReleaseSet(target, num);
				if(e.type == "touchstart"){target.itemIn.ontouchstart();}else{target.itemIn.onmousedown();}
				//target.itemIn.OffsetPos = num; // firefox fix
			}
			return false;
		}
		//
		itemOut.onmousedown = itemOut.ontouchstart = itemOutOnMouseDown;
		itemOut.evnt = evnt;
		itemOut.mg = this;
		itemOut.itemIn = itemIn;
		itemOut.itemOut = itemOut;
		itemOut.vertical = vertical;
		itemOut.scrollDragStr = scrollDragStr;
		itemOut.wheelnum = 0;
		//
		if(this[evnt][scrollDragStr+"Wheel"]){
			this.addWheel(itemOut, this.scWheel);
		}
	}
	itemOut.ondragstart = itemIn.ondragstart = function(e){return false;} // ie drag items fix
};
Mg.prototype.scClick = function(target){
	var evnt = target.evnt;
	var isScroll = target.isScroll;
	var itemIn = target.itemIn;
	var itemOut = target.itemOut;
	var scrollDragStr = target.scrollDragStr;
	// utils info
	this[evnt].startPosX = itemIn.startPosX;
	this[evnt].startPosY = itemIn.startPosY;
	//
	if(this[evnt][scrollDragStr+"Click"] != undefined){this[evnt][scrollDragStr+"Click"]();}
};
Mg.prototype.scMove = function(target, num, onlycalc, isWheel){
	var evnt = target.evnt;
	var scrollDragStr = target.scrollDragStr;
	var isScroll = target.isScroll;
	var min = target.min;
	var max = target.max;
	var fraction = this[evnt][scrollDragStr+"Fraction"];
	var rounding = this[evnt].rounding;
	// position and dragged
	this[evnt][scrollDragStr+"Dragged"] = target.startnum-num;
	this[evnt][scrollDragStr+"Position"] = num;
	// activated
	if(!isWheel){
		if(!isScroll){max=-max;min=-min;}
		// position
		if(!this[evnt][scrollDragStr+"Invert"]){
			var pos = num-min;
		}else{
			var pos = max-num-min;
		}
		var numfloat = (this.totalItems-1)*(pos/(max-min)); 
		var num = Math[rounding](numfloat);
	}
	if(num != this[evnt].num || fraction){ // fixes multiple set to the same number while dragging, is here for only the drag and not in setState
		if(num >= 0 && num <= this.totalItems-1){ // fixes activation with dragFurther
			if(fraction){var etype = "fraction";}else{var etype = scrollDragStr;}
			this[evnt].fraction = this.calculateFraction(numfloat, rounding);
			this.setState(num, evnt, true, !isScroll, isScroll, true, etype);
		}else if(this[evnt].cycle){ // fix dragging on cycling items
			var etype = scrollDragStr;
			if(num < 0){num = this.totalItems+num;}else{num = num-this.totalItems;}
			this.setState(num, evnt, true, !isScroll, isScroll, true, etype);
		}
	}
	//
	if(!onlycalc && this[evnt][scrollDragStr+"Move"] != undefined){this[evnt][scrollDragStr+"Move"]();}
};
Mg.prototype.scReleaseSet = function(target, num){
	var evnt = target.evnt;
	var itemIn = target.itemIn;
	var itemOut = target.itemOut;
	var scrollDragStr = target.scrollDragStr;
	var min = target.min;
	var max = target.max;
	var tot = this.totalItems-1;
	var rounding = this[evnt].rounding;
	//
	if(this[evnt][scrollDragStr+"Invert"]){num = max-num;}
	var n = Math[rounding]((this.totalItems-1)*(num/(max-min)));
	this.setState(n, evnt, true, false, true, true, scrollDragStr);
	this.scRelease(target, num);
};
Mg.prototype.scRelease = function(target, num){
	var evnt = target.evnt;
	var itemIn = target.itemIn;
	var itemOut = target.itemOut;
	var scrollDragStr = target.scrollDragStr;
	var isScroll = target.isScroll;
	var min = target.min;
	var max = target.max;
	var tot = this.totalItems-1;
	var fraction = this[evnt][scrollDragStr+"Fraction"];
	//
	if(num != undefined){
		itemIn.wheelnum = itemOut.wheelnum = num;
		this[evnt][scrollDragStr+"Dragged"] = target.startnum-num;
	}
	if(!isScroll){max=-max;min=-min;}
	var pos = this[evnt].activated * ((max-min)/tot) || 0;
	if(!this[evnt][scrollDragStr+"Invert"]){
		this[evnt][scrollDragStr+"Position"] = min+pos;
	}else{
		this[evnt][scrollDragStr+"Position"] = max-pos;
	}
	//
	if(num != undefined){
		// if it's an actuaL release
		if(this[evnt][scrollDragStr+"Release"] != undefined){this[evnt][scrollDragStr+"Release"]();}
	}else{
		// if it's a refresh
		if(this[evnt][scrollDragStr+"Move"] != undefined){this[evnt][scrollDragStr+"Move"]();}
	}
};
Mg.prototype.scReleaseFraction = function(target){
	var evnt = target.evnt;
	var scrollDragStr = target.scrollDragStr;
	var fraction = this[evnt][scrollDragStr+"Fraction"];
	if(fraction){
		this.setState(this[evnt].activated, evnt, true, !target.isScroll, target.isScroll, true, scrollDragStr); // fires setState for fraction but without eventType="fraction"
	}
};
Mg.prototype.scCheckLimits = function(num, isScroll, further, min, max){
	if(!isScroll){
		if(num > -min){
			num = -min+(num+min)*further;
		}else if(num < -max){
			num = -max+(num+max)*further;
		}
	}else{
		if(num < min){
			num = min+(num-min)*further;
		}else if(num > max){
			num = max+(num-max)*further;
		}
	}
	return num;
};
Mg.prototype.scGetMin = function(evnt, itemIn, itemOut, vertical, concurrent){
	if(!this[evnt].firstToSteps){concurrent = 1;}
	if(!vertical){
		return -itemIn.offsetWidth*(concurrent-1)/concurrent;
	}else{
		return -itemIn.offsetHeight*(concurrent-1)/concurrent;
	}
};
Mg.prototype.scGetMax = function(evnt, itemIn, itemOut, vertical, concurrent){
	if(!this[evnt].lastToSteps){concurrent = 1;}
	if(!vertical){
		return itemOut.offsetWidth-itemIn.offsetWidth/concurrent;
	}else{
		return itemOut.offsetHeight-itemIn.offsetHeight/concurrent;
	}
};
Mg.prototype.addWheel = function(obj, fnc){
	var evnt = (/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
	if(typeof obj.attachEvent == 'undefined'){ // ie7 ie8 fix
		obj.addEventListener(evnt, fnc, false);
	}
};
Mg.prototype.scWheel = function(e){
	var target = this;
	var mg = target.mg;
	//
	var delta = 0;
	if(e.wheelDelta){ // IE/Opera
		delta = e.wheelDelta/120;
	}else if(e.detail){ // Mozilla
		delta = -e.detail/3;
	}
	var num = target.wheelnum-delta;
	if(num >= 0 && num <= mg.totalItems-1){
		mg.scMove(target, num, true, true);
		mg.scReleaseFraction(target);
		mg.scRelease(target, mg[target.evnt].activated);
		mg.stopPropagation(e);
		mg.preventDefault(e);
	}
};
Mg.prototype.calculateFraction = function(numfloat, rounding){
	var fraction = numfloat%1;
	if(rounding == "round"){
		fraction -= 0.5; if(fraction<0){fraction += 1;}
	}else if(rounding == "ceil"){
		fraction +=1; if(fraction>1){fraction -= 1;}
	}
	return fraction;
};
Mg.prototype.getTransform = function(target){
	var arr = ["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform", "KhtmlTransform"];
	for(var i=0, len=arr.length; i<len; i++){
		var transform = target.style[arr[i]];
		if(transform){
			// get transform matrix
			var compStyle = this.getCompStyle(target);
			var cssMatrix = compStyle[arr[i]];
			var matrix = cssMatrix.replace(/[^0-9\-.,]/g, '').split(',');
			// get top and left
			var p = {};
			p.left = (cssMatrix.indexOf("matrix3d") == 0) ? matrix[12] * 1 : matrix[4] * 1; // matrix3d fix ie10
			p.top = (cssMatrix.indexOf("matrix3d") == 0) ? matrix[13] * 1 : matrix[5] * 1; // matrix3d fix ie10
	  		return p;
		}
 	}
};

/*
 * Return comp style of a element
 * @function getCompStyle(target)
 * 	@param target:documentElement
 */
Mg.prototype.getCompStyle = function(target){
	if(window.getComputedStyle){
		return window.getComputedStyle(target, "");
	}else{
		// fix ie8-
		return target.currentStyle;
	}
};

/*
 * Fix for mouseenter and mouseleave
 * @function getEventName(evnt)
 * 	@param evnt:string - event to replace
 */
Mg.prototype.getEventName = function(evnt){
	if(evnt == 'mouseenter'){
		return 'mouseover';
	}else if(evnt == 'mouseleave'){
		return 'mouseout';
	}else{
		return evnt;
	}
};

/*
 * Returns if needle is in haystack
 * @function inArray(needle, haystack)
 * 	@param needle - what to search
 * 	@param haystack:array - array to search
 */
Mg.prototype.inArray = function(needle, haystack) {
	if(!haystack){return -1}
	for(var i=0, len=haystack.length; i<len; i++){
		if(haystack[i] == needle) return i;
	}
	return -1;
};

/*
 * Returns multiple elements by id attribute
 * @function getElementsById(id)
 * 	@param id:string - id attribute
 */
Mg.prototype.getElementsById = function(id) {
	var children = document.body.getElementsByTagName('*');
	var elements = [],child;
	for(var i=0, len=children.length; i<len; i++){
		var child = children[i];
		if(child.id.substr(0,id.length) == id){
			elements.push(child);
		}
	}
	return elements;
};

/*
 * Event stop ropagation
 * @function stopPropagation(e)
 * 	@param e:event
 */
Mg.prototype.stopPropagation = function(e){
	if(e.stopPropagation){e.stopPropagation();}else{e.cancelBubble = true;}
};

/*
 * Event prevent default
 * @function preventDefault(e)
 * 	@param e:event
 */
Mg.prototype.preventDefault = function(e){
	if(e.preventDefault){e.preventDefault();}
};

/*
 * Enable text selection
 * @function enableTextSelect(obj)
 * 	@param obj:documentElement - a single element to enable text
 */
Mg.prototype.enableTextSelect = function(obj, cursor){
	if(obj){
		if(cursor){obj.style.cursor = "auto";}
		obj.that = this;
		obj.unselectable = false;
		obj.style.userSelect = "text";
		obj.style.OUserSelect = "text";
		obj.style.msUserSelect = "text";
		obj.style.MozUserSelect = "text";
		obj.style.webkitUserSelect = "text";
		obj.onselectstart = function(e){
			var e = e || window.event;
			this.that.stopPropagation(e);
	    }
		obj.onmousedown = function(e){
			var e = e || window.event;
			this.that.stopPropagation(e);
		}
		if(navigator.userAgent.match(/Android/i)){
			obj.style.webkitTapHighlightColor = "default";
		}
	}
};

/*
 * Disable text selection
 * @function disableTextSelect(obj)
 * 	@param obj:documentElement - a single element to disable text
 */
Mg.prototype.disableTextSelect = function(obj, cursor){
	if(obj){
		if(cursor){obj.style.cursor = "pointer";}
		obj.unselectable = true;
		obj.style.userSelect = "none";
		obj.style.OUserSelect = "none";
		obj.style.msUserSelect = "none";
		obj.style.MozUserSelect = "none";
		obj.style.webkitUserSelect = "none";
		obj.onselectstart = function(e){
			return false;
		}
		obj.onmousedown = function(e){
			return false;
		}
		if(navigator.userAgent.match(/Android/i)){
			obj.style.webkitTapHighlightColor = "rgba(0,0,0,0)";
		}
	}
};