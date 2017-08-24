<?php

include_once(__DIR__.'/../Conexion.php');

/**
* A model which represents a table in the database for storing user information. 
*
* This class instantiate statically two types of users: one with complete data
*   and the other one just with just login data
*   emulating constructor overload 
*
*/
class Socio
{

    public $membresia;
    public $correo;
    public $contrasena; 
    public $key; 
    public $activado; 
    public $nombre;

    public static function createLogin($correo,$contrasena) {
        $socio = new self();
        $socio->setLoginData($correo, $contrasena);
        return $socio;
    }

    public static function createSocio($nombre,$membresia,$correo,$contrasena){
        $socio = new self();
        $socio->setUserData($nombre,$membresia,$correo,$contrasena);
        return $socio;
    }

    private function setLoginData($correo,$contrasena) {
        $this->correo = $correo;
        $this->contrasena = $contrasena;
    }

    private function setUserData($nombre,$membresia,$correo,$contrasena){
        $this->membresia = $membresia;
        $this->nombre = $nombre;
        $this->correo = $correo;
        $this->contrasena = $contrasena;
        $this->key = md5(microtime().rand());
        $this->activado = 0;
    }

    private function __construct() {
    
    }

 
    
}