/* global
    actions: true,
    AutoPublish: false,
    getBuildMachine: false,
    Host: false,
    regularPublish: true
*/
'use strict';


regularPublish = function(pkgInfo, callback) {

  var
    arch = pkgInfo.firstArch || "os.linux.x86_64",
    credentials = Meteor.settings.defaultMeteorUser
  ;

  getBuildMachine(
    arch,
    pkgInfo,
    credentials,
    Meteor.bindEnvironment(function(err, getMachineResult) {
      if (getMachineResult.success) {

        var progress = {
          send: Meteor.bindEnvironment(function(msg){
            // Possibly removes initial IP address of the build machie
            msg = msg.replace(/^[0-9.]*: /, "");

            // Updates the publish action object to show this last message
            // ...but not the last one which usually comes too late when the
            // connection is actually closed!
            if (msg !== "Completed") {
              AutoPublish.update(pkgInfo._id, {
                $set: {
                  publishing: msg
                }
              });
            }
          })
        };

        // Creates the ssh interface to the remote machine
        // XXX: this should be transformed into a cycle to get machines
        //      for all three architectures when it is the case.
        var buildMachine = new Host(
          getMachineResult.machineInfo,
          // Meteor.settings.supportMachine,
          progress
        );
        buildMachine.connectedMessage = "Connected to remote Build Machine";
        // Uncomment the following line to get some debug log
        // buildMachine.verbose = true;

        // Log the current architecture
        buildMachine.addCommand('msg:Running on ' + arch + '...');

        // Command sequence
        buildMachine.addCommand('msg:Initial checks...');

        // Log free memory
        var cmd = 'free';
        buildMachine.addCommand(cmd);

        actions.checkMeteorVersion(buildMachine, pkgInfo);
        actions.loginMeteorUser(buildMachine, pkgInfo, credentials);
        actions.checkMeteorUser(buildMachine, pkgInfo, credentials.userName);

        // Possibly removes old autopublish folder
        cmd = 'rm -rf autopublish';
        buildMachine.addCommand('msg:Preparing environment...');
        buildMachine.addCommand(cmd);

        // Clones the repository and checks out the latest release
        // FIXME: does not work on git 1.7 (i.e. on meteor build machines...)
        //actions.cloneRepositoryAtTag(buildMachine, pkgInfo, "autopublish");

        // Clones the repository and checks out the latest release
        actions.cloneRepository(buildMachine, pkgInfo, "autopublish");

        // Moves into the cloned repo
        cmd = 'cd autopublish';
        buildMachine.addCommand(cmd);
        buildMachine.addCompleteAction({
          cmd: cmd,
          callback: function(response, hostObj) {
            if (/No such file or directory/.test(response)){
              hostObj.result.success = false;
              hostObj.errors.push('Unable to clone the repository');
              this.endCommands();
            }
          }
        });

        // Checks out the latest release
        buildMachine.addCommand('msg:Done!');
        actions.checkoutTag(buildMachine, pkgInfo);

        // Check the package name to make sure it matches the correct one
        // this is to prevent attacks trying to publish with different names
        // than the registered one!
        actions.checkPackageName(buildMachine, pkgInfo);

        // Runs 'meteor publish'
        actions.meteorPublish(buildMachine, pkgInfo);

        // Everything done!
        buildMachine.addCommand('msg:Done!');

        // Double check running 'meteor show'
        actions.done(buildMachine, pkgInfo);

        // Actually starts the command sequence
        buildMachine.run(function(err, sessionText, hostObj){

          var result = hostObj.result;
          // Stores the sessionText as the sequence log
          result.log = sessionText;

          if (err) {
            result.success = false;
            result.errors = [JSON.stringify(err)];
          }
          else if (hostObj.errors.length > 0){
            result.success = false;
            result.errors = hostObj.errors;
          }
          else if (!hostObj.result.completed){
            hostObj.errors.push('Operations not completed!');

            result.success = false;
            result.errors = hostObj.errors;
          }
          else {
            result.success = true;
          }

          // Eventually calls the final callback
          callback(result);
        });
      }
      else {
        callback(getMachineResult);
      }
    })
  );
};
