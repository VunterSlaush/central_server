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

        $socio = Socio::createSocio($nombre, $membresia, $correo, $contrasena);
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
           return false;
        }
        
        return true;
    }

    public static function findOne($membresia)
    {
        self::listar($membresia);
    }

    public static function findAll()
    {
        self::listar(false);
    }

    private static function listar($membresia){

        $conexion = Conexion::conectar();

        $query = "SELECT CONCAT(Nombre, ' ', ApellidoP) AS Nombre, Email AS Correo FROM personas AS p
        JOIN usuarios AS usr ON usr.ID_Persona = p.id ";

        $stmt = $conexion->prepare($query);

        if($membresia){
           $query = $query. "WHERE p.id = ?";
           $stmt = $conexion->prepare($query);
           $stmt->bind_param('s', $membresia);
        }       
        
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows==0){
            echo json_encode(array("success" => false, "m"=> "No se encontraron registros"));
            return;
        }

        while($row = $result->fetch_assoc()){
            $rows[] = $row;
        }

        echo json_encode(array("success" => true, "d"=> $rows));
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


    public static function getName($membresia){
        $query = "SELECT CONCAT(Nombre, ' ', ApellidoP) AS Nombre FROM personas where id = ?";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('s', $membresia);
        $stmt->execute();

        $result = $stmt->get_result();

        return ( $result->num_rows>0 ? $result->fetch_assoc()["Nombre"]: "");
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
        
        $body = "Estimado socio, su código de activación es ".$socio->key;
        $subject = "Active su cuenta";
        $mailSent = self::sendMail($body, $subject, $socio);
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

    public static function getMail($membresia)
    {
        
        $query = "SELECT Email FROM personas WHERE ID = ? ";
        $conexion = Conexion::conectar();

        $stmt = $conexion->prepare($query);
        $stmt->bind_param('i', $membresia);
        $stmt->execute();

        $result = $stmt->get_result();
        return  $result->num_rows>0 ? $result->fetch_assoc()["Email"] : false;
    }

    public static function getMembresia($correo)
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