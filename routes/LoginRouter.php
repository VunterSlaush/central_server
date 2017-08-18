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

    public static function enrutar($request){
     
        if ($request !== 'POST'){
             echo json_encode(array("success" => false, "m" => "Petición incorrecta"));
            return;
        }
        
        LoginController::login();
    }
}