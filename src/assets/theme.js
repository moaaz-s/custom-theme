window.slate = window.slate || {};
window.theme = window.theme || {};

theme.globalVar = new function() {

  var settings = {
    headerSelector : '#shopify-section-header'
  };

  function globalVar() {
    updateGlobalVar();
    checkBrowserVersion();
    window.addEventListener('resize', function () {
      updateGlobalVar();
    });
  }

  function updateGlobalVar() {
    var windowWidth = window.innerWidth,
        headerSection = $(settings.headerSelector);

    document.documentElement.style.setProperty('--window-height', window.innerHeight + 'px');

    if (headerSection && headerSection.height()) {
      document.documentElement.style.setProperty('--header-height', headerSection.height() + 'px');
    }
    else {
      document.documentElement.style.setProperty('--header-height', '0px');
    }
  }

  function checkBrowserVersion() {
    var objappVersion = navigator.appVersion;
    var objAgent = navigator.userAgent;
    var objbrowserName = navigator.appName;
    var objfullVersion = ''+parseFloat(navigator.appVersion);
    var objBrMajorVersion = parseInt(navigator.appVersion,10);
    var objOffsetName,objOffsetVersion,ix;

    // In Chrome
    if ((objOffsetVersion=objAgent.indexOf("Chrome"))!=-1) {
      objbrowserName = "Chrome";
      objfullVersion = objAgent.substring(objOffsetVersion+7);
    }

    // In Microsoft internet explorer
    else if ((objOffsetVersion=objAgent.indexOf("MSIE"))!=-1) {
     objbrowserName = "Microsoft Internet Explorer";
     objfullVersion = objAgent.substring(objOffsetVersion+5);
    }

    // In Firefox
    else if ((objOffsetVersion=objAgent.indexOf("Firefox"))!=-1) {
      objbrowserName = "Firefox";
    }

    // In Safari
    else if ((objOffsetVersion=objAgent.indexOf("Safari"))!=-1) {
      objbrowserName = "Safari";
      objfullVersion = objAgent.substring(objOffsetVersion+7);
      if ((objOffsetVersion=objAgent.indexOf("Version"))!=-1)
        objfullVersion = objAgent.substring(objOffsetVersion+8);
    }

    // For other browser "name/version" is at the end of userAgent
    else if ( (objOffsetName=objAgent.lastIndexOf(' ')+1) < (objOffsetVersion=objAgent.lastIndexOf('/')) ) {
      objbrowserName = objAgent.substring(objOffsetName,objOffsetVersion); objfullVersion = objAgent.substring(objOffsetVersion+1);
      if (objbrowserName.toLowerCase()==objbrowserName.toUpperCase()) { objbrowserName = navigator.appName;
      }
    }

    // trimming the fullVersion string at semicolon/space if present
    if ((ix=objfullVersion.indexOf(";"))!=-1) objfullVersion=objfullVersion.substring(0,ix);
      if ((ix=objfullVersion.indexOf(" "))!=-1)
        objfullVersion=objfullVersion.substring(0,ix);
      objBrMajorVersion = parseInt(''+objfullVersion,10);
      if (isNaN(objBrMajorVersion)) {
        objfullVersion = ''+parseFloat(navigator.appVersion);
        objBrMajorVersion = parseInt(navigator.appVersion,10);
    }
    $('body').addClass(objbrowserName + objBrMajorVersion);
  }

  return globalVar;
}

var globalVar = new theme.globalVar();


/*================ Slate ================*/
/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 *
 *
 * @namespace a11y
 */

slate.a11y = {

  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element.first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element.first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on('click', function(evt) {
      this.pageLinkFocus($(evt.currentTarget.hash));
    }.bind(this));
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (options.$container[0] !== evt.target && !options.$container.has(evt.target).length) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  }
};

/**
 * Cart Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Cart template.
 *
 * @namespace cart
 */

slate.cart = {
  
  /**
   * Browser cookies are required to use the cart. This function checks if
   * cookies are enabled in the browser.
   */
  cookiesEnabled: function() {
    var cookieEnabled = navigator.cookieEnabled;

    if (!cookieEnabled){
      document.cookie = 'testcookie';
      cookieEnabled = (document.cookie.indexOf('testcookie') !== -1);
    }
    return cookieEnabled;
  }
};

/**
 * Utility helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions for dealing with arrays and objects
 *
 * @namespace utils
 */

slate.utils = {

  /**
   * Return an object from an array of objects that matches the provided key and value
   *
   * @param {array} array - Array of objects
   * @param {string} key - Key to match the value against
   * @param {string} value - Value to get match of
   */
  findInstance: function(array, key, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
  },

  /**
   * Remove an object from an array of objects by matching the provided key and value
   *
   * @param {array} array - Array of objects
   * @param {string} key - Key to match the value against
   * @param {string} value - Value to get match of
   */
  removeInstance: function(array, key, value) {
    var i = array.length;
    while(i--) {
      if (array[i][key] === value) {
        array.splice(i, 1);
        break;
      }
    }

    return array;
  },

  /**
   * _.compact from lodash
   * Remove empty/false items from array
   * Source: https://github.com/lodash/lodash/blob/master/compact.js
   *
   * @param {array} array
   */
  compact: function(array) {
    var index = -1;
    var length = array == null ? 0 : array.length;
    var resIndex = 0;
    var result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  },

  /**
   * _.defaultTo from lodash
   * Checks `value` to determine whether a default value should be returned in
   * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
   * or `undefined`.
   * Source: https://github.com/lodash/lodash/blob/master/defaultTo.js
   *
   * @param {*} value - Value to check
   * @param {*} defaultValue - Default value
   * @returns {*} - Returns the resolved value
   */
  defaultTo: function(value, defaultValue) {
    return (value == null || value !== value) ? defaultValue : value
  }
};

