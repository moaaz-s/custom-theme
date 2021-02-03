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
