/*! concept-usine v1.0.0 | (c) 2021 STUDIO ZERANCE | http://link-to-your-git-repo.com */
// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

// http://olado.github.io/doT/
// https://github.com/olado/doT

(function () {
	"use strict";

	var doT = {
		name: "doT",
		version: "1.1.1",
		templateSettings: {
			evaluate:    /\{\$([\s\S]+?(\}?)+)\}\}/g,
			interpolate: /\{\$=([\s\S]+?)\}\}/g,
			encode:      /\{\$!([\s\S]+?)\}\}/g,
			use:         /\{\$#([\s\S]+?)\}\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\$##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\$\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:     /\{\$~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			varname:	"zerance",
			strip:		true,
			append:		true,
			selfcontained: false,
			doNotSkipEncoded: false
		},
		template: undefined, //fn, compile template
		compile:  undefined, //fn, for express
		log: true
	}, _globals;

	doT.encodeHTMLSource = function(doNotSkipEncoded) {
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
			matchHTML = doNotSkipEncoded ? /[&<>"'\/]/g : /&(?!#?\w+;)|<|>|"|'|\//g;
		return function(code) {
			return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
		};
	};

	_globals = (function(){ return this || (0,eval)("this"); }());

	/* istanbul ignore else */
	if (typeof module !== "undefined" && module.exports) {
		module.exports = doT;
	} else if (typeof define === "function" && define.amd) {
		define(function(){return doT;});
	} else {
		_globals.doT = doT;
	}

	var startend = {
		append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
		split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML(" }
	}, skip = /$^/;

	function resolveDefs(c, block, def) {
		return ((typeof block === "string") ? block : block.toString())
		.replace(c.define || skip, function(m, code, assign, value) {
			if (code.indexOf("def.") === 0) {
				code = code.substring(4);
			}
			if (!(code in def)) {
				if (assign === ":") {
					if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
						def[code] = {arg: param, text: v};
					});
					if (!(code in def)) def[code]= value;
				} else {
					new Function("def", "def['"+code+"']=" + value)(def);
				}
			}
			return "";
		})
		.replace(c.use || skip, function(m, code) {
			if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
				if (def[d] && def[d].arg && param) {
					var rw = (d+":"+param).replace(/'|\\/g, "_");
					def.__exp = def.__exp || {};
					def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
					return s + "def.__exp['"+rw+"']";
				}
			});
			var v = new Function("def", "return " + code)(def);
			return v ? resolveDefs(c, v, def) : v;
		});
	}

	function unescape(code) {
		return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
	}

	doT.template = function(tmpl, c, def) {
		c = c || doT.templateSettings;
		var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
			str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

		str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
					.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""): str)
			.replace(/'|\\/g, "\\$&")
			.replace(c.interpolate || skip, function(m, code) {
				try {
					var expressionParts = code.split(' | ');
					var value = expressionParts[0];
                  
					for (var i=1; i<expressionParts.length; i++) {
						var functionExpression = expressionParts[i];
						var functionParts = functionExpression.split(':'); 
                      	// Buiuld function arguments
						var functionArgs = functionParts[1]?functionParts[1].split('&&'):[];
							functionArgs.map(arg => unescape(arg).trim());
                      	var functionArgumentsExpression = `(${value}`;
                        for (var j=0; j < functionArgs.length; j++) {
                          functionArgumentsExpression += ', ';
                          functionArgumentsExpression += functionArgs[j];
                        }
                        functionArgumentsExpression += `)`;
                      
                      	// Build function name. 
						var functionName = functionParts[0].trim();
                      	var functionNameParts = functionName.split('.');
                        var functionNameExpression = "";
                        for (var k=0; k < functionNameParts.length; k++) {
                            functionNameExpression += `['${functionNameParts[k].trim()}']`
                        }
                      	
                      	
                      	if (typeof eval(`window${functionNameExpression}`) === 'function') 
                          value = `window${functionNameExpression}${functionArgumentsExpression}`;
						console.log("Value ", value);
					}

					return cse.start + unescape(value) + cse.end;
				} catch (e) {
					console.error("Couldn't transform value", e, {code, value});
				}
				
				return cse.start + unescape(code) + cse.end;
			})
			.replace(c.encode || skip, function(m, code) {
				needhtmlencode = true;
				return cse.startencode + unescape(code) + cse.end;
			})
			.replace(c.conditional || skip, function(m, elsecase, code) {
				return elsecase ?
					(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
					(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
			})
			.replace(c.iterate || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
				return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
					+vname+"=arr"+sid+"["+indv+"+=1];out+='";
			})
			.replace(c.evaluate || skip, function(m, code) {
				return "';" + unescape(code) + "out+='";
			})
			+ "';return out;")
			.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
			.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
			//.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

		if (needhtmlencode) {
			if (!c.selfcontained && _globals && !_globals._encodeHTML) _globals._encodeHTML = doT.encodeHTMLSource(c.doNotSkipEncoded);
			str = "var encodeHTML = typeof _encodeHTML !== 'undefined' ? _encodeHTML : ("
				+ doT.encodeHTMLSource.toString() + "(" + (c.doNotSkipEncoded || '') + "));"
				+ str;
		}
		try {
			return new Function(c.varname, str);
		} catch (e) {
			/* istanbul ignore else */
			if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
			throw e;
		}
	};

	doT.compile = function(tmpl, def) {
		return doT.template(tmpl, null, def);
	};
}());

/**
* Helpers
*/
var toolBox = {
  inheritPrototype: function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    Object.defineProperty(child.prototype, "constructor", {
      value: child,
      enumerable: false, // so that it does not appear in 'for in' loop
      writable: true,
    });
  },

  /**
   * Gets the value at `path` of `object`.
   * @param {Object}       object
   * @param {string|Array} path
   * @returns {*} value if exists else undefined
   * ex: toolBox.getProp(options, "question.layout", false);
   */
  getProp: function (object, path, value) {
    const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
    const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part);
    const foundValue = pathArrayFlat.reduce((obj, key) => obj && obj[key], object);

    return foundValue || foundValue == false ? foundValue : value;
  },

  /**
   * Verifies if something is empty.
   * if 1 param => value.
   * if 2 params => first is object, second is key.
   */ 
  isEmpty: function (args) {
    var value = "";

    if (arguments.length == 1)
      value = arguments[0];
    else if (arguments.length == 2) {
      const obj = arguments[0];
      const key = arguments[1];

      value = toolBox.getProp(obj, key);
    }

    if (typeof value === 'undefined')
      return true;
    else if (value === null)
      return true;
    else if (typeof (value) === 'string' && !value.trim().length)
      return true;
    else if (Array.isArray(value) && !value.length)
      return true;
    else if (typeof (value) === 'object' && Object.keys(value).length === 0)
      return true;
    else if (typeof (value) == 'function' || typeof (value) == 'number' || typeof (value) == 'boolean' || Object.prototype.toString.call(value) === '[object Date]')
      return false;

    return false;
  },

  /** Extracts a query params from ur. */
  getParameterByName: function (name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  },

  setCookie: (name, value, days) => {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  },

  getCookie: (name) => {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  clearCookie: (name, path, domain) => {
    domain = domain || document.domain;
    path = path || "/";

    if (toolBox.getCookie(name)) {
      document.cookie = name + "=" +
        ((path) ? ";path=" + path : "") +
        ((domain) ? ";domain=" + domain : "") +
        ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
  },

  /**
   * Recursively merge properties of two objects
   * @param {Object}   defaults default settings
   * @param {Object}   settings user settings that should override the defaults.
   * @param {bool}     isRecursiveCall this is an internal param - SHOULD NOT BE USED BY AN EXTERNAL CALLER.
   * @returns {Object} Merged settings.
   */
  merge: function (defaults, settings, isRecursiveCall) {
    var merged, clonedSettings;
    if (!isRecursiveCall) {
      // Attention, potential data loss with (undefined, new Date(), Infinity, reg expr)
      // => ref: https://stackoverflow.com/a/122704/2517028
      merged = JSON.parse(JSON.stringify(defaults));
      clonedSettings = JSON.parse(JSON.stringify(settings));
    } else {
      merged = defaults;
      clonedSettings = settings;
    }

    for (var p in clonedSettings) {
      try {
        // Property in destination object set; update its value.
        if (clonedSettings[p].constructor == Object)
          merged[p] = MergeRecursive(merged[p], clonedSettings[p], true);
        else
          merged[p] = clonedSettings[p];
      } catch (e) {
        // Property in destination object not set; create it and set its value.
        merged[p] = clonedSettings[p];
      }
    }
    return merged;
  },

  htmlToElement: function (html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  },

  /**
   * Build template - using DOT.js
   * ref => https://olado.github.io/doT/
   *
   * @param {string}   id the id of the template
   * @param {Object}   config the template config
   * @returns {string} HTML rendered template.
   */
  renderTemplate: function (id, config, def) {
    var tempFn = doT.template(document.getElementById(id).innerHTML, undefined, def);
    return tempFn(config);
  },

  /**
   * Generate a random string.
   * ref => https://stackoverflow.com/a/1349426/2517028
   *
   * @param {int}     length The length of the generated string.
   * @param {Object}  settings
   * @param {string}  settings.prefix
   * @param {string}  settings.postfix
   * @return {string} The generated string.
   */
  makeId: function (length, settings) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    while (result.length <= length)
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));

    return `${settings.prefix ? settings.prefix : ""}${result.join('')}${settings.postfix ? settings.postfix : ""}`;
  },

  /**
  * Creates style tag with the specified styles within.
  * The styles are either a string that gets attached directly or an object that gets parsed and then added one by one.
  *
  * @param {object} options        options for the import.
  * @param {String} options.url    styles to add from a URL.
  * @param {String} options.string styles to add directly as a string.
  * ex: options.string: "#root {color: white}"
  * @param {Object} options.object styles object
  * @param {Object} options.object.css_selector = css object.
  * @param {Object} options.object.min_width
  * @param {Object} options.object.max_width
  * ex. {"#xxx .button": "background-color: black; margin: 15px;"}
 
toolBox.loadStyles({max_width: "600px", object: {
     "#quiz"                       : toolBox.getProp(settings, "css_mobile.root", {}),
     "#quiz .quiz-question__title"  : toolBox.getProp(settings, "css_mobile.question", {}),
     "#quiz .quiz__answer__label"    : toolBox.getProp(settings, "css_mobile.answer", {}),
   }});
  */
  loadStyles: function (options) {
    const style = document.createElement('style');
    style.setAttribute("type", "text/css");
    if (options.id) {
      style.setAttribute("id", options.id);
    }

    if (options.url)
      style.setAttribute("href", options.url);
    else if (options.string)
      style.innerHTML = options.string;
    else if (options.object) {
      const styles = options.object;

      const minWidth = !isNaN(parseInt(options.min_width)) ? options.min_width : false;
      const maxWidth = !isNaN(parseInt(options.max_width)) ? options.max_width : false;
      const isMediaQuery = minWidth || maxWidth;

      style.innerHTML = !isMediaQuery ? "" : `@media screen ${minWidth ? ` and (min-width: ${minWidth}) ` : ``} ${maxWidth ? ` and (max-width: ${maxWidth}) ` : ``} {`;

      for (const selector in styles) {
        const stylesObject = styles[selector];

        // convert JSON styles into CSS string, ref: https://stackoverflow.com/a/45205645/2517028.
        var styleString = (
          Object.entries(stylesObject).map(([k, v]) => {
            var key = k.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
            var val = key == "background-image" || (key == "background" && v.includes("http")) ? `url(${v})` : v;
            return v && typeof v === 'string' && v.trim() !== "" ? `${key}:${val}` : ""
          }).join(';')
        );

        style.innerHTML += `${selector} { ${styleString} }`
      }

      style.innerHTML += !isMediaQuery ? "" : `}`
    }

    document.getElementsByTagName('head')[0].appendChild(style);
  },

  /**
   * Loads multiple scripts async, by creating a script tag in the head.
   *
   * @param {array}    scripts links of the scripts to create.
   * @param {function} completedCallback a callback indicating all scripts are fully loaded.
   * @param {function} individualSuccessCallback a callback indicating a specific script is loaded, takes {string} param for the url of the script.
   */
  loadScript: function (scripts, completedCallback, individualSuccessCallback) {
    var prot = !document.location.protocol.includes('http') ? "" : ("https:" === document.location.protocol ? "https://" : "http://");

    function checkStateAndCall(path, callback) {
      var _success = false;
      return function () {
        if (!_success && (!this.readyState || (this.readyState == 'complete'))) {
          _success = true;
          individualSuccessCallback(path);
          callback();
        }
      };
    }

    function asyncLoadScripts(files) {
      function loadNext() { // chain element
        if (!files.length) return completedCallback();
        var path = files.shift();
        if (typeof path !== 'string' || path.trim() == "") return completedCallback();

        var scriptElm = document.createElement('script');
        scriptElm.type = 'text/javascript';
        scriptElm.async = true;
        scriptElm.src = prot + path;
        scriptElm.onload = scriptElm.onreadystatechange =
          checkStateAndCall(path, loadNext); // load next file in chain when
        // this one will be ready
        var headElm = document.head || document.getElementsByTagName('head')[0];
        headElm.appendChild(scriptElm);
      }
      loadNext(); // start a chain
    }

    asyncLoadScripts(scripts);
  },

  hasAttribute: function (item, attribute) {
    if (!item.properties)
        return false;

    let itemProperties = JSON.parse(JSON.stringify(item.properties));

    if (!Array.isArray(itemProperties))
        itemProperties = [itemProperties];

    for (let property of itemProperties) {
        if (property.name == attribute.name && property.value == attribute.value)
            return true;
    }

    return false;
  }
};

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
var ZDOM = (function () {

	'use strict';

	/**
	 * Create the constructor
	 * @param {String} selector The selector to use
	 */
	var Constructor = function (selector) {
		if (!selector) {
			this.elems = arrayToNodeList([]);
		} else if (selector === 'document') {
			this.elems = [document];
		} else if (selector === 'window') {
			this.elems = [window];
		} else if (typeof selector === 'string') {
			this.elems = document.querySelectorAll(selector);
		} else if (selector instanceof NodeList) {
			this.elems = selector
		} else if (selector instanceof Element) {
			this.elems = [selector]
		} else if (selector instanceof DocumentFragment) {
			this.elems = selector.querySelectorAll('*');
		} else this.elems = arrayToNodeList([])
	};

	/**
	 * Do ajax stuff
	 * @param  {String} url The URL to get
	 */
	Constructor.prototype.ajax = function (url) {
		// Do some XHR/Fetch thing here
		console.log(url);
	};

	/**
	 * Run a callback on each item
	 * @param  {Function} callback The callback function to run
	 */
	Constructor.prototype.each = function (callback) {
		if (!callback || typeof callback !== 'function') return;
		for (var i = 0; i < this.elems.length; i++) {
			callback(this.elems[i], i);
		}
		return this;
	};

	Constructor.prototype.find = function (selector) {
		var foundItems = [];

		// Find elements.
		this.each(item => {
			var temp = item.querySelectorAll(selector)
			// document.querySelectorAll() returns an "array-like" collection of elements
			// convert this "array-like" collection to an array
			temp = Array.prototype.slice.call(temp);
			foundItems = foundItems.concat(temp);
		});

		// Convert to nodelist
		var fragment = document.createDocumentFragment();
		foundItems.forEach(function(item){
			fragment.appendChild(item.cloneNode());
		});

		return instantiate(arrayToNodeList(foundItems));
	};

	// get dom element at index or null
	Constructor.prototype.get = function(index) {
		if (index > this.elems.length - 1 || index < 0)
			return null;
		return this.elems[index];
	}

	Constructor.prototype.isEmpty = function () {
		return !!!this.elems.length;
	}

	/**
	 * Add a class to elements
	 * @param {String} className The class name
	 */
	Constructor.prototype.addClass = function () {
		return this.each(item => item.classList.add(...arguments));
	};

	/**
	 * Remove a class to elements
	 * @param {String} className The class name
	 */
	Constructor.prototype.removeClass = function () {
		return this.each(item => item.classList.remove(...arguments));
	};

	Constructor.prototype.toggleClass = function (className) {
		return this.each(item => item.classList.toggle(className));
	};
	  
	Constructor.prototype.hasClass = function(className) {
		for (var i = 0; i < this.elems.length; i++) {
			if (!this.elems[i].classList.contains(className))
				return false;
		}
		return true;
	}

  	/**
	 * Attach event to an element.
	 * @param {String} className The class name
	 */
	Constructor.prototype.on = function (eventType, callback) {
		// Attach event listeners to each element. 
		this.each(item => item.addEventListener(eventType, callback));

		// Store event handler for future ref. (in off for example)
		this.events = this.events || {};
		this.events[eventType] = this.events[eventType] || [];
		this.events[eventType].push(callback);

		return this;
	};

	/**
	 * Detaches event from an element.
	 * @param {String} className The class name
	 */
	Constructor.prototype.off = function (eventType, callback) {
		let self = this;

		if (callback) {
			this.each(item => item.removeEventListener(eventType, callback));
		} else if (self.events[eventType]) {
			this.each(item => {
				const cbArray = self.events[eventType];
				for (let cb of cbArray) {
					item.removeEventListener(eventType, cb);
				}
			})
		}

		return self;
	};

	/**
	 * Deletes an element from the dom
	 * @param {String} className The class name
	 */
	Constructor.prototype.remove = function () {
		this.each(item => {
			// const parent = item.parentNode;
			// parent.remove(item);

			item.remove();
		});

		return this;
	};

	/**
	 * Detaches event from an element.
	 * @param {String} className The class name
	 */
	Constructor.prototype.off = function (eventType, callback) {
		return this.each(item => item.removeEventListener(eventType, callback));
	};

	var arrayToNodeList = (items) => {
		// Convert to nodelist
		var fragment = document.createDocumentFragment();
		items.forEach(function(item){
			fragment.appendChild(item.cloneNode());
		});

		return fragment.querySelectorAll('*');;
	}

	/**
	 * Instantiate a new constructor
	 */
	var instantiate = function (selector) {
		return new Constructor(selector);
	};

	/**
	 * Return the constructor instantiation
	 */
	return instantiate;
})();
window.__ascf = {
  capitalize(value) {
    if (!value) return ''
    value = value.charAt(0).toUpperCase() + value.slice(1);
    return value
  },

  priceFormatter(value) {
    if (!value) return ''
    value = value / 100
    value = parseFloat(value).toFixed(2).toString().replace('.', ',') + ' €'
    return value
  },

  cleanJson(value) {
    if (!value) return ''
    value = value.replace(/\n/g, " ")
    return value
  },

  priceFormatterWithDiscount(value, discount) {
    if (!value) return ''
    discount = (100 - discount) * 0.01;
    value = value * discount;
    value = Math.round((value + Number.EPSILON) * 100) / 100;
    value = parseFloat(value).toFixed(2).toString().replace('.', ',') + ' €'
    return value
  },

  currencyFormatter(currency) {
    if (!currency) return ''
    if (currency === 'eur') { currency = '€' }
    if (currency === 'usd') { currency = '$' }
    if (currency === 'cad') { currency = '$CAD' }
    if (currency === 'chf') { currency = 'CHF' }
    return currency
  },

  dateUnitFormatter(unit) {
    if (!unit) return ''
    if (unit.toLowerCase() === 'day') { unit = 'jours' }
    if (unit.toLowerCase() === 'days') { unit = 'jours' }
    if (unit.toLowerCase() === 'week') { unit = 'semaines' }
    if (unit.toLowerCase() === 'weeks') { unit = 'semaines' }
    if (unit.toLowerCase() === 'month') { unit = 'mois' }
    if (unit.toLowerCase() === 'months') { unit = 'mois' }
    if (unit.toLowerCase() === 'year') { unit = 'années' }
    if (unit.toLowerCase() === 'years') { unit = 'années' }
    return unit
  },

  toSingular(unit) {
    if (!unit) return ''
    unit = unit.substring(0, unit.length - +(unit.lastIndexOf('s') == unit.length - 1));
    return unit
  },

  dateFormatterLong(date) {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    var d = new Date(date),
      month = monthNames[d.getMonth()],
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (day.length < 2)
      day = '0' + day;
    date = day + ' ' + month + ' ' + year
    return date
  },

  dateTimeFormatter(date) {
    var output = "";

    var d = new Date(date),
      sec = '' + d.getSeconds(),
      min = '' + (d.getMinutes()),
      day = '' + d.getDate(),
      hour = '' + (d.getHours()),
      month = '' + (d.getMonth() + 1),
      year = '' + d.getFullYear();

    month = (month.length < 2 ? '0' : '') + month;
    day = (day.length < 2 ? '0' : '') + day;

    //  if (general_config.date_format === "yyyy-mm-dd") { date = [year, month, day].join('-') }
    //  else if (general_config.date_format === "dd-mm-yyyy") { date = [day, month, year].join('-') }
    //  else if (general_config.date_format === "dd/mm/yyyy") { date = [day, month, year].join('/') }
    //  else if (general_config.date_time_format === "yyyy-mm-dd hh:mm") { date = [year, month, day].join('-') + ' ' + [hour, min].join(':') }
    //  else 
    if (general_config.date_format)
      date = general_config.date_format
        .replace('yyyy', year)
        .replace('dd', day)
        .replace('mm', month) // first mm should be replaced by month.
        .replace('hh', hour)
        .replace('mm', min) // second mm should be replaced by minute.
        .replace('ss', sec) // second mm should be replaced by minute.
    else
      output = d.toISOString();

    return output
  },
  // Ref: https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
  formatMoney : function(cents, format) {
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || this.money_formats);
  
    function defaultOption(opt, def) {
       return (typeof opt == 'undefined' ? def : opt);
    }
  
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');
  
      if (isNaN(number) || number == null) { return 0; }
  
      number = (number/100.0).toFixed(precision);
  
      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';
  
      return dollars + cents;
    }
  
    switch(formatString.match(placeholderRegex)[1]) {
      case 'default':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'without_trailing_zeros':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'without_trailing_zeros_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }
  
    return formatString.replace(placeholderRegex, value);
  },
  replace : function (str, toReplace, replaceWith) {
    return str.replace(toReplace, replaceWith);
  }
}