/**
 * Rich Text Editor
 * -----------------------------------------------------------------------------
 * Wrap iframes and tables in div tags to force responsive/scrollable layout.
 *
 * @namespace rte
 */

slate.rte = {
  /**
   * Wrap tables in a container div to make them scrollable when needed
   *
   * @param {object} options - Options to be used
   * @param {jquery} options.$tables - jquery object(s) of the table(s) to wrap
   * @param {string} options.tableWrapperClass - table wrapper class name
   */
  wrapTable: function(options) {
    var tableWrapperClass = typeof options.tableWrapperClass === "undefined" ? '' : options.tableWrapperClass;

    options.$tables.wrap('<div class="' + tableWrapperClass + '"></div>');
  },

  /**
   * Wrap iframes in a container div to make them responsive
   *
   * @param {object} options - Options to be used
   * @param {jquery} options.$iframes - jquery object(s) of the iframe(s) to wrap
   * @param {string} options.iframeWrapperClass - class name used on the wrapping div
   */
  wrapIframe: function(options) {
    var iframeWrapperClass = typeof options.iframeWrapperClass === "undefined" ? '' : options.iframeWrapperClass;

    options.$iframes.each(function() {
      // Add wrapper to make video responsive
      $(this).wrap('<div class="' + iframeWrapperClass + '"></div>');
      
      // Re-set the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      // Need to specifically target video and admin bar
      this.src = this.src;
    });
  }
};

slate.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:section:reorder', this._onReorder.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

slate.Sections.prototype = $.extend({}, slate.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (typeof constructor === 'undefined') {
      return;
    }

    var instance = $.extend(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (!instance) {
      return;
    }

    if (typeof instance.onUnload === 'function') {
      instance.onUnload(evt);
    }

    this.instances = slate.utils.removeInstance(this.instances, 'id', evt.detail.sectionId);
  },

  _onSelect: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (instance && typeof instance.onSelect === 'function') {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (instance && typeof instance.onDeselect === 'function') {
      instance.onDeselect(evt);
    }
  },

  _onReorder: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (instance && typeof instance.onReorder === 'function') {
      instance.onReorder(evt);
    }
  },

  _onBlockSelect: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (instance && typeof instance.onBlockSelect === 'function') {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    var instance = slate.utils.findInstance(this.instances, 'id', evt.detail.sectionId);

    if (instance && typeof instance.onBlockDeselect === 'function') {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(function(index, container) {
      this._createInstance(container, constructor);
    }.bind(this));
  }
});

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 */

slate.Currency = (function () {
  var moneyFormat = '${{amount}}';

  /**
   * Format money values based on your shop currency settings
   * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
   * or 3.00 dollars
   * @param  {String} format - shop money_format setting
   * @return {String} value - formatted value
   */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || moneyFormat);

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = slate.utils.defaultTo(precision, 2);
      thousands = slate.utils.defaultTo(thousands, ',');
      decimal = slate.utils.defaultTo(decimal, '.');

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsAmount = parts[1] ? (decimal + parts[1]) : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  };
})();

/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

slate.Image = (function() {

  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);

    if (match) {
      return match[1];
    } else {
      return null;
    }
  }

  /**
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === 'master') {
      return this.removeProtocol(src);
    }

    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

    if (match) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + '_' + size + suffix);
    } else {
      return null;
    }
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  return {
    preload: preload,
    loadImage: loadImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  };
})();

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist. Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

slate.Variants = (function() {

  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
  }

  Variants.prototype = $.extend({}, Variants.prototype, {

    /**
     * Get the currently selected options from add-to-cart form. Works with all
     * form input elements.
     *
     * @return {array} options - Values of currently selected variants
     */
    _getCurrentOptions: function() {
      var currentOptions = $.map($(this.singleOptionSelector, this.$container), function(element) {
        var $element = $(element);
        var type = $element.attr('type');
        var currentOption = {};

        if (type === 'radio' || type === 'checkbox') {
          if ($element[0].checked) {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          } else {
            return false;
          }
        } else {
          currentOption.value = $element.val();
          currentOption.index = $element.data('index');
          return currentOption;
        }
      });
      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = slate.utils.compact(currentOptions);

      updateSwatchVariant(variant);

      return currentOptions;
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selectedValues - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function() {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;
      var found = false;

      variants.forEach(function(variant) {
        var satisfied = true;

        selectedValues.forEach(function(option) {
          if (satisfied) {
            satisfied = (option.value === variant[option.index]);
          }
        });

        if (satisfied) {
          found = variant;
        }
      });

      return found || null;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onSelectChange: function() {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: 'variantChange',
        variant: variant
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }

      updateSwatchVariant(variant);

    },

    /**
     * Trigger event when variant image changes
     *
     * @param  {object} variant - Currently selected variant
     * @return {event}  variantImageChange
     */
    _updateImages: function(variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
        return;
      }

      this.$container.trigger({
        type: 'variantImageChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function(variant) {
      if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
        return;
      }

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    /**
     * Update history state for product deeplinking
     *
     * @param {object} variant - Currently selected variant
     */
    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
      window.history.replaceState({path: newurl}, '', newurl);
    },

    /**
     * Update hidden master select of variant change
     *
     * @param {object} variant - Currently selected variant
     */
    _updateMasterSelect: function(variant) {
      $(this.originalSelectorId, this.$container)[0].value = variant.id;
    }
  });

  function updateSwatchVariant(variant) {
    // BEGIN SWATCHES
    if (variant) {
      var form = jQuery('form[action="/cart/add"]');
      for (var i=0,length=variant.options.length; i<length; i++) {
        var radioButton = form.find('.swatch[data-option-index="' + i + '"] :radio[value="' + variant.options[i] +'"]');
        if (radioButton && radioButton.get(0)) {
          radioButton.get(0).checked = true;
        }
      }
    }
    // END SWATCHES
  }

  return Variants;
})();

 
/*================ General ================*/
// Inspiration: https://www.w3.org/TR/wai-aria-practices/examples/accordion/js/accordion.js
// feature: data-allow-toggle
// Allow for each toggle to both open and close its section. Makes it possible for all sections to be closed. Assumes only one section may be open.

