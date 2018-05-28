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

// get notifications
if ($_POST['type'] == 'read') {
    $notif_str = '';

    $sql = "SELECT `id` FROM `users` WHERE `username`='" . $_POST['username'] . "'";
    $qry = mysqli_query($conn, $sql);

    if (mysqli_num_rows($qry) > 0) {
        // output data of each row
        while ($row = mysqli_fetch_assoc($qry)) {
            $notif_sql = "SELECT * FROM `notifications` WHERE `notif_to`='" . $row['id'] . "' and `notif_read`='0' ORDER BY `created` DESC";
            $notif_qry = mysqli_query($conn, $notif_sql);
            $count = mysqli_num_rows($notif_qry);
            if ($count > 0) {
                while ($row = mysqli_fetch_assoc($notif_qry)) {
                    $notif_str .= '<li id="' . $row['id'] . '">' . $row['message'] . '</li>';
                }
            }
        }
    }

    echo json_encode(array('html' => $notif_str, 'count' => $count));
}

// add notification
if ($_POST['type'] == 'add_notification') {

    $message = $_POST['message'];
    $from = $_POST['from'];
    $to_array = $_POST['to_arr'];

    $str = "";
    foreach ($to_array as $key => $item) {
        $str .= "'" . $item . "'";
        if ($key < count($to_array) - 1) {
            $str .= ", ";
        }
    }

    $sql = "SELECT `id` FROM `users` WHERE `username` IN ({$str}) ";
    $qry = mysqli_query($conn, $sql);
    if (mysqli_num_rows($qry) > 0) {
        // output data of each row
        while ($row = mysqli_fetch_assoc($qry)) {
            $conn->query("INSERT INTO `notifications` (message, notif_from, notif_to) VALUES ('{$message}', '{$from}', '{$row['id']}')");
        }
    }

    echo true;
}

// mark notification as read
if ($_POST['type'] == 'mark_as_read') {
    $notif_id = $_POST['notif_id'];

    $sql = "UPDATE `notifications` SET `notif_read`='1' WHERE `id`='{$notif_id}'  ";

    if ($conn->query($sql) === TRUE) {
        echo true;
    } else {
        echo false;
    }
}

mysqli_close($conn);
?>