var productsList = {};

var shopifyProduct = new (function () {
 
    function Product(handle) {
        this.handle = handle; 

        if (productsList[this.handle])
            this.product = productsList[this.handle];
        else 
            this.update(this.handle);
    } 

    Product.prototype.findVariantIdFromOptions = function (selectionOptionsArray) {
        for (let variant of this.product.variants) {
            let selectionOptionsStr = selectionOptionsArray.join(',').toLowerCase();
            let variantOptionsStr = variant.options.join(',').toLowerCase();
            if (selectionOptionsStr == variantOptionsStr)
              return variant.id;
        }
    
        return null;
    }

    Product.prototype.prepProduct = async function (product) {
        for (let i=0; i< product.options.length ; i++) {
            let option = product.options[i];
            option.values = [];
            // option = {name: 'size', position: 1}
    
            let positionIndex0 = option.position - 1;
    
            for (let variant of product.variants) {
              let variantOption = variant.options[positionIndex0];
              if (!option.values.includes(variantOption))
                option.values.push(variantOption);
            }
        }

        this.product = product;
        productsList[this.handle] = this.product;
    }

    Product.prototype.update = function (handle) {
        this.fetch(handle, this.prepProduct.bind(this));
    }

    Product.prototype.fetch = function (handle, productHandler) {
        fetch(`/products/${handle}.js`)
            .then(res => res.json())
            .then(productHandler)
            .catch(e => console.error("Couldn't fetch product", {handle}, e))
    }
  
    return Product;
})();
//blocks
var generic_cart_block = new (function () {

    /**
     * ...
     * cartManager   {obj}        ref to the cart manager.
     * eventhandlers {array<obj>} ref les events a set/destroy
     * eventhandlers[n].handler {function} the event handler.
     * eventhandlers[n].event {string} the dom event
     * eventhandlers[n].$ele {string} ZDOM elements.
     */
    function GCB (cartManager, blockSettings, eventHandlers, isCartDependant) {
      // Will be set by the cart manager.
      this.money_formats = null;
      
      // Specify if it should be updated when cart is updated.
      this.cart_dependant = isCartDependant;
  
      // Reference to the cart manager.
      this.cartManager = cartManager;
  
      // Save settings locally.
      this.settings = blockSettings;
  
      // Generate the block ID.
      this.block_id = toolBox.makeId(10, {prefix:"block_"});
  
      // A reference to indicate whether the block is rendered.
      this.is_rendered = false;
  
      // A reference to all events handlers.
      this.events_handlers = eventHandlers;
    }
  
    GCB.prototype.getHtml = function () {
      console.log("Each block will have its own implementation of this function");
    }
  
    GCB.prototype.eventsHandler = function (status) {
      let verb = status?'on':'off';
      for (const eh of this.events_handlers) {
        ZDOM(eh.$ele?eh.$ele:`#${this.block_id}`)[verb](eh.event, eh.handler.bind(this));
      }
    }
  
    GCB.prototype.destroy = function () {
      // Execute custom destroyer if found.
      if (this.on_destroy && typeof this.on_destroy === "function") 
        this.on_destroy(); 

      this.is_rendered = false;
  
      // Unlink event listners
      this.eventsHandler(false);

      // Remove block from the dom.
      if (this.is_rendered)
        ZDOM('#' + this.block_id).remove();
  
      this.is_rendered = false;
      this.block_id    = undefined;
    }
  
    GCB.prototype.markAsRendered = function () {
      if (this.on_rendered && typeof this.on_rendered === "function")
        this.on_rendered();

      this.eventsHandler(true);
      this.is_rendered = true;
    }
  
    GCB.prototype.updateBlock = async function () { 
      if (!this.is_rendered) return;

      // Unlink event listners
      this.eventsHandler(false);

      if (typeof this.customBlockUpdate === 'function')
        this.customBlockUpdate();
      else {
        var html = await this.getHtml();
        var oldBlock = document.getElementById(this.block_id);
        var newBlock = toolBox.htmlToElement(html);
        // update dom.
        oldBlock.parentNode.replaceChild(newBlock, oldBlock);
      }

      // Relink event listners
      this.eventsHandler(true);
    }
  
    return GCB;
})();
// Generic controller.
const ItemManager = new (function () {
  /**
   *
   * @param {string} key     Cart line item as is.
   * @param {object} options Options as provided in the JSON config
   * @param {*} cart         The entire cart object
   */
  function Item(key, options, itemsManager, injections, eventHandlers) {
    // Will be set by the cart manager.
    this.money_formats = null;
    
    this.itemsManager = itemsManager;

    // Reference to the cart manager.
    this.cartManager = itemsManager.cartManager;

    // Save options locally. 
    this.options = options;

    // Save item key to be able to fetch it later.
    this.key = key;

    // Build product
    let lineItem = itemsManager.getItemByKey(this.key);
    this.productHandler = new shopifyProduct(lineItem.handle);

    // Generate the block ID.
    this.block_id = toolBox.makeId(10, { prefix: "line-item_" });

    // Injections templates
    this.block_attributes = injections.block_attributes.template;
    this.quantity_template = injections.quantity.template;
    this.remove_template = injections.remove.template;

    // Injections data
    this.injections_data = {};
    for (let key in injections) {
      let injection = injections[key]
      this.injections_data = {
        ...injection.template_data,
        ...this.injections_data
      }
    }

    // A reference to all events handlers.
    let defaultEventHandlers = [
      {
        event: "swiping-left",
        handler: swipingLeft.bind(this)
      },
      {
        event: "swiping-right",
        handler: swipingRight.bind(this)
      },
      {
        event: "swiped-left",
        handler: swipingLeft.bind(this)
      },
      {
        event: "swiped-right",
        handler: swipingRight.bind(this)
      },
      {
        event: "swipe-canceled",
        handler: cancelSwiping.bind(this)
      }
    ];

    this.events_handlers = Array.isArray(eventHandlers) ? eventHandlers.concat(defaultEventHandlers) : defaultEventHandlers;
  }

  Item.prototype.eventsHandler = function (status) {
    var verb = status === true ? 'on' : 'off';
    for (const eh of this.events_handlers) {
      ZDOM(eh.$ele ? eh.$ele : `#${this.block_id}`)[verb](eh.event, eh.handler.bind(this))
    }
  }

  Item.prototype.getGroupHeadingHtml = function () {
    console.log("item.getTitleHtml should be implemented by each extender");
  }

  Item.prototype.getItemHtml = function () {
    console.log("item.getItemHtml should be implemented by each extender");
  }

  Item.prototype.markAsRendered = function () {
    this.eventsHandler(true);
    this.is_rendered = true;
  }

  Item.prototype.destroy = function () {
    if (!this.is_rendered)
      return;

    // Execute custom destroyer if found.
    if (this.on_destroy && typeof this.on_destroy === "function")
      this.on_destroy();

    // Unlink event listners
    this.eventsHandler(false);

    // Remove block from the dom.
    ZDOM('#' + this.block_id).remove();

    this.block_id = undefined;
  }

  // Display error message on item
  Item.prototype.handleError = function (message) {
    // TODO
  }

  /*********************************/
  /* PUBLIC STATIC FUNCTIONS       */
  /*********************************/

  // Check if a line_item is eligible to be of this type.
  // @returns a priority indicator.
  // if -1, the item is not of this type.
  // else if > -1 it should assigned the type of the highest priority
  Item.is = function (line_item, line_items) {
    console.log("item.is should be implemented by each extender");
    return -1;
  }

  /*********************************/
  /* PRIVATE FUNCTIONS       */
  /*********************************/
  function swiping(e, removeClass, addClass) {
    if (!e.target)
      return;

    let xStart = e.detail.xStart;
    let xEnd   = e.detail.xEnd;

    let diff = Math.abs(xEnd - xStart);
    var distance = Math.min(Math.round(diff/40), 4);

    var $item = ZDOM(`#${this.block_id}`);

    if ($item.hasClass('swiping-distance-4') && $item.hasClass(addClass))
      return;

    $item.removeClass(removeClass, 'swiping-distance-1', 'swiping-distance-2', 'swiping-distance-3', 'swiping-distance-4' )
    $item.addClass('swiping', addClass, `swiping-distance-${distance}`);

    cleanSwipingClasses.bind(this)();
  }

  function swipingRight (e) {
    swiping.bind(this)(e, 'swiping--left', 'swiping--right')
  }

  function swipingLeft (e) {
    swiping.bind(this)(e, 'swiping--right', 'swiping--left')
  }

  function cancelSwiping (e) {
    var $item = ZDOM(`#${this.block_id}`);
    if ($item.hasClass('swiping-distance-4'))
      return;

    $item.removeClass('swiping', 'swiping--left', 'swiping--right', 'swiping-distance-1', 'swiping-distance-2', 'swiping-distance-3', 'swiping-distance-4' )
  }

  function cleanSwipingClasses () {
    if (this.cleanSwipingID)
      clearTimeout(this.cleanSwipingID);

    this.cleanSwipingID = setTimeout(cancelSwiping.bind(this), 400);
  }

  return Item;
})();

