/* global
		AutoPublish: false
*/
'use strict';

Template.Log.onCreated(function () {
	var
		self = this,
		logId = Router.current().params._id
	;

	console.log('Template Log');
	console.dir(Router.current().params);
	console.log(logId);

	self.logId = logId;

  // Use this.subscribe inside onCreated callback
  self.subscribe("log", logId);
});


Template.Log.helpers({
	publishAction: function(){
		var
			logId = Template.instance().logId,
			log = AutoPublish.findOne(logId)
		;

		console.dir(log);
		return log;
	}
});
