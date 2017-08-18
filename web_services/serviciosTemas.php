<?php
/**
 * Created by IntelliJ IDEA.
 * User: tianshi
 * Date: 19/01/15
 * Time: 01:55 PM
 */

session_start();
header("Content-Type: application/json; charset=utf-8");

include_once("conf.php");
include("sqlUtilery.php");
include("asignacionService.php");

$ws = filter_input(INPUT_POST, 'ws');

if ((!isset($ws)) || !$ws) {
    echo json_encode(array("s" => 0, "m" => "Servicio no específicado"));
    return;
}

    #---------------------------------------------------------
switch ($ws) {
    /*case "aAcceso":
    echo json_encode(array("s" => 1, "m" => "Info Acceso", "d" => array("persona" => $_SESSION[$MY_TEMAS_SESSION_PERSON], "nomina" => $_SESSION[$MY_TEMAS_SESSION_NSS])));
        break;
    case "logout":
        unset($_SESSION[$MY_TEMAS_SESSION_ADMIN]);
        unset($_SESSION[$MY_TEMAS_SESSION_PERSON]);
        unset($_SESSION[$MY_TEMAS_SESSION_NSS]);
        echo json_encode(array("s" => 1, "m" => "Sesíon Cerrada"));
        break;
    */
    case "getAsignaciones":
        $persona =  filter_input(INPUT_POST, 'persona', FILTER_REQUIRE_SCALAR);
        if (!isset($persona) || !$persona) {
            echo json_encode(array("s" => 0, "m" => "Bad request"));
            break;
        }
        getAsignaciones($persona);
        break;
    case "getTemas":
        getTemas($_POST['asignacion'], $_POST['fechaInicio'], $_POST['fechaFin'], $_POST['dias']);
        break;
    case "saveTema":
        $asignacion =  filter_input(INPUT_POST, 'asignacion', FILTER_SANITIZE_NUMBER_INT);
        $dia =  filter_input(INPUT_POST, 'dia', FILTER_SANITIZE_STRING);
        $titulo =  filter_input(INPUT_POST, 'titulo', FILTER_SANITIZE_STRING);
        $detalle =  filter_input(INPUT_POST, 'detalle', FILTER_SANITIZE_STRING);
        if (!isset($asignacion, $dia, $titulo, $detalle)|| !$asignacion ||!$dia ||!$titulo ||!$detalle) {
            echo json_encode(array("s" => 0, "m" => "Bad request"));
            break;
        }
        saveTema($asignacion, $dia, utf8_decode($titulo), utf8_decode($detalle));
        break;
    case "getReporteTema":
        getReporteTema();
        break;
    default:
        echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
        break;
}
/*
function verificarUsuario($user, $pass)
{
    $sql = "SELECT CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Persona FROM personas
            WHERE NSS='$user' AND NSS='$pass' ";
    $r = ejecutaSQL($sql);
    $info = array();
    if (mysqli_num_rows($r) == 1) {
        $row = mysqli_fetch_array($r);
        $row = array_map('utf8_encode', $row);
        $info['session'] = true;
        $info['person'] = $row['Persona'];
        $info['nss'] = $user;
        //echo var_dump($info);
    } else
        $info['session'] = false;
    return $info;
} */

