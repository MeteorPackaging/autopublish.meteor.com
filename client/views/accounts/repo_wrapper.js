'use strict';

Template.repoWrapper.onRendered(function(){
  var
    self = this,
    repoDetails = self.data.repoDetails
  ;

  if (repoDetails && repoDetails.wrapper && repoDetails.wrapper.enabled){
    self.$('.ui.checkbox')
      .checkbox('check')
    ;
  }
  else {
    self.$('.ui.checkbox')
      .checkbox('uncheck')
    ;
  }
});

Template.repoWrapper.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoWrapper.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoWrapper.events({
  'click .ui.checkbox': function(e, instance){
    var
      data = instance.data,
      pkgInfo = data.repoDetails && data.repoDetails.pkgInfo
    ;

    if (pkgInfo) {
      console.log('Toggling wrapper');
      console.dir(data);
      console.dir(pkgInfo);
      instance.updating.set(true);
      var newStatus = $(e.currentTarget).checkbox('is checked');
      Meteor.call('toggleWrapper', {
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
          instance.data.repoDetails.wrapper.enabled = newStatus;
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
