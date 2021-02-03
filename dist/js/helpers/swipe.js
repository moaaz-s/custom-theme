/*!
 * swiped-events.js - v@version@
 * Pure JavaScript swipe events
 * https://github.com/john-doherty/swiped-events
 * @inspiration https://stackoverflow.com/questions/16348031/disable-scrolling-when-touch-moving-certain-element
 * @author John Doherty <www.johndoherty.info>
 * @license MIT
 * 
 * 
 * MODIFIED :
 * - Change defaults for data-swipe-threshold=80px & data-swipe-timeout=1000ms
 * - When swiping is cancelled, dispatch : swipe-canceled
 * - While swapping, dispatch : swiping, swiping-left, swiping-right
 */
(function (window, document) {

    'use strict';

    // patch CustomEvent to allow constructor creation (IE/Chrome)
    if (typeof window.CustomEvent !== 'function') {

        window.CustomEvent = function (event, params) {

            params = params || { bubbles: false, cancelable: false, detail: undefined };

            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };

        window.CustomEvent.prototype = window.Event.prototype;
    }

    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    var xDown = null;
    var yDown = null;
    var xDiff = null;
    var yDiff = null;
    var timeDown = null;
    var startEl = null;

    function cancelSwipe() {
        if (!startEl)
            return;

        // dispatch event.
        startEl.dispatchEvent(new CustomEvent('swipe-canceled', { bubbles: true, cancelable: true, detail: {} }));

        // reset values
        xDown = null;
        yDown = null;
        timeDown = null;
        startEl = null;
    }  

    function getSwipeDirection() {
        var direction = '';

        var swipeThreshold = parseInt(getNearestAttribute(startEl, 'data-swipe-threshold', '80'), 10); // default 20px
        var swipeTimeout = parseInt(getNearestAttribute(startEl, 'data-swipe-timeout', '1000'), 10);    // default 500ms
        var timeDiff = Date.now() - timeDown;

        if (Math.abs(xDiff) > Math.abs(yDiff)) { // most significant
            if (Math.abs(xDiff) > swipeThreshold && timeDiff < swipeTimeout) {
                if (xDiff > 0) {
                    direction = 'left';
                }
                else {
                    direction = 'right';
                }
            }
        }
        else if (Math.abs(yDiff) > swipeThreshold && timeDiff < swipeTimeout) {
            if (yDiff > 0) {
                direction = 'up';
            }
            else {
                direction = 'down';
            }
        }

        return direction;
    }

    function dispatchEvents(e, direction, prefix) {
        if (startEl !== e.target)
            return;

        var changedTouches = e.changedTouches || e.touches || [];
        var eventType = prefix + '-' + direction;

        var eventData = {
            dir: direction,
            xStart: parseInt(xDown, 10),
            xEnd: parseInt((changedTouches[0] || {}).clientX || -1, 10),
            yStart: parseInt(yDown, 10),
            yEnd: parseInt((changedTouches[0] || {}).clientY || -1, 10)
        };

        // fire `swiped` event event on the element that started the swipe
        startEl.dispatchEvent(new CustomEvent(prefix, { bubbles: true, cancelable: true, detail: eventData }));

        // fire `swiped-dir` event on the element that started the swipe
        startEl.dispatchEvent(new CustomEvent(eventType, { bubbles: true, cancelable: true, detail: eventData }));
    }

    /**
     * Fires swiped event if swipe detected on touchend
     * @param {object} e - browser event object
     * @returns {void}
     */
    function handleTouchEnd(e) {

        // if the user released on a different target, cancel!
        if (startEl !== e.target)
            return cancelSwipe();

        var direction = getSwipeDirection();

        if (direction !== '') {
            dispatchEvents(e, direction, 'swiped')
        } else
            cancelSwipe();
    }

    /**
     * Records current location on touchstart event
     * @param {object} e - browser event object
     * @returns {void}
     */
    function handleTouchStart(e) {

        // if the element has data-swipe-ignore="true" we stop listening for swipe events
        if (e.target.getAttribute('data-swipe-ignore') === 'true') return;

        // cancel all ongoing swipes.
        if (startEl)
            cancelSwipe();

        startEl = e.target;

        timeDown = Date.now();
        xDown = e.touches[0].clientX;
        yDown = e.touches[0].clientY;
        xDiff = 0;
        yDiff = 0;
    }

    /**
     * Records location diff in px on touchmove event
     * @param {object} e - browser event object
     * @returns {void}
     */
    function handleTouchMove(e) {

        if (!xDown || !yDown) return;

        var xUp = e.touches[0].clientX;
        var yUp = e.touches[0].clientY;

        xDiff = xDown - xUp;
        yDiff = yDown - yUp;

        var direction = getSwipeDirection();

        if (direction === '') return;
        
        dispatchEvents(e, direction, 'swiping')
    }

    /**
     * Gets attribute off HTML element or nearest parent
     * @param {object} el - HTML element to retrieve attribute from
     * @param {string} attributeName - name of the attribute
     * @param {any} defaultValue - default value to return if no match found
     * @returns {any} attribute value or defaultValue
     */
    function getNearestAttribute(el, attributeName, defaultValue) {

        // walk up the dom tree looking for data-action and data-trigger
        while (el && el !== document.documentElement) {

            var attributeValue = el.getAttribute(attributeName);

            if (attributeValue) {
                return attributeValue;
            }

            el = el.parentNode;
        }

        return defaultValue;
    }

}(window, document));