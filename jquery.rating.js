/**
 * Modified Star Rating - jQuery plugin
 *
 * Copyright (c) 2006 Wil Stuckey
 *
 * Original source available: http://sandbox.wilstuckey.com/jquery-ratings/
 * Extensively modified by Lullabot: http://www.lullabot.com
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * Create a degradeable star rating interface out of a simple form structure.
 * Returns a modified jQuery object containing the new interface.
 *   
 * @example jQuery('form.rating').rating();
 * @cat plugin
 * @type jQuery 
 *
 */
(function($){ // Create local scope.
    /**
     * Takes the form element, builds the rating interface and attaches the proper events.
     * @param {Object} $obj
     */
    var buildRating = function($obj){
        var $widget = buildInterface($obj),
            $stars = $('.star', $widget),
            $cancel = $('.cancel', $widget),
            averageIndex = 0,
            averagePercent = 0;
        // Set default rating.
        $("input[@type='radio']", $obj).each(function () { if (this.checked) { averageIndex = this.value; } });
        
        // Add hover and focus events.
        $stars
            .mouseover(function(){
                event.drain();
                event.fill(this);
            })
            .mouseout(function(){
                event.drain();
                event.reset();
            })
            .focus(function(){
                event.drain();
                event.fill(this)
            })
            .blur(function(){
                event.drain();
                event.reset();
            });
        
        // Cancel button events.
        $cancel
            .mouseover(function(){
                event.drain();
                $(this).addClass('on')
            })
            .mouseout(function(){
                event.reset();
                $(this).removeClass('on')
            })
            .focus(function(){
                event.drain();
                $(this).addClass('on')
            })
            .blur(function(){
                event.reset();
                $(this).removeClass('on')
            });
        
        // Click events.
        $cancel.click(function(){
            event.drain();
            averageIndex = 0;
            averagePercent = 0;
            // Save the value in a hidden field.
            $("input[@type='radio']", $obj).each(function () { this.checked = (this.value ==  averageIndex) ? true : false; });
            // Submit the form if needed.
            $("input.fivestar-path", $obj).each(function () { $.get(this.value + '/' + averageIndex, null, voteHook); });
            return false;
        });
        $stars.click(function(){
            averageIndex = Math.ceil(($stars.index(this) + 1) * (100/$stars.size()));
            averagePercent = 0;
            // Save the value in a hidden field.
            $("input[@type='radio']", $obj).each(function () { this.checked = (this.value ==  averageIndex) ? true : false; });
            // Submit the form if needed.
            $("input.fivestar-path", $obj).each(function () { $.get(this.value + '/' + averageIndex, null, voteHook); });
            return false;
        });
        
        var event = {
            fill: function(el){ // Fill to the current mouse position.
                var index = $stars.index(el) + 1;
                $stars
                    .children('a').css('width', '100%').end()
                    .lt(index).addClass('hover').end();
            },
            drain: function() { // Drain all the stars.
                $stars
					.filter('.on').removeClass('on').end()
					.filter('.hover').removeClass('hover').end();
            },
            reset: function(){ // Reset the stars to the default index.
                $stars.lt(Math.floor(averageIndex/100 * $stars.size())).addClass('on').end();
                var percent = (averagePercent) ? averagePercent * 10 : 0;
                if (percent > 0) {
                    $stars.eq(averageIndex).addClass('on').children('a').css('width', percent + "%").end().end();
                }
            }
        };
        event.reset();
        return $widget;
    };
    
    /**
     * Accepts jQuery object containing a single fivestar widget.
     * Returns the proper div structure for the star interface.
     * 
     * @return jQuery
     * @param {Object} $widget
     * 
     */
    var buildInterface = function($widget){
        var $container = $(document.createElement('div')).attr({
            "class": 'fivestar-widget clear-block'
        });
        var $radios = $("input[@type='radio']", $widget);
        var size = $radios.size() - 1;
        var cancel = 1;
        for (var i = 0, radio; radio = $radios[i]; i++){
            if (radio.value == "0") {
              cancel = 0;
              $div = $('<div class="cancel"><a href="#0" title="Cancel Rating">Cancel Rating</a></div>');
            }
            else {
			  var zebra = (i + cancel) % 2 == 0 ? 'even' : 'odd';
			  var count = i + cancel;
              $div = $('<div class="star star-' + count + ' star-' + zebra + '"><a href="#' + radio.value + '" title="Give it ' + count + '/'+ (size + cancel) +'">' + radio.value + '</a></div>');
            }
            $container.append($div[0]);                    
        }
        // Attach the new widget and hide the existing widget
        $widget.hide().after($container);
        return $container;
    };
    
    /**
     * Checks for the presence of a javascript hook 'fivestarResult' to be
     * called upon completion of a AJAX vote request.
     */
     var voteHook = function(data) {
       var returnObj = new Object();
       returnObj.result = new Object();
       returnObj.vote = new Object();
       returnObj.result.count = $("count",data).text();
       returnObj.result.average = $("average",data).text();
       returnObj.result.summary = $("summary",data).text();
       returnObj.vote.id = $("id",data).text();
       returnObj.vote.type = $("type",data).text();
       returnObj.vote.value = $("value",data).text();
        if (window.fivestarResult) {
          fivestarResult(returnObj);
        }
        else {
          fivestarDefaultResult(returnObj);
        }
     };

    /**
     * Standard handler to update the average rating when a user changes their
     * vote. This behavior can be overridden by implementing a fivestarResult
     * function in your own module or theme.
     * @param object voteResult
     * Object containing the following properties from the vote result:
     * voteResult.result.count The current number of votes for this item
     * voteResult.result.average The current average of all votes for this item
     * voteResult.result.summary The textual description of the 
     * voteResult.vote.id The id of the item the vote was placed on (such as the nid)
     * voteResult.vote.type The type of the item the vote was placed on (such as 'node')
     * voteResult.vote.value The value of the new vote saved
     */
    function fivestarDefaultResult(voteResult) {
      $('div#fivestar-summary-'+voteResult.vote.id).html(voteResult.result.summary);
    };

    /**
     * Set up the plugin
     */
    $.fn.rating = function() {
      var stack = [];
      this.each(function() {
          var ret = buildRating($(this));
          stack.push(ret);
      });
      return stack;
    };

  // Fix ie6 background flicker problem.
  if ($.browser.msie == true) {
    try {
      document.execCommand('BackgroundImageCache', false, true);
    } catch(err) {}
  }
})(jQuery);

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    $('div.fivestar-widget').rating();
    $('input.fivestar-submit').hide();
  });
}