var item_types = item_types || {};

item_types.basic = new (function () {

    function Item(key, options, itemsManager, injections) {
      ItemManager.call(this, key, options, itemsManager, injections, []);
    }

    toolBox.inheritPrototype(Item, ItemManager);

    Item.prototype.getHtml = function () {
      let lineItem = this.itemsManager.getItemByKey(this.key);

      let data = {
        id        : this.block_id,
        money_formats : this.money_formats,
        options   : this.options,
        line_item : lineItem,
        ...this.injections_data
      };

      return toolBox.renderTemplate(
        this.cartManager.templatesSelectors.basic_item
        , data
        , {
          block_attributes: this.block_attributes ,
          quantity_template: this.quantity_template,
          remove_template: this.remove_template
        }
      );
    }


    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    // Every item can be considered a basic item, either because it is or as a fallback in case no other classes match.
    Item.is = function (line_item, cart) {
      return 1;
    }

    return Item;
})();

var item_types = item_types || {};

item_types.native_subscription = new (function () {
 
    function Item(line_item, options, cartManager, blockAttributes) {
      ItemManager.call(this, line_item, options, cartManager, blockAttributes, []);
    } 
  
    toolBox.inheritPrototype(Item, ItemManager);  

    Item.prototype.getHtml = function () {
    //   let itemSettings = {  
    //     id: this.block_id,
    //     block_attributes: this.block_attributes,
    //     item_data: this.line_item,
    //     item_options: this.options 
    //   };
  
    //   return toolBox.renderTemplate(
    //     this.cartManager.templatesSelectors.item
    //     , itemSettings
    //     , { block_attributes: this.block_attributes }
    //   );

        return "Native subscription Item"
    }

    // Every item can be considered to be a classic item. (the most basic form of items)
    Item.is = function (line_item, cart) {
      return -1;
    }
  
    return Item;
})();
var item_types = item_types || {};

item_types.native_recharge = new (function () {
 
    function Item(line_item, options, cartManager, blockAttributes) {
      ItemManager.call(this, line_item, options, cartManager, blockAttributes, []);
    } 
  
    toolBox.inheritPrototype(Item, ItemManager);  

    Item.prototype.getHtml = function () {
    //   let itemSettings = {  
    //     id: this.block_id,
    //     block_attributes: this.block_attributes,
    //     item_data: this.line_item,
    //     item_options: this.options 
    //   };
  
    //   return toolBox.renderTemplate(
    //     this.cartManager.templatesSelectors.item
    //     , itemSettings
    //     , { block_attributes: this.block_attributes }
    //   );

        return "Native recharge Item"
    }

    // Every item can be considered to be a classic item. (the most basic form of items)
    Item.is = function (line_item, cart) {
      return -1;
    }
  
    return Item;
})();
var item_types = item_types || {};

item_types.non_native_recharge = new (function () {

  function Item(key, options, itemsManager, injections) {
    ItemManager.call(this, key, options, itemsManager, injections, []);
  }

  toolBox.inheritPrototype(Item, ItemManager);

  Item.prototype.getHtml = function () {
    let lineItem = this.itemsManager.getItemByKey(this.key);

    let data = {
      id        : this.block_id,
      money_formats : this.money_formats,
      options   : this.options,
      line_item : lineItem,
      ...this.injections_data
    };

    return toolBox.renderTemplate(
      this.cartManager.templatesSelectors.non_native_recharge
      , data
      , {
        block_attributes: this.block_attributes ,
        quantity_template: this.quantity_template,
        remove_template: this.remove_template
      }
    );
  }

  // Every item can be considered to be a classic item. (the most basic form of items)
  Item.is = function (line_item, cart) {
    if(line_item.properties && "subscription_id" in line_item.properties) {
      return 10;
    } else {
      return -1;
    }
  }
  
  return Item;
  
})();

var item_types = item_types || {};

item_types.item_adder = new (function () { 
 
    function Item(item_data, item_options) {
      ItemManager.call(this, item_data, item_options);
    } 

    Item.prototype.getHtml = function () {
      // let itemSettings = { 
      //   id: this.block_id,
      //   block_attributes: this.block_attributes,
      //   item_data: this.line_item,
      //   item_options: this.options 
      // };
  
      // return toolBox.renderTemplate(
      //   this.cartManager.templatesSelectors.item
      //   , itemSettings
      //   , { block_attributes: this.block_attributes }
      // );

      return "Native subscription item"
    }

    // Every item can be considered to be a classic item. (the most basic form of items)
    Item.is = function (line_item, cart) {
      return -1;
    }
  
    toolBox.inheritPrototype(Item, ItemManager);
  
    return Item;
})();
// TODO: CAREFUL ... calling a static function from rewards will

var item_types = item_types || {}; 

item_types.reward = new (function () {
 
    function Item(key, options, itemsManager, injections) {
      ItemManager.call(this, key, options, itemsManager, injections, []);
    } 
  
    toolBox.inheritPrototype(Item, ItemManager);  

    Item.prototype.getHtml = function () {
      let lineItem = this.itemsManager.getItemByKey(this.key);

      let data = {
        id        : this.block_id,
        money_formats : this.money_formats,
        options   : this.options,
        line_item : lineItem,
        ...this.injections_data
      };

      return toolBox.renderTemplate(
        this.cartManager.templatesSelectors.reward_item
        , data
        , {
          block_attributes: this.block_attributes ,
          quantity_template: this.quantity_template,
          remove_template: this.remove_template
        }
      );
    }


    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    // A reward item can be detected by checking against the rewards class.
    Item.is = function (line_item, cart) {
      if (block_type && block_type.rewards && block_type.rewards.isRewardItem(line_item, line_item.variant_id))
        return 100000;
      return -1;
    }
  
    return Item;
})();
// TODO: CAREFUL ... calling a static function from featured_upsell will

var item_types = item_types || {}; 

item_types.featured_upsell = new (function () {
 
    function Item(key, options, itemsManager, injections) {
      ItemManager.call(this, key, options, itemsManager, injections, []);
    } 
  
    toolBox.inheritPrototype(Item, ItemManager);  

    Item.prototype.getHtml = function () {
      let lineItem = this.itemsManager.getItemByKey(this.key);

      let data = {
        id        : this.block_id,
        money_formats : this.money_formats,
        options   : this.options,
        line_item : lineItem,
        ...this.injections_data
      };

      return toolBox.renderTemplate(
        this.cartManager.templatesSelectors.featured_upsell_item
        , data
        , {
          block_attributes: this.block_attributes ,
          quantity_template: this.quantity_template,
          remove_template: this.remove_template
        }
      );
    }


    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    // A reward item can be detected by checking against the rewards class.
    Item.is = function (line_item, cart) {
      if (block_type && block_type.rewards && block_type.featured_upsell.isFeaturedUpsell(line_item))
        return 100000;
      return -1;
    }
  
    return Item;
})();
var block_type = block_type || {};

block_type.header = new (function () {

    var self;

    //Manage Header
    function HeaderManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], true);
      self = this;
    }

    toolBox.inheritPrototype(HeaderManager, generic_cart_block);


    //TODO détail chaque settings pour template
    HeaderManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();

      let headerSettings = {
        id: self.block_id,
        money_formats: self.money_formats,
        cart_count: cart.item_count,
        display_cart_count: self.settings.configurations.display_cart_count,
        header_fixed: self.settings.configurations.header_fixed,
        title_position: self.settings.configurations.title_position,
        title: self.settings.configurations.title,
        button_close_display: self.settings.configurations.button_close_display
      };

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.header, headerSettings);
    }

    return HeaderManager;
  })();

var block_type = block_type || {};

block_type.footer = new (function () {

    var self;

    //Manage Footer
    function FooterManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(FooterManager, generic_cart_block);

    FooterManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();
      let data = generateRenderOptions(self.settings, cart);
      // commonsFilters.priceFormatter(total)

      // Build summary block.
      let summaryHTML = "";
      if (data.summary) {
        let summary = new block_type.summary(self.cartManager, data.summary);
        summaryHTML = summary.getHtml();
        // summary.destroy();
      }

      // Build template
      return toolBox.renderTemplate(self.cartManager.templatesSelectors.footer, data, { 
        summary_template: summaryHTML
      });
      // return toolBox.renderTemplate(self.cartManager.templatesSelectors.footer, data);
    }

    const generateRenderOptions = function (block, cart) {
      var options = {
        id: self.block_id,
        money_formats: self.money_formats,
        isFixed: block.configurations.footer_fixed,
        cartIsEmpty: cart.item_count == 0,

        // options
        cart: false,
        checkout: false,
        summary: false,
        tos: false
      };

      for (let blockOption of block.block_level_options) {
        const optionSettings = toolBox.getProp(blockOption, "settings", {});
        const shouldDisplay  = toolBox.getProp(optionSettings, "enabled", false);
        const optionType     = blockOption.option;

        if (!shouldDisplay || !optionType) continue;

        switch (optionType) {
          case "cart":
            if (!optionSettings.label)
              break;

            var settings = {
              label: optionSettings.label
            };

            if (optionSettings.display_total)
              settings.total = cart.total_price

            options.cart = settings;

            break;
          case "checkout":
            if (!optionSettings.label)
              break;

            var settings = {
              label: optionSettings.label
            };

            if (optionSettings.display_total)
              settings.total = cart.total_price

            options.checkout = settings;
            break;
          case "summary":
            options.summary = {
              configurations: optionSettings
            };
            break;
          case "tos":
            var settings = {
              title: optionSettings.title,
              content: optionSettings.content
            };

            if (optionSettings.number_of_visible_lines > 0)
              settings.number_of_visible_lines = optionSettings.number_of_visible_lines;

            options.tos = settings;
            break;
          case "ps":
              var settings = {
                content: optionSettings.content
              };

              options.ps = settings;
              break;
          default:
            break;
        }
      }

      return options;
    }

    return FooterManager;
  })();

var block_type = block_type || {};

