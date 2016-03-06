var Chat = function(socket) {
	this.socket = socket;
}

Chat.prototype.sendMessage = function(room, text) {
	this.socket.emit('message', {
		room : room,
		text : text
	});
}

Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom : room
	});
};

Chat.prototype.processCommand = function(command) {
	var command = command.split(' ');
	var prefix = command[0].substring(1, command[0].length).toLowerCase();
	var message = false;
	switch(prefix) {
		case 'join':
			command.shift();
			this.changeRoom(command.join(' '));
			break;
		case 'nick':
			command.shift();
			this.socket.emit('nameAttempt', command.join(' '));
			break;
		default:
			message = 'Unrecongnized Command!';
			break;
	}
	return message;
};

function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;
	if (message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	$('#send-message').val('');
}

var socket = io.connect();
$(document).ready(function() {
	var chatApp = new Chat(socket);
	
	socket.on('nameResult', function(result) {
		var message;
		if (result.success == true) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});
	
	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	socket.on('message', function(result) {
		var newElement = $('<div></div>').text(result.text);
		$('#messages').append(newElement);
	});

	socket.on('rooms', function(rooms) {
		$('#room-list').empty();

		for (var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('#room-list').append(divEscapedContentElement(room));
			} 
		}

		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});

	setInterval(function() {
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function() {
		processUserInput(chatApp, socket);
		return false;
	});
});














