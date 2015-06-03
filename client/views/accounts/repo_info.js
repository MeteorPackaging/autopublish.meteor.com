'use strict';

Template.repoInfo.onCreated(function(){
  var self = this;
  self.loading = new ReactiveVar(true);

  Meteor.call('getRepoDetails', {
    id: self.data._id,
    fullName: self.data.full_name,
    gitUrl: self.data.html_url
  }, function(err, repoDetails){
    if (err) {
      console.dir(err);
    }
    else {
      self.data.repoDetails = repoDetails;
    }
    self.loading.set(false);
  });
});

Template.repoInfo.helpers({
  admin: function(){
    return this.permissions && this.permissions.push;
  },
  loading: function(){
    return Template.instance().loading.get();
  },
  pkgUrl: function(){
    var repoDetails = this.repoDetails;
    if (repoDetails && repoDetails.pkgInfo && repoDetails.pkgInfo.name){
      var name = repoDetails.pkgInfo.name.split(':');
      if (name.length === 2){
        return "https://atmospherejs.com/" + name[0] + "/" + name[1];
      }
    }
  },
  displayName: function(){
    var pkgInfo = this.repoDetails.pkgInfo;
    if (pkgInfo){
      var name = pkgInfo.name || 'A Meteor Package?';
      if (pkgInfo.version) {
        name += '@' + pkgInfo.version;
      }
      return name;
    }
    else {
      return 'Not a Meteor pacakge';
    }
  }
});
