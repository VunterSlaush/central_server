<?php

require('RestCaller.php');
include_once(__DIR__.'/../conexion.php');

class PushCaller extends RestIonicCaller
{
  const URL_BASE = '/push';

  public function pushToAll($jsonDecodificado)
  {
    error_log("PUSH TO ALLL", 0);
    $data = array();
    $data['profile'] = 'prod';
    $data['send_to_all'] = true;
    $data['notification'] = $jsonDecodificado['PUSH']['data']; // TODO add to database

    /* TODO!
    $query = "INSERT INTO notificaciones (titulo, imagen, fecha) VALUES (? , ? , ?)";

    $conexion = Conexion::conectar();
    error_log("PUSH TO ALLL DB CONECCTED", 0);

    $stmt = $conexion->prepare($query);*/

    $stmt->bind_param('sss', $jsonDecodificado['PUSH']['data']['title'], $jsonDecodificado['PUSH']['data']['image'], date("Y-m-d"));
    $stmt->execute();

    $response = $this->call("POST",self::URL_BASE.'/notifications', json_encode($data));
    return $response;
  }
}
?>
