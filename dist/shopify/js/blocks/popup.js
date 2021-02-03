var block_type = block_type || {};

block_type.popup = new (function () {

    var self;

    //Manage Popup
    function PopupManager (cartManager, block) {
      generic_cart_block.call(this, cartManager, block, [], true);
      self = this;
    }

    toolBox.inheritPrototype(PopupManager, generic_cart_block);


    //TODO détail chaque settings pour template
    PopupManager.prototype.getHtml = function () {
      let cart = self.cartManager.getCopyOfCart();

      let data = generateRenderOptions.bind(this)(this.settings, cart);
      console.log(data);

      return toolBox.renderTemplate(self.cartManager.templatesSelectors.popup, data);
    }

    const generateRenderOptions = function (block, cart) {
      var configurations = block.configurations;

      var options = {
        id: this.block_id,
        money_formats: this.money_formats
      };

      for (let blockOption of block.block_level_options) {
        const optionSettings = toolBox.getProp(blockOption, "settings", {});
        const shouldDisplay  = toolBox.getProp(optionSettings, "enabled", false);
        const optionType     = blockOption.option;

        if (!shouldDisplay || !optionType) continue;

        switch (optionType) {
          case "add_product":
            var settings = {};

            if (optionSettings.title_line && optionSettings.title_line.enabled)
              settings.title = {
                label: optionSettings.title_line.label
              }

            if (optionSettings.subtotal_line && optionSettings.subtotal_line.enabled)
              settings.subtotal = {
                label: optionSettings.subtotal_line.label
              }

            if (optionSettings.displayed_values)
              settings.displayed_values = {}




            options.add_product = settings;

            break;
          case "add_address":

            var settings = {};

            if (optionSettings.title_line && optionSettings.title_line.enabled)
              settings.title = {
                label: optionSettings.title_line.label
              }

            if (optionSettings.subtotal_line && optionSettings.subtotal_line.enabled)
              settings.subtotal = {
                label: optionSettings.subtotal_line.label
              }

            if (optionSettings.inputs && optionSettings.inputs.enabled)
              settings.form = null;

              var form = document.createElement("form");
              form.setAttribute('method',"post");
              form.setAttribute('action',"#");

              for (const [key, value] of Object.entries(optionSettings.inputs)) {
                // input text
                if (optionSettings.inputs[key].type == "text") {
                  if (optionSettings.inputs[key]) {
                    var input = document.createElement("input");
                    input.type = "text";
                    input.name = key;
                    input.id = key;
                    if (optionSettings.inputs[key].required) {
                      input.required = optionSettings.inputs[key].required;
                    }
                    if (optionSettings.inputs[key].placeholder) {
                      input.placeholder = optionSettings.inputs[key].placeholder;
                    }
                    if (optionSettings.inputs[key].label) {
                      var input_label = document.createElement("Label");
                      input_label.htmlFor = key;
                      input_label.innerHTML = optionSettings.inputs[key].label;
                      form.appendChild(input_label);
                    };
                    form.appendChild(input);
                  }
                } else if (optionSettings.inputs[key].type == "select") {
                  // select options
                  if (optionSettings.inputs[key]) {
                    var select = document.createElement("select");
                    select.id = key;
                    if (optionSettings.inputs[key].required) {
                      select.required = optionSettings.inputs[key].required;
                    }
                    for (var i = 0; i < optionSettings.inputs[key].options.length; i++) {
                      var option = document.createElement("option");
                      option.value = optionSettings.inputs[key].options[i];
                      option.text = optionSettings.inputs[key].options[i];
                      select.appendChild(option);
                    }
                    if (optionSettings.inputs[key].label) {
                      var select_label = document.createElement("Label");
                      select_label.htmlFor = key;
                      select_label.innerHTML = optionSettings.inputs[key].label;
                      form.appendChild(select_label);
                    };
                    form.appendChild(select);
                  }
                } else if (optionSettings.inputs[key].type == "number") {
                  // number
                  if (optionSettings.inputs[key]) {
                    var input = document.createElement("input");
                    input.type = "number";
                    input.name = key;
                    input.id = key;
                    if (optionSettings.inputs[key].required) {
                      input.required = optionSettings.inputs[key].required;
                    }
                    if (optionSettings.inputs[key].placeholder) {
                      input.placeholder = optionSettings.inputs[key].placeholder;
                    }
                    if (optionSettings.inputs[key].label) {
                      var input_label = document.createElement("Label");
                      input_label.htmlFor = key;
                      input_label.innerHTML = optionSettings.inputs[key].label;
                      form.appendChild(input_label);
                    };
                    form.appendChild(input);
                  }
                }
              }

              settings.form = form;
              console.log(settings.form);

            options.add_address = settings;
            break;
          default:
            break;
        }
      }


      options.popup = settings;

      return options;
    }

    return PopupManager;
  })();