// feature: data-allow-multiple
// Allow for multiple accordion sections to be expanded at the same time. Assumes data-allow-toggle otherwise the toggle on open sections would be disabled.
// __________

// Ex:
// Parent
// <div id="accordionGroup" data-accordion>
// <div id="accordionGroup" data-accordion data-allow-multiple>
// <div id="accordionGroup" data-accordion data-allow-toggle></div>
//  Question
// <div data-accordion-trigger aria-expanded="true / false" aria-controls="#faq-group-{{- id -}}-{{- forloop.index -}}">
// Answer
// <div id="faq-group-{{- id -}}-{{- forloop.index -}}" data-accordion-panel>


theme.accordion = (function () {
    'use strict';

    var selectors = {
        root   : "[data-accordion]",
        trigger: "[data-accordion-trigger]",
        panel  : "[data-accordion-panel]"
    }

    var features = {
        allow_multiple : "[data-allow-multiple]",
        allow_toggle   : "[data-allow-toggle]"
    }

    var data = {
        target_id: 'aria-controls'
    }

    var states = {
        expanded: {
            attr_name: 'aria-expanded',
            attr_values : {
                yes: "true",
                no:  "false"
            }
        },
        disabled: {
            attr_name: 'aria-disabled',
            attr_values : {
                yes: "true",
                no:  "false"
            }
        }
    }

    $(selectors.root).each(function () {
        var $accordion = $(this);
        init($accordion);
    });

    function init ($accordion) {
        var allowsMultiple = $accordion.is(features.allow_multiple);
        var options = {
            allowsMultiple: allowsMultiple,
            allowToggle: (allowsMultiple) ? allowsMultiple : $accordion.is(features.allow_toggle)
        }

        $accordion.on("click", selectors.trigger, function (e) {
            e.preventDefault();
            trigger($(this), $accordion, options);
        });

        $accordion.on('keydown', function (e) {
            handleKeyboard(event, $(this), options);
        });

        if (!options.allowToggle) {
            // Get the first expanded/ active accordion
            var $expanded = $accordion.find('[aria-expanded="true"]').first();

            // If an expanded/ active accordion is found, disable
            if ($expanded.length) {
                $expanded.setAttribute(states.disabled.attr_name, states.disabled.attr_values.yes);
            }
        } else {
            // Get all unexpanded accordion panels
            var $unexpanded = $accordion.find('[aria-expanded="false"]');
            $unexpanded.each(function () {
                var panelId = $(this).attr('aria-controls');
                hidePanel ($(panelId))
            })
        }
    }

    function trigger ($trigger, $accordion, options) {
        var settings = {
            allowsMultiple: options.allowsMultiple,
            allowToggle   : options.allowToggle
        };

        var $targetPanel = $($trigger.attr(data.target_id));

        var isExpanded = $trigger.is("[" + states.expanded.attr_name + "='" + states.expanded.attr_values.yes + "']");
        var $accordionActiveTriggers = $accordion.find("[" + states.expanded.attr_name + "='" + states.expanded.attr_values.yes + "']");
        var $accordionActivePanels = $accordion.find(selectors.panel);

        if (!settings.allowsMultiple && $accordionActiveTriggers.length > 0) {
            // Set the expanded state on the triggering element
            $accordionActiveTriggers.not($trigger).attr(states.expanded.attr_name, states.expanded.attr_values.no);
            // Hide the accordion sections, using aria-controls to specify the desired section
            hidePanel($accordionActivePanels.not($targetPanel));

            // When toggling is not allowed, clean up disabled state
            if (!settings.allowToggle) {
                $accordionActiveTriggers.removeAttr(states.disabled.attr_name);
            }
        }

        if (!isExpanded) {
            // Set the expanded state on the triggering element
            $trigger.attr(states.expanded.attr_name, states.expanded.attr_values.yes);
            // Hide the accordion sections, using aria-controls to specify the desired section
            reveilPanel($targetPanel);

            // If toggling is not allowed, set disabled state on trigger
            if (!settings.allowToggle) {
                $trigger.attr(states.disabled.attr_name, states.disabled.attr_values.yes);
            }
        }
        else if (settings.allowToggle && isExpanded) {
            // Set the expanded state on the triggering element
            $trigger.attr(states.expanded.attr_name, states.expanded.attr_values.no);
            // Hide the accordion sections, using aria-controls to specify the desired section
            hidePanel($targetPanel);
        }
    }

    function reveilPanel ($panel) {
        $panel.slideDown();// .removeClass('hide');
    }

    function hidePanel ($panel) {
        $panel.slideUp(); //.addClass('hide');
    }

    function handleKeyboard (event, $accordion, options) {}
})();

