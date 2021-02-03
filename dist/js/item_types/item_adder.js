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