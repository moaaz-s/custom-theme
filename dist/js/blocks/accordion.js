var block_type = block_type || {};

block_type.accordion = new (function () {

  var self;

  var domAttributes = {
    title_tab: 'scz-accordion-title-tab',
    content_tab: 'scz-accordion-content'
  }

  var domClasses = {
    active_title: 'scz-cart-accordion-title--active',
    open_content: 'scz-cart-accordion-content--open',
    closed_content: 'scz-cart-accordion-content--closed'
  };

  var selectors = {
    title_tab: `[${domAttributes.title_tab}]`,
    content_tab: `[${domAttributes.content_tab}]`,
    active_title: `.${domClasses.active_title}`,
    open_content: `.${domClasses.open_content}`,
    closed_content: `.${domClasses.closed_content}`
  };

  var defaultSettings = {
    panels: [
      {
        title: "Tab1 title",
        description: "Tab1 content"
      },
      {
        title: "Tab2 title",
        description: "Tab2 content"
      }
    ],
    configurations: {
      allow_multiple_active_tabs: true,
      display_icon: true,
      icon: "plus"
    }
  }

  //Manage Accordion
  function AccordionManager(cartManager, settings) {
    self = this;

    var eventListeners = [
      {
        event: 'click',
        handler: toggleTabHandler
      }
    ]

    generic_cart_block.call(this, cartManager, settings, eventListeners, false);
    self.settings = toolBox.merge(defaultSettings, settings, true);
  }

  toolBox.inheritPrototype(AccordionManager, generic_cart_block);

  AccordionManager.prototype.getHtml = function () {

    let accordionSettings = {
      id: this.block_id,
      money_formats: this.money_formats,
      panels: this.settings.panels,
      display_icon: this.settings.configurations.display_icon,
      icon: this.settings.configurations.icon
    };

    return toolBox.renderTemplate(self.cartManager.templatesSelectors.accordion, accordionSettings);
  }

  var toggleTabHandler = e => {
    var $target = ZDOM(e.target);
    if ($target.isEmpty()) return;

    var $tabTitle = ZDOM($target.get(0).closest(selectors.title_tab));
    if ($tabTitle.isEmpty()) return;

    var contentId = $tabTitle.get(0).getAttribute(domAttributes.title_tab);
    var $tabContent = ZDOM('#' + contentId);
    if ($tabContent.isEmpty()) return;

    var $root = ZDOM('#' + self.block_id)
    var shouldOpen = $tabTitle.hasClass(domClasses.active_title) ? false : true;

    // 300ms buffer to prevent unexpected behaviour
    let now = Date.now();
    this.lockTimestamp = this.lockTimestamp || now;
    if (now - this.lockTimestamp > 0 && now - this.lockTimestamp < 300)
      return;
    else if (now - this.lockTimestamp > 300)
      this.lockTimestamp = null;

    if (shouldOpen) {
      // animate tab
      if (!self.settings.configurations.allow_multiple_active_tabs)
        $root.find(selectors.title_tab).removeClass(domClasses.active_title)
      $tabTitle.addClass(domClasses.active_title);

      // animate content
      if (!self.settings.configurations.allow_multiple_active_tabs)
        $root.find(selectors.content_tab).removeClass(domClasses.open_content).addClass(domClasses.closed_content);
      $tabContent.removeClass(domClasses.closed_content).addClass(domClasses.open_content);
    } else {
      $tabTitle.removeClass(domClasses.active_title);
      $tabContent.removeClass(domClasses.open_content).addClass(domClasses.closed_content);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  return AccordionManager;
})();