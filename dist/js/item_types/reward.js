// TODO: CAREFUL ... calling a static function from rewards will

var item_types = item_types || {}; 

item_types.reward = new (function () {
 
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
        this.cartManager.templatesSelectors.reward_item
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
      if (block_type && block_type.rewards && block_type.rewards.isRewardItem(line_item, line_item.variant_id))
        return 100000;
      return -1;
    }
  
    return Item;
})();