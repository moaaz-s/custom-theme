// TODO: CAREFUL ... calling a static function from featured_upsell will

var item_types = item_types || {}; 

item_types.featured_upsell = new (function () {
 
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
        this.cartManager.templatesSelectors.featured_upsell_item
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
    // A reward item can be detected by checking against the rewards class.
    Item.is = function (line_item, cart) {
      if (block_type && block_type.rewards && block_type.featured_upsell.isFeaturedUpsell(line_item))
        return 100000;
      return -1;
    }
  
    return Item;
})();