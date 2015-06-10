/* global
  Subscriptions: false,
  Statistics: false
*/
'use strict';

Template.Subscriptions.rendered = function(){
  var self = this;

  Tracker.nonreactive(function(){
    var searchText = Session.get('searchText');
    if (searchText) {
      var node = self.$('#subscriptionSearch');
      $(node).val(searchText);
    }
  });
};

Template.Subscriptions.helpers({
  subscriptions: function() {
    var
      searchText = Session.get('searchText') || '',
      parts = searchText.trim().split(/[ \-\:]+/),
      regExp = new RegExp("(" + parts.join('|') + ")", "ig"),
      selector = {pkgName: regExp}
    ;
    return Subscriptions.find(selector, {
      transform: function(subscription) {
        var matchText = subscription.pkgName;
        if (searchText.length > 0 && matchText && regExp) {
          subscription.displayName = matchText.replace(regExp, "<u>$&</u>");
        }
        else {
          subscription.displayName = matchText;
        }
        return subscription;
      },
      sort: {
        pkgName: 1,
      }
    });
  },
  isLoading: function() {
    return Router.current().ready();
  },
  numSubscriptions: function(){
    var stats = Statistics.findOne();
    if (stats) {
      var subsCount = stats.subsCount;
      if (subsCount > 0) {
        return '( ' + subsCount + ' total)';
      }
      else {
        return '(None!)';
      }
    }
  }
});


Template.Subscriptions.events({
  "keyup #subscriptionSearch": _.throttle(function(e) {
    var searchText = $(e.target).val() || '';
    Session.set('searchText', searchText.trim());
  }, 200)
});
