/* global
    HookSearch: false
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
    return HookSearch.getData({
      transform: function(matchText, regExp) {
        if (matchText && regExp) {
          return matchText.replace(regExp, "<u>$&</u>");
        }
      },
      sort: {"repoFullName": 1}
    });
  },

  isLoading: function() {
    return HookSearch.getStatus().loading;
  }
});


Template.Hooks.events({
  "keyup #hookSearch": function(e) {
    var searchText = $(e.target).val().trim();
    console.log("hookSearch: " + searchText);
    Session.set('searchText', searchText);
    HookSearch.search(searchText);
  }
});