// TODO LATER : use accordion with shortcuts (keyboard)
// Array.prototype.slice.call(document.querySelectorAll('.Accordion')).forEach(function (accordion) {

//     // Allow for multiple accordion sections to be expanded at the same time
//     var allowMultiple = accordion.hasAttribute('data-allow-multiple');
//     // Allow for each toggle to both open and close individually
//     var allowToggle = (allowMultiple) ? allowMultiple : accordion.hasAttribute('data-allow-toggle');

//     // Create the array of toggle elements for the accordion group
//     var triggers = Array.prototype.slice.call(accordion.querySelectorAll('.Accordion-trigger'));
//     var panels = Array.prototype.slice.call(accordion.querySelectorAll('.Accordion-panel'));


//     accordion.addEventListener('click', function (event) {
//         var target = event.target;

//         if (target.classList.contains('Accordion-trigger')) {
//             // Check if the current toggle is expanded.
//             var isExpanded = target.getAttribute('aria-expanded') == 'true';
//             var active = accordion.querySelector('[aria-expanded="true"]');

//             // without allowMultiple, close the open accordion
//             if (!allowMultiple && active && active !== target) {
//                 // Set the expanded state on the triggering element
//                 active.setAttribute('aria-expanded', 'false');
//                 // Hide the accordion sections, using aria-controls to specify the desired section
//                 document.getElementById(active.getAttribute('aria-controls')).setAttribute('hidden', '');

//                 // When toggling is not allowed, clean up disabled state
//                 if (!allowToggle) {
//                 active.removeAttribute('aria-disabled');
//                 }
//             }

//             if (!isExpanded) {
//                 // Set the expanded state on the triggering element
//                 target.setAttribute('aria-expanded', 'true');
//                 // Hide the accordion sections, using aria-controls to specify the desired section
//                 document.getElementById(target.getAttribute('aria-controls')).removeAttribute('hidden');

//                 // If toggling is not allowed, set disabled state on trigger
//                 if (!allowToggle) {
//                 target.setAttribute('aria-disabled', 'true');
//                 }
//             }
//             else if (allowToggle && isExpanded) {
//                 // Set the expanded state on the triggering element
//                 target.setAttribute('aria-expanded', 'false');
//                 // Hide the accordion sections, using aria-controls to specify the desired section
//                 document.getElementById(target.getAttribute('aria-controls')).setAttribute('hidden', '');
//             }

//             event.preventDefault();
//         }
//     });

//     // Bind keyboard behaviors on the main accordion container
//     accordion.addEventListener('keydown', function (event) {
//         var target = event.target;
//         var key = event.which.toString();

//         var isExpanded = target.getAttribute('aria-expanded') == 'true';
//         var allowToggle = (allowMultiple) ? allowMultiple : accordion.hasAttribute('data-allow-toggle');

//         // 33 = Page Up, 34 = Page Down
//         var ctrlModifier = (event.ctrlKey && key.match(/33|34/));

//         // Is this coming from an accordion header?
//         if (target.classList.contains('Accordion-trigger')) {
//         // Up/ Down arrow and Control + Page Up/ Page Down keyboard operations
//         // 38 = Up, 40 = Down
//         if (key.match(/38|40/) || ctrlModifier) {
//             var index = triggers.indexOf(target);
//             var direction = (key.match(/34|40/)) ? 1 : -1;
//             var length = triggers.length;
//             var newIndex = (index + length + direction) % length;

//             triggers[newIndex].focus();

//             event.preventDefault();
//         }
//         else if (key.match(/35|36/)) {
//             // 35 = End, 36 = Home keyboard operations
//             switch (key) {
//             // Go to first accordion
//             case '36':
//                 triggers[0].focus();
//                 break;
//                 // Go to last accordion
//             case '35':
//                 triggers[triggers.length - 1].focus();
//                 break;
//             }
//             event.preventDefault();

//         }

//         }
//     });

//     // These are used to style the accordion when one of the buttons has focus
//     accordion.querySelectorAll('.Accordion-trigger').forEach(function (trigger) {

//         trigger.addEventListener('focus', function (event) {
//         accordion.classList.add('focus');
//         });

//         trigger.addEventListener('blur', function (event) {
//         accordion.classList.remove('focus');
//         });

//     });

//     // Minor setup: will set disabled state, via aria-disabled, to an
//     // expanded/ active accordion which is not allowed to be toggled close
//     if (!allowToggle) {
//         // Get the first expanded/ active accordion
//         var expanded = accordion.querySelector('[aria-expanded="true"]');

