var block_type = block_type || {};

block_type.icons = new (function () {

    var self;

    //Manage Icons
    function IconsManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(IconsManager, generic_cart_block);

    IconsManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();
      let data = generateRenderOptions(self.settings, cart);
      // commonsFilters.priceFormatter(total)

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.icons, data);
    }

    const generateRenderOptions = (block, cart) => {
      var options = {
        id: self.block_id,
        money_formats: self.money_formats,
        cartIsEmpty: cart.item_count == 0,
        numberPerRow: block.configurations.number_per_row,
        align: block.configurations.align,
        icons: self.settings.icons
      };

      return options;
    }

    return IconsManager;
  })();
