/**
 * Copyright 2014 Tailored Cloud
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  var nodegit = require('nodegit'),
    cron = require('cron');

  function manual_repo(n) {
    RED.nodes.createNode(this,n);
    this.topic = n.topic;
    this.repeat = n.repeat;
    this.crontab = n.crontab;
    this.once = n.once;
    this.interval_id = null;
    this.cronjob = null;
    this.git_command = n.git_command;
    this.git_command_arguments = n.git_command_arguments;
//    this.git_command_argument_names = n.git_command_argument_names;
    this.git_return_type = n.git_return_type;
    var node = this;

    if (this.repeat && !isNaN(this.repeat) && this.repeat > 0) {
      this.repeat = this.repeat * 1000;
      this.log('repeat = '+this.repeat);
      this.interval_id = setInterval( function () {
        node.emit('input',{});
      }, this.repeat);
    } else if (this.crontab) {
      if (cron) {
        this.log('crontab = '+this.crontab);
        this.crontab = new cron.CronJob(this.crontab,
          function () {
            node.emit('input',{});
          },
          null, true);
      } else {
          this.error("'cron' module not found");
      }
    }

    if (this.once) {
      setTimeout( function () { node.emit('input',{}); }, 100);
    }

    this.on('input',function(msg) {
      var newmsg,
        repofunc = nodegit.Repo[node.git_command],
        has_callback = false,
        resolved_arguments = [];

      newmsg = {
        topic:this.topic,
        payload:{
          return_type:node.git_return_type,
          return_value:""
        }
      };

/*
      node.git_command_arguments.forEach(function(element,index,array){
        console.log('argument '+element.name+' = '+element.value+' of type '+element.type);
        var nmtype, valtype, typtype;
        if (element.name instanceof )
        console.log('typeof name:' + (typeof element.name));
        console.log('typeof value:' + (typeof element.value));
        console.log('typeof type:' + (typeof element.type));

        switch(element.type) {
          case "Function":
            has_callback = true;
            break;
          case "Number":
            resolved_arguments.push(parseInt(element.value));
            break;
          case "CloneOptions":
            resolved_arguments.push(null);
            break;
          case "Signature":
            var sigarray = element.value.split(','),
              signame = sigarray[0],
              sigemail = sigarray[1]||'';
            var signature = nodegit.Signature.now(signame,sigemail);
            resolved_arguments.push(signature);
            break;
          default:
            resolved_arguments.push(element.value);
            break;
        }
      });
      */

      for(var i = 0; i < node.git_command_arguments.length; i++) {
        var element = node.git_command_arguments[i];
        switch(element.type) {
          case "Function":
            has_callback = true;
            break;
          case "Number":
            resolved_arguments.push(parseInt(element.value));
            break;
          case "CloneOptions":
            resolved_arguments.push(null);
            break;
          case "Signature":
            var sigarray = element.value.split(','),
              signame = sigarray[0],
              sigemail = sigarray[1]||'';
            var signature = nodegit.Signature.now(signame,sigemail);
            resolved_arguments.push(signature);
            break;
          default:
            resolved_arguments.push(element.value);
            break;
        }

      }

      console.log('repofunc:');
      console.log(repofunc);

      console.log('resolved_arguments');
      console.log(resolved_arguments);

      if (has_callback) {
        var cb;
        if (node.git_command == "createRevWalk" ||
          node.git_command == "getBlob" ||
          node.git_command == "getBranch" ||
          node.git_command == "getCommit" ||
          node.git_command == "getMaster" ||
          node.git_command == "getReference" ||
          node.git_command == "getTag" ||
          node.git_command == "getTree") {
          cb = ( function (innode,inmsg) {
            return function (ret) {
              inmsg.payload.return_value = ret;
              innode.send(inmsg);
            }
          })(node,newmsg);
        } else {
          cb = ( function (innode,inmsg) {
            return function (err,ret) {
              if (err) throw err;
              inmsg.payload.return_value = ret;
              innode.send(inmsg);
            }
          })(node,newmsg);
        }

        resolved_arguments.push(cb);
        repofunc.apply(repofunc,resolved_arguments);
 //       repofunc(resolved_arguments);

  //      nodegit.Repo[node.git_command](resolved_arguments);
      } else {
 //       newmsg.payload.return_value = nodegit.Repo[node.git_command](resolved_arguments);
 //         newmsg.payload.return_value = repofunc(resolved_arguments);
        newmsg.payload.return_value = repofunc.apply(repofunc,resolved_arguments);
        node.send(newmsg);
      }

    });
  }

  RED.nodes.registerType('manual_repo',manual_repo);

  manual_repo.prototype.close = function () {
    console.log('manual_repo closed');
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
      this.log('manual_repo: repeat stopped');
    } else if (this.cronjob != null) {
      this.cronjob.stop();
      this.log('manual_repo: cronjob stopped');
      delete this.cronjob;
    }
  };

  RED.httpAdmin.post('/manual_repo/:id',function(req,res) {
    var node = RED.nodes.getNode(req.params.id);
    if (node != null) {
      try {
        node.receive();
        res.send(200);
      } catch(err) {
        res.send(500);
        node.error('manual_repo failed:'+err);
        console.log(err.stack);
      }
    } else {
      res.send(404);
    }
  });
}