//         // If an expanded/ active accordion is found, disable
//         if (expanded) {
//         expanded.setAttribute('aria-disabled', 'true');
//         }
//     }

// });

theme.tabs = new function () {
    var selectors = {
        container   : ".tab",
        buttons_bar : ".tab__buttons",
        buttons     : ".tab__buttons__single",
        content     : ".tab__content"
    };

    var modifierClasses = {
        // active_button  : "tab__buttons--overlay-active",
        active_button  : "tab__buttons__single--active",
        active_content : "tab__content--active"
    }

    function tabs () {
        var $tabs = $(selectors.container);
        if (!$tabs.length) return;

        // init tabs
        $tabs.each(function () {
            init($(this));
        });

        return this;
    }

    function init($tab) {
        // Get active tab button
        var $activeButton  = false;
        var $tabButtons    = $tab.find(selectors.buttons);
        var $activeButtons = $tabButtons.is("." + modifierClasses.active_button);

        // if no tab buttons exist, exit.
        if (!$tabButtons.length) return;

        // if active buttons found: select first, else, assign first button as active
        if ($activeButtons.length)
            $activeButton = $activeButtons.first();
        else
            $activeButton = $tabButtons.first();

        // setup listners
        $tab.on('click', selectors.buttons, function () {
            var $button = $(this);
            if ($button.hasClass(modifierClasses.active_button))
                return;

            return open($button);
        });

        open($activeButton);

        // check length
        if ($(selectors.buttons_bar).length > $(window).length)
            $(selectors.buttons_bar).addClass(modifierClasses.active_button);
    }

    function open($activeButton) {
        var $tab      = $activeButton.closest(selectors.container);
        var $buttons  = $tab.find(selectors.buttons);
        var $contents = $tab.find(selectors.content);

        // Rest buttons / content
        $buttons.attr("tabindex", -1);

        $buttons.removeClass(modifierClasses.active_button);
        $contents
            .removeClass(modifierClasses.active_content)
            .hide();

        // Select buttons / content
        var contentId = $activeButton.attr('aria-controls');
        var $activeContent = $('#' + contentId);
        $activeButton.addClass(modifierClasses.active_button);
        $activeContent
            .addClass(modifierClasses.active_content)
            .fadeIn(300);

        $activeButton.attr("tabindex", 0);
    }

    return tabs;
}

theme.Filters = (function() {
    var constants = {
      SORT_BY: 'sort_by'
    };

    var selectors = {
      mainContent    : '#MainCollectionContent',
      sortSelection  : '#SortBy',
      filterTag      : '[data-filter-tag]'
    };

    var data = {
      sortBy: 'data-default-sortby'
    };

    var _sectionSettings = {};

    function Filters(container) {
      var $container = (this.$container = $(container));
      this._sectionSettings = $container.data("sectionSettings") || {};

      this.initSort();
      this.initFilters();
    }

    Filters.prototype.initSort = function () {
      this.defaultSort = this._sectionSettings.sortBy;
      this.$sortSelect = $(selectors.sortSelection, this.$container);
      this.$sortSelect.on('change', this._onSortChange.bind(this));
    }

    Filters.prototype.initFilters = function () {
        this.$container.on('click', selectors.filterTag, this._onFilterChange.bind(this));
    }

    Filters.prototype._onFilterChange = function() {
        // var filter = this._getFilterValue();

        // // remove the 'page' parameter to go to the first page of results
        // var search = document.location.search.replace(/\?(page=\w+)?&?/, '');

        // // only add the search parameters to the url if they exist
        // search = search !== '' ? '?' + search : '';

        // document.location.href = filter + search + selectors.mainContent;

        window.location.href = this._buildUrl();
    };

    Filters.prototype._buildFiltersUrlPart = function () {
        var filtersUrlPart = '';
        this.$container.find(selectors.filterTag).each (function () {
            if (!$(this).is(':checked')) return;

            var tagHandle = $(this).val();
            if (filtersUrlPart == '')
                filtersUrlPart = tagHandle;
            else
                filtersUrlPart += '+' + tagHandle;
        });

        return filtersUrlPart;
    };

    Filters.prototype._onSortChange = function() {
        // var sort = this._sortQuery();
        // var url = window.location.href.replace(window.location.search, '');
        // var queryStringValue = slate.utils.getParameterByName('q');
        // var query = queryStringValue !== null ? queryStringValue : '';

        // if (sort.length) {
        //     var urlStripped = url.replace(window.location.hash, '');
        //     query = query !== '' ? '?q=' + query + '&' : '?';

        //     window.location.href =
        //     urlStripped + query + sort + selectors.mainContent;
        // } else {
        //     // clean up our url if the sort value is blank for default
        //     window.location.href = url;
        // }

        window.location.href = this._buildUrl();
    };

    Filters.prototype._getSortValue = function() {
        return this.$sortSelect.val() || this.defaultSort;
    };

    Filters.prototype._sortQuery = function() {
        var sort = this._getSortValue();
        var query = '';

        if (sort !== this.defaultSort) {
            query = constants.SORT_BY + '=' + sort;
        }

        return query;
    };

    Filters.prototype._buildUrl = function() {
        var baseUrl = this._sectionSettings.collectionUrl;
        var filters = this._buildFiltersUrlPart();
        var sort = this._sortQuery();

        return baseUrl + (filters === ''?'':'/'+filters) + (sort === ''?'':'?'+sort) + selectors.mainContent;
    };

    return Filters;
  })();
  



