'use strict';

// Heavily based on the post 'Meteor Pattern: Template-Level Subscriptions'
// by @SachaG
// https://www.discovermeteor.com/blog/template-level-subscriptions/

Template.loadMoreList.created = function() {

  // -----------------
  // 1. Initialization
  // -----------------

  var
    instance = this,
    data = instance.data,
    collection = data.collection,
    loadStep = data.step || 5,
    selector = data.selector || {},
    subsName = data.subscription,
    itemTmpl = data.itemTemplate
  ;

  // Initializes reactive variables
  instance.limit = new ReactiveVar(5);
  instance.loaded = new ReactiveVar(0);
  instance.ready = new ReactiveVar(false);

  // Initializes Other variables
  instance.loadStep = loadStep;
  instance.itemTmpl = itemTmpl;

  // ----------
  // 2. Autorun
  // ----------

  // will re-run when the "limit" reactive variables changes
  instance.autorun(function() {

    // Get the current value for limit (reactively)
    var limit = instance.limit.get();

    // Updates the subscription to the items
    var subscription = Meteor.subscribe(subsName, limit);

    // When the subscription is ready...
    if (subscription.ready()) {
      // ...sets the 'loaded' amount of items to limit
      instance.loaded.set(limit);
      // ...marks the template instance as ready
      instance.ready.set(true);
    } else {
      // ...otherwise marks the template instance as non-ready
      instance.ready.set(false);
    }
  });

  // ---------
  // 3. Cursor
  // ---------

  instance.items = function() {
    return collection.find(selector);
  };
};

Template.loadMoreList.helpers({
  items: function () {
    // Returns the items cursor
    return Template.instance().items();
  },
  isReady: function () {
    // Returns the template instance readiness status
    return Template.instance().ready.get();
  },
  hasMoreItems: function () {
    // Tells whether there are more items to show?
    var instance = Template.instance();
    return instance.items().count() >= instance.limit.get();
  },
  itemTmpl: function (){
    // Returns the name for the template to be used for single item
    return Template.instance().itemTmpl;
  }
});

Template.loadMoreList.events({
  'click .button': function (event, instance) {
    event.preventDefault();
    // Increments the current value for limit,
    // i.e. how many items are currently displayed
    instance.limit.set(instance.limit.curValue + instance.loadStep);
  }
});