function getAsignaciones($nss)
{
    $asignaciones = array(); //Arreglo donde se guardan todas las asignaturas sin agrupar.

    $sql = " SELECT asig.ID AS ID_Asig, CRN, FechaInicio, FechaFin, ser.Codigo, ser.Titulo, ser.Nivel, esp.Nombre AS Salon
            FROM asignaciones AS asig
            INNER JOIN personas AS per ON asig.ID_Persona = per.ID
            INNER JOIN servicios AS ser ON asig.ID_Servicio = ser.ID
            INNER JOIN espacios AS esp ON asig.ID_Espacio = esp.ID
            WHERE NSS = '$nss' AND ser.Codigo <> 'CAMPUS' AND ser.Codigo <> 'CIDETEC'
            AND asig.Activo = 1 AND NOW() >= FechaInicio AND NOW() <= FechaFin ORDER BY CRN ";
    $r1 = ejecutaSQL($sql);
    if (mysqli_num_rows($r1) == 0) {
        echo json_encode(array("s" => 0, "m" => "No existen asignaciones"));
    } else {
        //Llenar el arreglo en formato JSON con los elementos principales de una asignacion
        while ($asig = mysqli_fetch_array($r1)) {
            $asig = array_map('utf8_encode', $asig);
            $temp = array("idAsig" => $asig['ID_Asig'], "crn" => $asig['CRN'], "fechaInicio" => $asig['FechaInicio'], "fechaFin" => $asig['FechaFin'], "codigoServicio" => $asig['Codigo'], "tituloServicio" => $asig['Titulo'], "nivel" => $asig['Nivel'], "salon" => $asig['Salon'], "horario" => array(), "total" => 0, "cargados" => 0);//, "temas"=> array());
            array_push($asignaciones, $temp);
        }

        foreach ($asignaciones as $key => $value) {
            $diaSemana = array('L', 'M', 'Mi', 'J', 'V', 'S', 'D');
            $dias = array();
            $total = 0;
            $cargados = 0;
            //Obtener los detalles de las asignaciones
            $sql = "SELECT Dia, HoraInicio, HoraFin FROM detalle_asignacion
                    WHERE ID_Asignacion = '{$value['idAsig']}' ";
            $r2 = ejecutaSQL($sql);
            if (mysqli_num_rows($r2) > 0) {
                while ($horario = mysqli_fetch_array($r2)) {
                    $temp = array("horaInicio" => $horario['HoraInicio'], "horaFin" => $horario['HoraFin']);
                    $asignaciones[$key]['horario'][$horario['Dia']] = $temp;
                    array_push($dias, $horario['Dia']);
                }
            }

            //Obtener la cantidad de temas para la asignacion
            $start = new DateTime($value['fechaInicio']);
            $end = new DateTime($value['fechaFin']);
            $interval = DateInterval::createFromDateString('1 day');
            $period = new DatePeriod($start, $interval, $end);
            foreach ($period as $dt) {
                foreach ($dias as $day) {
                    $day = array_search($day, $diaSemana)+ 1;
                    if ($dt->format("N") == $day) {
                        $total++;
                    }
                }
            }

            //Obtener los detalles de las asignaciones
            $sql = "SELECT count(ID_Asignacion) AS Cargados FROM temas WHERE ID_Asignacion = '{$value['idAsig']}' ";
            $r3 = ejecutaSQL($sql);
            if (mysqli_num_rows($r3) > 0) {
                while ($cantidad = mysqli_fetch_array($r3)) {
                    $cargados = (int)$cantidad['Cargados'];
                }
            }

            $asignaciones[$key]['total'] = $total;
            $asignaciones[$key]['cargados'] = $cargados;
        }

        $sql = "SELECT NSS, ID_Grupo FROM detalle_grupos AS d
                INNER JOIN personas AS p ON p.ID = d.ID_Persona
                INNER JOIN grupos AS g ON g.ID = d.ID_Grupo
                WHERE NSS = '$nss' AND g.Nombre = 'Carga Temas' ";
        $builder = mysqli_num_rows(ejecutaSQL($sql));
        if ($builder == 1) {
            $builder = true;
        } else {
            $builder = false;
        }

        echo json_encode(array("s" => 1, "m" => "Busqueda correcta", "d" => array("asignaciones" => $asignaciones, "construirTemas"=>$builder)));
    }
}

function getTemas($asig, $fi, $ff, $dias)
{
    $temas = array();
    $hoy = date("Y/m/d");
    //echo var_dump($hoy);
    $dias = explode(",", $dias);
    $start = new DateTime($fi);
    $end = new DateTime($ff);
    $interval = DateInterval::createFromDateString('1 day');
    $period = new DatePeriod($start, $interval, $end);

    $colorTexto = "black";
    $fondoMenor = "#707070 ";
    $bordeMenor = "#404040 ";
    $fondoBien = "#66CC00";
    $bordeBien = "#009900";
    $fondoMal = "#CC3300";
    $bordeMal = "#990000";

    foreach ($period as $dt) {
        $colorBorde = "";
        $colorFondo = "";
        $onClickModal = true;
        $link = "#";
        if ($dt->format("Y/m/d") <= $hoy) {
            $colorBorde = $bordeMenor;
            $colorFondo = $fondoMenor;
            $onClickModal = false;
            $link = "";
        } else {
            $colorBorde = $bordeMal;
            $colorFondo = $fondoMal;
        }

        foreach ($dias as $day) {
            switch ($day) {
                case "L":
                    if ($dt->format("N") == 1) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "M":
                    if ($dt->format("N") == 2) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "Mi":
                    if ($dt->format("N") == 3) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "J":
                    if ($dt->format("N") == 4) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "V":
                    if ($dt->format("N") == 5) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "S":
                    if ($dt->format("N") == 6) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
                case "D":
                    if ($dt->format("N") == 7) {
                        $temp = array("title" => "", "start" => $dt->format("Y-m-d"), "id" => $dt->format("Y-m-d"), "allDay" => true, "description" => "", "borderColor" => $colorBorde, "color" => $colorFondo, "onClickModal" => $onClickModal, "url" => $link, "textColor" => $colorTexto);
                        array_push($temas, $temp);
                    }
                    break;
            }
        }
    }

    //Obtener los temas de cada asignacion
    $sql = "SELECT * FROM temas WHERE ID_Asignacion = '$asig' ";
    if ($r = ejecutaSQL($sql)) {
        if (mysqli_num_rows($r) > 0) {
            while ($temp = mysqli_fetch_array($r)) {
                $temp = array_map('utf8_encode', $temp);
                foreach ($temas as $key => $value) {
                    if ($value['start'] === $temp['Dia']) {
                        $temas[$key]['title'] = $temp['Titulo'];
                        $temas[$key]['description'] = $temp['Detalle'];
                        if ($temas[$key]['url'] != "") {
                            if ($temas[$key]['title'] != "" && $temas[$key]['description'] != "") {
                                $temas[$key]['borderColor'] = $bordeBien;
                                $temas[$key]['color'] = $fondoBien;
                            }
                        }
                        break;
                    }
                }
            }
        }
        echo json_encode(array("s" => 1, "m" => "Busqueda de temas correcta", "d" => $temas));
    } else {
        echo json_encode(array("s" => 0, "m" => "Error al buscar temas"));
    }
}

