<?php
session_start();
include("conf.php");
header("Content-Type: application/json; charset=utf-8");
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Headers: http://localhost, X-Requested-With, Content-Type, Accept');
date_default_timezone_set('America/Mexico_City');

global $servidor;
global $base;
global $usuarioBD;
global $pass;
global $MY_SESSION_ADMIN;

$con = mysqli_connect($servidor, $usuarioBD, $pass, $base);

if (!isset($_SESSION[$MY_SESSION_ADMIN])) {
    if (isset($_POST['ws']) && $_POST['ws'] == "getHuellasC") {
        getHuellasForC();
    } else {
        echo json_encode(array("s" => 0, "m" => "No has iniciado sesión"));
    }
} //Si existe la sesión se puede acceder a los siguientes servicios.
else {
    #---------------------------------------------------------
    # NEW RELIC                                             --
    #                                                       --
    if (extension_loaded('newrelic')) {
        newrelic_set_appname($base . "_" . $_POST["ws"]);
    }
    #---------------------------------------------------------
    switch ($_POST["ws"]) {
        case "getHuellasC":
            getHuellasForC();
            break;
        case "getHuellasAdmin":
            if (isset($_POST['id'])) {
                getHuellasAdmin($_POST['id']);
            } else {
                echo json_encode(array("s" => 0, "m" => "Parametros de petición incorrectos"));
            }
            break;
        case "deleteHuellasAdmin":
            if (isset($_POST['idp']) && isset($_POST['huella'])) {
                deleteHellasAdmin($_POST['idp'], $_POST['huella']);
            } else {
                echo json_encode(array("s" => 0, "m" => "Parametros de petición incorrectos"));
            }
            break;
        case "saveHuella":
            if (isset($_POST['idp']) && isset($_POST['detalle']) && isset($_POST['huella'])) {
                saveHuella($_POST['idp'], $_POST['detalle'], $_POST['huella']);
            } else {
                echo json_encode(array("s" => 0, "m" => "Parametros de petición incorrectos"));
            }
            break;
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}

function getHuellasForC()
{
    GLOBAL $con;
    $sql = "SELECT NSS, Identidad FROM newIdentificador INNER JOIN personas ON ID_Persona = ID
            WHERE ID_Tipo_Identificador = 2";
    if ($r = mysqli_query($con, $sql)) {
        $res = array();
        while ($l = mysqli_fetch_array($r)) {
            $l = array_map('utf8_encode', $l);
            array_push($res, array("nss" => $l['NSS'], "fmd" => $l['Identidad']));
        }
        echo json_encode(array("s" => 1, "m" => "Busqueda de huellas existosa", "d" => $res));
    } else {
    echo json_encode(array("s" => 0, "m" => "Error al buscar huellas."));
}
    mysqli_close($con);
}

function getHuellasAdmin($idPersona)
{
    GLOBAL $con;
    $sql = "SELECT Descripcion FROM newIdentificador WHERE ID_Persona = $idPersona AND ID_Tipo_Identificador = 2";
    if ($r = mysqli_query($con, $sql)) {
        $res = array();
        while ($l = mysqli_fetch_array($r)) {
            $l = array_map('utf8_encode', $l);
            array_push($res, array("descripcion" => $l['Descripcion']));
        }
        echo json_encode(array("s" => 1, "m" => "Busqueda de huellas existosa", "d" => $res));
    } else {
        echo json_encode(array("s" => 0, "m" => "Error al buscar huellas."));
    }
    mysqli_close($con);
}

function deleteHellasAdmin($idPersona, $huella)
{
    GLOBAL $con;
    $huella = utf8_decode($huella);
    $sql = " DELETE FROM newIdentificador WHERE ID_Persona = '$idPersona' AND Descripcion = '$huella' AND ID_Tipo_Identificador = 2 ";
    if (mysqli_query($con, $sql)) {
        echo json_encode(array("s" => 1, "m" => "Huella eliminada correctamente"));
    } else {
        echo json_encode(array("s" => 0, "m" => "Huella no eliminada"));
    }
}

function saveHuella($idp, $description, $huella){
    GLOBAL $con;
    $description = utf8_decode($description);
    $sql = "INSERT INTO newIdentificador (ID_Persona, ID_Tipo_Identificador, Identidad, Descripcion) VALUES ($idp, 2, '$huella', '$description') ";
    if (mysqli_query($con, $sql)) {
        echo json_encode(array("s" => 1, "m" => "Huella registrada corrextamente"));
    }
    else {
        echo json_encode(array("s" => 0, "m" => "Error al guardar huella."));
    }
    mysqli_close($con);
}
