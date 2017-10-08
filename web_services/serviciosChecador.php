<?php
include("conf.php");
header("Content-Type: application/json; charset=utf-8");
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Headers: http://localhost, X-Requested-With, Content-Type, Accept');

global $servidor;
global $base;
global $usuarioBD;
global $pass;
$con = mysqli_connect($servidor, $usuarioBD, $pass, $base);
$diaSemana = array("D", "L", "M", "Mi", "J", "V", "S");
$versionBLOCK = "24-06-2016 11:48:11";
date_default_timezone_set('America/Mexico_City');

if (isset($_GET['servicio'])) {
    #---------------------------------------------------------
    # NEW RELIC                                             --
    #                                                       --
    if (extension_loaded('newrelic')) {
        newrelic_set_appname($base . "_" . $_GET['servicio']);
    }
    #---------------------------------------------------------

    switch ($_GET['servicio']) {
        case "loginChecador":
            loginChecador();
            break;
        case "checadoPubOffline":
            checadoPubOffline();
            break;
        case "checadoPubOnline":
            checadoPubOnline();
            break;
        case "checadoPubOnlineNew":
            checadoPubOnlineNew();
            break;
        case "getPublicidad":
            getPublicidad();
            break;
        case "getPublicidadChecado":
            getPublicidadChecado($_POST['maquina']);
            break;
        case "getPublicidadCarrusel":
            getPublicidadCarrusel($_POST['maquina']);
            break;
        case "getPersonas":
            getPersonas();
            break;
        case "getTemas":
            getTemasDia($_POST['dia']);
            break;
        case "log":
            saveInLog();
            break;
        case "newLog":
            saveInLogNew();
            break;
        case "updateTimeDevice":
            getConection();
            break;
        case "getMatriculas":
            getMatriculas();
            break;
        case "getTime":
            getTime();
            break;
        case "imActive":
            imActive();
            break;
        case "getVersionBlock":
            echo json_encode(array("s" => 1, "m" => "","d"=>$versionBLOCK));
            break;
        case "saveContadorCarrusel":
            if (isset($_POST['contadores'])) {
                saveContadorCarrusel($_POST['contadores']);
            } else {
                echo json_encode(array("s" => 0, "m" => "Parámetros incorrectos"));
            }
            break;
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}

function loginChecador()
{
    GLOBAL $con;
    $html = '<div id="contenido"> <div id="reloj" class="clock" style="position: fixed;"></div><div id="checador" class="jumbotron" style="background: #323434; position: fixed; top: 15px; right: 15px; padding-top: 15px; padding-bottom: 15px; border-radius: 6px;"> <div class="row"> <label for="nss" style="color: #ffffff;">Ingresa tu código:</label> <div class="form-inline"> <input type="text" class="form-control" id="nss" placeholder="NSS" size="12" maxlength="12" style="font-weight: 900; font-size: large"> <button id="btnEntrar" type="submit" class="btn btn-danger btn-md">Enviar</button> </div></div></div></div><div id="semaforo"> <div id="verde"><img src="img/semaforo/semaforo-verde.png"></div><div id="amarillo" style="display: none;"><img src="img/semaforo/semaforo-amarillo.png"></div><div id="rojo" style="display: none;"><img src="img/semaforo/semaforo-rojo.png"></div></div><div id="publicidad"></div><div id="banner-estado-checada"> <div id="banner-correcto" class="banner-publicidad" style="display: none;"><img src="img/banner/banner-correcto.png"></div><div id="banner-incorrecto" class="banner-publicidad" style="display: none;"><img src="img/banner/banner-incorrecto.png"></div></div><div class="text-publicidad" style="display: none;"> </div>';
    $hostName = $_POST['maquina'];
    $hostPass = $_POST['pass'];
    $phase = $_POST['phase'];
    $sql = " SELECT * FROM dispositivos WHERE Maquina='$hostName' AND Clave='$hostPass' AND Activo = 1";
    $r = mysqli_query($con, $sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "Licencia invalida"));
    else {
        $row = mysqli_fetch_array($r);
        if ($phase == 0 && $row['Licencia'] == 0) {
            $sql = " UPDATE dispositivos SET Licencia = 1 WHERE Maquina='$hostName' AND Clave='$hostPass' ";
            if(mysqli_query($con, $sql))
                echo json_encode(array("s" => 1, "m" => "Acceso correcto", "d" => $html));
            else
                echo json_encode(array("s" => 0, "m" => "Error en el licenciamiento", "d" => $html));
        } elseif ($phase == 0 && $row['Licencia'] == 1) {
            echo json_encode(array("s" => 0, "m" => "Licencia ya usada"));
        } elseif ($phase == 1 && $row['Licencia'] == 0) {
            echo json_encode(array("s" => 0, "m" => "Error en el licenciamiento"));
        } elseif ($phase == 1 && $row['Licencia'] == 1) {
            echo json_encode(array("s" => 1, "m" => "Acceso correcto", "d" => $html));
        }
    }
    mysqli_close($con);
}

