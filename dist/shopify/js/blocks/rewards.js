var block_type = block_type || {};

block_type.rewards = new (function () {

    const REWARD_TYPES = {
        FREE_SHIPPING: "free_shipping",
        PRODUCT: "product",
        DISCOUNT_CODE: "code"
    }

    const selectors = {
        current_message : "[scz-cart-rewards--current-message]",
        next_message    : "[scz-cart-rewards--next-message]",
        progress_bar    : "[scz-cart-rewards--progress-bar]"
    }

    let rewards = [];

    let currentAward = null;
    let nextAward    = null;

    //Manage Footer
    function Block(cartManager, block) {
        generic_cart_block.call(this, cartManager, block, [], true);

        this.enabled = toolBox.getProp(block, "configurations.enabled", false);
        this.rewards = toolBox.getProp(block, "configurations.steps", []);

        // Sort rewards based on "threshold" by ascending order
        this.rewards.sort((a, b) => {
            if ((isNaN(a.threshold) && isNaN(b.threshold)) || (a.threshold == b.threshold))
                return 0;
            else if ((!isNaN(a.threshold) && isNaN(b.threshold)) || (a.threshold > b.threshold))
                return 1
            else if ((!isNaN(b.threshold) && isNaN(a.threshold)) || (b.threshold > a.threshold))
                return -1
            return 0
        });

        for (var i=0; i< this.rewards.length; i++) {
            let reward = this.rewards[i];

            reward.unlocked = false;
            reward.last_unlocked = false;
            reward.next_to_unlock = i===0;
            
        }
    }

    toolBox.inheritPrototype(Block, generic_cart_block);

    Block.prototype.getHtml = function () {
        if (!this.enabled)
            return "";

        let cart = this.cartManager.getCopyOfCart();
        this.updateReward(cart);

        let data = this.generateRenderOptions(cart);

        return toolBox.renderTemplate(this.cartManager.templatesSelectors.rewards, data);
    }

    Block.prototype.customBlockUpdate = function () {
        if (!this.enabled)
            return;

        let cart = this.cartManager.getCopyOfCart();

        // Apply reward (add/remove awarded product - auto apply discount code - or should it be done after clicking on the button ?)
        this.updateReward(cart);
        
        // Update 
        document.getElementById(this.block_id).querySelector(selectors.current_message);
        document.getElementById(this.block_id).querySelector(selectors.next_message);
        document.getElementById(this.block_id).querySelector(selectors.progress_bar);



                                

        // control the progress bar & the texts. 
        // if (interfaceParams)
        //     updateInterface(interfaceParams);
    }

    /*********************************/
    /* PRIVATE FUNCTIONS       */
    /*********************************/ 

    // TODO: 
    Block.prototype.generateRenderOptions = function (cart) {
        var options = {
            id: this.block_id,
            money_formats: this.money_formats,
            rewards: this.rewards,
            cart
        };

        return options;
    }

    Block.prototype.updateReward = function (cart) {
        var subtotal = this.calculateRealSubtotal(cart);

        let newCurrentReward = null;
        let newNextReward = null;

        /** Get current & next actions **/
        /********************************/
        for (let reward of this.rewards) {
            if (!toolBox.isEmpty(reward) && subtotal >= reward.threshold) {
                newCurrentReward      = reward;

                reward.unlocked       = true;
                reward.last_unlocked  = false;
                reward.next_to_unlock = false;
            } else {
                reward.unlocked       = false;
                reward.last_unlocked  = false;

                var isNextToUnlock = !newNextReward && !toolBox.isEmpty(reward) && subtotal < reward.threshold;
                reward.next_to_unlock = isNextToUnlock;
                if (isNextToUnlock)
                    newNextReward = reward
            }
        }

        if (newCurrentReward)
            newCurrentReward.last_unlocked = true;


        /** Update rewards **/
        /***********************************/
        this.updateProductRewards(cart, this.rewards, newCurrentReward, newCurrentReward);

        /** Take actions based on rewards **/
        /***********************************/
        // The client has not yet earned a reward.
        if (toolBox.isEmpty(newCurrentReward) && toolBox.isEmpty(currentAward)) {
            // do nothing ?
        }

        // The client has earned a new reward.
        else if (toolBox.isEmpty(currentAward) || newCurrentReward.threshold > currentAward.threshold) {
            
        }

        // The client has lost the latest award.
        else if (toolBox.isEmpty(newCurrentReward) || newCurrentReward.threshold < currentAward.threshold) {
            // Scan cart to fetch rewarded products.
            // && remove products that don't match earned rewards.
            if (currentAward.type === REWARD_TYPES.FREE_SHIPPING) {
                // remove product
            }
        }

        /** Update local rewards references **/
        /*************************************/
        currentAward = newCurrentReward;
        nextAward = newNextReward;
    }

    Block.prototype.calculateRealSubtotal = function (cart) {
        let subtotal = cart.items_subtotal_price;

        // Exclude rewarded products form the cart.
        for (let item of cart.items) {
            let attribute = getItemProperty(item.variant_id);
            if (!toolBox.hasAttribute(item, attribute))
                continue;
            // We assume that the deduced price should exclude applied discounts for the reward 
            // & the quantity is 1. The client may have successed at adding the same item multiple times, only the first one is gifted
            subtotal -= item.original_price;
        }

        // Check if to exclude rewarded discount codes.
        // ...

        return subtotal;
    }

    /********************************************/
    /* PRODUCT REWARD       */
    /********************************************/
    Block.prototype.updateProductRewards = function (cart, rewards) {
        // List of rewards already added to the cart.
        const addedRewardItems = getAllRewardedLineItems(cart.items);
        // List of earned rewards.
        const earnedProductRewards = rewards.filter(reward => reward.unlocked && reward.type == REWARD_TYPES.PRODUCT && reward.variant_id)
        // List of earned rewards not yet added to the cart => Should be added.
        let missingRewards = []; 
        // List of lost rewards that are still present in the cart => Should be removed.
        let lostRewards = [];

        // Find  missing rewards by checking which rewards are not yet added to the cart.
        for (let reward of earnedProductRewards) {
            let found = false;
            for (let item of addedRewardItems) {
                let attribute = getItemProperty(item.variant_id);
                if (!toolBox.hasAttribute(item, attribute))
                    continue;
                found = true;
                break;
            }

            if (!found)
                missingRewards.push(reward);
        }

        // Find lost / unearned rewards by checking which of the already added items doesn't match the list of earned rewards
        for (let rewardedItem of addedRewardItems) {
            let found = false;

            for (let reward of earnedProductRewards) {
                let attribute = getItemProperty(reward.variant_id);
                if (!toolBox.hasAttribute(rewardedItem, attribute))
                    continue;
                found = true;
                break;
            }

            if (!found)
                lostRewards.push(rewardedItem);
        }

        // Build requests
        let itemsToAdd = [];
        let itemsToDelete = [];
        for (let missingReward of missingRewards) {
            itemsToAdd.push({
                id: missingReward.variant_id,
                quantity: 1,
                properties: getItemProperty(missingReward.variant_id)
            })
        }

        for (let lostReward of lostRewards) {
            itemsToDelete.push({
                key: lostReward.key
            })
        }

        let requests = [];
        if (itemsToAdd.length)
            requests.push({
                type: this.cartManager.CART_REQUEST_TYPES.ADD,
                items: itemsToAdd
            })

        if (itemsToDelete.length)
            requests.push({
                type: this.cartManager.CART_REQUEST_TYPES.REMOVE,
                items: itemsToDelete
            })

        if (requests.length)
            this.cartManager.updateItems(requests);
    }

    function getItemProperty(variantId) {
        return {
            name: `_reward_${variantId}`,
            value: `unlocked`
        }
    }

    function getAllRewardedLineItems(line_items) {
        return line_items.filter(item => {
            let rewardItemProperty = getItemProperty(item.variant_id);

            if (!item.properties)
                return false;

            let itemProperties = JSON.parse(JSON.stringify(item.properties));

            if (!Array.isArray(itemProperties))
                itemProperties = [itemProperties];

            for (let property of itemProperties) {
                if (property.name == rewardItemProperty.name && property.value == rewardItemProperty.value)
                    return true;
            }

            return false;
        })
    }

    /*********************************/
    /* PUBLIC STATIC FUNCTIONS       */
    /*********************************/
    Block.isRewardItem = function (item, variantId) {
        let attribute = getItemProperty(variantId);
        return toolBox.hasAttribute(item, attribute);
    }

    return Block;
})();