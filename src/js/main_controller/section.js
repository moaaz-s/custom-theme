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