function checadoPubOffline()
{
    GLOBAL $con;
    $nss = $_POST['nss'];
    $fecha = $_POST['periodo'];
    $idPub = $_POST['pub'];
    $devID = $_POST['devID'];
    $hostName = $_POST['hostName'];
    $key = $_POST['llave'];


    if(isset($_POST['titulo']) && $_POST['titulo']=='alumno'){
        $sql = "SELECT a.id_persona, b.nombre, b.apellidoP, b.apellidoM FROM identificador a, personas b WHERE a.id1='$nss' AND b.id=a.id_persona AND b.Titulo = 'alumno'";
    }else{
        $sql = "SELECT a.id_persona, b.nombre, b.apellidoP, b.apellidoM FROM identificador a, personas b WHERE a.id1='$nss' AND b.id=a.id_persona";
    }

    $result = mysqli_fetch_array(mysqli_query($con, $sql));
    $rs = $result[0];
    if ($rs) {
        $sql = "SELECT ID FROM dispositivos WHERE Maquina = '$hostName' ";
        $r = mysqli_fetch_array(mysqli_query($con, $sql));
        $hostId = $r['ID'];
        if ($idPub == '') {
            $sql = "INSERT INTO checado(Periodo, ID_Dispositivo, ID_Persona, Forma, ID_device) VALUES ('$fecha','$hostId','$rs', 'offline', $devID) ";
            mysqli_query($con, $sql);
        } else {
            $sql = "INSERT INTO checado(Periodo, ID_Dispositivo, ID_Persona, ID_Publicidad, Forma, ID_device) VALUES ('$fecha','$hostId','$rs', '$idPub', 'offline', $devID) ";
            mysqli_query($con, $sql);
        }
        echo json_encode(array("s" => 1, "m" => "Incidencia Guardada", "d" => array("llave" => $key)));
    } else
        echo json_encode(array("s" => 0, "m" => "No se guardó la Incidencia"));
    mysqli_close($con);
}

/**
 * Funcion que guarda las checadas online.
 * @deprecated since version 4
 */
function checadoPubOnline()
{
    GLOBAL $con;
    $nss = $_POST['nss'];
    $idPub = $_POST['pub'];
    $hostName = $_POST['hostName'];
    $sql = "SELECT * FROM personas  WHERE NSS= ".$nss;
    $result = mysqli_fetch_array(mysqli_query($con, $sql));
    $nombre = $result['ApellidoP'] . " " . $result['ApellidoM'] . " " . $result['Nombre'];
    $rs = $result[0];
    if ($rs) {
        $sql = "SELECT ID FROM dispositivos WHERE Maquina = '$hostName' ";
        $r1 = mysqli_fetch_array(mysqli_query($con, $sql));
        $hostId = $r1['ID'];
        mysqli_query($con, "INSERT INTO checado (ID_Dispositivo, ID_Persona, ID_Publicidad) VALUES ('$hostId','$rs', '$idPub') ");
        $json = array("s" => 1, "m" => "Incidencia guardada", 'd' => array("nombre" => utf8_encode($nombre)));
    } else
        $json = array('s' => 0, 'm' => 'Error, el id no esta siendo utilizado por alguien.');
    echo json_encode($json);
    mysqli_close($con);
}

