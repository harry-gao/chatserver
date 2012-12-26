"use strict"


process.title = 'node-chat'

var webSocketServerPort = 10377;

var webSocketServer = require('websocket').server;
var http = require('http');

var clientArrary = {};


function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
					  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


var server = http.createServer(function(request, response){

})

server.listen(webSocketServerPort, function(){
	console.log( (new Date()) + "server is listen on port " + webSocketServerPort);
});

var wsServer = new webSocketServer( 
	{httpServer: server}
);

wsServer.on('request', function(request){
	 console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	var connection = request.accept(null, request.origin);


	connection.on('message', function(data){
		
		console.log("received msg " + data.utf8Data);

		var message = eval('(' + data.utf8Data + ')');

		if(message.type == 'login')
		{
			console.log('user ' + message.userId + " with group id " + message.groupId + " logged in")

            if(clientArrary[message.groupId] == undefined)
			{	
				clientArrary[message.groupId] = [];
			}

			clientArrary[message.groupId].push({id :message.userId, connection: connection});

			var currentUsers = [];
			for (var i = clientArrary[message.groupId].length - 1; i >= 0; i--) {
				currentUsers.push(clientArrary[message.groupId][i].id);
			};

			console.log("current users:" + currentUsers.toString());

			var obj = {
                    type: 'users',
                    users: currentUsers
                };

			for (var i=0; i< clientArrary[message.groupId].length; i++) {
				clientArrary[message.groupId][i].connection.sendUTF(JSON.stringify(obj));
			}
		}

		else if(message.type == 'logoff')
		{
			console.log('user ' + message.userId + " with group id " + message.groupId + " logged off");
			for(var i = 0; i < clientArrary[message.groupId].length; i++)
			{
				console.log('checking user: ' + clientArrary[message.groupId][i].id);

				if(clientArrary[message.groupId][i].id === message.userId)
				{
					clientArrary[message.groupId].splice(i, 1);
					break;
				}
			}
	
			var currentUsers = [];
			for (var i = clientArrary[message.groupId].length - 1; i >= 0; i--){
				currentUsers.push(clientArrary[message.groupId][i].id);
			};

			var obj = {
                    type: 'users',
                    users: currentUsers
                };

            for (var i=0; i< clientArrary[message.groupId].length; i++) {
				clientArrary[message.groupId][i].connection.sendUTF(JSON.stringify(obj));
			}
		}
		else if(message.type == 'message')
		{
			if(clientArrary[message.groupId] == undefined)
				return;

			var obj = {
                    type: 'message',
                    userId: message.userId,
                    message: message.message
                };


            if(message.groupId == 0) //system user
            {
            	for (var group in clientArrary) {
            		if (!clientArrary.hasOwnProperty(group)) continue;
            		for(var i = 0; i < clientArrary[group].length; i ++){
            			console.log("current user " + clientArrary[group][i].id + " message.toId " + message.toId);
            			if(clientArrary[group][i].id != message.userId && (message.toId == undefined || clientArrary[group][i].id == message.toId))
            			{
            				console.log('sending msg ' + JSON.stringify(obj))
            				clientArrary[group][i].connection.sendUTF(JSON.stringify(obj));
            			}
            		}
            	}
            }
            else //user to user message, only can be send to same group id
            {
				for (var i=0; i< clientArrary[message.groupId].length; i++) {
					if(clientArrary[message.groupId][i].id != message.userId && (message.toId == undefined || clientArrary[message.groupId][i].id == message.toId))
						clientArrary[message.groupId][i].connection.sendUTF(JSON.stringify(obj));
				
				console.log("message sent to " + (clientArrary[message.groupId].length - 1) + " users with group id: " + message.groupId);
				}
			}
		}
	});

	connection.on('close', function(connection) {
		console.log('connection closed');
    });

});