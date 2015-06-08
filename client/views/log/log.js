/* global
		AutoPublish: false
*/
'use strict';

Template.Log.onCreated(function () {
	var
		self = this,
		logId = Router.current().params._id
	;

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

		return log;
	}
});
