<?php
include_once("controladores/SocioController.php");

/**
* Class middleware to handle communication between requests and controller methods
*
* Parses Request methods to each controller function 
*   POST /:model,  DELETE /:model/:id,  
*   GET /:model/:id and PUT /:model/:id
*
**/

class SociosRouter{

    /**
    * Sends requests to SocioController based on params and routes received. 
    *
    * @param string $request containing the request method *
    *
    *
    * @param array $routes in which in position contains from left to right 
    * all sub routes from uri. Eg: [user,1234]     
    *
    * @return void
    */

    public static function enrutar($request,$routes){
     
        if ($request == 'GET' && !isset($routes[2])){
            SocioController::findAll();
            return;
        }

        if ($request!== 'POST')
            $codigo = $routes[2];
        

        switch($request){
            case "POST":
                SocioController::registrar();
                break;

            case "GET": 
                SocioController::findOne($codigo);
                break;

            case "PUT": 
                SocioController::update($codigo);
                break;

            case "DELETE": 
                SocioController::delete($codigo);
                break;
        }
    }
}