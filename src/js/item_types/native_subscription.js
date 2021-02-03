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