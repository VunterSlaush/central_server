<?php
session_start();
header('Access-Control-Allow-Origin: *');
error_reporting(E_ALL);

require("Push.php");

if (empty($_POST["json"]))
{
    echo json_encode(array(
        "success" => "false",
        "m" => "Estructura Json Malformada, no JSON"
    ));
}
else
{

    $decodificado = json_decode($_POST["json"], TRUE);
    if (array_key_exists("fun", $decodificado))
    {
        $servicio       = $decodificado["fun"];
        $jsonCodificado = json_encode($decodificado, TRUE);
        switch ($servicio) {
            case "push_all":
                $push     = new PushCaller();
                $retorno = $push->pushToAll($decodificado);
                echo json_encode(array("success" => "true", "result" => $retorno));
                break;
            default:
                echo json_encode(array(
                    "success" => "false",
                    "m" => "Estructura Json Malformada"
                ));
                break;
        }
    }
}
function logOut()
{
    session_destroy();
}
function construcUser($json)
{

}
?>
