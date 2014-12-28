/* global AutoPublish: true, Accounts: true */

AutoPublish = new Mongo.Collection('autopublish');

// documents are in the form:
//
// {
// 	createdAt: Date
// 	completedAt: Date
// 	packageName: String
// 	version: String
// 	arch: String
// 	status: String ('queueing, successful, errored')
//  error: String
// }


Accounts = new Mongo.Collection('accounts');

// documents are in the form:
//
// {
// 	repo_id: Number
// 	branch: String
// 	event: String ('tag', 'release')
// 	arch: String
// }
