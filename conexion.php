<?php

/**
* A class for handling connections to the database
*
* It calls mysqli_connect (if it hasn't been already called during the script execution)
* with configuration params. 
*
*
*/
class Conexion{

    static $conexion;


    /**
    * Creates a new mysqli object if not already created
    *
    * The object is created with configuration files parsed config directory
    *   with values concerning the database environment used. 
    *
    *
    * @return mysqli $conexion, an adapter object.
    */

    public static function conectar() {

        if(!isset(self::$conexion)) {
            
            $config = parse_ini_file('./config/config.ini',true);
            $environment = parse_ini_file('./config/environment.ini')["environment"];
            $config = $config[$environment];

            self::$conexion = mysqli_connect($config['server'],$config['username'],$config['password'],$config['dbname']);
        }

        if(self::$conexion === false) {
            return mysqli_connect_error(); 
        }

        return self::$conexion;
    }

}

