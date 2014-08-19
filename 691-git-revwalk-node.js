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
  var nodegit = require('nodegit');

  function revwalk_node(n) {
    RED.nodes.createNode(this,n);
    this.topic = n.topic;
    this.git_command = n.git_command;
    this.git_command_arguments = n.git_command_arguments;
    this.git_return_type = n.git_return_type;
    var node = this;

    this.on('input', function (msg) {
      console.log(msg);

      var newmsg,
        RevWalk_method = nodegit.RevWalk[node.git_command],
        has_callback = false,
        resolved_arguments = [],
        cb_string,
        cb_args;

      newmsg = {
        "topic":node.topic,
        "payload":{
          "return_type":node.git_return_type,
          "return_value":""
        }
      };

      node.git_command_arguments.forEach(function (elem,idx,array) {
        switch(elem.type) {
          case "Function":
            has_callback = true;
            break;
          case "CloneOptions":
            resolved_arguments.push(null);
            break;
          default:
            resolved_arguments.push(msg.payload[elem.name]);
            break;
        }
      });

      if (has_callback) {
        var cb = ( function (innode,inmsg) { return function (err,ret) {
            if (err) throw err;
            inmsg.payload.return_value = ret;
            innode.send(inmsg);
          }
        })(node,newmsg);

        resolved_arguments.push(cb);
        RevWalk_method.apply(RevWalk_method,resolved_arguments);
      } else {
        newmsg.payload.return_value = RevWalk_method.apply(RevWalk_method,resolved_arguments);
        node.send(newmsg);
      }
    });
  }

  RED.nodes.registerType('revwalk_node',revwalk_node);

  revwalk_node.prototype.close = function () {
    console.log('revwalk_node closed');
  };
}
