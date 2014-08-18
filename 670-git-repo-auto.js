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

  function auto_repo(n) {
    RED.nodes.createNode(this,n);
    this.topic = n.topic;
    this.git_command = n.git_command;
    this.git_command_arguments = n.git_command_arguments;
    this.git_return_type = n.git_return_type;
    var node = this;

    this.on('input', function (msg) {
      console.log(msg);

      var newmsg,
        repofunc = nodegit.Repo[node.git_command],
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
            cb_string = msg.payload[elem.name];
            cb_args = msg.payload['arguments'];
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
        var cb;
        if (node.git_command == "createRevWalk" ||
          node.git_command == "createBlobFromBuffer" ||
          node.git_command == "createCommit" ||
          node.git_command == "createRevWalk" ||
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
        } else if (node.git_command == "clone") {
          cb = function (err,repo) {
            if (err) throw err;

            newmsg["payload"]["return_value"] = repo;

            var sha = "59b20b8d5c6ff8d09518454d4dd8b7b30f095ab5";
              repo.getCommit(sha, function (err, commit) {
                if (err) throw err;

                commit.getEntry("README.md", function (err, entry) {
                  if (err) throw err;

                  entry.getBlob(function (err, blob) {
                    if (err) throw err;

                    console.log(entry.name() + entry.sha() + blob.size() + "b");

                    console.log(Array(72).join("=") + '\n\n');

                    console.log(String(blob));
                  });
                });
              });
              node.send(newmsg);
          };
  /*        cb = ( function (innode,inmsg) {
            return function (err,repo) {
              if (err) {
                throw err;
              }
              var retmsg = {
                "topic":inmsg["topic"],
                "payload":{
                  "return_type":inmsg["payload"]["return_type"],
                  "return_value":repo
                }
              };

              var sha = "59b20b8d5c6ff8d09518454d4dd8b7b30f095ab5";
              repo.getCommit(sha, function (err, commit) {
                if (err) throw err;

                commit.getEntry("README.md", function (err, entry) {
                  if (err) throw err;

                  entry.getBlob(function (err, blob) {
                    if (err) throw err;

                    console.log(entry.name() + entry.sha() + blob.size() + "b");

                    console.log(Array(72).join("=") + '\n\n');

                    console.log(String(blob));
                  });
                });
              });
              innode.send(retmsg);
            }
          })(node,newmsg);
          */
        } else {
          if (cb_string) {
            var cb = new Function(cb_args,cb_string);
          } else {
            cb = ( function (innode,inmsg) {
              return function (err,ret) {
                if (err) throw err;
                inmsg.payload.return_value = ret;
                innode.send(inmsg);
              }
            })(node,newmsg);
          }
        }

        resolved_arguments.push(cb);
        console.log(resolved_arguments);

        repofunc.apply(repofunc,resolved_arguments);
      } else {
        newmsg.payload.return_value = repofunc.apply(repofunc,resolved_arguments);
        node.send(newmsg);
      }
    });
  }

  RED.nodes.registerType('auto_repo',auto_repo);

  auto_repo.prototype.close = function () {
    console.log('auto_repo closed');
  };
}
