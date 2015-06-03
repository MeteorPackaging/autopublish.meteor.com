'use strict';

Template.repoErrors.onRendered(function(){
  this.$('i.remove.circle.icon')
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
