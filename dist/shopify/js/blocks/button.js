var block_type = block_type || {};

block_type.button = new (function () {

    var self;

    //Manage Button
    function ButtonManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(ButtonManager, generic_cart_block);

    ButtonManager.prototype.getHtml = function () {
      let data = generateRenderOptions();
      // commonsFilters.priceFormatter(total)

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.button, data);
    }

    ButtonManager.prototype.generateRenderOptions = () => {
      let block = this.settings;
      let cart = self.cartManager.getCopyOfCart();

      var options = {
        id: this.block_id,
        money_formats: this.money_formats,
        cartIsEmpty: cart.item_count == 0,
        title: block.configurations.title,
        url: block.configurations.url,
        width: block.configurations.width,
        button_align: block.configurations.button_align,
        active_hover: block.configurations.active_hover,
        text_bold: block.configurations.text_bold,
        text_align: block.configurations.text_align
      };

      return options;
    }

    return ButtonManager;
  })();
