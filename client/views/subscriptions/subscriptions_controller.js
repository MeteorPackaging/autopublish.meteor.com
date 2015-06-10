/* global
  SubscriptionsController: true,
  Roles: false,
  RouteController: false
*/

SubscriptionsController = RouteController.extend({
  template: 'Subscriptions',
  onRun: function(){
    'use strict';

    Session.set('searchText', '');
    this.next();
  },
  onBeforeAction: function() {
    'use strict';

    var self = this;

    if (Meteor.loggingIn()) {
      self.renderRegions();
    }
    else {
      if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {
        var counterInterval = self.counterInterval;
    		if (counterInterval) {
          Meteor.clearInterval(counterInterval);
        }
        self.state.set('counter', 0);
    		self.counterInterval = Meteor.setInterval(function() {
          Tracker.nonreactive(function(){
            var nextValue = (self.state.get('counter') || 0) + 1;
    	      self.state.set('counter', nextValue);
          });
    		}, 60000 /* 1 minute */);

        self.next();
      }
      else {
        this.stop();
        Meteor.defer(function(){
          Router.go('home');
        });
      }
    }
  },

  onStop: function(){
    'use strict';
    var self = this;

    delete Session.keys.searchText;
    var counterInterval = self.counterInterval;
		if (counterInterval) {
      Meteor.clearInterval(counterInterval);
    }
  },

  subscriptions: function(){
    'use strict';
    return Meteor.subscribe("allSubscriptions");
  },
});
