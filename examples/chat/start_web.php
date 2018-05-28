<?php

use Workerman\Worker;
use Workerman\WebServer;
use Workerman\Autoloader;
use PHPSocketIO\SocketIO;

// composer autoload
require_once __DIR__ . '/../../vendor/autoload.php';

//$host = '127.0.0.1';
$host = '192.168.1.247';
$server_listen_ip = '0.0.0.0';
$web = new WebServer('http://' . $server_listen_ip . ':2022');
$web->addRoot('http://' . $host, __DIR__ . '/public');

if (!defined('GLOBAL_START')) {
    Worker::runAll();
}
