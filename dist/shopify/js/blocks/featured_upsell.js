var block_type = block_type || {};

block_type.featured_upsell  = new (function () {

    var domAttributes = {
        input: 'scz-featured-upsell-input'
    }

    var domClasses = {
        hide_input: 'scz-featured-upsell--hide',
        loading   : 'scz-featured-upsell--loading'
    };

    var selectors = {
        input: `[${domAttributes.input}]`,
        hide_input: `.${domClasses.hide_input}`,
        loading: `.${domClasses.loading}`
    };

    function Block(cartManager, block) {

        var eventListeners = [
            {
                event: 'change',
                handler: changeInput.bind(this)
            }
        ]

        // Indicates whether there is an active cart request with Shopify
        this.blocked = false;

        // Add event listener.
        generic_cart_block.call(this, cartManager, block, eventListeners, true);

        this.title            = toolBox.getProp(block, "configurations.title", "");
        this.description      = toolBox.getProp(block, "configurations.description", "");
        this.input_label      = toolBox.getProp(block, "configurations.input_label", "");
        this.hide_if_selected = toolBox.getProp(block, "configurations.hide_if_selected", false);
        this.variant_id       = toolBox.getProp(block, "configurations.variant_id", "");
    }

    toolBox.inheritPrototype(Block, generic_cart_block);

    Block.prototype.getHtml = function () {
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));

        let data = {
            id          : this.block_id,
            money_formats: this.money_formats,
            title       : this.title,
            description : this.description,
            input_label : this.input_label,
            input_attr  : domAttributes.input,
            is_checked  : !!product
        };

        return toolBox.renderTemplate(this.cartManager.templatesSelectors.featured_upsell, data);
    }

    Block.prototype.customBlockUpdate = function () {
        this.toggleHideClass();

        // Add hide class
        changeInput.bind(this)();
    }

    Block.prototype.on_rendered = function () {
        changeInput.bind(this)();
    }

    /********************************************/
    /* PRIVATE FUNCTIONS       */
    /********************************************/
    function getItemProperty(variantId) {
        return {
            name: `_featured_upsell_${variantId}`,
            value: `unlocked`
        }
    }

    function changeInput(e) {
        if (this.blocked)
            return;

        // Get dom input.
        var root = document.getElementById(this.block_id);
        if (!root) return;

        var input = root.querySelector(selectors.input);
        // Check if featured upsell is already added.
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));
        var hasProduct = !!product;

        if (input.checked && !hasProduct) {
            this.toggleLoadingClass();

            root.classList.remove(domClasses.hide_input);

            let formData = {
                id: this.variant_id,
                quantity: 1,
                properties: getItemProperty(this.variant_id)
            };

            this.cartManager.postShopify(formData, this.cartManager.CART_REQUEST_TYPES.ADD, {
                onSuccess: itemAdded.bind(this),
                onFailure: itemAdded.bind(this),
                always   : unblock.bind(this)
            })
        } else if (!input.checked && hasProduct) {
            this.toggleLoadingClass();

            if (this.hide_if_selected)
                root.classList.add(domClasses.hide_input);

            let formData = {
                id: product.key,
                quantity: 0
            }
            this.cartManager.postShopify(formData, this.cartManager.CART_REQUEST_TYPES.CHANGE, {
                onSuccess: itemRemoved.bind(this),
                onFailure: itemAdded.bind(this),
                always   : unblock.bind(this)
            })
        }
    }

    function itemAdded() {
        this.blocked = false;
    }

    function itemRemoved () {
        this.blocked = false;
        
    }

    function unblock () {
        this.toggleLoadingClass();
    }

    Block.prototype.toggleHideClass = function () {
        var cart       = this.cartManager.getCopyOfCart();
        var attribute  = getItemProperty(this.variant_id);
        var product = cart.items.find(item => toolBox.hasAttribute(item, attribute));
        document.getElementById(this.block_id).classList[this.hide_if_selected && !!product?'add':'remove'](domClasses.hide_input);
    }

    Block.prototype.toggleLoadingClass = function () {
        // Add loading class;
        let hasClass = document.getElementById(this.block_id).classList.contains(domClasses.hide_input);
        document.getElementById(this.block_id).classList[hasClass?'remove':'add'](domClasses.loading);
        // Block
        this.blocked = !hasClass;
    }

    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    Block.isFeaturedUpsell = function (item) {
        let attribute = getItemProperty(item.variant_id);
        return toolBox.hasAttribute(item, attribute);
    }

    return Block;
})();
