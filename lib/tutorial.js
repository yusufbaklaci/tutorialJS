var tutorial;

function _sourcesLoadedForTutorial(){

  $.cookie.json = true;

  tutorial = (function($) {
    var tutorial = $.tutorial = {};
    var steps = tutorial.steps = [];
    var stepGuiders = tutorial.stepGuiders = {};
    tutorial.currentIndex = null;
    var _startIndex = null;
    var _stopIndex = null;

    var _interval = null;
    var _onEventTutorialGroup = [];
    var _shownSteps = [];

    tutorial.onStepHide = null;
    tutorial.onStepShow = null;
    tutorial.onTutorialClose=null;

    tutorial.cookieControl = false;

    tutorial.start = function(_start, _stop, onEvent, startInSequence){
      onEvent = onEvent || null;
      startInSequence = startInSequence || 0;
      _start = _start==undefined?0:_start;
      
      //convert id to index
      if(isNaN(_start) || !steps[_start])
        _start = _indexOfObjValue(steps,"attachTo",_start);
      if(_stop && (isNaN(_stop) || !steps[_stop]))
        _stop = _indexOfObjValue(steps,"attachTo",_stop);
       
       _stop=!isNaN(_stop)&&_stop<steps.length&&_stop>-1?_stop:steps.length-1;

      if(hasStepShown(_start))
        return;
      
      if(onEvent || startInSequence){
        _onEventTutorialGroup.push({start:_start, stop:_stop, onEvent:onEvent, startInSequence:startInSequence});
        if(!_interval){
          _interval = setInterval(checkEventToStart, 1000);
        }
      }else{
        _arrangeAndStart(_start, _stop);
      }

      return true;
    }

    function _arrangeAndStart(_start, _stop){
      if(!isNaN(_stop) && steps.length > _stop){
        var stopGuider = steps[_stop];
        var nextButtonIndex = _indexOfObjValue(stopGuider.buttons,"name","Next");
        if(nextButtonIndex > -1){
          var nextButton = stopGuider.buttons[nextButtonIndex];
          var nextId = stopGuider.next;
          stopGuider.next = null;
          _removeItemFromArrayByIndex(stopGuider.buttons, nextButtonIndex);

          stopGuider.onHide = function(){
            stopGuider.onHide = null;
            stopGuider.buttons.push(nextButton);
            stopGuider.next = nextId;
            setStepShown(_start,_stop);
          };
        }else{
          stopGuider.onHide = function(){setStepShown(_start,_stop);};
        }
      }

      var guider;
      for (var i = 0; i <= _stop; i++) {
        if(!stepGuiders[steps[i].id]){
          guider = _createStepGuider(steps[i]);
          if(i<_stop)
            guider.onClose = function(){setStepShown(_start,_stop);};
        }
      };

      _startIndex = _start;
      _stopIndex = _stop;

      guiders.show(steps[_start].id);
    }

    function checkEventToStart(){
      if(_onEventTutorialGroup.length){
        for(var i=0;i< _onEventTutorialGroup.length;i++){
          var eventTutorial = _onEventTutorialGroup[i];
          if(!eventTutorial.startInSequence || hasStepShown(eventTutorial.start-1) ){
            if(eventTutorial.onEvent && eventTutorial.onEvent()){
              _removeItemFromArrayByIndex(_onEventTutorialGroup, i);
              _arrangeAndStart(eventTutorial.start, eventTutorial.stop);
            }
          }
        }
      }else if(_interval){
        clearInterval(_interval);
        _interval = null;
      }
    }


    tutorial.createStep = function (param){
      var highlight = param.highlight;
      var id = param.id;
      highlight = highlight==undefined?(param.onClick?true:false):(highlight?true:false);
      var attachTo = param.attachTo || "#"+id;
      id = id+"Tutorial"+steps.length;
      param.id = id;
      param.attachTo= attachTo;
      param.position = param.position || 12;
      param.overlay= highlight;
      //param.xButton = param.xButton || true;
      param.width = 300;
      if(param.closeOnEscape == undefined)
        param.closeOnEscape = 1;

      if(!param.buttons){
        param.buttons= [{name: "Close"}];
      }else if(_indexOfObjValue(param.buttons,name,"Close") < 0){
        param.buttons.push({name: "Close"});
      }

      if(highlight){
        param.highlight = attachTo;
      }

      if(param.onClick && typeof(param.onClick) != "function"){
        param.onClick = function(){console.log(attachTo, "clicked");};
      }

      if(steps.length>0){
        var prevGuider = steps[steps.length-1];
        if(prevGuider.onClick){
          var prevOnClick = prevGuider.onClick;
          prevGuider.onClick = function(clickParam){
            prevOnClick(clickParam);
            _nextGuider();
          }
        }else{
          prevGuider.buttons = prevGuider.buttons || [];
          prevGuider.buttons.push({name: "Next"});
        }
        prevGuider.next = id;
      }

      var index = steps.length;
      param.onShow = function(){
        tutorial.currentIndex = index;
        if(tutorial.onStepShow)
          tutorial.onStepShow(index);
      }
      param.onClose = _guidersClosed;
      

      steps.push(param);

      return param;
    }

    tutorial.init = function(param){
      var _startStep=-1,_stopStep=-1;

      if(param.length > 0 ){
        param[0].startInSequence = 0;
      }

      for(var i=0;i<param.length;i++){
        var group = param[i];
        _startStep = _stopStep+1;

        for(var j=0;j<group.steps.length;j++){
          tutorial.createStep(group.steps[j]);
          _stopStep++;
        }
        tutorial.start(_startStep, _stopStep, group.startIf, group.startInSequence);
      }
    }

    var _createStepGuider = function(param){
      var id = param.id;
      var attachTo = param.attachTo;
      var onClick = param.onClick;
      //param.offset=1;
      guiders.createGuider(param);
      var guider = guiders.get(id);

      if(onClick){
        $(attachTo).bind( "click", function(event) {
          $(this).unbind( event );
          onClick(id);
        });
      }
      guider.onClick = onClick;
      stepGuiders[id] = guider;

      if(!param.title)
        guider.elem.find(".guiders_title").remove();
      if(!param.description)
        guider.elem.find(".guiders_description").remove();

      return guider;
    }

    var _nextGuider = function(){
      guiders.hideAll();
      if(_stopIndex > tutorial.currentIndex){
        guiders.show(steps[tutorial.currentIndex+1].id);
      }
    }

    var _guidersClosed = function(){
      if(tutorial.onTutorialClose)
        tutorial.onTutorialClose(steps[currentIndex]);
    }

    var _indexOfObjValue = function(arr,key,val){
      for(i in arr){
        if(arr[i][key] == val)
          return i;
      }
      return -1;
    }

    function setStepShown(startIndex, stopIndex){
      var shownSteps;
      if(tutorial.cookieControl && $.cookie){
        shownSteps = $.cookie("shownTutorialSteps") || [];
      }else{
        shownSteps =_shownSteps;
      }

      stopIndex = stopIndex || startIndex;
      for(var currentStep=startIndex;currentStep<=stopIndex;currentStep++){
        if(shownSteps.indexOf(currentStep) < 0){
          shownSteps.push(currentStep);
        }
      }

      if(tutorial.cookieControl && $.cookie){
        $.cookie("shownTutorialSteps", shownSteps, {expires:999999})
      }

      _shownSteps = shownSteps;
    }

    function hasStepShown(stepIndex){
      var shownSteps;
      if(tutorial.cookieControl && $.cookie){
        shownSteps = $.cookie("shownTutorialSteps") || [];
      }else{
        shownSteps =_shownSteps;
      }

      return shownSteps.indexOf(stepIndex) > -1;
    }

    /**
     * modifies the array in place
     * @param arr
     * @param itemIndex
     */
    var _removeItemFromArrayByIndex = function(arr, itemIndex)
    {
      if(!isNaN(itemIndex) && itemIndex > -1 && itemIndex < arr.length){
        arr.splice(itemIndex, 1);
      }
    }


    return tutorial;
  }).call(this, jQuery);

   initialiseTutorial();
}


$( document ).on('ready', function(){
  //var uid = FB.getUserID();
  //console.log("uid:",uid);

  //_sourcesLoadedForTutorial();
  //if(uid != "1013829913")
  //  return;

  //load depended sources if not already loaded
   if(!this["guiders"]){
     $.getScript("lib/guiders.js",function(){
       _loadJqueryCookie();
       _loadGuidersCSS();
     }).fail(function(){console.log("failed to load guiders.js");});
   }else{_loadJqueryCookie();_loadGuidersCSS();}

   var _loadGuidersCSS = function(){
       $("head").append("<link rel='stylesheet' href='lib/guiders.css' type='text/css' />");
   }
   var _loadJqueryCookie = function(){
     if(!$.cookie){
       $.getScript("lib/jquery.cookie.js",_sourcesLoadedForTutorial).fail(function(){console.log("failed to load jquery.cookie.js");});
     }else{_sourcesLoadedForTutorial();}
   }
});