block_type.items = new (function () {

  var self;
  var cart_lines = [];
  var itemGroups = {};

  const domAttributes = {
    item_root: 'data-item-root',
    item_quantity_action: 'scz-cart-item-quantity-action'
  };

  const selectors = {
    item_root: `[${domAttributes.item_root}]`,
    item_quantity_action: `[${domAttributes.item_quantity_action}]`
  };

  //Manage Items
  function Items(cartManager, block) {

    const eventHandlers = [
      {
        event: 'click',
        handler: clickEventHandler
      },
      {
        event: 'input',
        handler: changeEventHandler
      }
    ];

    generic_cart_block.call(this, cartManager, block, eventHandlers, true);
    self = this;

    // Identify which types should be grouped.
    for (let itemOptions of self.settings.item_level_options) {
      let itemType = itemOptions.type;
      let isItemHidden = itemOptions.hidden;

      let groupingOptions = toolBox.getProp(itemOptions, "settings.grouping", {});
      if (isItemHidden === true || groupingOptions.enabled !== true || !itemType) continue;

      itemGroups[itemType] = groupingOptions;
    }
  }

  toolBox.inheritPrototype(Items, generic_cart_block);

  Items.prototype.getHtml = async function () {
    let cart = self.cartManager.getCopyOfCart();

    // Init individual items
    cart_lines = self.initCartItems();

    // TODO: update
    // Sort items into groups if applicable.
    let itemsByGroups = cart_lines.reduce((result, item) => {
      // Check if there are any group options for this item type.
      let groupOptions = itemGroups[item.type];

      // The group is either the sorted one based on the item.type or all other groups.
      let group = groupOptions?item.type:'non_grouped';

      // Attach the item to the selected group
      if (!result[group])
        result[group] = { options: groupOptions, items: [] }
      result[group].items.push(item);
      return result;
    }, {});


    let itemsHTML = "";
    // Build Grouped Items First
    for (let groupName in itemsByGroups) {
      let groupOptions = itemsByGroups[groupName].options;
      let lines = itemsByGroups[groupName].items;

      // TODO: Create a template for grouped items to replace the below hard coded html.

      itemsHTML += `<!-- items group : ${groupName} -->`
      itemsHTML += `<div>`

      if (groupOptions)
        itemsHTML += `
        <div>
          <p class="scz-cart-items-group-title">${groupOptions.title}</p>
          ${groupOptions.subtitle? `<p class="scz-cart-items-group-subtitle">${groupOptions.subtitle}</p>`:``}
        </div>
      `;

      for (let line of lines) {
          try {
            itemsHTML += line.getHtml();
          } catch (e) {
            let lineItem = self.getItemByKey(line.key);
            console.error("Couldn't render item", line, e);
            itemsHTML += `<div><center>${lineItem.title} failed to display correctly</center></div>`
          }
      }

      itemsHTML += `</div>`;
    }

    // TODO - build html based on groups.
    // for (let line of cart_lines) {
    //   try {
    //     itemsHTML += line.getHtml();
    //   } catch (e) {
    //     let lineItem = self.getItemByKey(line.key);
    //     console.error("Couldn't render item", line, e);
    //     itemsHTML += `<div><center>${lineItem.title} failed to display correctly</center></div>`
    //   }
    // }

    let itemsSettings = {
      id: self.block_id,
      item_count: cart.item_count,
      items_html: itemsHTML
    };

    return toolBox.renderTemplate(self.cartManager.templatesSelectors.items, itemsSettings);
  }

  // TODO - destroy each item.
  Items.prototype.on_destroy = function () {
    // TODO - complete
    // reset values etc...

    // Destroy each item individually
    for (let line of cart_lines) {
      line.destroy();
    }
  }

  Items.prototype.on_rendered = function () {
    for (let line of cart_lines) {
      line.markAsRendered();
    }
  }

  /***************************/
  /* TEMPLATING HELPERS      */
  /***************************/
  Items.prototype.getQuantityTemplate = function (line_options, line_item) {
    try {
      let isUpdatable = toolBox.getProp(line_options, "quantity.updatable", false);
      // if (!isUpdatable)
      //   throw new Error("Quantity is not updatable for this line item");

      const QUANTITY_STYLES = {
        ACTIONS  : {
          LABEL: 'actions',
          TEMPLATE_ID: '#scz-cart-item-quantity-actions'
        },
        DROPDOWN : {
          LABEL: 'dropdown',
          TEMPLATE_ID: '#scz-cart-item-quantity-dropdown'
        },
        // BOTH : {
        //   LABEL: 'both',
        //   TEMPLATE_ID: '#scz-cart-item-quantity-both'
        // },
        NONE     : {
          LABEL: 'none',
          TEMPLATE_ID: ''
        },
      };

      let options = toolBox.getProp(this.settings, "configurations.quantity", {
        "style"   : "actions",
        "limit_max": 10
      });

      for (const STYLE in QUANTITY_STYLES) {
        let STYLE_OPTIONS = QUANTITY_STYLES[STYLE];
        if (STYLE_OPTIONS.LABEL != options.style)
          continue;

        var $templates = ZDOM(STYLE_OPTIONS.TEMPLATE_ID);
        if ($templates.isEmpty())
          throw new Error ("Template is empty")

        var template_data = { ...options.metadata };
        template_data.quantity_values = (function() {
          let arr = []
          let max = Math.max(options.limit_max, line_item.quantity);
          for (let i = 0; i <= max; i++)
            arr.push(i)
          return arr;
        })()

        return {
          template: $templates.get(0).innerHTML,
          template_data
        }
      }
    } catch (e) {
      console.error("Couldn't find a template for quantity", e);
    }

    return {
      template: "",
      template_data: {}
    };
  }

  Items.prototype.getRemoveTemplate = function (line_options, line_item) {
    try {
      let isEnabled = toolBox.getProp(line_options, "remove.enabled", false);
      if (!isEnabled)
        throw new Error("Remove action is not available for this line item");

      const REMOVE_STYLES = {
        ONLY_TEXT  : {
          LABEL: 'only_text',
          TEMPLATE_ID: '#scz-cart-remove-item-only-text'
        },
        ONLY_ICON : {
          LABEL: 'only_icon',
          TEMPLATE_ID: '#scz-cart-remove-item-only-icon'
        },
        BOTH     : {
          LABEL: 'both',
          TEMPLATE_ID: '#scz-cart-remove-item-both'
        },
        NONE     : {
          LABEL: 'none',
          TEMPLATE_ID: ''
        }
      };

      let options = toolBox.getProp(this.settings, "configurations.remove", {
        "layout"  : "both",
        "label"   : "remove",
        "icon"    : ""
      });

      for (const STYLE in REMOVE_STYLES) {
        let STYLE_OPTIONS = REMOVE_STYLES[STYLE];
        if (STYLE_OPTIONS.LABEL != options.style)
          continue;

        var $templates = ZDOM(STYLE_OPTIONS.TEMPLATE_ID);
        var template_data = {
          remove_label: options.label,
          remove_icon: options.icon
        };

        if ($templates.isEmpty())
          throw new Error("Template is empty or not found", STYLE_OPTIONS);
        return {
          template: $templates.get(0).innerHTML,
          template_data
        };
      }
    } catch (e) {
      console.error("Couldn't fetch remove item template", e)
    }

    return {
      template: "",
      template_data: {}
    }
  }

  Items.prototype.initCartItems = function () {
    let cart = self.cartManager.getCopyOfCart();
    let options = self.settings;

    var lines = [];

    // Init the proper class for each item.
    for (let line_item of cart.items) {
      // List of all candidate classes for the item.
      let candidates = [];

      // Loop over item implementers to add all matching classes.
      for (let itemType in item_types) {
        let pertinenceScore = -1;
        try {
          pertinenceScore = item_types[itemType].is(line_item);
        } catch (e) {console.error(`Couldn't verify if line item is an itemType`, e, {line_item, itemType})}
        if (pertinenceScore < 0) continue;

        let matchingConfig = options.item_level_options.find(ilo => ilo.type == itemType);

        candidates.push({
          type    : itemType,
          score   : pertinenceScore,
          class   : item_types[itemType],
          options : matchingConfig.settings,
          hidden  : matchingConfig.hidden
        })
      }

      // Sort candidates according to pertinence score by descending order.
      candidates.sort((a,b)=> {
        if (a.score > b.score) return -1
        else if (b.score < a.score) return 1;
        return 0;
      })

      // This condition should never be met, because at least the basic class should always be available.
      if (!candidates.length)
        return;

      // The elected class is the one with the highest score (at position 0 after sorting)
      let elected = candidates.shift();

      // Predefined templates that we pass as is to the item.
      let injections = {
        block_attributes: {
          template : `
            ${domAttributes.item_root}='{
              "type"     : "${elected.type}",
              "key"      : "${line_item.key}",
              "quantity" : ${line_item.quantity}
            }'
          `,
          template_data: {}
        },
        quantity: this.getQuantityTemplate(elected.options, line_item),
        remove: this.getRemoveTemplate(elected.options, line_item)
      }

      // Merge global item settings.
      let removeOptions = elected.options.remove || {};
          removeOptions.enable_swiping_on_mobile = toolBox.getProp(options, "configurations.remove.enable_swiping_on_mobile", false);
      elected.options.remove = removeOptions;

      elected.options.link_product = toolBox.getProp(options, "configurations.link_product", {});

      if (elected.hidden)
        continue;

      // Build line instance & add it to the array.
      let lineInstance = new elected.class(line_item.key, elected.options, this, injections);
          lineInstance.money_formats = this.money_formats;
      // Add type to enable grouping
      lineInstance.type = elected.type;

      lines.push(lineInstance);
    }

    return lines;
  }

  /***************************/
  /* CART HELPERS            */
  /***************************/
  Items.prototype.increaseQuantity = function (key) {
    const item = this.getItemByKey(key);
    if (!item || isNaN(item.quantity))
      return console.error(`Couldn't find a matching item for key: ${key}`);

    return this.cartManager.updateItems([{
      type: this.cartManager.CART_REQUEST_TYPES.UPDATE,
      items: [{key, quantity: ++item.quantity}]
    }]);
  }

  Items.prototype.decreaseQuantity = function (key) {
    const item = this.getItemByKey(key);

    if (!item || isNaN(item.quantity))
      return console.error(`Couldn't find a matching item for key: ${key}`);

    return this.cartManager.updateItems([{
      type: this.cartManager.CART_REQUEST_TYPES.UPDATE,
      items: [{key, quantity: --item.quantity}]
    }]);
  }

  // remove item
  Items.prototype.removeItem = function (key) {
    return this.cartManager.updateItems([{
      type: cartManager.CART_REQUEST_TYPES.REMOVE,
      items: [{key, quantity: 0}]
    }]);
  }

  Items.prototype.updateProperties = function (key, properties) {
    return this.cartManager.updateItems([{
      type: this.cartManager.CART_REQUEST_TYPES.UPDATE,
      items: [{key, properties}]
    }]);
  }

  // Find an item by key
  Items.prototype.getItemByKey = function (key) {
    let cart = this.cartManager.getCopyOfCart();
    return cart.items.find(item => item.key == key)
  }

  // Find an item by variant id
  Items.prototype.getItemById = function (id) {
    let cart = this.cartManager.getCopyOfCart();
    return cart.items.find(item => item.id == id)
  }

  /***************************/
  /* PRIVATE FUNCTIONS       */
  /***************************/
  function getQuantityInstructions (target) {

  }

  function clickEventHandler(e) {
    var target = e.target;
    if (!target)
      return;

    var actionEle = target.closest(selectors.item_quantity_action);
    if (!actionEle)
      return;

    var root = actionEle.closest(selectors.item_root);
    if (!root)
      return;

    var itemAttributes = {};
    try {
      itemAttributes = JSON.parse(root.getAttribute(domAttributes.item_root))
    } catch (e) {
      return;
    }

    var action = actionEle.getAttribute(domAttributes.item_quantity_action);
    var key = itemAttributes.key;

    if (!action || !key)
      return;

    if (action == '-')
      this.decreaseQuantity(key);
    else if (action == '+')
      this.increaseQuantity(key);
    else if (action == '0')
      this.removeItem(key);
    else
      return;

    e.stopPropagation();
  }

  function changeEventHandler(e) {
    var target = e.target;
    if (!target)
      return;

    var actionEle = target.closest(selectors.item_quantity_action);
    if (!actionEle)
      return;

    var root = actionEle.closest(selectors.item_root);
    if (!root)
      return;

    var itemAttributes = {};
    try {
      itemAttributes = JSON.parse(root.getAttribute(domAttributes.item_root))
    } catch (e) {
      return;
    }

    var action = actionEle.getAttribute(domAttributes.item_quantity_action);
    var key = itemAttributes.key;

    if (!action || !key)
      return;

    if (actionEle.tagName.toLowerCase() == 'select' || actionEle.tagName.toLowerCase() == 'input')
      this.cartManager.updateItems([{
        type: this.cartManager.CART_REQUEST_TYPES.UPDATE,
        items: [{key, quantity: actionEle.value}]
      }]);
    else
      return;

    e.stopPropagation();
  }

  return Items;
})();

var block_type = block_type || {};

block_type.richtext = new (function () {

    //Manage Richtext
    function RichtextManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }
  
    toolBox.inheritPrototype(RichtextManager, generic_cart_block);
  
    RichtextManager.prototype.getHtml = function () {
      let richtextSettings = {
        id: this.block_id,
        settings: this.settings,
        money_formats: self.money_formats,
      };
  
      return toolBox.renderTemplate(this.cartManager.templatesSelectors.richtext, richtextSettings);
    }
  
    return RichtextManager;
  })();
var block_type = block_type || {};

