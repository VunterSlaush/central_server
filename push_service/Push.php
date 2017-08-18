<?php

require('RestCaller.php');


class PushCaller extends RestIonicCaller
{
  const URL_BASE = '/push';

  public function pushToAll($jsonDecodificado)
  {
    $data = array();
    $data['profile'] = 'prod';
    $data['send_to_all'] = true;
    $data['notification'] = $jsonDecodificado['PUSH']['data'];
    $response = $this->call("POST",self::URL_BASE.'/notifications', json_encode($data));
    return $response;
  }
}
?>
