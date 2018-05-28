$(function () {

    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize varibles
    var $window = $(window);
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;

    // var socket = io('http://'+document.domain+':2020');
    var host = '192.168.1.247';
    var projectDir = 'notification';
    var socket = io('http://' + host + ':2020');
    var projectPath = 'http://' + host + '/' + projectDir + '/examples/chat/public/';

    $('#count').text(0);

    // starting point, for page refresh
    setUsername('admin'); // call this at the start for auto login

    // Sets the client's username
    function setUsername(usr) {
        username = usr;
        // If the username is valid
        if (username) {
            // Tell the server your username
            socket.emit('add user', username);

            readChat(username);
        }
    }

    function readChat(username) {
        $.ajax({
            url: projectPath + 'db/readchat.php',
            type: 'POST',
            data: {
                username: username
            },
            success: function (chats) {
                $messages.html(chats);
            },
            error: function (e) {
                console.log(e);
            }
        });
    }

    function clientListGenerate(data) {
        // add to active client list
        var clientsHtml = "";

        if (typeof data.usernames !== 'undefined' && typeof data.usernames['admin'] !== 'undefined') {
            delete data.usernames['admin']; // no need to show admin in client list
        }

        for (var i in data.usernames) {
            clientsHtml += "<li>" + data.usernames[i]
                + " - <span data-username='" + data.usernames[i] + "' class='drop'>Disconect</span>"
                + " - <span data-username='" + data.usernames[i] + "' class='private-msg'>Message</span>"
                + "</li>";
        }

        $('#client-list').html(clientsHtml);
        $('#count').text((data.numUsers <= 0) ? 0 : data.numUsers);
    }

    function addParticipantsMessage(data) {
        var message = '';
        data.numUsers -= 1; // do not count admin
        if (data.numUsers === 1) {
            message += "there's 1 client";
        } else {
            message += "there are " + data.numUsers + " clients";
        }
        log(message);
        clientListGenerate(data);
    }

    $(document).on('click', '.private-msg', function () {
        $('.private-div').remove(); // hide all other open input boxes
        var username = $(this).data('username');
        var privateBox = '<div class="private-div"><input id="' + username + '-box"/><button class="private-sub" data-username="' + username + '">Send</button></div>';
        $(this).after(privateBox);
    });

    $(document).on('click', '.private-sub', function () {
        var toUser = $(this).data('username');
        var msgBox = $('#' + toUser + '-box');
        var message = msgBox.val();
        sendPrivateMessage({
            message: message,
            to: toUser
        });
    });

    $(document).on("click", ".drop", function () {
        var username = $(this).data('username');
        socket.emit('force disconnect', username);
    });

    // Sends a chat message
    function sendMessage() {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new adminmessage', message);
        }
    }

    // Sends a chat message
    function sendPrivateMessage(data) {
        // if there is a non-empty message and a socket connection
        if (data.message && connected) {
            addChatMessage({
                username: username,
                message: cleanInput(data.message)
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new adminmessage_private', data);
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
//        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        /* var $usernameDiv = $('<span class="username"/>')
             .text(data.username)
             .css('color', getUsernameColor(data.username));
         var $messageBodyDiv = $('<span class="messageBody">')
             .text(data.message);*/

        var $usernameDiv = $('<span/>')
            .text(data.username + ': ');
        var $messageBodyDiv = $('<span>')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping() {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor(username) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Cookie Functions

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function checkCookie(cookieName) {
        var user = getCookie(cookieName);
        if (user != "") {
            return true;
        } else {
            return false;
        }
    }

    function deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }

    // End cookie functions

    // Keyboard events

    $window.keydown(function (event) {
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
        }
    });

    $inputMessage.on('input', function () {
        updateTyping();
    });


    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        connected = true;
        // Display the welcome message
        var message = "Welcome to Socket.IO Chat – ";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new clientmessage', function (data) {
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
        clientListGenerate(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
        clientListGenerate(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function (data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });


});
