/* global
    Roles: false
*/
'use strict';

// Grants admin rights to the following email addresses.
var admins = [
  {
    email: 'ddascalescu+github@gmail.com',
    username: 'dandv',
  },
  {
    email: 'ing.luca.mussi@gmail.com',
    username: 'splendido',
  },
  {
    email: 'simon.r.k.fridlund+github@gmail.com',
    username: 'zimme',
  },
];

_.each(admins, function(admin){
  var user = Meteor.users.findOne({
    "services.github.email" : admin.email,
    "services.github.username" : admin.username,
  });
  if (user && !Roles.userIsInRole(user._id, ['admin'])) {
    console.log("Granting admin rights to " + user.services.github.username);
    Roles.addUsersToRoles(user._id, ['admin']);
  }
});
