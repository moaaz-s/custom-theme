var block_type = block_type || {};

block_type.footer = new (function () {

    var self;

    //Manage Footer
    function FooterManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [],  true);
      self = this;
    }

    toolBox.inheritPrototype(FooterManager, generic_cart_block);

    FooterManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();
      let data = generateRenderOptions(self.settings, cart);
      // commonsFilters.priceFormatter(total)

      // Build summary block.
      let summaryHTML = "";
      if (data.summary) {
        let summary = new block_type.summary(self.cartManager, data.summary);
        summaryHTML = summary.getHtml();
        // summary.destroy();
      }

      // Build template
      return toolBox.renderTemplate(self.cartManager.templatesSelectors.footer, data, { 
        summary_template: summaryHTML
      });
      // return toolBox.renderTemplate(self.cartManager.templatesSelectors.footer, data);
    }

    const generateRenderOptions = function (block, cart) {
      var options = {
        id: self.block_id,
        money_formats: self.money_formats,
        isFixed: block.configurations.footer_fixed,
        cartIsEmpty: cart.item_count == 0,

        // options
        cart: false,
        checkout: false,
        summary: false,
        tos: false
      };

      for (let blockOption of block.block_level_options) {
        const optionSettings = toolBox.getProp(blockOption, "settings", {});
        const shouldDisplay  = toolBox.getProp(optionSettings, "enabled", false);
        const optionType     = blockOption.option;

        if (!shouldDisplay || !optionType) continue;

        switch (optionType) {
          case "cart":
            if (!optionSettings.label)
              break;

            var settings = {
              label: optionSettings.label
            };

            if (optionSettings.display_total)
              settings.total = cart.total_price

            options.cart = settings;

            break;
          case "checkout":
            if (!optionSettings.label)
              break;

            var settings = {
              label: optionSettings.label
            };

            if (optionSettings.display_total)
              settings.total = cart.total_price

            options.checkout = settings;
            break;
          case "summary":
            options.summary = {
              configurations: optionSettings
            };
            break;
          case "tos":
            var settings = {
              title: optionSettings.title,
              content: optionSettings.content
            };

            if (optionSettings.number_of_visible_lines > 0)
              settings.number_of_visible_lines = optionSettings.number_of_visible_lines;

            options.tos = settings;
            break;
          case "ps":
              var settings = {
                content: optionSettings.content
              };

              options.ps = settings;
              break;
          default:
            break;
        }
      }

      return options;
    }

    return FooterManager;
  })();
