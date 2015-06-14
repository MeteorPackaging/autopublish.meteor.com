/* global
    actions: false
*/
'use strict';


actions.checkoutTag = function(machine, repoInfo){
  var cmd = "git checkout " + repoInfo.tagName;
  machine.addCommand('msg:Checking out ' + repoInfo.tagName + '...');
  machine.addCommand(cmd);
};


actions.cloneRepository = function(machine, repoInfo, destinationFolder){
  var cmd = "git clone " + repoInfo.repoCloneUrl + " " + destinationFolder;
  machine.addCommand('msg:Cloning Repository...');
  machine.addCommand(cmd);
};


actions.cloneRepositoryAtTag = function(machine, repoInfo, destinationFolder){
  var cmd =
    "git clone --branch " + repoInfo.tagName + " --depth 1 " +
    repoInfo.repoCloneUrl + " " +  destinationFolder
  ;
  machine.addCommand('msg:Cloning Repository at ' + repoInfo.tagName + '...');
  machine.addCommand(cmd);
};


actions.checkMeteorUser = function(machine, username) {
  // Checks currently logged in meteor user
  var cmd = '~/.meteor/meteor whoami';
  machine.addCommand('msg:Checking Meteor User...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(response, hostObj) {
      if (hostObj.verbose) {
        console.log("checkMeteorUser:");
        console.dir(username);
      }
      if (response === username) {
        hostObj.result.username = username;
        machine.addCommandToFront('msg:Logged in as ' + username);
      } else {
        hostObj.result.success = false;
        hostObj.errors.push(
          'Could not login user ' + username + ' on remote machine'
        );
        this.endCommands();
      }
    }
  });
};

actions.checkMeteorVersion = function(machine) {
  // Checks for currently installed Meteor Version
  var cmd = '~/.meteor/meteor --version';
  machine.addCommand('msg:Checking Meteor Version...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(response, hostObj) {
      var match = /.*Meteor\s([0-9\.]*)./.exec(response);
      if (match) {
        hostObj.result.meteorVersion = match[1];
      } else {
        hostObj.errors.push('Could not run meteor on remote machine');
        this.endCommands();
      }
    }
  });
};


actions.checkPackageName = function(machine, pkgInfo) {

  // Runs 'meteor show' and checks the current package name currently matches
  // the expected one:
  // this should prevent attemps to publishing packages with a different name
  // wrt the one for which they where registered to autopublish!

  var cmd = "meteor show " +
            pkgInfo.pkgName +
            " | grep `pwd` | awk '{print $1;}'";

  var afterPublishCallback = function(response, hostObj) {
    if (machine.verbose) {
      console.log("checkPackageName:");
      console.dir(response);
    }
    if (!response) {
      // Not reason to proceed, and attack is under attempt?!
      hostObj.result.success = false;
      hostObj.errors.push("Invalid package name!");
      this.endCommands();
    }
    else {
      machine.addCommandToFront(
        "msg:Package name is correct! " +
        "Publishing version " + response + "!"
      );
    }
  };
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: afterPublishCallback
  });
};

actions.done = function(machine, pkgInfo) {
  // Double checks by running 'meteor show'
  // end eventually marks the publish action as *completed*!
  var cmd = '~/.meteor/meteor show ' + pkgInfo.pkgName;
  machine.addCommand('msg:Double checking...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(response, hostObj) {
      hostObj.result.completed = true;
    }
  });
};

actions.getBuildMachine = function(machine, architecture) {
  // See the following links for more details (also about restrictions):
  // * https://github.com/meteor/meteor/wiki/Build-Machines
  // * https://www.meteor.com/services/build

  var cmd = 'meteor admin get-machine ' + architecture + ' --json';
  machine.addCommand('msg:Getting Build Machine for ' + architecture + '...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(response, hostObj) {
      // Sample errors:
      // * Error connecting to get-machines server: DDP connection timed out
      if (/error/gi.test(response)) {
        hostObj.result.success = false;
        hostObj.errors.push("Failed to get build machine!");
        this.endCommands();
      }
      else {
        var machineInfo = JSON.parse(response);
        hostObj.machineInfo = machineInfo;
      }
    }
  });
};

