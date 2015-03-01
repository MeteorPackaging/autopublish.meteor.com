'use strict';

Template.publishSubscription.helpers({
	atmosphereUrl: function(){
		var name = this.pkgName.split(':');
		if (name.length === 2){
			return "https://atmospherejs.com/" + name[0] + "/" + name[1];
		}
	},
});
