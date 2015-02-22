'use strict';
/* global
    actions: false,
    AutoPublish: false,
    getBuildMachine: true,
    Host: false
*/

getBuildMachine = function(architecture, pkgInfo, userCredentials, callback) {

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
  var machine = new Host(
    Meteor.settings.supportMachine,
    progress
  );
  machine.connectedMessage = "Connected to Support Machine";

  // Command sequence
  actions.checkMeteorVersion(machine);
  actions.loginMeteorUser(machine, userCredentials);
  actions.getBuildMachine(machine, architecture);

  // Actually starts the command sequence
  machine.run(function(err, sessionText, hostObj){

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
    else {
      var machineInfo = hostObj.machineInfo;
      result.success = true;
      result.machineInfo = {
        host: machineInfo.host,
        port: machineInfo.port,
        userName: machineInfo.username,
        // publicKey: machineInfo.hostKey,
        privateKey: machineInfo.key,
      };
    }

    // Eventually calls the final callback
    callback(null, result);
  });
};
