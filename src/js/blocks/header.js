var block_type = block_type || {};

block_type.header = new (function () {

    var self;

    //Manage Header
    function HeaderManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], true);
      self = this;
    }

    toolBox.inheritPrototype(HeaderManager, generic_cart_block);


    //TODO détail chaque settings pour template
    HeaderManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();

      let headerSettings = {
        id: self.block_id,
        money_formats: self.money_formats,
        cart_count: cart.item_count,
        display_cart_count: self.settings.configurations.display_cart_count,
        header_fixed: self.settings.configurations.header_fixed,
        title_position: self.settings.configurations.title_position,
        title: self.settings.configurations.title,
        button_close_display: self.settings.configurations.button_close_display
      };

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.header, headerSettings);
    }

    return HeaderManager;
  })();
