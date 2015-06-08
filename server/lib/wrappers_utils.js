/* global
  Subscriptions: false,
  wrappersUtils: true
*/
'use strict';


wrappersUtils = {

  get: function(repoInfo) {
    var repoFullName = repoInfo.fullName.split('/');

    return Subscriptions.findOne({
      user: repoFullName[0],
      repo: repoFullName[1],
      repoId: repoInfo.id,
    });
  },


  upsert: function(repoInfo, wrapInfo, user) {
    var repoFullName = repoInfo.fullName.split('/');

    Subscriptions.update({
      user: repoFullName[0],
      repo: repoFullName[1],
      repoId: repoInfo.id,
    }, {$set: {
      createdAt: new Date(),
      createdBy: user.profile.login,
      wrapper: true,
      deleted: false,
      user: repoFullName[0],
      repo: repoFullName[1],
      repoId: repoInfo.id,
      wrapInfo: wrapInfo,
      pkgName: repoInfo.pkgName,
	    pkgVersion: repoInfo.pkgVersion,
	    pkgSummary: repoInfo.pkgSummary,
      gitUrl: repoInfo.gitUrl,
    }}, {
      upsert: true
    });
  },


  delete: function(repoInfo, user) {
    var repoFullName = repoInfo.fullName.split('/');

    Subscriptions.update({
      user: repoFullName[0],
      repo: repoFullName[1],
      repoId: repoInfo.id,
    }, {
      $set: {
        deletedAt: new Date(),
				deletedBy: user.profile.login,
        deleted: true
      }
    });
  },

};
