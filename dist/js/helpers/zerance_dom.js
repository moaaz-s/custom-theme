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