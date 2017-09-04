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
    $data['notification'] = array(); // TODO add to database
    $data['notification']["title"] = $jsonDecodificado['data']['title'];
    $data['notification']['message'] = $jsonDecodificado['data']['title'];
    $data['notification']['image'] = $jsonDecodificado['data']['image'];
    $data['notification']['payload']["image"] = $jsonDecodificado['data']['image'];

    $query = "INSERT INTO notificaciones (titulo, imagen) VALUES (? , ?)";

    $conexion = Conexion::conectar();

    $stmt = $conexion->prepare($query);

    $stmt->bind_param('ss', $jsonDecodificado['data']['title'], $jsonDecodificado['data']['image']);
    $stmt->execute();

    $response = $this->call("POST",self::URL_BASE.'/notifications', json_encode($data));
    return $response;
  }
}
?>
