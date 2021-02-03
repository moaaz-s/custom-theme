var block_type = block_type || {};

block_type.upsell = new (function () {

    //Manage upsell
    function Block (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], true);
 
      this.title                 = toolBox.getProp(block, "configurations.title", "");
      this.search_term           = toolBox.getProp(block, "configurations.search_term", "");
      this.style                 = toolBox.getProp(block, "configurations.style", "slider");
      this.products_per_row      = Math.max(toolBox.getProp(block, "configurations.products_per_row", 0), 1);
      this.max_rows              = Math.max(toolBox.getProp(block, "configurations.max_rows", 0), 1);
      this.max_products          = Math.max(toolBox.getProp(block, "configurations.max_products", 0), 1);
      this.hide_products_in_cart = toolBox.getProp(block, "configurations.hide_products_in_cart", true);
      
      this.vaultKey              = 'upsell-' + this.search_term;
      this.products              = this.cartManager.getFromVault(this.vaultKey)

      if (!this.products)
        fetch(`/search/suggest.json?q=${this.search_term}&resources[type]=product`)
        .then(raw => raw.json())
        .then(this.handleProducts.bind(this));
    }
  
    toolBox.inheritPrototype(Block, generic_cart_block);
  
    Block.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();

      let validProducts = [];

      for (var product of this.products) {
        let found = !!cart.items.find(item => item.product_id == product.id);
        if ((!found || !this.hide_products_in_cart) && this.max_products > validProducts.length) validProducts.push(product);
      }

      let isSlider = this.style == 'slider' && validProducts.length > 1
      var data = {
        id               : this.block_id,
        money_format     : this.money_formats,
        is_slider        : isSlider,
        title            : this.title,
        max_rows         : isSlider? 1 : this.max_rows,
        products_per_row : isSlider ? this.max_rows * this.products_per_row : this.products_per_row,
        products         : validProducts
      };

      // Build template
      return toolBox.renderTemplate(self.cartManager.templatesSelectors.upsell, data, {});
    }

    // get collection or each product
    Block.prototype.handleProducts = function (res) {
      let products = toolBox.getProp(res, "resources.results.products", []);
      if (!products)
        products = [];

      this.cartManager.addToVault(this.vaultKey, products);
      this.products = products;
    }
  
    return Block;
  
  })();
  