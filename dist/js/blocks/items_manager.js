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
