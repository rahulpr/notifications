<?php
// get file contents
$data = '';
if (isset($_POST['username'])) {
    if ($_POST['username'] === 'admin') {
        $file = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'chat' . DIRECTORY_SEPARATOR . 'admin.txt';
        if (file_exists($file)) {
            $data = file_get_contents($file);
        }
    } else {
        $file = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'chat' . DIRECTORY_SEPARATOR . 'clients' . DIRECTORY_SEPARATOR . $_POST['username'] . '.txt';
        if (file_exists($file)) {
            $data = file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'chat' . DIRECTORY_SEPARATOR . 'clients' . DIRECTORY_SEPARATOR . $_POST['username'] . '.txt');
        }
    }
}

echo nl2br($data);

?>