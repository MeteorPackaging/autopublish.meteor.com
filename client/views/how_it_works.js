'use strict';

var steps = [
	{
		_id: 0,
		icon: "cloud upload",
		title: "New Release",
		desc: "pushed to repo",
	},
	{
		_id: 1,
		icon: "announcement",
		title: "Web Hook",
		desc: "from GitHub",
	},
	{
		_id: 2,
		icon: "wizard",
		title: "Autopublish",
		desc: "takes delivery",
	},
	{
		_id: 3,
		icon: "settings",
		title: "Build Machine",
		desc: "remote hard work",
	},
];

Template.howItWorks.created = function(){
	this.activeStep = new ReactiveVar(0);
};

Template.howItWorks.helpers({
	active: function(){
		if (this._id === Template.instance().activeStep.get()) {
			return "active";
		}
	},
	display: function(id){
		return id === Template.instance().activeStep.get();
	},
	numSteps: "four",
	steps: steps,
});

Template.howItWorks.events({
	'click .step': function(e, instance){
		e.preventDefault();
		instance.activeStep.set(this._id);
	}
});