function checadoPubOnlineNew()
{
    GLOBAL $con;
    GLOBAL $diaSemana;

    $nss = $_POST['nss'];
    $idPub = $_POST['pub'];
    $devID = $_POST['devID'];
    $hostName = $_POST['hostName'];
    $periodo = date("Y-m-d H:i:s");
    // Conocer si una persona existe por el Identificador
    if(isset($_POST['titulo']) && $_POST['titulo']=='alumno'){
        $sql = "SELECT a.id_persona, b.nombre, b.apellidoP, b.apellidoM FROM identificador a, personas b WHERE a.id1='$nss' AND b.id=a.id_persona AND b.Titulo = 'alumno'";
    }else
        $sql = "SELECT a.id_persona, b.nombre, b.apellidoP, b.apellidoM FROM identificador a, personas b WHERE a.id1='$nss' AND b.id=a.id_persona";
    $result = mysqli_fetch_array(mysqli_query($con, $sql));
    $nombre = $result['apellidoP'] . " " . $result['apellidoM'] . " " . $result['nombre'];
    $rs = $result[0];
    if ($rs) {
        //Conocer el ID del dispositivo
        $sql = "SELECT ID FROM dispositivos WHERE Maquina = '$hostName' ";
        $r1 = mysqli_fetch_array(mysqli_query($con, $sql));
        $hostId = $r1['ID'];
        // Ingresar incidencia
        if ($idPub == '') {
            mysqli_query($con, "INSERT INTO checado (Periodo,  ID_Dispositivo, ID_Persona, Forma, ID_device) VALUES ('$periodo','$hostId','$rs', 'online', $devID) ");
        } else {
            mysqli_query($con, "INSERT INTO checado (Periodo, ID_Dispositivo, ID_Persona, ID_Publicidad, Forma, ID_device) VALUES ('$periodo','$hostId','$rs', '$idPub', 'online', $devID) ");
        }
        //Conocer si la persona tiene asignaciones
        //TODO: Cambio nueva instancia: Modicar las restricciones de servicios exluidos. ['CIDETEC', 'CAMPUS']
        $sql = "SELECT s.Titulo, a.ID as ID_ASIGNACION, a.FechaInicio, a.FechaFin, d.Dia, d.HoraInicio, d.HoraFin, g.Nombre FROM asignaciones AS a
                INNER JOIN detalle_asignacion AS d ON d.ID_Asignacion = a.ID
                INNER JOIN personas AS p ON a.ID_Persona = p.ID
                INNER JOIN servicios AS s ON a.ID_Servicio = s.ID
                INNER JOIN detalle_grupos AS de ON de.ID_Persona = p.ID
                INNER JOIN grupos AS g ON g.ID = de.ID_Grupo
                WHERE p.NSS = '$nss' AND d.Dia = '{$diaSemana[date('w')]}' AND a.Activo = 1
                AND s.Codigo <> 'CAMPUS' AND s.Codigo <> 'CIDETEC' AND g.Nombre = 'Mostrar Temas'
                AND a.FechaInicio <= CURDATE() AND a.FechaFin >= CURDATE() ORDER BY d.HoraInicio ";
        if ($r2 = mysqli_query($con, $sql)) {
            if (mysqli_num_rows($r2) == 0) {
                $json = array("s" => 1, "m" => "Incidencia guardada", 'd' => array("nombre" => utf8_encode($nombre), "temas" => array()));
            } else {
                $asigConTemas = array();
                while ($asig = mysqli_fetch_assoc($r2)) {
                    $asig = array_map("utf8_encode", $asig);
                    $sql = " SELECT Titulo FROM temas WHERE ID_Asignacion = {$asig['ID_ASIGNACION']} AND Dia = CURDATE() ";
                    $r3 = mysqli_query($con, $sql);
                    $temp = array("titulo" => $asig["Titulo"], "hi" => $asig["HoraInicio"], "hf" => $asig["HoraFin"], "tema" => "");
                    if (mysqli_num_rows($r3) == 0) {
                        $temp['tema'] = "El tema no ha sido cargado";
                    } else {
                        $tema = mysqli_fetch_array($r3);
                        $temp['tema'] = utf8_encode($tema['Titulo']);
                    }
                    array_push($asigConTemas, $temp);
                }
                $json = array("s" => 1, "m" => "Incidencia guardada", 'd' => array("nombre" => utf8_encode($nombre), "temas" => $asigConTemas));
            }
        } else
            $json = array('s' => 0, 'm' => 'Error, no se pudo buscar asignaciones para la persona.');
    } else
        $json = array('s' => 0, 'm' => 'Error, el id no esta siendo utilizado por alguien.');

    echo json_encode($json);
    mysqli_close($con);
}

