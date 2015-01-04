/* global AutoPublish: true, Subscriptions: true */

AutoPublish = new Mongo.Collection('autopublish');

// documents are in the form:
//
// {
//   createdAt: Date
//   completedAt: Date
//   packageName: String
//   version: String
//   arch: String
//   status: String ('queueing, successful, errored')
//  error: String
// }


Subscriptions = new Mongo.Collection('subscriptions');

// documents are in the form:
//
// {
//   user: String
//   repo: String
//   repoId: String
//   hookId: String
//   hookEvents: [String]
//   pkgName: String
//   pkgVersion: String
//   gitUrl: String
// }
