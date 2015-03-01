'use strict';

/* global
		HookPayloads: false,
		processHookPingEvent: false
*/

Meteor.methods({
	processPublishRequest: function(payload) {
		/*
		console.log('Received publish request');
		console.log('Payload:');
		console.dir(payload);
		*/

		// Stores the received payload as requests log...
		var payloadDoc = {
			receivedAt: new Date(),
			payload: payload,
		};
		HookPayloads.insert(payloadDoc);

		// Checks if this is a webhook ping event
		// See https://developer.github.com/webhooks/#ping-event
		if (payload.zen) {
			processHookPingEvent(payload);
		}

		// Makes sure it's a 'valid' github webhook payload...
		if (!payload.repository) {
			throw new Meteor.Error(400, "Invalid Payload!");
		}

		var
			repository = payload.repository,
			repoId = repository.id,
			repoName = repository.name,
			repoFullName = repository.full_name
		;
		console.log('Repository: ' + repoName);

		// Looks for a valid subscription
		var sub = Subscriptions.findOne({
			repo: repoName,
			repoId: repoId,
		});

		if (!sub) {
			throw new Meteor.Error(403, "No subscription found for this repository!");
		}

		if (payload.hook) {
			// Test Payload
			var hookId = payload.hook_id;

			// Simply sets 'tested' field to true
			if (sub.hookId === hookId) {
				Subscriptions.update(sub._id, {
					$set: {
						tested: true
					}
				});
				console.log("Subscription successfully tested!");
			} else {
				throw new Meteor.Error(
					409,
					"Invalid hook id! Try disabling/re-enabling autopublish..."
				);
			}
		} else if (payload.action === 'published' && payload.release) {
			console.log('  release action');
			// New Release!
			var
				release = payload.release,
				publishedAt = release.published_at,
				tagName = release.tag_name,
				releaseName = release.name,
				releaseBody = release.body,
				releaseTargetCommittish = release.target_commitish,
				repoCloneUrl = repository.clone_url
			;

			// Adds the new publish request
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
			AutoPublish.insert({
				createdAt: new Date(),
				publishedAt: publishedAt,
				pkgName: sub.pkgName,
				tagName: tagName,
				releaseName: releaseName,
				releaseTargetCommittish: releaseTargetCommittish,
				repoCloneUrl: repoCloneUrl,
				status: 'queueing',
			});
			console.log('New Publish request created!');
		} else if (payload.ref_type === "tag") {
			/*
			"ref": "0.0.9",
			"ref_type": "tag",
			"master_branch": "master",
			*/
			// New Tag!
			console.log("Tag action");
			var
			  now = new Date(),
				releaseName = payload.ref,
				releaseTargetCommittish = payload.master_branch,
			  repoCloneUrl = payload.repository.clone_url,
				tagName = payload.ref
			;

			// Adds the new publish request
			// documents are in the form:
			//
			// {
			//   createdAt: Date
			//   publishedAt: Date
			//   completedAt: Date
			//   pkgName: String
			//   tagName: String
			//   version: String
			//   arch: String
			//   status: String ('queueing, successful, errored')
			//   errors: [String]
			// }
			AutoPublish.insert({
				createdAt: now,
				publishedAt: now,
				pkgName: sub.pkgName,
				tagName: tagName,
				releaseTargetCommittish: releaseTargetCommittish,
				repoCloneUrl: repoCloneUrl,
				status: 'queueing',
			});
			console.log('New Publish request created!');
	  } else if (payload.head_commit) {
			console.log('  push action');
			var
				repoCommit = payload.head_commit.id,
				repoName = payload.repository.name,
				repoUrl = payload.repository.git_url,
				meteorUser = process.env.METEOR_USER,
				meteorPwd = process.env.METEOR_PWD;

			console.log('  commit: ' + repoCommit);
			console.log('  name  : ' + repoName);
			console.log('  url   : ' + repoUrl);

			//publishPackage(repoUrl, repoName, repoCommit, meteorUser, meteorPwd);
		}
	}
});

