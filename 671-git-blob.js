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

//Require nodegit
var nodegit = require('nodegit');
//Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");

//The main node definition
function GitBlobNode(n) {
	// Create a RED node
	RED.nodes.createNode(this,n);

	var node = this;

  this.git_command = n.git_command;
  this.git_command_arguments = n.git_command_arguments;
	// Store local copies of the node configuration (as defined in the .html)
	this.topic = n.topic;

  this.on("input", function(msg) {




	});

	this.on("close", function () {
		// Called when the node is shutdown - eg on redeploy
		// Allows ports to be closed, connections dropped etc.
		// eg: this.client.disconnect();
	});
}

RED.nodes.registerType("GitBlobNode",GitBlobNode);
