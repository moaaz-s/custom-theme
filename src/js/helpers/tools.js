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
