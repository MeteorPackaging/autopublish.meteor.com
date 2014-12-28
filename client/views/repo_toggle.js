'use strict';

Template.repoToggle.rendered = function(){
  this.$('.ui.checkbox')
    .checkbox()
  ;
};

Template.repoToggle.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoToggle.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoToggle.events({
  'click .ui.checkbox': function(e, instance){
    console.log("toggling web hook for:");
    console.dir(this);
    instance.updating.set(true);
    Meteor.call('toggleRepo', instance.data, function(err, result){
      instance.updating.set(false);
    });
  },
});