function saveTema($asig, $dia, $titulo, $detalle)
{

    if (!(validDate($dia))) {
        echo json_encode(array("s" => 0, "m" => "Fecha malformada"));
        return;
    }

    $horasAsig = buscarHorasAsignacion($asig);
    if (empty($horasAsig)) {
        echo json_encode(array("s" => 0, "m" => "Asignación no existe"));
        return;
    }

    if (!(perteneceDia($dia, $horasAsig))) {
        echo json_encode(array("s" => 0, "m" => "Día no corresponde a la asignación"));
        return;
    }

    if (!asignacionActiva($asig)) {
        echo json_encode(array("s" => 0, "m" => "Asignacion no está activa"));
        return;
    }
      


    $sql = "SELECT * FROM temas WHERE ID_Asignacion = '$asig' AND Dia = '$dia' ";
    $res = ejecutaSQL($sql);
    if (!$res) {
        echo json_encode(array("s" => 0, "m" => "Error al consultar"));
        return;
    }
    if (mysqli_num_rows($res) > 0) {
        $sql = "UPDATE temas SET Titulo = '$titulo', Detalle= '$detalle' WHERE ID_Asignacion = '$asig' AND Dia = '$dia' ";
        $res = updateSQL($sql);
        echo json_encode(array("s" => 1, "m" => "Tema actualizado correctamente"));
        return;
    }
    $sql = "INSERT INTO temas (ID_Asignacion, Dia, Titulo, Detalle) VALUES ('$asig', '$dia', '$titulo', '$detalle') ";
    $res = insertaSQL($sql);
    if ($res>0) {
        echo json_encode(array("s" => 1, "m" => "Tema guardado correctamente"));
        return;
    }
    echo json_encode(array("s" => 0, "m" => "Error al guardar tema"));
}


function getReporteTema(){

    //idPersona, 
    //idAsignacion
    $idP = filter_input(INPUT_POST, 'idP', FILTER_SANITIZE_NUMBER_INT,FILTER_REQUIRE_SCALAR);
    $idAs = filter_input(INPUT_POST, 'idAs', FILTER_SANITIZE_NUMBER_INT,FILTER_REQUIRE_SCALAR);

    if(!isset($idP,$idAs)){
        echo json_encode(array("s" => 0, "m" => "Bad request"));
        return;
    }

    if(!$idP){
        echo json_encode(array("s" => 0, "m" => "Id persona inválido"));
        return;
    }

    if(!$idAs){
        echo json_encode(array("s" => 0, "m" => "Id asignación inválido"));
        return;
    }


    $sql = "SELECT id FROM personas WHERE id='$idP'";
    $res = ejecutaSQL($sql);
    if (!$res) {
        echo json_encode(array("s" => 0, "m" => "Persona no existe"));
        return;
    }

    $sql = "SELECT id FROM asignaciones WHERE id='$idAs'";
    $res = ejecutaSQL($sql);
    if (!$res) {
        echo json_encode(array("s" => 0, "m" => "Asignación no existe"));
        return;
    }

    $sql = "SELECT asigs.id AS idAsignacion, tem.detalle, dic.dictamen, dic.Timestamp AS Fecha FROM dictamen AS dic
            JOIN asignaciones AS asigs ON dic.ID_Asignacion = asigs.id
            JOIN personas AS pe ON pe.id = asigs.ID_Persona
            LEFT JOIN temas AS tem ON dic.id = tem.ID_Dictamen
            WHERE asigs.id = '$idAs' AND pe.id = '$idP'";

    $res = ejecutaSQL($sql);
    if (!$res) {
        echo json_encode(array("s" => 0, "m" => "No se encontraron resultados"));
        return;
    }
    $temas = array();
    while ($row = mysqli_fetch_assoc($res)) {
        $row["dictamen"]=convertirDictamen($row["dictamen"],"char");
        $row = array_map('utf8_encode', $row);
        if(!$row["detalle"])
            $row["detalle"]="";
        $temas[]=$row;
    }

    echo json_encode(array("s" => 1, "m" => "Registros obtenidos satisfactoriamente", "d" => $temas),JSON_UNESCAPED_UNICODE);
    return;
}
