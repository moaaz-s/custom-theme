var block_type = block_type || {};

block_type.richtext = new (function () {

    //Manage Richtext
    function RichtextManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }
  
    toolBox.inheritPrototype(RichtextManager, generic_cart_block);
  
    RichtextManager.prototype.getHtml = function () {
      let richtextSettings = {
        id: this.block_id,
        settings: this.settings,
        money_formats: self.money_formats,
      };
  
      return toolBox.renderTemplate(this.cartManager.templatesSelectors.richtext, richtextSettings);
    }
  
    return RichtextManager;
  })();