<?php
session_start();
include("../web_services/conf.php");
global $MY_SESSION_ADMIN;

if (isset($_SESSION[$MY_SESSION_ADMIN])) {
    include("index_menu.html");
} else
    include("login.html");

