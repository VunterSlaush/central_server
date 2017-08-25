<?php

/**
* A class for handling connections to the database
*
* It calls mysqli_connect (if it hasn't been already called during the script execution)
* with configuration params.
*
*
*/
include('config/conf.php');
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
            self::$conexion = mysqli_connect(HOST,USER,PASS,DB);
        }

        if(self::$conexion === false) {
            return mysqli_connect_error();
        }

        return self::$conexion;
    }

}
