'use strict';

Template.repoInfo.created = function(){
  var self = this;
  self.loading = new ReactiveVar(true);

  Meteor.call('getRepoDetails', {
    id: self.data._id,
    fullName: self.data.full_name,
    gitUrl: self.data.html_url
  }, function(err, info){
    if (err) {
      self.data.error = err.error;
    }
    else {
      self.data.info = info;
    }
    self.loading.set(false);
  });
};

Template.repoInfo.helpers({
  admin: function(){
    return this.permissions && this.permissions.push;
  },
  loading: function(){
    return Template.instance().loading.get();
  },
  pkgUrl: function(){
    var info = this.info;
    if (info && info.name){
      var name = info.name.split(':');
      if (name.length === 2){
        return "https://atmospherejs.com/" + name[0] + "/" + name[1];
      }
    }
  },
  displayName: function(){
    var info = this.info;
    if (info){
      var name =
        (info.name || 'Meteor Package') +
        (info.version ? '@' + info.version : '')
      ;
      return name;
    }
  }
});
