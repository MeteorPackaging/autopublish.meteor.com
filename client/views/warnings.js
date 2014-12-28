'use strict';

Template.warnings.rendered = function(){
  this.$('i.warning.icon')
    .popup({
      inline   : true,
      hoverable: true,
      position : 'bottom left',
      delay: {
        show: 200,
        hide: 500
      }
    })
  ;
};