/*================ Sections ================*/
/**
 * Product Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Product template.
 *
   * @namespace product
 */

theme.Product = (function() {

  var selectors = {
    addToCart: '[data-add-to-cart]',
    addToCartText: '[data-add-to-cart-text]',
    comparePrice: '[data-compare-price]',
    comparePriceText: '[data-compare-text]',
    originalSelectorId: '[data-product-select]',
    priceWrapper: '[data-price-wrapper]',
    productFeaturedImage: '[data-product-featured-image]',
    productJson: '[data-product-json]',
    productPrice: '[data-product-price]',
    productThumbs: '[data-product-single-thumbnail]',
    singleOptionSelector: '[data-single-option-selector]'
  };

  /**
   * Product section constructor. Runs on page load as well as Theme Editor
   * `section:load` events.
   * @param {string} container - selector for the section container DOM element
   */
  function Product(container) {
    this.$container = $(container);

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$(selectors.productJson, this.$container).html()) {
      return;
    }

    var sectionId = this.$container.attr('data-section-id');
    this.productSingleObject = JSON.parse($(selectors.productJson, this.$container).html());

    var options = {
      $container: this.$container,
      enableHistoryState: this.$container.data('enable-history-state') || false,
      singleOptionSelector: selectors.singleOptionSelector,
      originalSelectorId: selectors.originalSelectorId,
      product: this.productSingleObject
    };

    this.settings = {};
    this.namespace = '.product';
    this.variants = new slate.Variants(options);
    this.$featuredImage = $(selectors.productFeaturedImage, this.$container);

    this.$container.on('variantChange' + this.namespace, this.updateAddToCartState.bind(this));
    this.$container.on('variantPriceChange' + this.namespace, this.updateProductPrices.bind(this));

    if (this.$featuredImage.length > 0) {
      this.settings.imageSize = slate.Image.imageSize(this.$featuredImage.attr('src'));
      slate.Image.preload(this.productSingleObject.images, this.settings.imageSize);

      this.$container.on('variantImageChange' + this.namespace, this.updateProductImage.bind(this));
    }
  }

  Product.prototype = $.extend({}, Product.prototype, {

    /**
     * Updates the DOM state of the add to cart button
     *
     * @param {boolean} enabled - Decides whether cart is enabled or disabled
     * @param {string} text - Updates the text notification content of the cart
     */
    updateAddToCartState: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(selectors.priceWrapper, this.$container).removeClass('hide');
      } else {
        $(selectors.addToCart, this.$container).prop('disabled', true);
        $(selectors.addToCartText, this.$container).html(theme.strings.unavailable);
        $(selectors.priceWrapper, this.$container).addClass('hide');
        return;
      }

      if (variant.available) {
        $(selectors.addToCart, this.$container).prop('disabled', false);
        $(selectors.addToCartText, this.$container).html(theme.strings.addToCart);
      } else {
        $(selectors.addToCart, this.$container).prop('disabled', true);
        $(selectors.addToCartText, this.$container).html(theme.strings.soldOut);
      }
    },

    /**
     * Updates the DOM with specified prices
     *
     * @param {string} productPrice - The current price of the product
     * @param {string} comparePrice - The original price of the product
     */
    updateProductPrices: function(evt) {
      var variant = evt.variant;
      var $comparePrice = $(selectors.comparePrice, this.$container);
      var $compareEls = $comparePrice.add(selectors.comparePriceText, this.$container);

      $(selectors.productPrice, this.$container)
        .html(slate.Currency.formatMoney(variant.price, theme.moneyFormat));

      if (variant.compare_at_price > variant.price) {
        $comparePrice.html(slate.Currency.formatMoney(variant.compare_at_price, theme.moneyFormat));
        $compareEls.removeClass('hide');
      } else {
        $comparePrice.html('');
        $compareEls.addClass('hide');
      }
    },

    /**
     * Updates the DOM with the specified image URL
     *
     * @param {string} src - Image src URL
     */
    updateProductImage: function(evt) {
      var variant = evt.variant;
      var sizedImgUrl = slate.Image.getSizedImageUrl(variant.featured_image.src, this.settings.imageSize);

      this.$featuredImage.attr('src', sizedImgUrl);
    },

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    onUnload: function() {
      this.$container.off(this.namespace);
    }
  });

  return Product;
})();


/** swatch color **/

if ($('body').hasClass('template-product')) {
  jQuery(function() {
    jQuery('.swatch :radio').change(function() {
      var optionIndex = jQuery(this).closest('.swatch').attr('data-option-index');
      var optionValue = jQuery(this).val();
      jQuery(this)
        .closest('form')
        .find('[data-single-option-selector]')
        .eq(optionIndex)
        .val(optionValue)
        .trigger('change');
    });
  });

  /** update swatch with current variant **/
  if (variant) {
    var form = jQuery('form[action="/cart/add"]');
    for (var i=0,length=variant.options.length; i<length; i++) {
      var radioButton = form.find('.swatch[data-option-index="' + i + '"] :radio[value="' + variant.options[i] +'"]');
      if (radioButton.lenth && radioButton.lenth != 0) {
        radioButton.get(0).checked = true;
      }
    }
  }
}

