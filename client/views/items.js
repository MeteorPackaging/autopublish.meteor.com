'use strict';
/* global AutoPublish: false */

Template.items.created = function() {

	// 1. Initialization

	var instance = this;
	var selector = this.data.selector;
	var subscription = this.data.subscription;

	console.log(this.data.title);
	console.log("  selector:");
	console.dir(selector);
	console.log("  subscription: " + subscription);

	// initialize the reactive variables
	instance.loaded = new ReactiveVar(0);
	instance.limit = new ReactiveVar(5);
	instance.ready = new ReactiveVar(false);

	// 2. Autorun

	// will re-run when the "limit" reactive variables changes
	instance.autorun(function() {

		// get the limit
		var limit = instance.limit.get();

		console.log("Asking for " + limit + " items...");

		// subscribe to the items publication
		var subscription = Meteor.subscribe('completedPublish', limit);

		// if subscription is ready, set limit to newLimit
		if (subscription.ready()) {
			console.log("> Received "+limit+" items. \n\n");
			instance.loaded.set(limit);
			instance.ready.set(true);
		} else {
			instance.ready.set(false);
			console.log("> Subscription is not ready yet. \n\n");
		}
	});

	instance.items = function() {
		return AutoPublish.find(selector, {
			limit: instance.loaded.get()
		});
	};
};

Template.items.helpers({
	// the items cursor
	items: function () {
		return Template.instance().items();
	},
	// the subscription handle
	isReady: function () {
		return Template.instance().ready.get();
	},
	// are there more items to show?
	hasMoreItems: function () {
		var instance = Template.instance();
		return instance.items().count() >= instance.limit.get();
	}
});

Template.items.events({
	'click .load-more': function (event, instance) {
		event.preventDefault();

		// get current value for limit, i.e. how many items are currently displayed
		var limit = instance.limit.get();

		// increase limit by 5 and update it
		limit += 5;
		instance.limit.set(limit);
	}
});
