/* global Statistics: true */
Statistics = new Mongo.Collection("statistics");

Meteor.subscribe("statistics");
