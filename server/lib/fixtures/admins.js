/* global
    Roles: false
*/
'use strict';

// Grants admin rights to the following email addresses.
var adminEmails = [
  'ing.luca.mussi@gmail.com',
];

_.each(adminEmails, function(email){
  var user = Meteor.users.findOne({"emails.address" : email});
  if (user) {
    console.log("Granting admin rights to " + user.profile.login);
    Roles.addUsersToRoles(user._id, ['admin']);
  }
});
