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
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $notifications = $('.notifications');
    var $notificationsCount = $('#notifications-count');


    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;

    var host = '192.168.1.247';
    var projectDir = 'notification';
    var socket = io('http://' + host + ':2020');
    var url = 'http://' + host + '/' + projectDir + '/examples/chat/public/';
    var projectPath = 'http://' + host + '/' + projectDir + '/examples/chat/public/';

    // $notificationsCount.html(0);
    $notifications.hide();

    // starting point of script, for page refresh
    if (checkCookie('username') && getCookie('username') != '') {
        username = getCookie('username');
        afterLoggedIn();
    } else {
        afterLogout();
    }

    function afterLoggedIn() {
        $("#client-name").text(username);
        $loginPage.fadeOut();
        $chatPage.show();
        setUsername(username);
    }

    function afterLogout() {
        $("#client-name").text('');
        $loginPage.fadeIn();
        $chatPage.hide();
        deleteCookie('username');
        username = null;
    }

    // Sets the client's username
    function setUsername(usr = null) {
        if (!username) {
            username = cleanInput($usernameInput.val().trim());
        } else {
            username = usr;
        }

        // If the username is valid
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();

            // Tell the server your username
            socket.emit('add user', username);
            readChat(username);
            // get unread notifications for this user
            readNotifications(username);
        }

        if (!checkCookie('username')) {
            setCookie('username', username, 30);
        }

        $("#client-name").text(username);
        $('#after-logged').show();
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

    function readNotifications(username) {
        $.ajax({
            url: projectPath + 'db/notifications.php',
            type: 'POST',
            data: {
                username: username,
                type: 'read'
            },
            success: function (res) {
                // console.log(res);
                res = JSON.parse(res);
                pushUpdate(res);
            },
            error: function (e) {
                console.log(e);
            }
        });
    }

    function pushUpdate(res) {

        if(res.count > 0){
            $notifications.html(res.html);
            $notificationsCount.html(res.count).css({
                'background': 'red',
                'font-size': '20px',
                'font-weight': 'bold',
            });
        } else{
            $notifications.html('No unread notifications!');
            $notificationsCount.html(0);
        }
    }

    function markAsRead($this) {
        $.ajax({
            url: projectPath + 'db/notifications.php',
            type: 'POST',
            data: {
                notif_id: $this.attr('id'),
                type: 'mark_as_read'
            },
            success: function (chats) {
                $this.remove();
                var newNotifCount = parseInt($notificationsCount.html()) > 0 ? parseInt($notificationsCount.html()) - 1 : 0;
                $notificationsCount.html(newNotifCount);
            },
            error: function (e) {
                console.log(e);
            }
        });
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

    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        log(message);
    }

    function checkUsername() {
        var username = cleanInput($usernameInput.val().trim());
        $.ajax({
            'type': "POST",
            'url': url + 'db/db_actions.php',
            'data': {
                username: username,
                user_agent: navigator.userAgent,
                browser_id: navigator.productSub,
                ip: navigator.productSub,
                type: 'select'
            },
            'success': function (res) {
                if (res) {
                    console.log('Success');
                    setUsername(username);
                } else {
                    // stay on the same page
                    alert('user does not exist');
                }
            },
            'error': function (err) {
                console.log(err);
            }
        });
    }


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
            // socket.emit('new message', message);
            socket.emit('new clientmessage', message);
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
        // addMessageElement($el, options);
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


    // Keyboard events

    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
//            $currentInput.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                checkUsername();
                //setUsername();
            }
        }
    });

    $inputMessage.on('input', function () {
        updateTyping();
    });

    // Click events

    $(document).on('click', '#logout', function () {
        socket.emit('force disconnect', username);
        afterLogout();
    });

    $(document).on('click', '.notifications li', function () {
        markAsRead($(this));
    });

    $(document).on('click', '#notifications-count', function () {
        $notificationsCount.attr('style', '');
        $notifications.toggle();
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
    socket.on('new adminmessage', function (data) {
        addChatMessage(data);

        // get unread notifications for this user
        readNotifications(username);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
        // automatic logout when admin drops client connection
        if (data.username == username) {
            $('#logout').trigger('click');
        }
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
