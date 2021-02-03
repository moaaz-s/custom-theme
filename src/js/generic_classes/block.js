//blocks
var generic_cart_block = new (function () {

    /**
     * ...
     * cartManager   {obj}        ref to the cart manager.
     * eventhandlers {array<obj>} ref les events a set/destroy
     * eventhandlers[n].handler {function} the event handler.
     * eventhandlers[n].event {string} the dom event
     * eventhandlers[n].$ele {string} ZDOM elements.
     */
    function GCB (cartManager, blockSettings, eventHandlers, isCartDependant) {
      // Will be set by the cart manager.
      this.money_formats = null;
      
      // Specify if it should be updated when cart is updated.
      this.cart_dependant = isCartDependant;
  
      // Reference to the cart manager.
      this.cartManager = cartManager;
  
      // Save settings locally.
      this.settings = blockSettings;
  
      // Generate the block ID.
      this.block_id = toolBox.makeId(10, {prefix:"block_"});
  
      // A reference to indicate whether the block is rendered.
      this.is_rendered = false;
  
      // A reference to all events handlers.
      this.events_handlers = eventHandlers;
    }
  
    GCB.prototype.getHtml = function () {
      console.log("Each block will have its own implementation of this function");
    }
  
    GCB.prototype.eventsHandler = function (status) {
      let verb = status?'on':'off';
      for (const eh of this.events_handlers) {
        ZDOM(eh.$ele?eh.$ele:`#${this.block_id}`)[verb](eh.event, eh.handler.bind(this));
      }
    }
  
    GCB.prototype.destroy = function () {
      // Execute custom destroyer if found.
      if (this.on_destroy && typeof this.on_destroy === "function") 
        this.on_destroy(); 

      this.is_rendered = false;
  
      // Unlink event listners
      this.eventsHandler(false);

      // Remove block from the dom.
      if (this.is_rendered)
        ZDOM('#' + this.block_id).remove();
  
      this.is_rendered = false;
      this.block_id    = undefined;
    }
  
    GCB.prototype.markAsRendered = function () {
      if (this.on_rendered && typeof this.on_rendered === "function")
        this.on_rendered();

      this.eventsHandler(true);
      this.is_rendered = true;
    }
  
    GCB.prototype.updateBlock = async function () { 
      if (!this.is_rendered) return;

      // Unlink event listners
      this.eventsHandler(false);

      if (typeof this.customBlockUpdate === 'function')
        this.customBlockUpdate();
      else {
        var html = await this.getHtml();
        var oldBlock = document.getElementById(this.block_id);
        var newBlock = toolBox.htmlToElement(html);
        // update dom.
        oldBlock.parentNode.replaceChild(newBlock, oldBlock);
      }

      // Relink event listners
      this.eventsHandler(true);
    }
  
    return GCB;
})();