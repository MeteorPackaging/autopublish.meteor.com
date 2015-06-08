'use strict';

Template.repoWebhook.onRendered(function(){
  var self = this;
  if (self.data.repoDetails && self.data.repoDetails.webhookEnabled){
    self.$('.ui.checkbox').checkbox('check');
  }
  else {
    self.$('.ui.checkbox').checkbox('uncheck');
  }
});

Template.repoWebhook.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoWebhook.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoWebhook.events({
  'click .ui.checkbox': function(e, instance){
    var
      data = instance.data,
      pkgInfo = data.repoDetails && data.repoDetails.pkgInfo
    ;

    if (pkgInfo) {
      instance.updating.set(true);
      var newStatus = $(e.currentTarget).checkbox('is checked');
      Meteor.call('toggleWebhook', {
        id: data._id,
        fullName: data.full_name,
        pkgName: pkgInfo.name,
        pkgVersion: pkgInfo.version,
        pkgSummary: pkgInfo.summary,
        gitUrl: data.html_url
      }, newStatus, function(err, result){
        instance.updating.set(false);
        if (!err && !!result && 'enabled' in result){
          newStatus = result.enabled;
          instance.data.enabled = newStatus;
        }
        else {
          newStatus = !newStatus;
        }
        var status = 'uncheck';
        if (newStatus){
          status = 'check';
        }
        instance.$('.ui.checkbox').checkbox(newStatus);
      });
    }
  },
});
