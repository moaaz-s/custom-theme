var block_type = block_type || {};

block_type.image = new (function () {

    function Block (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], false);
    }
  
    toolBox.inheritPrototype(Block, generic_cart_block);
  
    Block.prototype.getHtml = function () {
      let data = {
        id: this.block_id,
        money_formats: this.money_formats,
        src: this.settings.configurations.src,
        nature: this.settings.configurations.nature,
        crop : this.settings.configurations.crop, 
        full_width: this.settings.configurations.full_width
      };
  
      return toolBox.renderTemplate(this.cartManager.templatesSelectors.image, data);
    }
  
    return Block;
  })();