# Deprecated since V_5
/**
 * Funcion para obtener la publicidad que se usa para las checadas.
 * @deprecated Since version 5
 */
function getPublicidad()
{
    GLOBAL $con;
    $r = mysqli_query($con, " SELECT * FROM publicidad WHERE Activo = 1");
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No existe publicidad."));
    else {
        $res = array();
        while ($l = mysqli_fetch_assoc($r)) {
            $res[] = $l;
        }
        echo json_encode(array("s" => 1, "m" => "Búsqueda publicidad exitosa", "d" => $res));
    }
    mysqli_close($con);
}

function getPublicidadChecado($maquina)
{
    GLOBAL $con;
    $sql = " SELECT pub.ID, Ruta FROM checador_publicidad as cp
            INNER JOIN publicidad AS pub ON pub.ID = ID_Publicidad
            INNER JOIN tipos_publicidad AS tp ON tp.ID = ID_Tipo_Publicidad
            INNER JOIN dispositivos AS dev ON dev.ID = ID_Dispositivo AND dev.Activo = 1
            WHERE pub.Activo = 1 AND tp.Tipo = 'Checada' AND dev.Maquina = '$maquina' AND cp.Activo = '1'";
    $r = mysqli_query($con, $sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No existe publicidad."));
    else {
        $res = array();
        while ($l = mysqli_fetch_assoc($r)) {
            $res[] = $l;
        }
        echo json_encode(array("s" => 1, "m" => "Búsqueda publicidad exitosa", "d" => $res));
    }
    mysqli_close($con);
}

function getPublicidadCarrusel($maquina)
{
    GLOBAL $con;
    $sql = "SELECT cp.ID, Ruta FROM checador_publicidad AS cp
            INNER JOIN publicidad AS pub ON pub.ID = ID_Publicidad
            INNER JOIN tipos_publicidad AS tp ON tp.ID = ID_Tipo_Publicidad
            INNER JOIN dispositivos AS dev ON dev.ID = ID_Dispositivo AND dev.Activo = 1
            WHERE pub.Activo = 1 AND tp.Tipo = 'Carrusel' AND dev.Maquina = '$maquina'  AND cp.Activo = '1'";
    //echo ($sql);
    $r = mysqli_query($con, $sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No existe publicidad."));
    else {
        $res = array();
        while ($l = mysqli_fetch_assoc($r)) {
            $res[] = $l;
        }
        echo json_encode(array("s" => 1, "m" => "Búsqueda publicidad para carrusel exitosa", "d" => $res));
    }
    mysqli_close($con);
}

function getPersonas()
{
    GLOBAL $con;
    $r = mysqli_query($con, " SELECT NSS, CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Nombre FROM personas ORDER BY NSS ");
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "Error al buscar personas."));
    else {
        $res = array();
        while ($l = mysqli_fetch_array($r)) {
            $l = array_map('utf8_encode', $l);
            $res[$l['NSS']] = $l['Nombre'];
        }
        echo json_encode(array("s" => 1, "m" => "Busqueda personas existosa", "d" => $res));
    }
    mysqli_close($con);
}

