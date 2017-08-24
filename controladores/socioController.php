<?php

include_once('modelos/Socio.php');
include_once('utilities/Mailer.php');

class SocioController
{

    /**
    * Parses POST variables and sends json response according to validations
    *
    * Filter, sanitize and validate request parameters, instantiates an user
    *   with these params and inserts him on the database
    *
    * @return void
    */

    public static function registrar()
    {

        $membresia = filter_input(INPUT_POST, "membresia", FILTER_SANITIZE_NUMBER_INT);
        $correo = filter_input(INPUT_POST, "correo", FILTER_SANITIZE_EMAIL);
        $contrasena = filter_input(INPUT_POST, "contraseña");

        if ($membresia && !$correo) {
            $correo = self::getMail($membresia);
        } elseif ($correo && !$membresia) {
            $membresia = self::getMembresia($correo);
        }

        $nombre = self::getName($membresia);

        if (!self::validateInputs($membresia, $correo, $contrasena)) {
            echo json_encode(array("success" => false, "m"=> "Parámetros de petición incorrectos"));
            return;
        }

        $socio = Socio::createSocio($membresia, $correo, $contrasena);
        self::registrarSocio($socio);
    }

    public static function sendMail($body, $subject, $socio)
    {
        $mail = new Mailer();
        
        // Now you only need to add the necessary stuff
        $mail->addAddress($socio->correo, $socio->nombre);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        
        if (!$mail->send()) {
            echo 'There was an error sending the message';
            exit;
        }
        
        echo 'Message was sent successfully';
    }

    public static function findOne($codigo)
    {
        echo json_encode(array("success" => false, "m"=> "Not supported yet"));
        return;
    }
    

    public static function delete($codigo)
    {
        echo json_encode(array("success" => false, "m"=> "Not supported yet"));
        return;
    }


    /**
    * Confirms user code and activates it
    *
    * Validates a code given by request params
    *   and updates user setting it to activado = 1
    *   sending a json response accordingly
    *
    * @param string $codigo a md5 hash string that
    *   was generated when instantiating an user
    *
    * @return void
    */
    public static function update($codigo)
    {

        if (!self::codigoValido($codigo)) {
            echo json_encode(array("success" => false, "m"=> "Código incorrecto"));
            return;
        }

        $query = "UPDATE usuarios SET activado = 1 WHERE codigo = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('s', $codigo);
        $stmt->execute();

        if ($conexion->affected_rows==1) {
            echo json_encode(array("success" => true, "m"=> "Código confirmado"));
            return;
        }

        echo json_encode(array("success" => false, "m"=> "Error desconocido"));
    }


    private function getName(){
        //TODO
    }


    /**
    * Verify if the code given exists on the database
    *
    * @param string $codigo a md5 hash string that
    *   was generated when instantiating an user
    *
    * @return boolean
    */
    private static function codigoValido($codigo)
    {
        $query = "SELECT codigo FROM usuarios where codigo = ?";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('s', $codigo);
        $stmt->execute();

        $result = $stmt->get_result();

        return ( $result->num_rows > 0 );
    }
    

    /**
    * Validates user and inserts him on the database
    *
    * @param Socio $socio an object representing
    *   the user data on database
    *
    * @return void
    */
    private static function registrarSocio($socio)
    {
           
        if (!self::socioValido($socio)) {
            echo json_encode(array("success" => false, "m"=> "Registro no enviado"));
            return;
        }

        if (self::socioDuplicado($socio)) {
            echo json_encode(array("success" => false, "m"=> "Usuario ya existe"));
            return;
        }

        $query = "INSERT INTO usuarios (activado, codigo, ID_Persona, Pass) VALUES  (?,?,?,?)";
        
        $conexion = Conexion::conectar();
        
        $stmt = $conexion->prepare($query);
        $stmt->bind_param('isss', $socio->activado, $socio->key, $socio->membresia, $socio->contrasena);
        $stmt->execute();
        
        
        $mailSent = self::sendMail($body, $socio);
        if ($conexion->affected_rows==1 && $mailSent) {
            echo json_encode(array("success" => true, "m"=> "Usuario registrado exitosamente"));
            return;
        }

         echo json_encode(array("success" => false, "m"=> "Error inesperado"));
    }


    /**
    * @deprecated Will not longer be used
    * Verify is a given user matches data
    *
    * @param Socio $socio an object representing
    *   the user data on database
    *
    * @return boolean
    */

    private static function socioValido($socio)
    {
        $query = "SELECT Email FROM personas where ID = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('i', $socio->membresia);
        $stmt->execute();

        $result = $stmt->get_result();
        return ($result->num_rows > 0 && $result->fetch_assoc()["Email"] == $socio->correo);
    }

    /**
    *
    * Verify is a given user is already in database
    *
    * @param Socio $socio an object representing
    *   the user data on database
    *
    * @return boolean
    */

    private static function socioDuplicado($socio)
    {

        $query = "SELECT ID FROM usuarios where ID_Persona = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('i', $socio->membresia);
        $stmt->execute();

        $result = $stmt->get_result();
        return ($result->num_rows > 0);
    }

    private static function getMail($membresia)
    {
        
        $query = "SELECT Email FROM personas WHERE ID = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('i', $membresia);
        $stmt->execute();

        $result = $stmt->get_result();
        return  $result->num_rows>0 ? $result->fetch_assoc()["Email"] : false;
    }

    private static function getMembresia($correo)
    {
        
        $query = "SELECT id FROM personas WHERE Email = ?";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('s', $correo);
        $stmt->execute();

        $result = $stmt->get_result();
        return  $result->num_rows>0 ? $result->fetch_assoc()["id"] : false;
    }




    private static function validateInputs($membresia, $correo, $contrasena)
    {
        return ($membresia && $correo && $contrasena);
    }
}
