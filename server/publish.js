'use strict';
/* global AutoPublish: false, Meteor: false, Subscriptions: false */

Meteor.publish('queueingPublish', function(limit){
	check(limit, Number);
	Meteor._sleepForMs(3000);
	return AutoPublish.find({
		completedAt: { $exists: false }
	}, {
		limit: limit
	});
});

Meteor.publish('completedPublish', function(limit){
	check(limit, Number);

	return AutoPublish.find({
		completedAt: { $exists: true }
	}, {
		limit: limit
	});
});

Meteor.publish('subscriptions', function(limit){
	check(limit, Number);

	return Subscriptions.find({}, {
		limit: limit
	});
});
