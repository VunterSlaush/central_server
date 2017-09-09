<?php

include_once('modelos/Socio.php');
include_once('controladores/SocioController.php');

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

            $membresia = SocioController::getMembresia($correo);
            $_SESSION["id"] = $membresia;
            $data = SocioController::getSocio($membresia);
            echo json_encode(array("success" => true, "m"=> "Login exitoso", "d" => $data[0]));
            return;
        }

         echo json_encode(array("success" => false, "m"=> "Contraseña o correo inválidos"));
    }


    
    public static function cambiarPass()
    {

        $membresia = filter_input(INPUT_POST, "membresia", FILTER_SANITIZE_NUMBER_INT);
        $correo = filter_input(INPUT_POST, "correo", FILTER_VALIDATE_EMAIL);
        $contrasena = filter_input(INPUT_POST, "contraseña");
        $newPass = filter_input(INPUT_POST, "new");

        if ($membresia && !$correo) {
            $correo = SocioController::getMail($membresia);
        } elseif ($correo && !$membresia) {
            $membresia = SocioController::getMembresia($correo);
        }

        if (!self::validateInputs($correo, $contrasena)) {
            echo json_encode(array("success" => false, "m"=> "Parámetros de petición incorrectos"));
            return;
        }

        $nombre = SocioController::getName($membresia);
        $socio = Socio::createLogin($correo,$contrasena);
        
        $passwordMatch = self::dataMatches($socio);

        if(!$passwordMatch){
            echo json_encode(array("success" => false, "m"=> "Contraseña inválida"));
            return;
        }

        $socio = Socio::createSocio($nombre, $membresia, $correo, $contrasena);
        $socio->contrasena = password_hash($newPass,PASSWORD_BCRYPT);
        if(self::updatePass($socio)){
            $body = "Estimado socio, se ha realizado una solicitud de modificación de contraseña la cual ha sido procesada satisfactoriamente. Si usted NO realizó esta operación, notifiquelo en respuesta a este correo";
            $subject = "Cambio de contraseña";
            SocioController::sendMail($body,$subject,$socio);
            echo json_encode(array("success" => true, "m"=> "Contraseña cambiada exitosamente"));
            return;
        }
        
        echo json_encode(array("success" => true, "m"=> "Error al cambiar contraseña"));
    }



    private static function updatePass($socio){
    
        $query = "UPDATE usuarios SET Pass = ? WHERE ID_Persona = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);

        if(!$stmt){
            return false;
        }
        $stmt->bind_param('ss', $socio->contrasena, $socio->membresia);
        $stmt->execute();

        return ($conexion->affected_rows==1);
    
    }


    /**
    * Verify is a user is found on database
    * 
    * @return boolean
    */
    private static function dataMatches($socio){

       $query = "SELECT usr.Pass AS hash FROM usuarios AS usr 
                JOIN personas AS per ON usr.ID_Persona = per.ID 
                WHERE per.Email = ? AND activado = 1";
           
        $conexion = Conexion::conectar();
        
        $stmt = $conexion->prepare($query);
        $stmt->bind_param('s', $socio->correo);
        $stmt->execute();

        $result = $stmt->get_result();
        return (password_verify($socio->contrasena,$result->fetch_assoc()["hash"]));
    }


    private static function validateInputs($correo,$contrasena){
        return ((isset($correo,$contrasena) && $correo && $contrasena));
    }
}

  