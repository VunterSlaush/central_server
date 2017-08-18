<?php

class RestIonicCaller
{
  //TODO change this api token
  const API_TOKEN  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTJhZjNmMy1lOTFhLTRjNzUtYmM1MC01YmYxY2Q5OGU3M2UifQ.se1yM60RGZrso2NdSQvfTwZO6ekETZBYJ7DTx99Vil4';
  const URL = 'https://api.ionic.io';

  public function call($method,$url, $data = false)
  {
      $ch = curl_init(self::URL.$url);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer '. self::API_TOKEN,
        'Content-Type: application/json'
      ));

      $result = curl_exec($ch);
      curl_close($ch);
      return json_encode($result);
  }
}
?>
