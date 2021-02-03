var block_type = block_type || {};

block_type.spacer = new (function () {

    function SpacerManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }

    toolBox.inheritPrototype(SpacerManager, generic_cart_block);

    SpacerManager.prototype.getHtml = function () {
      let data = {
        id: this.block_id,
        money_formats: self.money_formats,
        spacing: this.settings.configurations.spacing
      };

      return toolBox.renderTemplate(this.cartManager.templatesSelectors.spacer, data);
    }

    return SpacerManager;
  })();
