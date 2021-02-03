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