function getTemasDia($dia)
{
    GLOBAL $con;
    GLOBAL $diaSemana;
    $day = date('Y-m-d', $dia);
    $sql = "SELECT p.NSS, s.Titulo, a.ID as ID_ASIGNACION, d.HoraInicio, d.HoraFin, g.Nombre FROM asignaciones AS a
            INNER JOIN detalle_asignacion AS d ON d.ID_Asignacion = a.ID
            INNER JOIN personas AS p ON a.ID_Persona = p.ID
            INNER JOIN servicios AS s ON a.ID_Servicio = s.ID
            INNER JOIN detalle_grupos AS de ON de.ID_Persona = p.ID
            INNER JOIN grupos AS g ON g.ID = de.ID_Grupo
            WHERE d.Dia = '{$diaSemana[date('w', $dia)]}' AND a.Activo = 1
            AND s.Codigo <> 'CAMPUS' AND s.Codigo <> 'CIDETEC' AND g.Nombre = 'Mostrar Temas'
            AND a.FechaInicio <= '$day' AND a.FechaFin >= '$day' ORDER BY d.HoraInicio ";
    if ($r = mysqli_query($con, $sql)) {
        if (mysqli_num_rows($r) == 0)
            echo json_encode(array("s" => 1, "m" => "No existen asignaciones-temas para este día.", "d" => array()));
        else {
            $asigConTemas = array();
            while ($asig = mysqli_fetch_array($r)) {
                $asig = array_map('utf8_encode', $asig);
                $sql = " SELECT Titulo FROM temas WHERE ID_Asignacion = {$asig['ID_ASIGNACION']} AND Dia = '$day' ";
                $r3 = mysqli_query($con, $sql);
                $temp = array("titulo" => $asig['Titulo'], "hi" => $asig['HoraInicio'], "hf" => $asig['HoraFin'], "tema" => "");
                //Verificar que existan temas para la persona en este día
                if (mysqli_num_rows($r3) == 0) {
                    $temp['tema'] = "El tema no ha sido cargado";
                } else {
                    $tema = mysqli_fetch_array($r3);
                    $temp['tema'] = utf8_encode($tema['Titulo']);
                }

                if (array_key_exists($asig['NSS'], $asigConTemas)) {
                    array_push($asigConTemas[$asig['NSS']], $temp);
                } else {
                    $asigConTemas["{$asig['NSS']}"] = array($temp);
                }
            }
            echo json_encode(array("s" => 1, "m" => "Busqueda asignaciones-temas existosa", "d" => $asigConTemas));
        }
    } else
        echo json_encode(array("s" => 0, "m" => "Error al buscar asignacion-temas por día."));
    mysqli_close($con);
}

/**
 * Funcion que guarda las checadas en la base de datos, esta funcion ya no es utilizada.
 * @deprecated
 */
function checado()
{
    GLOBAL $con;
    $id = $_GET['id'];
    $result = mysqli_fetch_array(mysqli_query($con, "SELECT a.id_persona, b.nombre, b.apellidoP, b.apellidoM FROM identificador a, personas b WHERE a.id1='$id' AND b.id=a.id_persona"));
    $nombre = $result['nombre'] . " " . $result['apellidoP'] . " " . $result['apellidoM'];
    $rs = $result[0];
    if ($rs) {
        mysqli_query($con, "INSERT INTO checado(id_dispositivo,id_persona) VALUES ('1','$rs')");
        $json = array('mensaje' => 'OK', 'nombre' => utf8_encode($nombre));
    } else
        $json = array('mensaje' => 'Error, el id no esta siendo utilizado por alguien.');
    echo json_encode($json);
    mysqli_close($con);
}

/**
 * Function to save in log that it's deprecated since v5
 * @deprecated
 */
function saveInLog()
{
    GLOBAL $con;
    $mensaje = utf8_decode($_POST['msj']);
    $r = mysqli_query($con, " INSERT INTO log (descripcion, tipo) VALUES ('$mensaje', 'W') ");
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Mensaje guardado en LOG"));
    else
        echo json_encode(array("s" => 0, "m" => "Error al guardar mensaje en LOG"));
    mysqli_close($con);

}

/**
 *
 */
function saveInLogNew()
{
    GLOBAL $con;
    $mensaje = utf8_decode($_POST['msj']);
    $device = $_POST['device'];
    //Conocer el ID del dispositivo
    $sql = "SELECT ID FROM dispositivos WHERE Maquina = '$device' ";
    $dispositivo = mysqli_fetch_array(mysqli_query($con, $sql));
    $hostId = $dispositivo['ID'];
    $r = mysqli_query($con, " INSERT INTO log (ID_Dispositivo, Descripcion, Tipo) VALUES ('$hostId', '$mensaje', 'W') ");
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Mensaje guardado en LOG"));
    else
        echo json_encode(array("s" => 0, "m" => "Error al guardar mensaje en LOG"));
    mysqli_close($con);
}

/**
 *
 *Actualiza la hora del dispositivo junto con el getTime
 */

