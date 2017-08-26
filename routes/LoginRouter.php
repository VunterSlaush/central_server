<?php
include_once("controladores/LoginController.php");

/**
* Class middleware to handle communication between requests and controller methods
*
* As LoginController only allows login method, it is sent if the request method is POST.
* 
*
**/

class LoginRouter{

    public static function enrutar($request,$routes){
     
        if ($request !== 'POST'){
             echo json_encode(array("success" => false, "m" => "Petición incorrecta"));
            return;
        }
        
        if(isset($routes[2]) && $routes[2] == "update"){
            LoginController::cambiarPass();
        }else{
            LoginController::login();
        }
    }
}