block_type.accordion = new (function () {

  var self;

  var domAttributes = {
    title_tab: 'scz-accordion-title-tab',
    content_tab: 'scz-accordion-content'
  }

  var domClasses = {
    active_title: 'scz-cart-accordion-title--active',
    open_content: 'scz-cart-accordion-content--open',
    closed_content: 'scz-cart-accordion-content--closed'
  };

  var selectors = {
    title_tab: `[${domAttributes.title_tab}]`,
    content_tab: `[${domAttributes.content_tab}]`,
    active_title: `.${domClasses.active_title}`,
    open_content: `.${domClasses.open_content}`,
    closed_content: `.${domClasses.closed_content}`
  };

  var defaultSettings = {
    panels: [
      {
        title: "Tab1 title",
        description: "Tab1 content"
      },
      {
        title: "Tab2 title",
        description: "Tab2 content"
      }
    ],
    configurations: {
      allow_multiple_active_tabs: true,
      display_icon: true,
      icon: "plus"
    }
  }

  //Manage Accordion
  function AccordionManager(cartManager, settings) {
    self = this;

    var eventListeners = [
      {
        event: 'click',
        handler: toggleTabHandler
      }
    ]

    generic_cart_block.call(this, cartManager, settings, eventListeners, false);
    self.settings = toolBox.merge(defaultSettings, settings, true);
  }

  toolBox.inheritPrototype(AccordionManager, generic_cart_block);

  AccordionManager.prototype.getHtml = function () {

    let accordionSettings = {
      id: this.block_id,
      money_formats: this.money_formats,
      panels: this.settings.panels,
      display_icon: this.settings.configurations.display_icon,
      icon: this.settings.configurations.icon
    };

    return toolBox.renderTemplate(self.cartManager.templatesSelectors.accordion, accordionSettings);
  }

  var toggleTabHandler = e => {
    var $target = ZDOM(e.target);
    if ($target.isEmpty()) return;

    var $tabTitle = ZDOM($target.get(0).closest(selectors.title_tab));
    if ($tabTitle.isEmpty()) return;

    var contentId = $tabTitle.get(0).getAttribute(domAttributes.title_tab);
    var $tabContent = ZDOM('#' + contentId);
    if ($tabContent.isEmpty()) return;

    var $root = ZDOM('#' + self.block_id)
    var shouldOpen = $tabTitle.hasClass(domClasses.active_title) ? false : true;

    // 300ms buffer to prevent unexpected behaviour
    let now = Date.now();
    this.lockTimestamp = this.lockTimestamp || now;
    if (now - this.lockTimestamp > 0 && now - this.lockTimestamp < 300)
      return;
    else if (now - this.lockTimestamp > 300)
      this.lockTimestamp = null;

    if (shouldOpen) {
      // animate tab
      if (!self.settings.configurations.allow_multiple_active_tabs)
        $root.find(selectors.title_tab).removeClass(domClasses.active_title)
      $tabTitle.addClass(domClasses.active_title);

      // animate content
      if (!self.settings.configurations.allow_multiple_active_tabs)
        $root.find(selectors.content_tab).removeClass(domClasses.open_content).addClass(domClasses.closed_content);
      $tabContent.removeClass(domClasses.closed_content).addClass(domClasses.open_content);
    } else {
      $tabTitle.removeClass(domClasses.active_title);
      $tabContent.removeClass(domClasses.open_content).addClass(domClasses.closed_content);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  return AccordionManager;
})();
var block_type = block_type || {};

block_type.rewards = new (function () {

    const REWARD_TYPES = {
        FREE_SHIPPING: "free_shipping",
        PRODUCT: "product",
        DISCOUNT_CODE: "code"
    }

    const selectors = {
        current_message : "[scz-cart-rewards--current-message]",
        next_message    : "[scz-cart-rewards--next-message]",
        progress_bar    : "[scz-cart-rewards--progress-bar]"
    }

    let rewards = [];

    let currentAward = null;
    let nextAward    = null;

    //Manage Footer
    function Block(cartManager, block) {
        generic_cart_block.call(this, cartManager, block, [], true);

        this.enabled = toolBox.getProp(block, "configurations.enabled", false);
        this.rewards = toolBox.getProp(block, "configurations.steps", []);

        // Sort rewards based on "threshold" by ascending order
        this.rewards.sort((a, b) => {
            if ((isNaN(a.threshold) && isNaN(b.threshold)) || (a.threshold == b.threshold))
                return 0;
            else if ((!isNaN(a.threshold) && isNaN(b.threshold)) || (a.threshold > b.threshold))
                return 1
            else if ((!isNaN(b.threshold) && isNaN(a.threshold)) || (b.threshold > a.threshold))
                return -1
            return 0
        });

        for (var i=0; i< this.rewards.length; i++) {
            let reward = this.rewards[i];

            reward.unlocked = false;
            reward.last_unlocked = false;
            reward.next_to_unlock = i===0;
            
        }
    }

    toolBox.inheritPrototype(Block, generic_cart_block);

    Block.prototype.getHtml = function () {
        if (!this.enabled)
            return "";

        let cart = this.cartManager.getCopyOfCart();
        this.updateReward(cart);

        let data = this.generateRenderOptions(cart);

        return toolBox.renderTemplate(this.cartManager.templatesSelectors.rewards, data);
    }

    Block.prototype.customBlockUpdate = function () {
        if (!this.enabled)
            return;

        let cart = this.cartManager.getCopyOfCart();

        // Apply reward (add/remove awarded product - auto apply discount code - or should it be done after clicking on the button ?)
        this.updateReward(cart);
        
        // Update 
        document.getElementById(this.block_id).querySelector(selectors.current_message);
        document.getElementById(this.block_id).querySelector(selectors.next_message);
        document.getElementById(this.block_id).querySelector(selectors.progress_bar);



                                

        // control the progress bar & the texts. 
        // if (interfaceParams)
        //     updateInterface(interfaceParams);
    }

    /*********************************/
    /* PRIVATE FUNCTIONS       */
    /*********************************/ 

    // TODO: 
    Block.prototype.generateRenderOptions = function (cart) {
        var options = {
            id: this.block_id,
            money_formats: this.money_formats,
            rewards: this.rewards,
            cart
        };

        return options;
    }

    Block.prototype.updateReward = function (cart) {
        var subtotal = this.calculateRealSubtotal(cart);

        let newCurrentReward = null;
        let newNextReward = null;

        /** Get current & next actions **/
        /********************************/
        for (let reward of this.rewards) {
            if (!toolBox.isEmpty(reward) && subtotal >= reward.threshold) {
                newCurrentReward      = reward;

                reward.unlocked       = true;
                reward.last_unlocked  = false;
                reward.next_to_unlock = false;
            } else {
                reward.unlocked       = false;
                reward.last_unlocked  = false;

                var isNextToUnlock = !newNextReward && !toolBox.isEmpty(reward) && subtotal < reward.threshold;
                reward.next_to_unlock = isNextToUnlock;
                if (isNextToUnlock)
                    newNextReward = reward
            }
        }

        if (newCurrentReward)
            newCurrentReward.last_unlocked = true;


        /** Update rewards **/
        /***********************************/
        this.updateProductRewards(cart, this.rewards, newCurrentReward, newCurrentReward);

        /** Take actions based on rewards **/
        /***********************************/
        // The client has not yet earned a reward.
        if (toolBox.isEmpty(newCurrentReward) && toolBox.isEmpty(currentAward)) {
            // do nothing ?
        }

        // The client has earned a new reward.
        else if (toolBox.isEmpty(currentAward) || newCurrentReward.threshold > currentAward.threshold) {
            
        }

        // The client has lost the latest award.
        else if (toolBox.isEmpty(newCurrentReward) || newCurrentReward.threshold < currentAward.threshold) {
            // Scan cart to fetch rewarded products.
            // && remove products that don't match earned rewards.
            if (currentAward.type === REWARD_TYPES.FREE_SHIPPING) {
                // remove product
            }
        }

        /** Update local rewards references **/
        /*************************************/
        currentAward = newCurrentReward;
        nextAward = newNextReward;
    }

    Block.prototype.calculateRealSubtotal = function (cart) {
        let subtotal = cart.items_subtotal_price;

        // Exclude rewarded products form the cart.
        for (let item of cart.items) {
            let attribute = getItemProperty(item.variant_id);
            if (!toolBox.hasAttribute(item, attribute))
                continue;
            // We assume that the deduced price should exclude applied discounts for the reward 
            // & the quantity is 1. The client may have successed at adding the same item multiple times, only the first one is gifted
            subtotal -= item.original_price;
        }

        // Check if to exclude rewarded discount codes.
        // ...

        return subtotal;
    }

    /********************************************/
    /* PRODUCT REWARD       */
    /********************************************/
    Block.prototype.updateProductRewards = function (cart, rewards) {
        // List of rewards already added to the cart.
        const addedRewardItems = getAllRewardedLineItems(cart.items);
        // List of earned rewards.
        const earnedProductRewards = rewards.filter(reward => reward.unlocked && reward.type == REWARD_TYPES.PRODUCT && reward.variant_id)
        // List of earned rewards not yet added to the cart => Should be added.
        let missingRewards = []; 
        // List of lost rewards that are still present in the cart => Should be removed.
        let lostRewards = [];

        // Find  missing rewards by checking which rewards are not yet added to the cart.
        for (let reward of earnedProductRewards) {
            let found = false;
            for (let item of addedRewardItems) {
                let attribute = getItemProperty(item.variant_id);
                if (!toolBox.hasAttribute(item, attribute))
                    continue;
                found = true;
                break;
            }

            if (!found)
                missingRewards.push(reward);
        }

        // Find lost / unearned rewards by checking which of the already added items doesn't match the list of earned rewards
        for (let rewardedItem of addedRewardItems) {
            let found = false;

            for (let reward of earnedProductRewards) {
                let attribute = getItemProperty(reward.variant_id);
                if (!toolBox.hasAttribute(rewardedItem, attribute))
                    continue;
                found = true;
                break;
            }

            if (!found)
                lostRewards.push(rewardedItem);
        }

        // Build requests
        let itemsToAdd = [];
        let itemsToDelete = [];
        for (let missingReward of missingRewards) {
            itemsToAdd.push({
                id: missingReward.variant_id,
                quantity: 1,
                properties: getItemProperty(missingReward.variant_id)
            })
        }

        for (let lostReward of lostRewards) {
            itemsToDelete.push({
                key: lostReward.key
            })
        }

        let requests = [];
        if (itemsToAdd.length)
            requests.push({
                type: this.cartManager.CART_REQUEST_TYPES.ADD,
                items: itemsToAdd
            })

        if (itemsToDelete.length)
            requests.push({
                type: this.cartManager.CART_REQUEST_TYPES.REMOVE,
                items: itemsToDelete
            })

        if (requests.length)
            this.cartManager.updateItems(requests);
    }

    function getItemProperty(variantId) {
        return {
            name: `_reward_${variantId}`,
            value: `unlocked`
        }
    }

    function getAllRewardedLineItems(line_items) {
        return line_items.filter(item => {
            let rewardItemProperty = getItemProperty(item.variant_id);

            if (!item.properties)
                return false;

            let itemProperties = JSON.parse(JSON.stringify(item.properties));

            if (!Array.isArray(itemProperties))
                itemProperties = [itemProperties];

            for (let property of itemProperties) {
                if (property.name == rewardItemProperty.name && property.value == rewardItemProperty.value)
                    return true;
            }

            return false;
        })
    }

    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    Block.isRewardItem = function (item, variantId) {
        let attribute = getItemProperty(variantId);
        return toolBox.hasAttribute(item, attribute);
    }

    return Block;
})();
var block_type = block_type || {};

block_type.upsell = new (function () {

    //Manage upsell
    function Block (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], true);
 
      this.title                 = toolBox.getProp(block, "configurations.title", "");
      this.search_term           = toolBox.getProp(block, "configurations.search_term", "");
      this.style                 = toolBox.getProp(block, "configurations.style", "slider");
      this.products_per_row      = Math.max(toolBox.getProp(block, "configurations.products_per_row", 0), 1);
      this.max_rows              = Math.max(toolBox.getProp(block, "configurations.max_rows", 0), 1);
      this.max_products          = Math.max(toolBox.getProp(block, "configurations.max_products", 0), 1);
      this.hide_products_in_cart = toolBox.getProp(block, "configurations.hide_products_in_cart", true);
      
      this.vaultKey              = 'upsell-' + this.search_term;
      this.products              = this.cartManager.getFromVault(this.vaultKey)

      if (!this.products)
        fetch(`/search/suggest.json?q=${this.search_term}&resources[type]=product`)
        .then(raw => raw.json())
        .then(this.handleProducts.bind(this));
    }
  
    toolBox.inheritPrototype(Block, generic_cart_block);
  
    Block.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();

      let validProducts = [];

      for (var product of this.products) {
        let found = !!cart.items.find(item => item.product_id == product.id);
        if ((!found || !this.hide_products_in_cart) && this.max_products > validProducts.length) validProducts.push(product);
      }

      let isSlider = this.style == 'slider' && validProducts.length > 1
      var data = {
        id               : this.block_id,
        money_format     : this.money_formats,
        is_slider        : isSlider,
        title            : this.title,
        max_rows         : isSlider? 1 : this.max_rows,
        products_per_row : isSlider ? this.max_rows * this.products_per_row : this.products_per_row,
        products         : validProducts
      };

      // Build template
      return toolBox.renderTemplate(self.cartManager.templatesSelectors.upsell, data, {});
    }

    // get collection or each product
    Block.prototype.handleProducts = function (res) {
      let products = toolBox.getProp(res, "resources.results.products", []);
      if (!products)
        products = [];

      this.cartManager.addToVault(this.vaultKey, products);
      this.products = products;
    }
  
    return Block;
  
  })();
  
var block_type = block_type || {};

block_type.spacer = new (function () {

    function SpacerManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }

    toolBox.inheritPrototype(SpacerManager, generic_cart_block);

    SpacerManager.prototype.getHtml = function () {
      let data = {
        id: this.block_id,
        money_formats: self.money_formats,
        spacing: this.settings.configurations.spacing
      };

      return toolBox.renderTemplate(this.cartManager.templatesSelectors.spacer, data);
    }

    return SpacerManager;
  })();

var block_type = block_type || {};

block_type.image = new (function () {

    function Block (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }
  
    toolBox.inheritPrototype(Block, generic_cart_block);
  
    Block.prototype.getHtml = function () {
      let data = {
        id: this.block_id,
        money_formats: this.money_formats,
        src: this.settings.configurations.src,
        nature: this.settings.configurations.nature,
        crop : this.settings.configurations.crop, 
        full_width: this.settings.configurations.full_width
      };
  
      return toolBox.renderTemplate(this.cartManager.templatesSelectors.image, data);
    }
  
    return Block;
  })();
var block_type = block_type || {};

block_type.summary = new (function () {

  var domAttributes = {
      input: 'scz-add-address'
  }

  var selectors = {
      input: `[${domAttributes.input}]`
  };

    //Manage Summary
    function SummaryManager (cartManager, block) {

      var eventListeners = [
          {
              event: 'click',
              handler: clickInput.bind(this)
          }
      ]

      this.popupSettings = null;

      generic_cart_block.call(this, cartManager, block, eventListeners,  true);
    }

    toolBox.inheritPrototype(SummaryManager, generic_cart_block);

    SummaryManager.prototype.getHtml = function () {
      let cart = this.cartManager.getCopyOfCart();
      let data = generateRenderOptions.bind(this)(this.settings, cart);
      // commonsFilters.priceFormatter(total)

      this.address = this.cartManager.getFromVault('adress')

      return toolBox.renderTemplate(this.cartManager.templatesSelectors.summary, data);
    }

    const generateRenderOptions = function (block, cart) {
      var configurations = block.configurations;

      var options = {
        id: this.block_id,
        money_formats: this.money_formats,
        cartIsEmpty: cart.item_count == 0
      };

      var settings = {};

      if (configurations.title_line && configurations.title_line.enabled)
      settings.title = {
        label: configurations.title_line.label,
        isCollapsible: configurations.collapsible == true ? true : false,
        isOpenDefault: configurations.collapsible && configurations.open_default == false ? false : true
      }

      if (configurations.subtotal_line && configurations.subtotal_line.enabled)
        settings.subtotal = {
          label: configurations.subtotal_line.label,
          value: cart.items_subtotal_price
        }

      if (configurations.discounts_line && configurations.discounts_line.enabled)
        settings.discounts = {
          label: configurations.discounts_line.label,
          value: cart.total_discount
        }

      if (configurations.shipping_line && configurations.shipping_line.enabled) {
        settings.shipping = {
          label: configurations.shipping_line.label,
          value: configurations.shipping_line.value
        }
        if (configurations.shipping_line.button_add_address && this.address == undefined) {
          settings.shipping.button_add_address = configurations.shipping_line.button_add_address
        }
      }

      if (configurations.total_line && configurations.total_line.enabled)
        if (configurations.total_line.display_cart_count) {
          var total_label = configurations.total_line.label + " ( " + cart.item_count + configurations.total_line.cart_count_prefix + " ) ";
        } else {
          var total_label = configurations.total_line.label
        }
        settings.total = {
          label: total_label,
          value: cart.total_price
        }

      if (configurations.weight_line && configurations.weight_line.enabled)
        settings.weight = {
          label: configurations.weight_line.label,
          value: cart.total_weight
        }

      if (block.block_level_options != undefined) {
        for (let blockOption of block.block_level_options) {
            const optionSettings = toolBox.getProp(blockOption, "settings", {});
            const shouldDisplay  = toolBox.getProp(optionSettings, "enabled", false);
            const optionType     = blockOption.option;

            if (!shouldDisplay || !optionType) continue;

            switch (optionType) {
              case "add_address":

              var popupSettings = {};

                if (optionSettings.title_line && optionSettings.title_line.enabled)
                  popupSettings.title = {
                    label: optionSettings.title_line.label
                  }

                if (optionSettings.subtotal_line && optionSettings.subtotal_line.enabled)
                  popupSettings.subtotal = {
                    label: optionSettings.subtotal_line.label
                  }

                if (optionSettings.inputs && optionSettings.inputs.enabled)
                  popupSettings.form = optionSettings.inputs;

                this.popupSettings = popupSettings;
                break;
              default:
                break;
            }
          }
      }

      options.summary = settings;

      return options;
    }


    function clickInput(e) {

        // Get dom input.
        var root = document.getElementById(this.block_id);
        if (!root) return;

        var input = root.querySelector(selectors.input);

        this.cartManager.openPopup(this.popupSettings);
    }

    return SummaryManager;
  })();

