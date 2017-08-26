<?php

    /**
    * This script handles all requests made to the server and 
    * sends them to one router according to the request URI
    */


    header("Content-Type: application/json; charset=utf-8");    
    include("routes/SociosRouter.php");
    include("routes/LoginRouter.php");
    
    $base_url = getCurrentUri();
    $routes = array();
    $uriRoutes = explode('/', $base_url);
    $request = $_SERVER['REQUEST_METHOD'];

    foreach($uriRoutes as $route)
    {   
        if(trim($route) != '')
            array_push($routes, $route);
    }
    
    if($routes[0]!="ws"){
        sendErrorMessage();
        return;
    }


    //Sends each requests accordingly to its router
    switch($routes[1]){
        case "socio":
            SociosRouter::enrutar($request,$routes);
            break;
        case "login":
            LoginRouter::enrutar($request,$routes);
            break;
        default: 
            sendErrorMessage();
            break;
    }

    function sendErrorMessage(){
        echo json_encode(array("success" => false, "m" => "Petición incorrecta"));
    }

    /**
    * Returns the adress of the current request who called the script. 
    *
    * This is the core method, since the .htaccess files redirects all requests to 
    *   this script, this one parses the requests, removes any whitespaces and query symbols
    *
    *
    * @return string $uri Containing a string representation of adress. E.g /user/1
    */


    function getCurrentUri()
    {
        $basepath = implode('/', array_slice(explode('/', $_SERVER['SCRIPT_NAME']), 0, -1)) . '/';
        $uri = substr($_SERVER['REQUEST_URI'], strlen($basepath));
        if (strstr($uri, '?')) $uri = substr($uri, 0, strpos($uri, '?'));
        $uri = '/' . trim($uri, '/');
        return $uri;
    }
