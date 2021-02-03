var block_type = block_type || {};

block_type.summary = new (function () {

  var domAttributes = {
      input: 'scz-add-address'
  }

  var selectors = {
      input: `[${domAttributes.input}]`
  };

    //Manage Summary
    function SummaryManager (cartManager, block) {

      var eventListeners = [
          {
              event: 'click',
              handler: clickInput.bind(this)
          }
      ]

      this.popupSettings = null;

      generic_cart_block.call(this, cartManager, block, eventListeners,  true);
    }

    toolBox.inheritPrototype(SummaryManager, generic_cart_block);

    SummaryManager.prototype.getHtml = function () {
      let cart = this.cartManager.getCopyOfCart();
      let data = generateRenderOptions.bind(this)(this.settings, cart);
      // commonsFilters.priceFormatter(total)

      this.address = this.cartManager.getFromVault('adress')

      return toolBox.renderTemplate(this.cartManager.templatesSelectors.summary, data);
    }

    const generateRenderOptions = function (block, cart) {
      var configurations = block.configurations;

      var options = {
        id: this.block_id,
        money_formats: this.money_formats,
        cartIsEmpty: cart.item_count == 0
      };

      var settings = {};

      if (configurations.title_line && configurations.title_line.enabled)
      settings.title = {
        label: configurations.title_line.label,
        isCollapsible: configurations.collapsible == true ? true : false,
        isOpenDefault: configurations.collapsible && configurations.open_default == false ? false : true
      }

      if (configurations.subtotal_line && configurations.subtotal_line.enabled)
        settings.subtotal = {
          label: configurations.subtotal_line.label,
          value: cart.items_subtotal_price
        }

      if (configurations.discounts_line && configurations.discounts_line.enabled)
        settings.discounts = {
          label: configurations.discounts_line.label,
          value: cart.total_discount
        }

      if (configurations.shipping_line && configurations.shipping_line.enabled) {
        settings.shipping = {
          label: configurations.shipping_line.label,
          value: configurations.shipping_line.value
        }
        if (configurations.shipping_line.button_add_address && this.address == undefined) {
          settings.shipping.button_add_address = configurations.shipping_line.button_add_address
        }
      }

      if (configurations.total_line && configurations.total_line.enabled)
        if (configurations.total_line.display_cart_count) {
          var total_label = configurations.total_line.label + " ( " + cart.item_count + configurations.total_line.cart_count_prefix + " ) ";
        } else {
          var total_label = configurations.total_line.label
        }
        settings.total = {
          label: total_label,
          value: cart.total_price
        }

      if (configurations.weight_line && configurations.weight_line.enabled)
        settings.weight = {
          label: configurations.weight_line.label,
          value: cart.total_weight
        }

      if (block.block_level_options != undefined) {
        for (let blockOption of block.block_level_options) {
            const optionSettings = toolBox.getProp(blockOption, "settings", {});
            const shouldDisplay  = toolBox.getProp(optionSettings, "enabled", false);
            const optionType     = blockOption.option;

            if (!shouldDisplay || !optionType) continue;

            switch (optionType) {
              case "add_address":

              var popupSettings = {};

                if (optionSettings.title_line && optionSettings.title_line.enabled)
                  popupSettings.title = {
                    label: optionSettings.title_line.label
                  }

                if (optionSettings.subtotal_line && optionSettings.subtotal_line.enabled)
                  popupSettings.subtotal = {
                    label: optionSettings.subtotal_line.label
                  }

                if (optionSettings.inputs && optionSettings.inputs.enabled)
                  popupSettings.form = optionSettings.inputs;

                this.popupSettings = popupSettings;
                break;
              default:
                break;
            }
          }
      }

      options.summary = settings;

      return options;
    }


    function clickInput(e) {

        // Get dom input.
        var root = document.getElementById(this.block_id);
        if (!root) return;

        var input = root.querySelector(selectors.input);

        this.cartManager.openPopup(this.popupSettings);
    }

    return SummaryManager;
  })();
