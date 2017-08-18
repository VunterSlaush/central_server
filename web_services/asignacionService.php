<?php

const TOLERANCIA_ENTRADA_SECS = 1200;
const TOLERANCIA_FALTA_SECS = 1200;
const TOLERANCIA_RETARDO_SECS = 300;



function buscarHorasAsignacion($id)
{
    $con = conectar();
    $sql = "SELECT * FROM detalle_asignacion WHERE ID_Asignacion = ".$id;
    $query = mysqli_query($con, $sql);

    $horas = array();
    while ($asig = mysqli_fetch_assoc($query)) {
        $asig = array_map("utf8_encode", $asig);
        $temp = array("dia" => $asig["Dia"], "hi" => $asig["HoraInicio"], "hf" => $asig["HoraFin"]);
        array_push($horas, $temp);
    }

    mysqli_close($con);
    return $horas;
}

function verificarAsignacion($nss, $id)
{
    $con = conectar();
    $sql = "SELECT pe.id AS idp, asi.id AS idAs FROM personas AS pe 
          JOIN asignaciones AS asi ON pe.id = asi.id_Persona 
          WHERE pe.NSS = '$nss' AND asi.id = '$id'";
    $res = mysqli_query($con, $sql);
    if (mysqli_num_rows($res)>0) {
        return true;
    }
    return false;
}

function buscarHorarioCorrespondiente($horas)
{
    foreach ($horas as $i => $hora) {
        if (compararDiaConActual($hora['dia']) && horarActualDentroDelInvervalo($hora)) {
            return $hora;
        }
    }
    return null;
}

function horaActualDentroDelInvervalo($hora)
{
    $ini = conseguirMinutos($hora);
    $actual = conseguirMinutos("".date("H:i"));
    if (isset($_POST["hora"])) {
        $actual = conseguirMinutos($_POST["hora"]);
    }

    return (($ini - TOLERANCIA_ENTRADA) <= $actual && ($ini + TOLERANCIA_FALTA) >= $actual);

}

function isAbsent($inicio,$final){
    $final = conseguirMinutos($final);
    $inicio = conseguirMinutos($inicio);
    $actual = conseguirMinutos("".date("H:i"));
    if (isset($_POST["hora"])) {
        $actual = conseguirMinutos($_POST["hora"]);
    }
    return (($inicio + TOLERANCIA_FALTA) <= $actual && ($actual <= $final));
}


function compararDiaConActual($letraDia)
{
    if (!isset($_POST["dia"])) {
        return convertirLetraDia($letraDia) === date("l");
    }
    return $letraDia === $_POST["dia"];
}

function conseguirMinutos($horaTexto)
{
    $hora = explode(":", $horaTexto);
    $mins = (intval($hora[0]) * 60) + intval($hora[1]);
    return $mins;
}



function convertirLetraDia($letra)
{
    switch ($letra) {
        case 'L':
            return "Monday";
        break;
        case 'M':
            return "Tuesday";
        case 'Mi':
            return "Wednesday";
        case 'J':
            return "Thursday";
        case 'V':
            return "Friday";
        case 'S':
            return "Saturday";
        case 'D':
            return "Sunday";
        default:
            return '';
    }
}


function perteneceDia($dia, $horasAsig)
{
    $time = strtotime($dia);
    foreach ($horasAsig as $i => $hora) {
        if (convertirLetraDia($hora['dia'])==date('l', $time)) {
            return true;
        }
    }
    return false;
}

function asignacionActiva($idAsig)
{
    $sql = "SELECT FechaInicio, FechaFin FROM asignaciones WHERE id = '$idAsig'";
    $res = ejecutaSQL($sql);
    $dates = mysqli_fetch_array($res);
    $fechaInicio = $dates["FechaInicio"];
    $fechaFin = $dates["FechaFin"];
    $now = date('Y-m-d');

    if (fechaEnRango($fechaInicio, $fechaFin, $now)) {
        return true;
    }
    return false;
}

function convertirIntDia($weekN){
    switch ($weekN){
        case 1:
            return "L";
        case 2:
            return "M";
        case 3 :
            return "Mi";
        case 4:
            return "J";
        case 5:
            return "V";
        case 6:
            return "S";
        case 0:
            return "D";
    }
}

function convertToSQLWeekDay($dia){
    switch ($dia){
        case "L":
            return 0;
        case "M":
            return 1;
        case "Mi" :
            return 2;
        case "J":
            return 3;
        case "V":
            return 4;
        case "S":
            return 5;
        case "D":
            return 6;
    }
}


