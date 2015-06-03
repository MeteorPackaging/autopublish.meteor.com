'use strict';

Template.repoMeteorPackage.onRendered(function(){
  var
    self = this,
    repoDetails = self.data.repoDetails
  ;
  if (repoDetails && repoDetails.pkgInfo && repoDetails.pkgInfo.enabled){
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

Template.repoMeteorPackage.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoMeteorPackage.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoMeteorPackage.events({
  'click .ui.checkbox': function(e, instance){
    var
      data = instance.data,
      pkgInfo = data.repoDetails && data.repoDetails.pkgInfo
    ;

    console.dir(data);
    console.dir(pkgInfo);
    if (pkgInfo) {
      instance.updating.set(true);
      Meteor.call('toggleMeteorPackage', {
        id: data._id,
        fullName: data.full_name,
        pkgName: pkgInfo.name,
        pkgVersion: pkgInfo.version,
        pkgSummary: pkgInfo.summary,
        gitUrl: data.html_url
      }, function(err, result){
        instance.updating.set(false);
        if (result.enabled !== undefined){
          instance.data.enabled = result.enabled;
          var status = 'uncheck';
          if (result.enabled){
            status = 'check';
          }
          instance.$('.ui.checkbox').checkbox(status);
        }
      });
    }
  },
});
