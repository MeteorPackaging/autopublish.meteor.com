/* global
    KnownHooks: false,
    Statistics: false
*/
'use strict';

Template.Hooks.rendered = function(){
  var self = this;

  Tracker.nonreactive(function(){
    var searchText = Session.get('searchText');
    if (searchText) {
      var node = self.$('#hookSearch');
      $(node).val(searchText);
    }
  });
};

Template.Hooks.helpers({
  hooks: function() {
    var
      searchText = Session.get('searchText') || '',
      parts = searchText.trim().split(/[ \-\:]+/),
      regExp = new RegExp("(" + parts.join('|') + ")", "ig"),
      selector = {repoFullName: regExp}
    ;
    return KnownHooks.find(selector, {
      transform: function(hook) {
        var matchText = hook.repoFullName;
        if (searchText.length > 0 && matchText && regExp) {
          hook.displayName = matchText.replace(regExp, "<u>$&</u>");
        }
        else {
          hook.displayName = matchText;
        }
        return hook;
      },
      sort: {
        repoFullName: 1,
        hook_id: 1,
      }
    });
  },
  isLoading: function() {
    return Router.current().ready();
  },
  numHooks: function(){
    var stats = Statistics.findOne();
    if (stats) {
      var hooksCount = stats.hooksCount;
      if (hooksCount > 0) {
        return '( ' + hooksCount + ' total)';
      }
      else {
        return '(None!)';
      }
    }
  }
});


Template.Hooks.events({
  "keyup #hookSearch": _.throttle(function(e) {
    var searchText = $(e.target).val() || '';
    Session.set('searchText', searchText.trim());
  }, 200)
});