var block_type = block_type || {};

block_type.button = new (function () {

    var self;

    //Manage Button
    function ButtonManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(ButtonManager, generic_cart_block);

    ButtonManager.prototype.getHtml = function () {
      let data = generateRenderOptions();
      // commonsFilters.priceFormatter(total)

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.button, data);
    }

    ButtonManager.prototype.generateRenderOptions = () => {
      let block = this.settings;
      let cart = self.cartManager.getCopyOfCart();

      var options = {
        id: this.block_id,
        money_formats: this.money_formats,
        cartIsEmpty: cart.item_count == 0,
        title: block.configurations.title,
        url: block.configurations.url,
        width: block.configurations.width,
        button_align: block.configurations.button_align,
        active_hover: block.configurations.active_hover,
        text_bold: block.configurations.text_bold,
        text_align: block.configurations.text_align
      };

      return options;
    }

    return ButtonManager;
  })();

var block_type = block_type || {};

block_type.icons = new (function () {

    var self;

    //Manage Icons
    function IconsManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(IconsManager, generic_cart_block);

    IconsManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();
      let data = generateRenderOptions(self.settings, cart);
      // commonsFilters.priceFormatter(total)

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.icons, data);
    }

    const generateRenderOptions = (block, cart) => {
      var options = {
        id: self.block_id,
        money_formats: self.money_formats,
        cartIsEmpty: cart.item_count == 0,
        numberPerRow: block.configurations.number_per_row,
        align: block.configurations.align,
        icons: self.settings.icons
      };

      return options;
    }

    return IconsManager;
  })();

var block_type = block_type || {};

block_type.featured_upsell  = new (function () {

    var domAttributes = {
        input: 'scz-featured-upsell-input'
    }

    var domClasses = {
        hide_input: 'scz-featured-upsell--hide',
        loading   : 'scz-featured-upsell--loading'
    };

    var selectors = {
        input: `[${domAttributes.input}]`,
        hide_input: `.${domClasses.hide_input}`,
        loading: `.${domClasses.loading}`
    };

    function Block(cartManager, block) {

        var eventListeners = [
            {
                event: 'change',
                handler: changeInput.bind(this)
            }
        ]

        // Indicates whether there is an active cart request with Shopify
        this.blocked = false;

        // Add event listener.
        generic_cart_block.call(this, cartManager, block, eventListeners, true);

        this.title            = toolBox.getProp(block, "configurations.title", "");
        this.description      = toolBox.getProp(block, "configurations.description", "");
        this.input_label      = toolBox.getProp(block, "configurations.input_label", "");
        this.hide_if_selected = toolBox.getProp(block, "configurations.hide_if_selected", false);
        this.variant_id       = toolBox.getProp(block, "configurations.variant_id", "");
    }

    toolBox.inheritPrototype(Block, generic_cart_block);

    Block.prototype.getHtml = function () {
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));

        let data = {
            id          : this.block_id,
            money_formats: this.money_formats,
            title       : this.title,
            description : this.description,
            input_label : this.input_label,
            input_attr  : domAttributes.input,
            is_checked  : !!product
        };

        return toolBox.renderTemplate(this.cartManager.templatesSelectors.featured_upsell, data);
    }

    Block.prototype.customBlockUpdate = function () {
        this.toggleHideClass();

        // Add hide class
        changeInput.bind(this)();
    }

    Block.prototype.on_rendered = function () {
        changeInput.bind(this)();
    }

    /********************************************/
    /* PRIVATE FUNCTIONS       */
    /********************************************/
    function getItemProperty(variantId) {
        return {
            name: `_featured_upsell_${variantId}`,
            value: `unlocked`
        }
    }

    function changeInput(e) {
        if (this.blocked)
            return;

        // Get dom input.
        var root = document.getElementById(this.block_id);
        if (!root) return;

        var input = root.querySelector(selectors.input);
        // Check if featured upsell is already added.
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));
        var hasProduct = !!product;

        if (input.checked && !hasProduct) {
            this.toggleLoadingClass();

            root.classList.remove(domClasses.hide_input);

            let formData = {
                id: this.variant_id,
                quantity: 1,
                properties: getItemProperty(this.variant_id)
            };

            this.cartManager.postShopify(formData, this.cartManager.CART_REQUEST_TYPES.ADD, {
                onSuccess: itemAdded.bind(this),
                onFailure: itemAdded.bind(this),
                always   : unblock.bind(this)
            })
        } else if (!input.checked && hasProduct) {
            this.toggleLoadingClass();

            if (this.hide_if_selected)
                root.classList.add(domClasses.hide_input);

            let formData = {
                id: product.key,
                quantity: 0
            }
            this.cartManager.postShopify(formData, this.cartManager.CART_REQUEST_TYPES.CHANGE, {
                onSuccess: itemRemoved.bind(this),
                onFailure: itemAdded.bind(this),
                always   : unblock.bind(this)
            })
        }
    }

    function itemAdded() {
        this.blocked = false;
    }

    function itemRemoved () {
        this.blocked = false;
        
    }

    function unblock () {
        this.toggleLoadingClass();
    }

    Block.prototype.toggleHideClass = function () {
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));
        document.getElementById(this.block_id).classList[this.hide_if_selected && !!product?'add':'remove'](domClasses.hide_input);
    }

    Block.prototype.toggleLoadingClass = function () {
        // Add loading class;
        let hasClass = document.getElementById(this.block_id).classList.contains(domClasses.hide_input);
        document.getElementById(this.block_id).classList[hasClass?'remove':'add'](domClasses.loading);
        // Block
        this.blocked = !hasClass;
    }

    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    Block.isFeaturedUpsell = function (item) {
        let attribute = getItemProperty(item.variant_id);
        return toolBox.hasAttribute(item, attribute);
    }

    return Block;
})();

var block_type = block_type || {};