actions.loginMeteorUser = function(machine, credentials) {
  // Logs in a new meteor user
  var
    cmd = '~/.meteor/meteor login',
    pwdEntered = false,
    usernameEntered = false,
    loginSuccessDetected = false,
    loginFailed = true
  ;

  machine.addCommand('msg:Logging in Meteor User...');
  machine.addCommand(cmd);
  machine.addProcessingAction({
    cmd: cmd,
    callback: function(response, hostObj, stream) {
      if (hostObj.verbose) {
        console.log("loginMeteorUser ProcessingAction:");
        console.dir(response);
      }
      // Possibly inputs the password
      // ...password promt comes last, so check this first!
      if (/Password/gi.test(response) && !pwdEntered) {
        if (hostObj.verbose) {
          console.log("entering password!");
        }
        stream.write(credentials.pwd + '\n');
        pwdEntered = true;
      }
      // Possibly inputs the username
      // ...username prompt comes first, so check this after password...
      else if (/Username/gi.test(response) && !usernameEntered) {
        if (hostObj.verbose) {
          console.log("entering username!");
        }
        stream.write(credentials.userName + '\n');
        usernameEntered = true;
      }
      else if (/Login failed/gi.test(response)){
        if (hostObj.verbose) {
          console.log("********* LOGIN FAILED :-(");
        }
        machine.addCommandToFront(
          "msg:Failed to login user " + credentials.userName + "!"
        );
      }
      else {
        // Sanity check to confirm the user is logged in. Tipical response:
        // Logged in as xxxxxxx. Thanks for being a Meteor developer!
        var match = /.*Logged\sin\sas\s(\w+).*/gi.exec(response);
        if (match && match[1] === credentials.userName) {
          if (hostObj.verbose) {
            console.log("********* LOGIN SUCCEEDED :-)");
          }

          loginFailed = false;
          if (!loginSuccessDetected) {
            loginSuccessDetected = true;
            machine.addCommandToFront(
              "msg:Successfully logged in " + credentials.userName
            );
          }
        }
      }
    }
  });
};


actions.logoutMeteorUser = function(machine) {
  // Logs out the current meteor user
  var cmd = '~/.meteor/meteor logout';
  machine.addCommand('msg:Logging out Meteor User...');
  machine.addCommand(cmd);
};


actions.meteorPublish = function(machine, pkgInfo, publishForArch) {
  // Runs 'meteor publish'

  var cmd = null;
  if (publishForArch) {
    cmd =
      "~/.meteor/meteor publish-for-arch " +
      pkgInfo.pkgName + '@' + pkgInfo.version
    ;
  }
  else {
    cmd = "~/.meteor/meteor publish";
  }
  console.log("meteorPublish cmd:");
  console.log(cmd);

  var afterPublishCallback = function(response, hostObj) {
    if (machine.verbose) {
      console.log("meteorPublish:");
      console.dir(response);
    }
    if (/There is no package named/gi.test(response)) {
      // Not published, first time publishing!
      // Triggers a `meteor publish --create` command
      cmd += " --create";
      machine.addCommandToFront(cmd);
      machine.addCommandToFront("msg:First time publishing...");
      machine.addCompleteAction({
        cmd: cmd,
        callback: afterPublishCallback
      });
    }
    else if (/Version already exists/gi.test(response)) {
      // Not published, version already existed!
      hostObj.result.success = false;
      hostObj.errors.push("Version already exists");
      this.endCommands();
    }
    else if (/Documentation not found/gi.test(response)) {
      // Not published, Documentation not found!
      hostObj.result.success = false;
      hostObj.errors.push(
        "Documentation not found! " +
        "Check your *documentation* option inside " +
        "Package.describe (defaults to README.md)"
      );
      this.endCommands();
    }
    else if (/package description is too long/gi.test(response)) {
      // Not published, description is too long!
      hostObj.result.success = false;
      hostObj.errors.push("First section too long inside README.m");
      this.endCommands();
    }
    // Otherwise extracts publish information
    // else if (/Published/gi.test(response)) {
    else {
      var re = RegExp(".*Published " + pkgInfo.pkgName + "@(.*)\.", "gi");
      var match = re.exec(response);
      if (match) {
        // Successfully published!
        hostObj.result.success = true;
        // Gets the published version
        hostObj.result.version = match[1];
      }
      else {
        hostObj.result.success = false;
        hostObj.errors.push("Some error occurred :(");
        this.endCommands();
      }
    }
  };
  machine.addCommand('msg:Running publish for ' + pkgInfo.pkgName + '...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: afterPublishCallback
  });
};
