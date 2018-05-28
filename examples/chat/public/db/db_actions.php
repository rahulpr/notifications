<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "admin_chat";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_POST['type'] == 'select') {
    $sql = "SELECT * FROM users WHERE `username`='" . $_POST['username'] . "'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $upd_sql = "UPDATE users 
                SET `user_agent`='" . $_POST['user_agent'] . "', 
               `browser_id`='" . $_POST['browser_id'] . "', 
               `ip`='" . $_SERVER['REMOTE_ADDR'] . "' 
                WHERE `username`='" . $_POST['username'] . "'";
        $conn->query($upd_sql);

        echo true;
    } else {
        echo false;
    }
}

// not using
if ($_POST['type'] == 'update') {
    $sql = "update `users` set `client_socket_id`='" . $_POST['client_socket_id'] . "' where `username`='" . $_POST['username'] . "'";

    if ($conn->query($sql) === TRUE) {
        echo true;
    } else {
        echo false;
    }
}


$conn->close();
?>