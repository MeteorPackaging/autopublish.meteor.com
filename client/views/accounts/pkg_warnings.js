'use strict';

Template.pkgWarnings.onRendered(function(){
  this.$('i.warning.icon')
    .popup({
      inline   : true,
      hoverable: true,
      position : 'bottom right',
      delay: {
        show: 200,
        hide: 500
      }
    })
  ;
});
