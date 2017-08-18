<?php

  header ('Access-Control-Allow-Origin: *');

  $CDN = 'https://c8936f364d4942409e30bd1a97c0bb2e@sentry.io/176631';

  $row = exec('git rev-parse HEAD',$output,$error);

  //$session = $_SESSION[$MY_SESSION_ADMIN]);

  echo json_encode(array(
      "cdn" => $CDN,
      "release" => $row
  ));


?>