const CartManager = new (function () {

  let self = undefined;
  let $ = ZDOM;

  var blocks_list = [];
  var shopifyCart = undefined;

  const selectors = {
    'cart': '[scz-cart]',
    'cartTrigger': '[scz-cart-trigger]',
    'cartClose': '[scz-cart-close]',
    'cartOverlay': '[scz-cart-overlay]',
    'cartHeader': '[scz-cart-header]',
    'cartItems': '[scz-cart-items]',
    'cartItem': '[scz-cart-item]',
    'cartItemRemove': '[scz-cart-item-remove]',
    'cartItemQuantityDecrement': '[scz-cart-item-quantity-decrement]',
    'cartItemQuantityIncrement': '[scz-cart-item-quantity-increment]',
    'cartFooter': '[scz-cart-footer]',
    'loader': '[scz-loader]',
  };

  const classes = {
    'cartOpen'     : 'scz-cart-open',
    'overlayActive': 'scz-overlay-active',
    'loaderActive' : 'scz-loader-active',
  };

  const templatesSelectors = {
    'container': 'scz-cart-container',
    'overlay': 'scz-cart-overlay',
    'header': 'scz-cart-header',
    'footer': 'scz-cart-footer',
    'content': 'scz-cart-content',
    'items': 'scz-cart-items',
    'basic_item': 'scz-cart-basic_item',
    'reward_item': 'scz-cart-reward_item',
    'featured_upsell_item': 'scz-cart-featured_upsell_item',
    'non_native_recharge': 'scz-cart-non_native_recharge_item',
    'richtext': 'scz-cart-richtext',
    'accordion': 'scz-cart-accordion',
    'rewards': 'scz-cart-rewards',
    'featured_upsell': 'scz-cart-featured_upsell',
    'spacer': 'scz-cart-spacer',
    'image': 'scz-cart-image',
    'summary': 'scz-cart-summary',
    'button': 'scz-cart-button',
    'spacer': 'scz-cart-spacer',
    'icons': 'scz-cart-icons',
    'upsell': 'scz-cart-upsell',
    'popup': 'scz-cart-popup',
  };

  const CSS_DOM_CONTAINERS = {
    DESKTOP: "my_desktop_styles_id",
    MOBILE: "my_mobile_styles_id"
  };

  let shipping_data = {
    enabled     : false,
    storage_key : 'sz_cart_address',
    rates       : null,
    address     : null
  }

  const PARAMS = {
    JSON: config_sidecart,
    CART: "/cart.js"
  };

  // Information that should be kept persistent even when the cart is closed.
  let vault = {};

  function Cart() {
    self = this;

    self.templatesSelectors = templatesSelectors;

    self.CART_REQUEST_TYPES = {
      ADD   : 'add',
      UPDATE: 'update',
      CHANGE: 'change',
      REMOVE: 'remove',
      CLEAR : 'clear'
    }
  }


  /**
  * Public fonctions
  */

  // init cart
  Cart.prototype.init = async function init() {
    // Fetch site configurations.
    this.settings = await getSettings();

    // Fetch Data // note really needed ?
    shopifyCart = await fetchCart();

    // Create the root element of the shopping cart (all generated blocks will be placed inside.)
    this.root_dom_id = toolBox.makeId(10, { prefix: "cart_root_" });
    document.querySelector("body").append(toolBox.htmlToElement(`
        <div id="${this.root_dom_id}"></div>
      `))

    // Detect cart interactions
    httpInterceptor.bind(this)(["/cart/add.js", "/cart/update.js", "/cart/change.js"], this.handleCartUpdates.bind(this));

    // Attach events
    this.handleEvents();

    this.cartVisibilityState = false;
    this.isUpdating = false;

    // Default money format
    var shopifyCurrency = toolBox.getProp(Shopify, "currency.active", "EUR");
    
    // The problem this code is trying to solve :
    // We don't know where the currency is located for each local (before/after)
    var formatSeed = `{{format}}${shopifyCurrency}`;
    try {
      var locale = Shopify.locale + '-' + Shopify.locale.toUpperCase();
      // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
      var formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: shopifyCurrency }).format(1);
      var currencySign = new Intl.NumberFormat(locale, { style: 'currency', currency: shopifyCurrency }).formatToParts().find(part => part.type == 'currency').value;
      formatSeed = formatted.split(currencySign).map(part => part != ""?"{{format}}":currencySign).join("")
    } catch (e) {
      console.error("Couldn't get money format, reverting to default: ", formatSeed);
    }

    this.money_formats = {
      default: formatSeed.replace('format', 'default'), 
      without_trailing_zeros: formatSeed.replace('format', 'without_trailing_zeros'),
      with_comma_separator: formatSeed.replace('format', 'with_comma_separator'),
      without_trailing_zeros_with_comma_separator: formatSeed.replace('format', 'without_trailing_zeros_with_comma_separator')
    }

    // Add plugins to the service.
    this.handlePlugins();

    // Dry runs blocks.
    this.dryBlockInit();
  }

  Cart.prototype.destroy = function () {
    // TODO - reset events
    // document.body.removeEventListener("click", self.handleEvents());

    // ATTENTION : DO NOT reset the shopify cart object. Why ?
    // Because it is used when updating cart on the website even when the cart is not yet init or destroyed.
    // shopifyCart = null;

    // reset blocks
    self.teardownBlocks();

    //remove styles
    self.teardownStyles();

    // clear cart content
    document.getElementById(self.root_dom_id).innerHTML = "";
  }

  Cart.prototype.teardownStyles = function () {
    var desktopStyles = document.getElementById(CSS_DOM_CONTAINERS.DESKTOP)
    if (desktopStyles) desktopStyles.remove();

    var mobileStyles = document.getElementById(CSS_DOM_CONTAINERS.MOBILE)
    if (mobileStyles) mobileStyles.remove();
  }

  Cart.prototype.teardownBlocks = function () {
    for (const block of blocks_list) {
      block.destroy();
    }
    blocks_list = [];
  }

  // Get events from cart
  Cart.prototype.handleEvents = function () {

    document.body.addEventListener("click", e => {
      if (!e.target || window.location.pathname.endsWith('/cart'))
        return;

      // if someone clicks on the cart link
      if (e.target.closest('a')) {
        var anchor = e.target.closest('a');
        if (anchor.getAttribute('href') == "/cart") {
          self.updateCartVisibilityState(true);

          e.stopPropagation();
          e.preventDefault();
        }
      }

      // for custom implementations, if someone clicks on an element tagged with our attribute.
      if (e.target.closest(selectors.cartTrigger)) {
        self.updateCartVisibilityState(true);

        e.stopPropagation();
        // e.preventDefault();
      }
    }, false)

    // Close if clicking on the close icon.
    document.getElementById(self.root_dom_id).addEventListener("click", function (e) {
      if (e.target && e.target.matches(selectors.cartClose)) {
        self.updateCartVisibilityState(false);
      }
    }, false);

    // Close if clicking outside the cart
    const closeSettings = toolBox.getProp(self.settings, "section.close", {});

    if (closeSettings && closeSettings.on_outside_click) {
      document.body.addEventListener("click", function (e) {
        if (e.target && !e.target.closest(`.${templatesSelectors.container}`)) {
          self.updateCartVisibilityState(false);
        }
      }, false);
    }
  }

  Cart.prototype.updateCartVisibilityState = async function (cartVisibilityState) {
    if (self.cartVisibilityState == cartVisibilityState) {
      shopifyCart = await fetchCart();
      this.notifyCartDependents();
      return;
    } else if (cartVisibilityState) {
      await self.renderCart(self.settings.blocks);
      $(selectors.cart).addClass(classes.cartOpen);
      $(selectors.cartOverlay).addClass(classes.overlayActive);
    } else {
      $(selectors.cart).removeClass(classes.cartOpen);
      $(selectors.cartOverlay).removeClass(classes.overlayActive);
      self.destroy();
    }
    self.cartVisibilityState = cartVisibilityState;
  }

  Cart.prototype.updateLoaderVisibilityState = function (isUpdating) {
    if (this.isUpdating == isUpdating) {
      return;
    } else if (isUpdating) {
      $(selectors.loader).addClass(classes.loaderActive);
    } else {
      $(selectors.loader).removeClass(classes.loaderActive);
    }
    this.isUpdating = isUpdating;
  }

  // Manage vault
  Cart.prototype.addToVault = function (key, value) {
    vault[key] = value;
  }

  Cart.prototype.getFromVault = function (key) {
    return vault[key];
  }

  // Add or update note cart
  Cart.prototype.updateNote = async function (note) {
    const formData = {
      note: note
    };
    await this.postShopify.bind(this)(formData, 'update');
  }

  Cart.prototype.initBlocks = function () {
    this.teardownBlocks();

    const blocks = this.settings.blocks;
    for (let block of blocks) {
      try {
        let blockInstance = new block_type[block.block_type](self, block);
            blockInstance.money_formats = this.money_formats;

        blocks_list.push(blockInstance);
      } catch (e) {
        console.error(`Couldn't create an instance of block ${block.block_type}`, e)
      }
    }
  }

  // Dry runs over the blocks.
  Cart.prototype.dryBlockInit = function () {
    this.initBlocks();
    this.teardownBlocks();
  }

  Cart.prototype.initAssets = function () {
    //remove styles
    self.teardownStyles();

    // ajouter les variables CSS
    toolBox.loadStyles({
      id: CSS_DOM_CONTAINERS.DESKTOP, object: {
        ":root": toolBox.getProp(this, "settings.root_var", {})
      }
    });

    toolBox.loadStyles({
      id: CSS_DOM_CONTAINERS.MOBILE, max_width: "600px", object: {

      }
    });

    // executer les scripts de depart si besoin.
  }

  // render cart
  Cart.prototype.renderCart = async function () {
    self.initBlocks();
    self.initAssets();

    self.section_id = toolBox.makeId(5, { prefix: "side_cart_container_" });
    self.section_type = "side_cart";

    shopifyCart = await fetchCart();

    let containerData = {
      layout: self.settings.layout
    };

    const container = toolBox.renderTemplate(self.templatesSelectors.container, containerData);
    self.template = `<section id="${self.section_id}" section-type="${self.section_type}"><div class="scz-cart-container-arrow-up"></div>${container}</section>`;
    document.getElementById(self.root_dom_id).insertAdjacentHTML('beforeend', self.template);

    const overlaySettings = toolBox.getProp(self.settings, "section.overlay", {});

    if (overlaySettings && overlaySettings.enabled) {
      const overlayData = {
        opacity: overlaySettings.opacity
      };
      const overlay = toolBox.renderTemplate(self.templatesSelectors.overlay, overlayData);
      document.getElementById(self.root_dom_id).insertAdjacentHTML('beforeend', overlay);
    }

    await self.renderBlocks();
  }

  Cart.prototype.renderBlocks = async function () {
    for (const block of blocks_list) {
      const blockScope = toolBox.getProp(block, "settings.configurations.scope", 1);
      if (blockScope == 1 && shopifyCart.item_count != 0) continue;
      if (blockScope == 2 && shopifyCart.item_count == 0) continue;

      let nodeTemplate = "";
      try {
        nodeTemplate = await block.getHtml();
      } catch (e) {
        console.error("Error rendering block", {block}, e);
        continue;
      }
      let node = toolBox.htmlToElement(nodeTemplate);
      document
        .getElementById(self.section_id)
        .getElementsByClassName(self.templatesSelectors.container)
      [0].append(node);

      try {
        block.markAsRendered();
      } catch (e) {
        console.error("Error marking block as rendered", {block}, e);
      }
    }
  }

  // When a major change occurs (e.g. clear cart), reload the entire content of the cart.
  Cart.prototype.reload = async function () {
    self.initBlocks();
    self.initAssets();

    document
      .getElementById(self.section_id)
      .getElementsByClassName(self.templatesSelectors.container)
    [0].innerHTML = "";

    await self.renderBlocks();
  }

  // Reload blocks which are affected by cart updates.
  Cart.prototype.notifyCartDependents = async function (shouldUpdateCart) {
    const updateBlocks = async function () {
      // Loop over concerned blocks
      for (const block of blocks_list) {
        if (!block.cart_dependant)
          continue;
        await block.updateBlock();
      }
    }

    if (shouldUpdateCart === true)
      fetchCart(true).then(async data => {
        shopifyCart = data;
        await updateBlocks();
      });
    else
      await updateBlocks();
  }

  // TODO: Test
  Cart.prototype.handlePlugins = () => {
    // Plugins management.
    if (toolBox.isEmpty(window.alfred_side_cart_plugins))
      return;

    let plugins = window.alfred_side_cart_plugins;

    // Get custom blocks.
    let customBlocks = toolBox.getProp(plugins, 'blocks', []);
    if (!Array.isArray(customBlocks) || !customBlocks.length)
      return;

    // Sort plugin blocks based on the custom property "order"
    // sort order is ascending
    customBlocks.sort((a, b) => {
      if ((isNaN(a.order) && isNaN(b.order)) || (a.order == b.order))
        return 0;
      else if ((!isNaN(a.order) && isNaN(b.order)) || (a.order > b.order))
        return 1
      else if ((!isNaN(b.order) && isNaN(a.order)) || (b.order > a.order))
        return -1
      return 0
    });

    let updatedBlocks = [];

    let header = {};
    let footer = {};

    for (const block of self.settings.blocks) {
      // There should only be one header & one footer .. if found in the custom blocks => replace default ones.
      if (block.block_type == "header")
        header = block;
      else if (block.block_type == "footer")
        footer = block;

      updatedBlocks.push(block);
    }

    for (const block of customBlocks) {
      // TODO - call a function to validate plugin block.

      var { order, _class, config } = block;
      if (toolBox.isEmpty(_class) || toolBox.isEmpty(config))
        continue;

      // Header & footer have a predefined positions (header at the top, footer at the bottom)
      if (config.block_type == "header")
        header = config;
      else if (config.block_type == "footer")
        footer = config;

      // Don't accept a new block of type items.
      else if (config.block_type == "items")
        continue;

      else if (order && order > 0 && order < updatedBlocks.length)
        // -1 because the header is not added yet.
        updatedBlocks.splice(order - 1, 0, config);
      else
        updatedBlocks.push(config);

      block_type[config.block_type] = _class
    }

    // header should be the first block.
    if (!toolBox.isEmpty(header))
      updatedBlocks.unshift(header);

    // Footer is always at the end
    if (!toolBox.isEmpty(footer))
      updatedBlocks.push(footer);


    // Get custom items.
    let customItems = toolBox.getProp(plugins, 'items', []);

    for (const block of customItems) {
      // TODO - call a function to validate plugin block.

      var { order, _class, config } = block;
      if (toolBox.isEmpty(_class) || toolBox.isEmpty(config))
        continue;

      // Don't accept a new block of type basic.
      if (config.block_type == "basic")
        continue;
      // TODO - validate item config & _class.

      item_types[config.block_type] = _class
    }
  }

  // Errors
  Cart.prototype.handleErrors = function (options) {
    console.log(options);
    const errorMessage = options.status + ' ' + options.message + ' ' + options.description;
    return errorMessage;

    // //A utiliser pour les erreur propre à nous sinon erreur shopify
    // if (error !== undefined) {
    //   console.log(error);
    // }
    //  const errorsMessages = this.settings.errorsMessages;
    //  const message = errorsMessages.action.message;
    //  return message;
  }

  /******************************************/
  /* CART HELPERS */
  /******************************************/

  // cart response.
  Cart.prototype.handleCartUpdates = function (res, url) {
    let requiresFullUpdate = false;

    let cartBeforeUpdate   = this.getCopyOfCart();
    let newItemsAdded      = this.updateLocalCartObject(res);
    let cartAfterUpdate    = this.getCopyOfCart();

    let shouldOpenCartOnUpdate = toolBox.getProp(this.settings, "section.open.on_cart_update", false);

    // TODO - check if the cart is augmented by any custom data (recharge subscriptions, metafields ... )

    /* VISUAL CART UPDATES */
    /***********************/

    // Open cart
    if (!this.cartVisibilityState // if cart is closed.
      && shouldOpenCartOnUpdate
      && cartAfterUpdate.item_count // not empty.
      && cartAfterUpdate.item_count > cartBeforeUpdate.item_count // make sure the update concerns adding NOT deleting items to the cart.
    )
      this.updateCartVisibilityState(true);

    // Reload the entire cart
    else if (
      this.cartVisibilityState &&
      (
        (cartBeforeUpdate.item_count == 0 && cartAfterUpdate.item_count > 0)
        || (cartBeforeUpdate.item_count > 0 && cartAfterUpdate.item_count == 0)
        || newItemsAdded
      )
    )
      this.reload();

    // Only update cart-dependant blocks
    else if (this.cartVisibilityState)
      this.notifyCartDependents();

    // Do nothing.
    else  {}

    /* EVENTS */
    /***********************/
    let detail = {
      request: (new URL(url)).pathname.replace(/(\/cart\/)([\D]*)\.js/,function (match, p1,p2,p3) {
        return p2;
      }),
      item_count: cartAfterUpdate.item_count,
      cart: cartAfterUpdate
    }

    document.body.dispatchEvent(new CustomEvent('cart:update', { bubbles: true, cancelable: true, detail: detail }));
  }

  Cart.prototype.getCopyOfCart = function () {
    var cart = JSON.parse(JSON.stringify(shopifyCart));
    
    if (!cart.total_price_variations) {
      cart.total_price_variations = {

      }
    } 
    
    return cart;
  }

  // ATTENTION:
  // res is Shopify's response after a post request.
  // if request is ADD => res contains only the added items.
  // otherwise (UPDATE/CHANGE/CLEAR) => the entire cart.
  // while updating cart we should make sure to update only updated properties.
  // @returns a bool indicating whether new items were added.
  Cart.prototype.updateLocalCartObject = function (res) {
    try {
      var newItemsAdded = false;

      if (!Array.isArray(res.items) && typeof res == 'object' && res.key) {
        var arr = [res];
        res = {items: []};
        res.items = arr;
      }
      else if (!Array.isArray(res.items) && typeof res.items != 'object' && !res.key)
        return console.error(`ERROR - unable to update cart because input object is not valid`, res);

      const blacklistedCartProperties = ["items"]
      const blacklistedItemProperties = ["title", "subtitle", "featured_image", "image"]

      // res is the entire cart object :
      // => update only first level cart properties
      // => remove deleted cart items from the local object.
      if (res.token) {
        for (let prop in res) {
          if (blacklistedCartProperties.includes(prop))
            continue;

          let value = res[prop];
          shopifyCart[prop] = value;
        }

        let nonDeletedItems = [];
        for (let item of res.items) {
          var foundItem = shopifyCart.items.find(sci => sci.key == item.key);
          if (!foundItem) continue;

          nonDeletedItems.push(foundItem);
        }

        shopifyCart.items = nonDeletedItems;
      }

      // update items
      for (let i = 0; i < res.items.length; i++) {
        let item = res.items[i];
        let matchingCartItemIndex = shopifyCart.items.findIndex(currentItem => currentItem.key == item.key);

        // update existing item.
        if (matchingCartItemIndex > -1)
          for (let prop in item) {
            if (blacklistedItemProperties.includes(prop))
              continue;

            shopifyCart.items[matchingCartItemIndex][prop] = item[prop];
          }

        // add new item as is.
        else {
          shopifyCart.items.unshift(item);
          newItemsAdded = true;
        }
      }

      // Recalculate dynamic properties
      // Add 0 as initial value to the reducer as a work around when the cart contains only 1 element
      shopifyCart.original_total_price = shopifyCart.items.reduce((result, item) => parseInt(result.original_line_price  || result) + parseInt(item.original_line_price) , 0);
      shopifyCart.items_subtotal_price = shopifyCart.items.reduce((result, item) => parseInt(result.final_line_price     || result) + parseInt(item.final_line_price    ), 0);
      shopifyCart.total_discount       = shopifyCart.items.reduce((result, item) => parseInt(result.total_discount       || result) + parseInt(item.total_discount)      , 0);
      shopifyCart.total_weight         = shopifyCart.items.reduce((result, item) => parseInt(result.grams                || result) + parseInt(item.grams)               , 0);
      shopifyCart.item_count           = shopifyCart.items.reduce((result, item) => parseInt(result.quantity             || result) + parseInt(item.quantity)            , 0);
      shopifyCart.total_price          = shopifyCart.items_subtotal_price

      return newItemsAdded;
    } catch (err){
      console.error("Error updating local cart object using the intercepted response", err)
    }

  }

  // TODO - update to allow adding multiple items at once & selling plans.
  Cart.prototype.addItem = async function (variant_id, quantity, properties) {
    const formData = {
      items: [{
        id: variant_id,
        quantity: quantity,
        properties: properties
      }]
    };
    this.postShopify.bind(this)(formData, 'add');
  }

    /**
   * Replace a cart item with another (ex, upsell, convert one-off to subscription ...)
   *
   * @param {string} key                  The line_item key of the item currently in the cartManager
   * @param {string} id                   The variant id of the new item that should be added to the cartManager
   * @param {object} options              Replacement options.
   * @param {number} options.quantity     The new quantity to add, if a not set, the current quantity will be requested.
   * @param {object} options.properties   The new properties to add, if not set, the current properties will be added.
   * @param {object} options.selling_plan The new properties to add, if not set, the current properties will be added.
   */
  Cart.prototype.replaceItem = function (key, id, options) {
    let currentItem = this.getItemByKey(key);
    let newItemInCart = this.getItemById(id);
    /* Build the new item to add. */
    /******************************/
    let itemToAdd = {
      id
    }
    itemToAdd.quantity     = options.quantity || currentItem.quantity;
    itemToAdd.properties   = options.properties || currentItem.properties || {};
    itemToAdd.selling_plan = options.selling_plan;
    /* Decide which operation(s): "update" or "update + add" */
    /*****************************************************/
    // if item has properties or selling plan, we can't use the UPDATE route.
    // if the variant is already in the cart, UPDATING quantity could override exiting item. (thus checking the newItemInCart)
    if (toolBox.isEmpty(itemToAdd.properties)
      && toolBox.isEmpty(itemToAdd.selling_plan)
      && !newItemInCart) {
      this.updateItems({
        type: this.CART_REQUEST_TYPES.UPDATE,
        items: [{key, quantity: 0}, itemToAdd]
      })
    } else {
      this.updateItems([
        {
          type: this.CART_REQUEST_TYPES.REMOVE,
          items: [{key}]
        },
        {
          type: this.CART_REQUEST_TYPES.ADD,
          items: [itemToAdd]
        }
      ])
    }
  }
  /**
   * A list of requests that should be analysed for optimization before passing them to Shopify.
   *
   * @param {Object[]} requests                        The list of requests to be processed. (IF not array, it will be converted to an array with a single element)
   * @param {String}   requests[].type                 Enum of CART_REQUEST_TYPES
   * @param {Object[]} requests[].items                The list of items for which the action should be applied.
   * @param {String}   requests[].items[].id           Required only for CART_REQUEST_TYPES.ADD
   * @param {object}   requests[].items[].key          Required only for operations that updates existing line items i.e.  CART_REQUEST_TYPES.REMOVE or CART_REQUEST_TYPES.UPDATE
   * @param {object}   requests[].items[].quantity     Only required for CART_REQUEST_TYPES.ADD | Optional for CART_REQUEST_TYPES.UPDATE
   * @param {object}   requests[].items[].properties   Optional for CART_REQUEST_TYPES.ADD & CART_REQUEST_TYPES.Update | Not used for CART_REQUEST_TYPES.REMOVE
   * @param {object}   requests[].items[].selling_plan Optional for CART_REQUEST_TYPES.ADD & CART_REQUEST_TYPES.Update | Not used for CART_REQUEST_TYPES.REMOVE
   */
  Cart.prototype.updateItems = function (requests, callback) {
    if (!Array.isArray(requests))
      requests = [requests];
    let shopifyRequestsList = [];
    // In update requests we can add many items, as a map of id/key:quantity
    let shopifyUpdateRequest = {
      updates: {}
    };
    // In add requests we can add many items, as an object
    let shopifyAddRequest = {
      items: []
    };
    for (let request of requests) {
      let action = request.type;
      let items  = request.items;
      if (action == this.CART_REQUEST_TYPES.ADD) {
        for (let item of items) {
          if (!item.id || isNaN(item.quantity)) {
            console.error("To add a new item both properties: ID & QUANTITY are required", item)
            continue;
          }

          let cartItem = {
            id: item.id,
            quantity: item.quantity
          }
          if (typeof item.properties == 'object' && !toolBox.isEmpty(item.properties))
            cartItem.properties = item.properties;

          if (!toolBox.isEmpty(item.selling_plan))
            cartItem.selling_plan = item.selling_plan;
          shopifyAddRequest.items.push(cartItem);
        }
      } else if (action == this.CART_REQUEST_TYPES.UPDATE) {
        for (let item of items) {
          if (!item.key || isNaN(item.quantity)) {
            console.error("To update an existing item, both properties: KEY & QUANTITY are required", item)
            continue;
          }

          let cartItem = {
            id: item.key,
            quantity: item.quantity
          }
          if (typeof item.properties == 'object' && !toolBox.isEmpty(item.properties))
            cartItem.properties = item.properties;

          // TODO: Test if a normal item can be converted to a subscription using the change request.
          if (!toolBox.isEmpty(item.selling_plan))
            cartItem.selling_plan = item.selling_plan;
          if (cartItem.properties || cartItem.selling_plan)
            shopifyRequestsList.push({
              type: this.CART_REQUEST_TYPES.CHANGE,
              request: cartItem
            });
          else
            shopifyUpdateRequest.updates[cartItem.id] = cartItem.quantity;
        }
      } else if (action == this.CART_REQUEST_TYPES.REMOVE) {
        for (let item of items) {
          if (!item.key) {
            console.error("To remove an existing item KEY is required", item)
            continue;
          }

          shopifyUpdateRequest.updates[item.key] = 0;
        }
      }
    }
    if (Object.keys(shopifyUpdateRequest.updates).length)
      shopifyRequestsList.push({
        type: this.CART_REQUEST_TYPES.UPDATE,
        body: shopifyUpdateRequest
      });
    if (shopifyAddRequest.items.length)
      shopifyRequestsList.push({
        type: this.CART_REQUEST_TYPES.ADD,
        body: shopifyAddRequest
      });
    for (let shopifyRequest of shopifyRequestsList) {
      this.postShopify(shopifyRequest.body, shopifyRequest.type, callback);
    }
  }

  // Clear cart
  Cart.prototype.clearCart = function () {
    const formData = {};
    this.postShopify.bind(this)(formData, 'clear');
  }


  Cart.prototype.openPopup = function (data) {

    var popup = document.createElement('div');
    popup.dataset.sczCartPopup;
    popup.classList.add("scz-cart-popup");

    if (data.title) {
      var title = data.title.label;
      var title_html = document.createElement('h2');
      title_html.classList.add("scz-cart-popup-title");
      title_html.innerHTML = title;
      popup.append(title_html)
    }
    if (data.form) {
      var form = this.generateForm.bind(this)(data.form);
      console.log(form);
      var form_html = document.createElement('div');
      form_html.classList.add("scz-cart-popup-form");
      form_html.append(form);
      popup.append(form_html)
    }

    document.getElementById(self.section_id).append(popup);
  }

  Cart.prototype.closePopup = function (data) {

  }

  Cart.prototype.generateForm = function (data) {
    var form = document.createElement("form");
    form.setAttribute('method',"post");
    form.setAttribute('action',"#");

    for (const [key, value] of Object.entries(data)) {
      var div = document.createElement("div");
      // input text
      if (data[key].type == "text") {
        if (data[key]) {
          var input = document.createElement("input");
          input.type = "text";
          input.name = key;
          input.id = key;
          if (data[key].required) {
            input.required = data[key].required;
          }
          if (data[key].placeholder) {
            input.placeholder = data[key].placeholder;
          }
          if (data[key].label) {
            var input_label = document.createElement("Label");
            input_label.htmlFor = key;
            input_label.innerHTML = data[key].label;
            div.appendChild(input_label);
          };
          div.appendChild(input);
          form.appendChild(div);
        }
      } else if (data[key].type == "select") {
        // select options
        if (data[key]) {
          var select = document.createElement("select");
          select.id = key;
          if (data[key].required) {
            select.required = data[key].required;
          }
          for (var i = 0; i < data[key].options.length; i++) {
            var option = document.createElement("option");
            option.value = data[key].options[i];
            option.text = data[key].options[i];
            select.appendChild(option);
          }
          if (data[key].label) {
            var select_label = document.createElement("Label");
            select_label.htmlFor = key;
            select_label.innerHTML = data[key].label;
            div.appendChild(select_label);
          };
          div.appendChild(select);
          form.appendChild(div);
        }
      } else if (data[key].type == "number") {
        // number
        if (data[key]) {
          var input = document.createElement("input");
          input.type = "number";
          input.name = key;
          input.id = key;
          if (data[key].required) {
            input.required = data[key].required;
          }
          if (data[key].placeholder) {
            input.placeholder = data[key].placeholder;
          }
          if (data[key].label) {
            var input_label = document.createElement("Label");
            input_label.htmlFor = key;
            input_label.innerHTML = data[key].label;
            div.appendChild(input_label);
          };
          div.appendChild(input);
          form.appendChild(div);
        }
      } else if (data[key].type == "submit") {
        // number
        if (data[key]) {
          var input = document.createElement("button");
          input.type = "submit";
          input.name = key;
          input.id = key;
          input.innerHTML = data[key].label;
          div.appendChild(input);
          form.appendChild(div);
        }
      }
    }
    console.log(form);
    return form;
  }


  /**
   * 
   * @param {Object}   formData            the body of the request. This function doesn't control the body, it is upon the user to make sure that the body corresponds with the action.
   * @param {Enum  }   action              based on this.CART_REQUEST_TYPES
   * @param {Object}   callbacks
   * @param {Function} callbacks.onSuccess called on success.
   * @param {Function} callbacks.onFailure called on failure.
   * @param {Function} callbacks.always    called always. 
   */
  Cart.prototype.postShopify = function (formData, action, callbacks) {
    var self = this;
    var url = false;

    // Create a queue if it is not created yet.
    if (!Array.isArray(self.requestsQueue))
      self.requestsQueue = [];

    // Add the new request at the beginning of queue.
    const newRequest = {
      formData, action, callbacks
    }
    self.requestsQueue.unshift(newRequest);

    // Quit if we're processing a request, the new request is added to the queue and should be handled at its turn.
    if (self.isUpdating)
      return;

    // Replace the current request (queued at the end) with the next request in line.
    const currentRequest = self.requestsQueue.pop();
    formData  = currentRequest.formData;
    action    = currentRequest.action;
    callbacks = currentRequest.callbacks || {};
    
    if (!callbacks.onSuccess || typeof callbacks.onSuccess !== 'function')
      callbacks.onSuccess = function () {};
    if (!callbacks.onFailure || typeof callbacks.onFailure !== 'function')
      callbacks.onFailure = function () {};
    if (!callbacks.always || typeof callbacks.always !== 'function')
      callbacks.always = function () {};


           if (action == this.CART_REQUEST_TYPES.ADD) {
      url = '/cart/add.js';
    } else if (action == this.CART_REQUEST_TYPES.UPDATE) {
      url = '/cart/update.js';
    } else if (action == this.CART_REQUEST_TYPES.CHANGE) {
      url = '/cart/change.js';
    } else if (action == this.CART_REQUEST_TYPES.CLEAR) {
      url = '/cart/clear.js';
    }
    // Ignore request as it doesn't match any of the available actions
    // If there are still requests in the queue, handle the next in line.
    else if (self.requestsQueue.length) {
      const nextRequest = self.requestsQueue.pop();
      return self.postShopify(nextRequest.formData, nextRequest.action, nextRequest.callbacks);
    }
    // Otherwise, end execution.
    else
      return console.error(`Can't post to Shopify. The action: ${action} is not valid`);

    // Activate loader.
    self.updateLoaderVisibilityState(true);

    // Execute request
    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'xmlhttprequest'
      },
      body: JSON.stringify(formData)
    }).then(function (response) {
      if (response.ok)
        return response.json();
      throw Error(response.statusText);
    }).then(function (cart) {
      // logic moved to handleCartUpdates
      try {
        callbacks.onSuccess();
      } catch (e) {
        console.error("Error executing onSuccess callback from postShopify", e);
      }
    }).catch(function (error) {
      self.handleErrors(error);

      try {
        callbacks.onFailure();
      } catch (e) {
        console.error("Error executing onFailure callback from postShopify", e);
      }
    }).finally(function () {
      try {
        callbacks.always();
      } catch (e) {
        console.error("Error executing always callback from postShopify", e);
      }

      // Terminate loading.
      self.updateLoaderVisibilityState(false);

      // Handle next request if there are any in the queue.
      if (self.requestsQueue.length) {
        const nextRequest = self.requestsQueue.pop();
        return self.postShopify(nextRequest.formData, nextRequest.action);
      }
    });
  }

  /**
   * Calculates shipping fee.
   * Ref: https://shopify.dev/docs/themes/ajax-api/reference/cart#generate-shipping-rates
   *
   * @param {Object} address       Address | Ref: Shopify address
   * @param {Bool}   saveAsAddress Indicates whether the entered address should be saved locally as the customer's address. (Helps in pre-filling checkout later.)
   *                               PS: why wouldn't we save any way ? because the entered address could be a fallback address that is not entered by the customer.
   * @param {Bool}   callback      TODO: REMOVE
   */
  Cart.prototype.calculateShipping = function (address, saveAsAddress, callback) {
    // TODO - each module should specifiy if it requires shipping calculation
    if (!shipping_data.enabled)
      return;

    // Save entered address in the browser's local storage (to avoid double netr)
    if (saveAsAddress) {
      // TODO chck if address is saved on INIT.
      localStorage.setItem(shipping_data.storage_key, JSON.stringify(address));
      shipping_data.address = address;
    } else
      localStorage.setItem(shipping_data.storage_key, null);

    // Build URL.
    let qa = [];
    for (let key in address) {
      qa.push(`shipping_address[${key}]=${address[key]}`)
    }

    let queryStringParams = qa.length? '?' + qa.join('&'):'';

    let path = "/cart/shipping_rates.json";

    var req = fetch(path + queryStringParams, {
      method: 'POST',
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(function (d) {
      // Save shipping options in memory.
      // TODO
      if(d.shipping_rates && d.shipping_rates.length) {
        shipping_data.rates = d.shipping_rates;
      } else {
        shipping_data.rates = null;
      }


      if (typeof callback === 'function')
        callback(d.shipping_rates || "Couldn't fetch shipping rates.")

      // TODO
      // Update dependents
    })
    .catch(err => {
      console.error("Opps, something worng happened.", err);

      if (typeof callback === 'function')
        callback(d.shipping_rates || "Couldn't fetch shipping rates.")
    })
  }

  /******************************************/
  /* PRIVATE FUNCTIONS */
  /******************************************/
  const getSettings = async function () {
    var res = await fetch(PARAMS.JSON);
    return await res.json();
  }

  const fetchCart = async function (async) {
    var req = fetch(PARAMS.CART);

    if (async) {
      return req.then(response => response.json())
    } else {
      var res = await req;
      return await res.json();
    }
  }

  const httpInterceptor = function (urlmatchs, callback) {
    var responseMatchesAnyUrl = function (requestUrl, urls) {
      if (!Array.isArray(urls))
        urls = [urls];

      for (const url of urls) {
        if (!requestUrl.includes(url))
          continue;
        return true;
      }

      return false;
    }

    // Intercept fetch.
    const constantMock = window.fetch;
    window.fetch = function () {

      return new Promise((resolve, reject) => {
        constantMock.apply(this, arguments)
          .then(async (response) => {
            try {
              if (responseMatchesAnyUrl(response.url, urlmatchs) && response.type != "cors" && response.ok) {
                let json = await response.clone().json();
                if (typeof callback === "function")
                  callback(json, response.url);
              }
            } catch (err) {
              console.error("Something went wrong while intercepting cart update", err);
            }
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          })
      });
    }

    // Intercept Ajax.
    let send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener('readystatechange', function () {
        if (responseMatchesAnyUrl(this.responseURL, urlmatchs) && this.readyState === 4 && this.status == 200) {
          if (typeof callback === "function")
            callback(JSON.parse(this.response), this.responseURL);
        }
      }, false);
      send.apply(this, arguments);
    };

    // TODO: Listen to HTML form submits.
    // Intercept HTML Forms.
    document.addEventListener("submit", function (e) {
      // Valid the target.
      if(!e.target || e.target.tagName.toLowerCase() !== "form" || e.target.matches('[sz-no-block]')) return;
      // Validate the URL.
      var form = e.target;
      var actionUrl = new URL(form.action);
      var actionPath = actionUrl.pathname;
      if (!actionPath.includes('/cart'))
        return;

      const XHR = new XMLHttpRequest();
      const FD = new FormData( form );
      const self = this;
      // Define what happens on successful data submission
      XHR.addEventListener( "load", function(event) {
        self.updateCartVisibilityState(true);
      } );
      // Define what happens in case of error
      XHR.addEventListener( "error", function( event ) {
        console.log("Error submitting form", event);

        // Add a custom tag & resubmit the form in order to allow the site to handle the error.
        form.setAttribute('sz-no-block', "");
        form.submit();
      } );
      // Set up our request
      XHR.open( "POST", actionPath );
      // The data sent is what the user provided in the form
      XHR.send( FD );

      e.preventDefault();
    }.bind(this));
  }

  return Cart;

})();
