'use strict';
/* global moment: false */

var
  counter = null,
	instances = [],
  timer = null
;


Template.publishAction.created = function(){
		if (timer === null) {
			counter = new ReactiveVar(0);
			timer = Meteor.setInterval(function() {
				counter.set(counter.curValue + 1);
			}, 60000 /* 1 minute */);
		}
		instances.push(this);
};

Template.publishAction.rendered = function(){
  this.$('div.errored.label')
    .popup({
      inline   : true,
      hoverable: true,
      position : 'bottom right',
      delay: {
        show: 200,
        hide: 500
      }
    })
  ;
};

Template.publishAction.destroyed = function(){
	// Possibly removes the current instance from the array of template instances
	var index = instances.indexOf(this);
	if (index > -1) {
		instances.splice(index, 1);
	}
	if (instances.length === 0 && timer !== null) {
		Meteor.clearInterval(timer);
		timer = null;
		counter = null;
	}
};

Template.publishAction.helpers({
	atmosphereUrl: function(){
		if (this.pkgName) {
			var name = this.pkgName.split(':');
			if (name.length === 2){
				return "https://atmospherejs.com/" + name[0] + "/" + name[1];
			}
		}
	},
  completed: function(){
    // Trick to make this recomputing every minute...
    counter && counter.get();
    return moment(this.completedAt).fromNow();
  },
  queueing: function(){
    return this.status === 'queueing';
  },
	released: function(){
		// Trick to make this recomputing every minute...
		counter && counter.get();
		return moment(this.publishedAt).fromNow();
	},
  successful: function(){
    return this.status === 'successful';
  },
});

Template.publishAction.events({
  'click #republishButton': function(e){
    e.preventDefault();
    console.log(this._id);
    Meteor.call('republish', this._id);
  }
});
