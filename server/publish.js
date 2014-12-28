'use strict';
/* global AutoPublish: false, Meteor: false */

Meteor.publish('queueingPublish', function(limit){
	check(limit, Number);

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
