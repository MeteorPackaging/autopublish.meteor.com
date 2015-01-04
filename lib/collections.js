/* global
		AutoPublish: true,
		completedSelector: true,
		newestCompleted: true,
		oldestQueueing: true,
		queueingSelector: true,
		Subscriptions: true
*/

AutoPublish = new Mongo.Collection('autopublish');

// documents are in the form:
//
// {
// 		createdAt: Date
// 		completedAt: Date
// 		publishedAt: Date
// 		pkgName: String
// 		tagName: String
// 		releaseName: String
// 		releaseTargetCommittish: String
// 		repoCloneUrl: String
// 		status: String ('queueing', 'successful', 'errored')
// }

queueingSelector = {
	status: 'queueing'
};


completedSelector = {
	status: {
		$ne: 'queueing'
	}
};

// Newest completed first
newestCompleted = {sort: {completedAt: -1}};

// Oldest queueing first
oldestQueueing = {sort: {createdAt: 1}};


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