function updateTimeDevice($device){
    GLOBAL $con;
    $sql="UPDATE dispositivos SET TimeStamp = NOW() WHERE Maquina = '$device' ";
    $r=mysqli_query($con,$sql);
    if ($r==1){
       $msg = "Timestamp del dispositivo actualizado";
    } else {
        $msg = "Error en la actualizacion del Timestamp del dispositivo";
    }
    mysqli_close($con);
    return $msg;
}


/**
 *
 */
function getTime()
{
    //date_default_timezone_set('America/Mexico_City');
    $fecha = array("year" => date('Y'), "month" => date('n'), "day" => date('j'), "hour" => date('G'), "minute" => date('i'), "second" => date('s'));
    $update_tmp_result = updateTimeDevice($_GET['device']);
    echo json_encode(array("s" => 1, "m" => $update_tmp_result, "d" => $fecha));
}

/**
 * @param $data
 */
function saveContadorCarrusel($data)
{
    if($data != "false") {
        GLOBAL $con;
        $isCorrect = true;
        foreach ($data['datos'] as $key => $value) {
            foreach ($value as $index => $valor) {
                if ($key < 10) {
                    $myTime = date("Y-m-d", $data['fecha']) . " 0$key%";
                    $myDate = date("Y-m-d", $data['fecha']) . " 0$key:00:00";
                } else {
                    $myTime = date("Y-m-d", $data['fecha']) . " $key%";
                    $myDate = date("Y-m-d", $data['fecha']) . " $key:00:00";
                }
                $sqlCheck = " SELECT * FROM detalle_carrusel WHERE ID_Checador_Publicidad = {$valor['id']} AND Periodo LIKE '$myTime' ";
                if ($resCheck = mysqli_query($con, $sqlCheck)) {
                    if (mysqli_num_rows($resCheck) > 0) {
                        $sqlUpdate = "UPDATE detalle_carrusel SET Contador = Contador + {$valor['cnt']}
                                 WHERE ID_Checador_Publicidad = {$valor['id']} AND Periodo LIKE '$myTime' ";
                        if (!mysqli_query($con, $sqlUpdate)) {
                            $isCorrect = false;
                            break 2;
                        }
                    } else {
                        $sqlInsert = "INSERT INTO detalle_carrusel (ID_Checador_Publicidad, Contador, Periodo) VALUES ({$valor['id']}, {$valor['cnt']}, '$myDate') ";
                        if (!mysqli_query($con, $sqlInsert)) {
                            $isCorrect = false;
                            break 2;
                        }
                    }
                } else {
                    $isCorrect = false;
                    break 2;
                }
            }
        }
        if ($isCorrect) {
            echo json_encode(array("s" => 1, "m" => "Contadores guardados"));
        } else {
            echo json_encode(array("s" => 0, "m" => "Error al guardar contadores"));
        }
        mysqli_close($con);
    }
    else {
        echo json_encode(array("s" => 1, "m" => "No se realizó ninguna acción"));
    }
}

function getMatriculas(){
    GLOBAL $con;
    $r = mysqli_query($con, " SELECT NSS, CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) AS Nombre FROM personas WHERE titulo = 'alumno' ORDER BY NSS ");
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "Error al buscar matriculas."));
    else {
        $res = array();
        while ($l = mysqli_fetch_array($r)) {
            $l = array_map('utf8_encode', $l);
            $res[$l['NSS']] = $l['Nombre'];
        }
        echo json_encode(array("s" => 1, "m" => "Busqueda de matriculas existosa", "d" => $res));
    }
    mysqli_close($con);
}

function imActive(){
    global $con;
    $maq = $_POST['maquina'];
    $p = $_POST['pass'];
    $sql = "SELECT Activo FROM dispositivos WHERE Maquina = '$maq' AND Clave = '$p'";
    $r = mysqli_query($con, $sql);
    if(mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "Maquina ".$maq." no existe."));
    else{
        if(mysql_result($r, 0,"Activo") == 1){
            echo json_encode(array("s" => 1, "m" => "Maquina ".$maq." activa.", "d"=>1));
        }else{
            echo json_encode(array("s" => 1, "m" => "Maquina ".$maq." inactiva.", "d"=>0));
        }
    }
    mysqli_close($con);
}