function buscarAsignacion($nss){

    $hora =  filter_input(INPUT_POST, 'hora',FILTER_SANITIZE_STRING);
    if (!isset($hora) || !$hora) {
        $hora=date("H:i");
    }

    $dia = filter_input(INPUT_POST, 'dia',FILTER_SANITIZE_STRING);
    if(!isset($dia)|| !$dia){
        $dia = convertirIntDia(date("w"));
    }

    /*********************************************************************************************
    *    BE CAREFUL: BECAUSE OF THE WAY ATTENDANCE RANGE IS SET, ORDER HERE MATTERS.             * 
    *    IT SHOULD ALWAYS CHECK FOR RETARDMENT FIRST.                                            *
    *    ABSENCE MOSTLY HAPPENS WHEN CHECKING IN A DIFFERENT DAY. THERE COULD BE                 *
    *    ABSECENCE CHECKED AS ASISTANCE WHEN HORA IS NOT INSIDE INTERVAL.                        *
    *    THIS SHOULD ALWAYS BE CHECKED AFTER THE RETURN CALLING horaActualDentroDelIntervalo().  *
    *********************************************************************************************/

    $sql = getQuery("retardo",$dia,$hora, $nss);
    $res = ejecutaSQL($sql);
    if(mysqli_num_rows($res)>0){
        $values = mysqli_fetch_assoc($res);
        return array(
            "dictamen" => "retardo",
            "values" => $values
        );
    }

    $sql = getQuery("asistencia",$dia,$hora, $nss);

    $res = ejecutaSQL($sql);

    if(mysqli_num_rows($res)>0){
        $values = mysqli_fetch_assoc($res);
        return array(
            "dictamen" => "asistencia",
            "values" => $values
        );
    }

    $sql = getQuery("falta",$dia,$hora, $nss);
    $res = ejecutaSQL($sql);
    if(mysqli_num_rows($res)>0){
        $values = mysqli_fetch_assoc($res);
        return  array(
            "dictamen" => "notfound",
            "values" => $values
        );
    }
}
  
// Ranges here are the same as the ones in the function generarDictamenSegunHora
// Queries are pretty much getting that data now from databse alongside with Person data and asignacion id.
// Using TOLERANCIA_RETARDO_SECS instead of TOLERANCIA_RETARDO * 60 so the queries are more readable 
function getQuery($opc, $dia, $hora, $nss){

    $hoy = date('Y-m-d');

    switch($opc){
        case "retardo":
            return "SELECT asig.id, CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Nombre, HoraInicio, HoraFin, serv.Titulo AS nomAsig, tem.detalle AS detalleTema 
                FROM asignaciones AS asig
                JOIN detalle_asignacion AS detAsig ON detAsig.ID_Asignacion = asig.id
                JOIN personas as pe ON pe.id = asig.ID_Persona
                JOIN servicios AS serv ON serv.id = asig.ID_Servicio
                LEFT JOIN temas AS tem ON tem.ID_Asignacion = asig.id AND (tem.dia = '$hoy')
                WHERE detAsig.dia= '$dia' AND pe.nss='$nss'
                AND (
                    TIME_TO_SEC('$hora') -  TIME_TO_SEC(detAsig.HoraInicio) >= ".TOLERANCIA_RETARDO_SECS ."
                    AND
                    TIME_TO_SEC('$hora') -  TIME_TO_SEC(detAsig.HoraInicio) <= ". TOLERANCIA_FALTA_SECS."
                    )";

        case "asistencia":
             return "SELECT asig.id, CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Nombre, HoraInicio, HoraFin, serv.Titulo AS nomAsig, tem.detalle AS detalleTema 
                FROM asignaciones AS asig
                JOIN detalle_asignacion AS detAsig ON detAsig.ID_Asignacion = asig.id
                JOIN personas as pe ON pe.id = asig.ID_Persona
                JOIN servicios AS serv ON serv.id = asig.ID_Servicio
                LEFT JOIN temas AS tem ON tem.ID_Asignacion = asig.id AND (tem.dia = '$hoy')
                WHERE detAsig.dia= '$dia' AND pe.nss='$nss'
                AND (
                    TIME_TO_SEC(detAsig.HoraInicio) - TIME_TO_SEC('$hora') <=".TOLERANCIA_ENTRADA_SECS."
                    OR
                    TIME_TO_SEC('$hora') -  TIME_TO_SEC(detAsig.HoraInicio) <= ".TOLERANCIA_RETARDO_SECS."
                    )";

        case "falta":
            return "SELECT CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Nombre FROM personas WHERE nss = '$nss'"; 
    }
}

function fechaEnRango($fechaInicio, $fechaFin, $now)
{
  // Convert to timestamp
    $fechaIniTs = strtotime($fechaInicio);
    $fechaFinTs = strtotime($fechaFin);
    $nowTs = strtotime($now);
  // Check that now date is between start & end
    return (($nowTs >= $fechaIniTs) && ($nowTs <= $fechaFinTs));
}

function validDate($fecha)
{
    $date = date_parse_from_format("Y-m-d", $fecha); // or date_parse_from_format("d/m/Y", $date);
    return checkdate($date['month'], $date['day'], $date['year']);
}

function convertirDictamen($dictamen,$opcion)
{
  switch($opcion){
    case "char":
      switch($dictamen){
        case "A":
          return "asistencia";
        case "R":
          return "retardo";
        case "F":
          return "falta";
      }
    case "string":
      switch($dictamen){
        case "asistencia":
          return "A";
        case "retardo":
          return "R";
        case "falta":
          return"F";
      }
  } 
}