// Tag Payload
/*
{
	"ref": "0.0.9",
	"ref_type": "tag",
	"master_branch": "master",
	"description": "Dummy package to be used to test auto-publish with TravisCI",
	"pusher_type": "user",
	"repository": {
		"id": 28239280,
		"name": "autopublish-test",
		"full_name": "MeteorPackaging/autopublish-test",
		"owner": {
			"login": "MeteorPackaging",
			"id": 10003264,
			"avatar_url": "https://avatars.githubusercontent.com/u/10003264?v=3",
			"gravatar_id": "",
			"url": "https://api.github.com/users/MeteorPackaging",
			"html_url": "https://github.com/MeteorPackaging",
			"followers_url": "https://api.github.com/users/MeteorPackaging/followers",
			"following_url": "https://api.github.com/users/MeteorPackaging/following{/other_user}",
			"gists_url": "https://api.github.com/users/MeteorPackaging/gists{/gist_id}",
			"starred_url": "https://api.github.com/users/MeteorPackaging/starred{/owner}{/repo}",
			"subscriptions_url": "https://api.github.com/users/MeteorPackaging/subscriptions",
			"organizations_url": "https://api.github.com/users/MeteorPackaging/orgs",
			"repos_url": "https://api.github.com/users/MeteorPackaging/repos",
			"events_url": "https://api.github.com/users/MeteorPackaging/events{/privacy}",
			"received_events_url": "https://api.github.com/users/MeteorPackaging/received_events",
			"type": "Organization",
			"site_admin": false
		},
		"private": false,
		"html_url": "https://github.com/MeteorPackaging/autopublish-test",
		"description": "Dummy package to be used to test auto-publish with TravisCI",
		"fork": false,
		"url": "https://api.github.com/repos/MeteorPackaging/autopublish-test",
		"forks_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/forks",
		"keys_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/keys{/key_id}",
		"collaborators_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/collaborators{/collaborator}",
		"teams_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/teams",
		"hooks_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks",
		"issue_events_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/events{/number}",
		"events_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/events",
		"assignees_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/assignees{/user}",
		"branches_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/branches{/branch}",
		"tags_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/tags",
		"blobs_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/blobs{/sha}",
		"git_tags_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/tags{/sha}",
		"git_refs_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/refs{/sha}",
		"trees_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/trees{/sha}",
		"statuses_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/statuses/{sha}",
		"languages_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/languages",
		"stargazers_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/stargazers",
		"contributors_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/contributors",
		"subscribers_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/subscribers",
		"subscription_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/subscription",
		"commits_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/commits{/sha}",
		"git_commits_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/commits{/sha}",
		"comments_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/comments{/number}",
		"issue_comment_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/comments/{number}",
		"contents_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/contents/{+path}",
		"compare_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/compare/{base}...{head}",
		"merges_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/merges",
		"archive_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/{archive_format}{/ref}",
		"downloads_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/downloads",
		"issues_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues{/number}",
		"pulls_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/pulls{/number}",
		"milestones_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/milestones{/number}",
		"notifications_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/notifications{?since,all,participating}",
		"labels_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/labels{/name}",
		"releases_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/releases{/id}",
		"created_at": "2014-12-19T17:32:50Z",
		"updated_at": "2015-01-05T20:34:06Z",
		"pushed_at": "2015-01-05T20:34:15Z",
		"git_url": "git://github.com/MeteorPackaging/autopublish-test.git",
		"ssh_url": "git@github.com:MeteorPackaging/autopublish-test.git",
		"clone_url": "https://github.com/MeteorPackaging/autopublish-test.git",
		"svn_url": "https://github.com/MeteorPackaging/autopublish-test",
		"homepage": null,
		"size": 252,
		"stargazers_count": 0,
		"watchers_count": 0,
		"language": "Shell",
		"has_issues": true,
		"has_downloads": true,
		"has_wiki": true,
		"has_pages": false,
		"forks_count": 0,
		"mirror_url": null,
		"open_issues_count": 0,
		"forks": 0,
		"open_issues": 0,
		"watchers": 0,
		"default_branch": "master"
	},
	"organization": {
		"login": "MeteorPackaging",
		"id": 10003264,
		"url": "https://api.github.com/orgs/MeteorPackaging",
		"repos_url": "https://api.github.com/orgs/MeteorPackaging/repos",
		"events_url": "https://api.github.com/orgs/MeteorPackaging/events",
		"members_url": "https://api.github.com/orgs/MeteorPackaging/members{/member}",
		"public_members_url": "https://api.github.com/orgs/MeteorPackaging/public_members{/member}",
		"avatar_url": "https://avatars.githubusercontent.com/u/10003264?v=3",
		"description": "Fork a library, follow the directions for adding Meteor packages, and submit a PR to its authors"
	},
	"sender": {
		"login": "splendido",
		"id": 6148980,
		"avatar_url": "https://avatars.githubusercontent.com/u/6148980?v=3",
		"gravatar_id": "",
		"url": "https://api.github.com/users/splendido",
		"html_url": "https://github.com/splendido",
		"followers_url": "https://api.github.com/users/splendido/followers",
		"following_url": "https://api.github.com/users/splendido/following{/other_user}",
		"gists_url": "https://api.github.com/users/splendido/gists{/gist_id}",
		"starred_url": "https://api.github.com/users/splendido/starred{/owner}{/repo}",
		"subscriptions_url": "https://api.github.com/users/splendido/subscriptions",
		"organizations_url": "https://api.github.com/users/splendido/orgs",
		"repos_url": "https://api.github.com/users/splendido/repos",
		"events_url": "https://api.github.com/users/splendido/events{/privacy}",
		"received_events_url": "https://api.github.com/users/splendido/received_events",
		"type": "User",
		"site_admin": false
	}
}
*/

