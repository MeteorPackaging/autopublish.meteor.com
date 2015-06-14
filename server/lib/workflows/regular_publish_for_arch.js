/* global
    actions: true,
    AutoPublish: false,
    getBuildMachine: false,
    Host: false,
    regularPublishForArch: true
*/
'use strict';


regularPublishForArch = function(pkgInfo, callback) {

  var credentials = Meteor.settings.defaultMeteorUser;

  getBuildMachine(
    pkgInfo.forArch,
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

        // Command sequence
        buildMachine.addCommand('msg:Initial checks...');

        // Possibly log free memory
        var cmd = 'free';
        if (pkgInfo.forArch !== 'os.windows.x86_32') {
          buildMachine.addCommand(cmd);
        }

        actions.checkMeteorVersion(buildMachine, pkgInfo);
        actions.loginMeteorUser(buildMachine, pkgInfo, credentials);
        actions.checkMeteorUser(buildMachine, pkgInfo, credentials.userName);

        // Possibly removes old autopublish folder
        if (pkgInfo.forArch === 'os.windows.x86_32') {
          cmd = 'rmdir /s /q autopublish';
        }
        else {
          cmd = 'rm -rf autopublish';
        }

        buildMachine.addCommand('msg:Preparing environment...');
        buildMachine.addCommand(cmd);

        // Runs 'meteor publish'
        actions.meteorPublish(buildMachine, pkgInfo, true);

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