/** header **/

theme.header = new function() {

  var settings = {};
  var lastScrollTop = 0;

  function header(headerSettings) {

    // init default settings
    var defaultSettings = {
      headerId : "shopify-section-header",
      headerSelector : '.header',
      headerTransparent : 'header--transparent',
      toggleSideNav : '[data-header-toggle]',
      sideNavSelector : '[data-header-side-nav]',
      openSideNavClass : 'active',
      sideNavSubmenu : '[data-submenu]'
    };

    // merge settings
    settings = $.extend({}, defaultSettings, headerSettings);

    $(settings.toggleSideNav).on('click', function() {
      toggleSideNav();
    });

    updateHeader();
    $(window).scroll(function(){
      updateHeader();
    });

    $(settings.sideNavSubmenu).on('click', function(){
      $(this).toggleClass('active');
      $(this).next().slideToggle();
    })
  }

  function openSideNav() {
    $(settings.headerSelector).addClass('side-nav-open');
    $(settings.sideNavSelector).addClass(settings.openSideNavClass);
  }

  function closeSideNav() {
    $(settings.headerSelector).removeClass('side-nav-open');
    $(settings.sideNavSelector).removeClass(settings.openSideNavClass);
  }

  function toggleSideNav() {
    if ($(settings.sideNavSelector).hasClass(settings.openSideNavClass))
      closeSideNav();
    else
      openSideNav();
  }

  function updateHeader() {
    if ($(window).scrollTop() > 300) {
      var st = $(window).scrollTop();
      if (st > lastScrollTop){
        $('.header__main-menu .header__menu-items').removeClass('active');
      } else {
        $('.header__main-menu .header__menu-items').addClass('active');
      }
      lastScrollTop = st;
      }
    else {
      $('.header__main-menu .header__menu-items').addClass('active');
    }
  }

  return header;
}

var header = new theme.header();

theme.banner = new function() {

  var settings = {};

  function banner(bannerSettings) {

    var defaultSettings = {
      headerSelector : '#shopify-section-header',
      bannerSelector : '[data-banner]',
      selectorData : 'banner',
      prevNextButtons : false,
      pageDots : false
    };

    $(document).ready(function(){
      resizeWindow();
    });

    window.addEventListener('resize', function () {
      resizeWindow();
    });

    settings = $.extend({}, defaultSettings, bannerSettings);

    $(settings.bannerSelector).each(function() {

      var el = $(this);

      $(this).imagesLoaded( function() {
        var elementSettings = $(el).data(settings.selectorData);
        var finalSettings = $.extend({}, settings, elementSettings);

        $(el).flickity({
          lazyLoad: 'true',
          pageDots: finalSettings.pageDots,
          prevNextButtons: finalSettings.prevNextButtons
        });
      });

    });
  }

  function resizeWindow() {
    var windowWidth = window.innerWidth,
        headerSection = $(settings.headerSelector);

    document.documentElement.style.setProperty('--window-height', window.innerHeight + 'px');
    if (headerSection && headerSection.height()) {
      document.documentElement.style.setProperty('--header-height', headerSection.height() + 'px');
    }
    else {
      document.documentElement.style.setProperty('--header-height', '0px');
    }
  };

  return banner;
}

var banner = new theme.banner();

theme.cart = new function() {

  var settings = {};

  function cart(cartSettings) {

    // init default settings
    var defaultSettings = {
      openCartSelector : "[data-cart-open]",
      toggleCartSelector : "[data-cart-toggle]",
      closeCartSelector : "[data-cart-close]",
      cartSelector : "[data-side-cart]",
      cartItemSelector : '[data-cart-item]',
      cartItemsSelector : '[data-cart-items]',
      cartItemRemoveSelector : '[data-cart-item-remove]',
      cartTotalPriceSelector : '[data-cart-total-price]',
      cartFooterSelector : '[data-cart-footer]',
      updateCartSelector : '[data-add-to-cart]',
      backgroundSelector : "[data-cart-background-overlay]",
      openCartClass : 'open',
      activeBackgroundClass : "active",
      emptyCartText : '<div class="cart__empty-state heading z-h2">Votre panier est vide</div>',
      headerSelector : '.header',
      headerNotLight : 'not-light'
    };
    // merge settings
    settings = $.extend({}, defaultSettings, cartSettings);

    // init cart
    $(document).on('cart.ready', function(event, cart) {
      //console.log('cart ready cart');
      constructCart(cart, false);
    });

    // call classic function on click on trigger elemets
    $(settings.toggleCartSelector).on('click', function() {
      toggleCart();
      return false;
    });

    $('body').on('click', settings.closeCartSelector, function() {
      closeCart();
      return false;
    });

    $(settings.openCartSelector).on('click', function() {
      openCart();
      return false;
    });

    $(document).on('cart.requestComplete', function(event, cart) {
        constructCart(cart, true);
    });
  }

  function getPrice(price, cart) {
    var price = Number(price / 100).toFixed(2);
    if (cart.currency == "EUR")
      return price + "€";
    else
      return price + "$";
  }

  function constructCart(cart, open) {
    // create elemets
    var contexts = [];
    var context = {};
    var c = null;
    var final_html = "";
    var source = "";
    var template = null;

    for(var i=0, l=cart.items.length; i<l; i++) {
      c = cart.items[i];
      var context = {
        item_image : c.image,
        item_variant_title : c.variant_title,
        item_variant_id : c.variant_id,
        item_product_title : c.product_title,
        item_price : getPrice(c.price, cart),
        item_quantity : c.quantity,
        item_quantity_plus : c.quantity + 1,
        item_quantity_minus : c.quantity - 1,
        item_line_price : getPrice(c.line_price, cart),
        item_url :  c.url
      };
      source = $(settings.cartItemSelector).html();
      template = Handlebars.compile(source);
      html = template(context);
      final_html += html;
    }

    $(settings.cartTotalPriceSelector).html(getPrice(cart.total_price, cart));

    if (cart.items.length > 0) {
      $(settings.cartItemsSelector).html(final_html);
    }
    else {
      $(settings.cartItemsSelector).html(settings.emptyCartText);
    }

    if (open)
      openCart();
  }

  function openCart() {

    if ($('body').hasClass('template-cart')) return;

    $(settings.cartSelector).addClass(settings.openCartClass);
    $(settings.backgroundSelector).addClass(settings.activeBackgroundClass);
    $(settings.headerSelector).addClass(settings.headerNotLight);
  }

  function closeCart() {
    $(settings.cartSelector).removeClass(settings.openCartClass);
    $(settings.backgroundSelector).removeClass(settings.activeBackgroundClass);
    $(settings.headerSelector).removeClass(settings.headerNotLight);
    if ($('body').hasClass('template-cart'))
      window.location.href = "/";

  }

  function toggleCart() {
    if ($(settings.cartSelector).hasClass(settings.openCartClass))
      closeCart();
    else
      openCart();
  }

  return cart;
}