// Release Payload
/*
{
	"action": "published",
	"release": {
		"url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/releases/821965",
		"assets_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/releases/821965/assets",
		"upload_url": "https://uploads.github.com/repos/MeteorPackaging/autopublish-test/releases/821965/assets{?name}",
		"html_url": "https://github.com/MeteorPackaging/autopublish-test/releases/tag/0.0.7",
		"id": 821965,
		"tag_name": "0.0.7",
		"target_commitish": "master",
		"name": "First AutoPublish test!",
		"draft": false,
		"author": {
			"login": "splendido",
			"id": 6148980,
			"avatar_url": "https://avatars.githubusercontent.com/u/6148980?v=3",
			"gravatar_id": "",
			"url": "https://api.github.com/users/splendido",
			"html_url": "https://github.com/splendido",
			"followers_url": "https://api.github.com/users/splendido/followers",
			"following_url": "https://api.github.com/users/splendido/following{/other_user}",
			"gists_url": "https://api.github.com/users/splendido/gists{/gist_id}",
			"starred_url": "https://api.github.com/users/splendido/starred{/owner}{/repo}",
			"subscriptions_url": "https://api.github.com/users/splendido/subscriptions",
			"organizations_url": "https://api.github.com/users/splendido/orgs",
			"repos_url": "https://api.github.com/users/splendido/repos",
			"events_url": "https://api.github.com/users/splendido/events{/privacy}",
			"received_events_url": "https://api.github.com/users/splendido/received_events",
			"type": "User",
			"site_admin": false
		},
		"prerelease": false,
		"created_at": "2015-01-03T21:15:06Z",
		"published_at": "2015-01-03T21:16:42Z",
		"assets": [

		],
		"tarball_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/tarball/0.0.7",
		"zipball_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/zipball/0.0.7",
		"body": "This should trigger the webhook pointing to autopublish.meteor.com :-)"
	},
	"repository": {
		"id": 28239280,
		"name": "autopublish-test",
		"full_name": "MeteorPackaging/autopublish-test",
		"owner": {
			"login": "MeteorPackaging",
			"id": 10003264,
			"avatar_url": "https://avatars.githubusercontent.com/u/10003264?v=3",
			"gravatar_id": "",
			"url": "https://api.github.com/users/MeteorPackaging",
			"html_url": "https://github.com/MeteorPackaging",
			"followers_url": "https://api.github.com/users/MeteorPackaging/followers",
			"following_url": "https://api.github.com/users/MeteorPackaging/following{/other_user}",
			"gists_url": "https://api.github.com/users/MeteorPackaging/gists{/gist_id}",
			"starred_url": "https://api.github.com/users/MeteorPackaging/starred{/owner}{/repo}",
			"subscriptions_url": "https://api.github.com/users/MeteorPackaging/subscriptions",
			"organizations_url": "https://api.github.com/users/MeteorPackaging/orgs",
			"repos_url": "https://api.github.com/users/MeteorPackaging/repos",
			"events_url": "https://api.github.com/users/MeteorPackaging/events{/privacy}",
			"received_events_url": "https://api.github.com/users/MeteorPackaging/received_events",
			"type": "Organization",
			"site_admin": false
		},
		"private": false,
		"html_url": "https://github.com/MeteorPackaging/autopublish-test",
		"description": "Dummy package to be used to test auto-publish with TravisCI",
		"fork": false,
		"url": "https://api.github.com/repos/MeteorPackaging/autopublish-test",
		"forks_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/forks",
		"keys_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/keys{/key_id}",
		"collaborators_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/collaborators{/collaborator}",
		"teams_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/teams",
		"hooks_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks",
		"issue_events_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/events{/number}",
		"events_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/events",
		"assignees_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/assignees{/user}",
		"branches_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/branches{/branch}",
		"tags_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/tags",
		"blobs_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/blobs{/sha}",
		"git_tags_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/tags{/sha}",
		"git_refs_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/refs{/sha}",
		"trees_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/trees{/sha}",
		"statuses_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/statuses/{sha}",
		"languages_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/languages",
		"stargazers_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/stargazers",
		"contributors_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/contributors",
		"subscribers_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/subscribers",
		"subscription_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/subscription",
		"commits_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/commits{/sha}",
		"git_commits_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/git/commits{/sha}",
		"comments_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/comments{/number}",
		"issue_comment_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/comments/{number}",
		"contents_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/contents/{+path}",
		"compare_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/compare/{base}...{head}",
		"merges_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/merges",
		"archive_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/{archive_format}{/ref}",
		"downloads_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/downloads",
		"issues_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/issues{/number}",
		"pulls_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/pulls{/number}",
		"milestones_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/milestones{/number}",
		"notifications_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/notifications{?since,all,participating}",
		"labels_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/labels{/name}",
		"releases_url": "https://api.github.com/repos/MeteorPackaging/autopublish-test/releases{/id}",
		"created_at": "2014-12-19T17:32:50Z",
		"updated_at": "2015-01-03T21:15:15Z",
		"pushed_at": "2015-01-03T21:16:42Z",
		"git_url": "git://github.com/MeteorPackaging/autopublish-test.git",
		"ssh_url": "git@github.com:MeteorPackaging/autopublish-test.git",
		"clone_url": "https://github.com/MeteorPackaging/autopublish-test.git",
		"svn_url": "https://github.com/MeteorPackaging/autopublish-test",
		"homepage": null,
		"size": 232,
		"stargazers_count": 0,
		"watchers_count": 0,
		"language": "Shell",
		"has_issues": true,
		"has_downloads": true,
		"has_wiki": true,
		"has_pages": false,
		"forks_count": 0,
		"mirror_url": null,
		"open_issues_count": 0,
		"forks": 0,
		"open_issues": 0,
		"watchers": 0,
		"default_branch": "master"
	},
	"organization": {
		"login": "MeteorPackaging",
		"id": 10003264,
		"url": "https://api.github.com/orgs/MeteorPackaging",
		"repos_url": "https://api.github.com/orgs/MeteorPackaging/repos",
		"events_url": "https://api.github.com/orgs/MeteorPackaging/events",
		"members_url": "https://api.github.com/orgs/MeteorPackaging/members{/member}",
		"public_members_url": "https://api.github.com/orgs/MeteorPackaging/public_members{/member}",
		"avatar_url": "https://avatars.githubusercontent.com/u/10003264?v=3",
		"description": "Fork a library, follow the directions for adding Meteor packages, and submit a PR to its authors"
	},
	"sender": {
		"login": "splendido",
		"id": 6148980,
		"avatar_url": "https://avatars.githubusercontent.com/u/6148980?v=3",
		"gravatar_id": "",
		"url": "https://api.github.com/users/splendido",
		"html_url": "https://github.com/splendido",
		"followers_url": "https://api.github.com/users/splendido/followers",
		"following_url": "https://api.github.com/users/splendido/following{/other_user}",
		"gists_url": "https://api.github.com/users/splendido/gists{/gist_id}",
		"starred_url": "https://api.github.com/users/splendido/starred{/owner}{/repo}",
		"subscriptions_url": "https://api.github.com/users/splendido/subscriptions",
		"organizations_url": "https://api.github.com/users/splendido/orgs",
		"repos_url": "https://api.github.com/users/splendido/repos",
		"events_url": "https://api.github.com/users/splendido/events{/privacy}",
		"received_events_url": "https://api.github.com/users/splendido/received_events",
		"type": "User",
		"site_admin": false
	}
}
*/


