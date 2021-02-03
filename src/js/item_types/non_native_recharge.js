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