var cart = new theme.cart();


/*================ Templates ================*/
/**
 * Customer Addresses Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Customer Addresses
 * template.
 *
 * @namespace customerAddresses
 */

theme.customerAddresses = (function() {
  var $newAddressForm = $('#AddressNewForm');

  if (!$newAddressForm.length) {
    return;
  }

  // Initialize observers on address selectors, defined in shopify_common.js
  if (Shopify) {
    new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
      hideElement: 'AddressProvinceContainerNew'
    });
  }

  // Initialize each edit form's country/province selector
  $('.address-country-option').each(function() {
    var formId = $(this).data('form-id');
    var countrySelector = 'AddressCountry_' + formId;
    var provinceSelector = 'AddressProvince_' + formId;
    var containerSelector = 'AddressProvinceContainer_' + formId;

    new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
      hideElement: containerSelector
    });
  });

  // Toggle new/edit address forms
  $('.address-new-toggle').on('click', function() {
    $newAddressForm.toggleClass('hide');
  });

  $('.address-edit-toggle').on('click', function() {
    var formId = $(this).data('form-id');
    $('#EditAddress_' + formId).toggleClass('hide');
  });

  $('.address-delete').on('click', function() {
    var $el = $(this);
    var formId = $el.data('form-id');
    var confirmMessage = $el.data('confirm-message');
    if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
      Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
    }
  });
})();

/**
 * Password Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Password template.
 *
 * @namespace password
 */

theme.customerLogin = (function() {
  var config = {
    recoverPasswordForm: '#RecoverPassword',
    hideRecoverPasswordLink: '#HideRecoverPasswordLink'
  };

  if (!$(config.recoverPasswordForm).length) {
    return;
  }

  checkUrlHash();
  resetPasswordSuccess();

  $(config.recoverPasswordForm).on('click', onShowHidePasswordForm);
  $(config.hideRecoverPasswordLink).on('click', onShowHidePasswordForm);

  function onShowHidePasswordForm(evt) {
    evt.preventDefault();
    toggleRecoverPasswordForm();
  }

  function checkUrlHash() {
    var hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      toggleRecoverPasswordForm();
    }
  }

  /**
   *  Show/Hide recover password form
   */
  function toggleRecoverPasswordForm() {
    $('#RecoverPasswordForm').toggleClass('hide');
    $('#CustomerLoginForm').toggleClass('hide');
  }

  /**
   *  Show reset password success message
   */
  function resetPasswordSuccess() {
    var $formState = $('.reset-password-success');

    // check if reset password form was successfully submited.
    if (!$formState.length) {
      return;
    }

    // show success message
    $('#ResetSuccess').removeClass('hide');
  }
})();


$(document).ready(function() {
  var sections = new slate.Sections();
  sections.register('product', theme.Product);

  // Common a11y fixes
  slate.a11y.pageLinkFocus($(window.location.hash));

  $('.in-page-link').on('click', function(evt) {
    slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
  });

  // Target tables to make them scrollable
  var tableSelectors = '.rte table';

  slate.rte.wrapTable({
    $tables: $(tableSelectors),
    tableWrapperClass: 'rte__table-wrapper',
  });

  // Target iframes to make them responsive
  var iframeSelectors =
    '.rte iframe[src*="youtube.com/embed"],' +
    '.rte iframe[src*="player.vimeo"]';

  slate.rte.wrapIframe({
    $iframes: $(iframeSelectors),
    iframeWrapperClass: 'rte__video-wrapper'
  });

  // Apply a specific class to the html element for browser support of cookies.
  if (slate.cart.cookiesEnabled()) {
    document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');
  }
});