// Test Payload
/*
{
	zen: 'It\'s not fully shipped until it\'s fast.',
	hook_id: 3770015,
	hook: {
		url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/3770015',
		test_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/3770015/test',
		ping_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/3770015/pings',
		id: 3770015,
		name: 'web',
		active: true,
		events: ['release'],
		config: {
			url: 'http://2b233d0d.ngrok.com/publish',
			content_type: 'json'
		},
		last_response: {
			code: null,
			status: 'unused',
			message: null
		},
		updated_at: '2015-01-03T20:54:17Z',
		created_at: '2015-01-03T20:54:17Z'
	},
	repository: {
		id: 28239280,
		name: 'autopublish-test',
		full_name: 'MeteorPackaging/autopublish-test',
		owner: {
			login: 'MeteorPackaging',
			id: 10003264,
			avatar_url: 'https://avatars.githubusercontent.com/u/10003264?v=3',
			gravatar_id: '',
			url: 'https://api.github.com/users/MeteorPackaging',
			html_url: 'https://github.com/MeteorPackaging',
			followers_url: 'https://api.github.com/users/MeteorPackaging/followers',
			following_url: 'https://api.github.com/users/MeteorPackaging/following{/other_user}',
			gists_url: 'https://api.github.com/users/MeteorPackaging/gists{/gist_id}',
			starred_url: 'https://api.github.com/users/MeteorPackaging/starred{/owner}{/repo}',
			subscriptions_url: 'https://api.github.com/users/MeteorPackaging/subscriptions',
			organizations_url: 'https://api.github.com/users/MeteorPackaging/orgs',
			repos_url: 'https://api.github.com/users/MeteorPackaging/repos',
			events_url: 'https://api.github.com/users/MeteorPackaging/events{/privacy}',
			received_events_url: 'https://api.github.com/users/MeteorPackaging/received_events',
			type: 'Organization',
			site_admin: false
		},
		private: false,
		html_url: 'https://github.com/MeteorPackaging/autopublish-test',
		description: 'Dummy package to be used to test auto-publish with TravisCI',
		fork: false,
		url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test',
		forks_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/forks',
		keys_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/keys{/key_id}',
		collaborators_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/collaborators{/collaborator}',
		teams_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/teams',
		hooks_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks',
		issue_events_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/events{/number}',
		events_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/events',
		assignees_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/assignees{/user}',
		branches_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/branches{/branch}',
		tags_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/tags',
		blobs_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/git/blobs{/sha}',
		git_tags_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/git/tags{/sha}',
		git_refs_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/git/refs{/sha}',
		trees_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/git/trees{/sha}',
		statuses_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/statuses/{sha}',
		languages_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/languages',
		stargazers_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/stargazers',
		contributors_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/contributors',
		subscribers_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/subscribers',
		subscription_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/subscription',
		commits_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/commits{/sha}',
		git_commits_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/git/commits{/sha}',
		comments_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/comments{/number}',
		issue_comment_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/issues/comments/{number}',
		contents_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/contents/{+path}',
		compare_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/compare/{base}...{head}',
		merges_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/merges',
		archive_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/{archive_format}{/ref}',
		downloads_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/downloads',
		issues_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/issues{/number}',
		pulls_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/pulls{/number}',
		milestones_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/milestones{/number}',
		notifications_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/notifications{?since,all,participating}',
		labels_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/labels{/name}',
		releases_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/releases{/id}',
		created_at: '2014-12-19T17:32:50Z',
		updated_at: '2014-12-20T16:08:33Z',
		pushed_at: '2014-12-20T16:08:33Z',
		git_url: 'git://github.com/MeteorPackaging/autopublish-test.git',
		ssh_url: 'git@github.com:MeteorPackaging/autopublish-test.git',
		clone_url: 'https://github.com/MeteorPackaging/autopublish-test.git',
		svn_url: 'https://github.com/MeteorPackaging/autopublish-test',
		homepage: null,
		size: 232,
		stargazers_count: 0,
		watchers_count: 0,
		language: 'Shell',
		has_issues: true,
		has_downloads: true,
		has_wiki: true,
		has_pages: false,
		forks_count: 0,
		mirror_url: null,
		open_issues_count: 0,
		forks: 0,
		open_issues: 0,
		watchers: 0,
		default_branch: 'master'
	},
	sender: {
		login: 'splendido',
		id: 6148980,
		avatar_url: 'https://avatars.githubusercontent.com/u/6148980?v=3',
		gravatar_id: '',
		url: 'https://api.github.com/users/splendido',
		html_url: 'https://github.com/splendido',
		followers_url: 'https://api.github.com/users/splendido/followers',
		following_url: 'https://api.github.com/users/splendido/following{/other_user}',
		gists_url: 'https://api.github.com/users/splendido/gists{/gist_id}',
		starred_url: 'https://api.github.com/users/splendido/starred{/owner}{/repo}',
		subscriptions_url: 'https://api.github.com/users/splendido/subscriptions',
		organizations_url: 'https://api.github.com/users/splendido/orgs',
		repos_url: 'https://api.github.com/users/splendido/repos',
		events_url: 'https://api.github.com/users/splendido/events{/privacy}',
		received_events_url: 'https://api.github.com/users/splendido/received_events',
		type: 'User',
		site_admin: false
	}
}
*/
