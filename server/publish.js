'use strict';

var
  childProcess = Npm.require('child_process'),
  exec = childProcess.exec,
  execFile = childProcess.execFile
;

// More concisely
var runCommand = function (error, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);

  if(error !== null) {
    console.log('exec error: ' + error);
  }
};

var publishPackage = function(
                        repoUrl,
                        repoName,
                        repoCommit,
                        meteorUser,
                        meteorPwd
                    ){
  exec("sh assets/app/scripts/publish.sh", {
    //cwd: "~/tmp/",
    env: {
      REPO_URL: repoUrl,
      REPO_NAME: repoName,
      REPO_COMMIT: repoCommit,
      METEOR_USER: meteorUser,
      METEOR_PWD: meteorPwd,
      HOME: process.env.HOME
    }
  }, runCommand);
};

/*


exec("ls -la", runCommand);

child_process.execFile(file, [args], [options], [callback])
  file String The filename of the program to run
  args Array List of string arguments
  options Object
    cwd String Current working directory of the child process
    env Object Environment key-value pairs
    encoding String (Default: 'utf8')
    timeout Number (Default: 0)
    maxBuffer Number (Default: 200*1024)
    killSignal String (Default: 'SIGTERM')
    callback Function called with the output when process terminates
      error Error
      stdout Buffer
      stderr Buffer
  Return: ChildProcess object

  REPO_URL
  REPO_NAME
  REPO_COMMIT
  METEOR_USER
  METEOR_PWD
*/


Meteor.methods({
  processPublishRequest: function(payload){
    console.log('Received publish request');
    //console.log('Payload:');
    //console.dir(payload);

    if (!payload.repository) {
      throw new Meteor.Error(400, "Invalid Payload!");
    }

    if (payload.head_commit) {
      console.log('  push action');
      var
        repoCommit = payload.head_commit.id,
        repoName = payload.repository.name,
        repoUrl = payload.repository.git_url,
        meteorUser = process.env.METEOR_USER,
        meteorPwd = process.env.METEOR_PWD
      ;

      console.log('  commit: ' + repoCommit);
      console.log('  name  : ' + repoName);
      console.log('  url   : ' + repoUrl);

      publishPackage(repoUrl, repoName, repoCommit, meteorUser, meteorPwd);
    }
    if (payload.action && payload.action === 'published') {
      console.log('  release action');
    }

  }
});
