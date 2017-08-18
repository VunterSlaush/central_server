<?php

include_once('modelos/Socio.php');

class LoginController{


    /**
    * Parses POST variables and sends json response according to validations
    *
    * Filter, sanitize and validate request parameters, instantiates an user 
    *   with these params and compares it to the data in database. 
    * 
    * @return void
    */

    public static function login(){

        $contrasena = filter_input(INPUT_POST,"contraseña");
        $correo = filter_input(INPUT_POST,"correo",FILTER_SANITIZE_EMAIL);

        if (!self::validateInputs($correo,$contrasena)){
            echo json_encode(array("success" => false, "m"=> "Parámetros de petición incorrectos"));
            return;
        }

        $socio = Socio::createLogin($correo,$contrasena);
        
        if(self::dataMatches($socio)){
            echo json_encode(array("success" => true, "m"=> "Login exitoso"));
            return;
        }

         echo json_encode(array("success" => false, "m"=> "Contraseña o correo inválidos"));
    }


    /**
    * Verify is a user is found on database
    * 
    * @return boolean
    */
    private static function dataMatches($socio){
           
       $query = "SELECT * FROM usuarios AS usr 
                JOIN personas AS per ON usr.ID_Persona = per.ID 
                WHERE usr.Pass = ? AND per.Email = ?";
           
        $conexion = Conexion::conectar();
        
        $stmt = $conexion->prepare($query);
        
        $stmt->bind_param('ss', $socio->contrasena, $socio->correo);
        $stmt->execute();

        $result = $stmt->get_result();
        return ($result->num_rows > 0);
    }


    private static function validateInputs($correo,$contrasena){
        return ((isset($correo,$contrasena) && $correo && $contrasena));
    }
}

  