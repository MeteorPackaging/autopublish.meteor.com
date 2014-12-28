'use strict';

Router.configure({
  layoutTemplate: 'masterLayout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'pageNotFound',
  yieldTemplates: {
    nav: {to: 'nav'},
    footer: {to: 'footer'},
  }
});


Router.route('/', {
    name: 'home',
});

Router.route('/accounts', {
  name: 'accounts',
  onBeforeAction: function(){
    if (!Meteor.loggingIn() && !Meteor.userId()) {
      Router.go('home');
    }
    else {
      this.next();
    }
  },
});

Router.route('/publish', function () {
  // NodeJS request object
  var request = this.request;

  // NodeJS response object
  var response = this.response;

  // Asks to process the request
  Meteor.call('processPublishRequest', request.body, function(err){
    // Checks if some error occurred...
    if (err) {
      console.dir(err);
      // ...and in case it was, denies the request signalling the error
      response.writeHead(err.error);
      response.end(err.reason);
    }
    else {
      // Aknowledges the request in case of no error
      response.end();
    }
  });
}, {where: 'server'});
