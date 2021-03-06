<?php
include("conf.php");
include("libreria.php");
header("Content-Type: text/html; charset=utf-8");
ini_set('max_execution_time', 0);

global $base;
global $MY_SESSION_ADMIN;
$diaSemana = array("D", "L", "M", "Mi", "J", "V", "S");
date_default_timezone_set('US/Arizona');


# ----------------------------------------------------------------------
# Parametros validos para iniciar el dictaminador
#       dictaminador.php?
#           servicio = dictamen &
#           fecha = [ Y-m-d ] &
#           forma = [ print | database ] &
#           tipo = [ all | nss ] &
#           nss = valor (si el tipo es nss)
#_______________________________________________________________________

//Verifica si existe una sesión, para poder acceder a los servicios.
if (!isset($_SESSION[$MY_SESSION_ADMIN])) {
    if (isset($_GET['servicio']) && $_GET['servicio'] == "dictamen") {
        //Validación de que exista una fecha en el parametro $_GET['fecha']
        if (isset($_GET['fecha'])) {
            # Verificar que la fecha sea correcta
            $fecha = explode("-", $_GET['fecha'], 3);
            if (checkdate($fecha[1], $fecha[2], $fecha[0])) {
                # Verificar que exista una forma para trabajar
                if (isset($_GET['forma'])) {
                    #---------------------------------------------------------
                    # NEW RELIC                                             --
                    #                                                       --
                    if (extension_loaded('newrelic')) {
                        newrelic_set_appname($base . "_" . $_GET['servicio'] . "_" . $_GET['forma']);
                    }
                    #---------------------------------------------------------

                    # Si se va a trabajar como impresion de resultados
                    if ($_GET['forma'] == "print" || $_GET['forma'] == "database") {
                        # Verificar que exista un tipo de como trabajar [ all | nss ]
                        if (isset($_GET['tipo'])) {
                            if ($_GET['tipo'] == "all") {
                               $estado=validarChecadores();
                              if ($estado=="1"){
                                    if(isset($_GET['rango'])){
                                        $rangoFecha = explode("-", $_GET['rango'], 3);
                                        if (checkdate($rangoFecha[1], $rangoFecha[2], $rangoFecha[0])) {                                        
                                            dictaminarTodoRango($_GET['fecha'], $_GET['forma'],$_GET['rango']);
                                        }else{
                                            echo json_encode(array("s" => 0, "m" => "La fecha de rango no es valida."));
                                        }
                                    }else{
                                        dictaminarTodo($_GET['fecha'], $_GET['forma']);
                                    }                                    
                               } else {
                                    echo json_encode(array("s" => 0, "m" => "No se ejecuto el dictaminador debido a un error de conexion con  los siguientes dispositivos:"));
                                    echo "<table><tr><th>Dispositivo</th> <th>Ultima conexion</th></tr>";
                                    while ($row=mysqli_fetch_array($estado,MYSQLI_ASSOC)){
                                           echo "<tr><td>".$row["Maquina"]."</td><td>".$row["Timestamp"]."</td></tr>";
                                    }
                                    echo "</table>";
                               }
                            } elseif ($_GET['tipo'] == "nss") {
                                # Verificar que exista un nss si se va a tratar como nss
                                if (isset($_GET['nss'])) {
                                    if(isset($_GET['rango'])){
                                        $rangoFecha = explode("-", $_GET['rango'], 3);
                                        if (checkdate($rangoFecha[1], $rangoFecha[2], $rangoFecha[0])) {                                            
                                            dictaminarPersonaRango($_GET['fecha'], $_GET['forma'], $_GET['nss'], $_GET['rango']);
                                        }else{
                                            echo json_encode(array("s" => 0, "m" => "La fecha de rango no es valida."));
                                        }                                            
                                    }else{                                    
                                        dictaminarPersona($_GET['fecha'], $_GET['forma'], $_GET['nss']);
                                    }
                                } else {
                                    echo json_encode(array("s" => 0, "m" => "No se ingresó un numero de nómina"));
                                }
                            } else {
                                echo json_encode(array("s" => 0, "m" => "El tipo para realizar el dictamen no es valido"));
                            }
                        } else {
                            echo json_encode(array("s" => 0, "m" => "El tipo para realizar el dictamen no es valido"));
                        }
                    } else {
                        echo json_encode(array("s" => 0, "m" => "Forma de trabajo no es valida"));
                    }
                } # FIN Verificar que exista una forma para trabajar
                else {
                    echo json_encode(array("s" => 0, "m" => "No se ingresó una forma para trabajar"));
                }
            } # FIN Verificar que la fecha sea correcta
            else {
                echo json_encode(array("s" => 0, "m" => "La fecha es incorrecta"));
            }
        } else {
            echo json_encode(array("s" => 0, "m" => "No se ingresó una fecha"));
        }
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
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}

/**
 * Dictaminar para todas las personas que tengan una materia para la fecha especificada, ya sea solo para mostrar la información o guardarla en la base de datos
 * @param $fecha
 * @param $forma
 */
function dictaminarTodo($fecha, $forma)
{
    GLOBAL $diaSemana;
    $fechaConsulta = strtotime($fecha);

    echo "<br>Generando Dictamen para fecha: " . date("Y-m-d 00:00:00", $fechaConsulta) . "<br>";
    if ($r = nss_por_asignacion_por_dia_asignatura(date("Y-m-d 00:00:00", $fechaConsulta), date("Y-m-d 23:59:59", $fechaConsulta), $diaSemana[date("w", $fechaConsulta)])) {
        while ($l = array_pop($r)) {
            echo "<br>LINEA: ";
            print_r($l);
            echo "<br>";

            if ($forma == 'print') analizar_imp($l, date("U", $fechaConsulta));
            elseif ($forma == 'database') {
                $qry = "SELECT * FROM dictamen WHERE Fecha = '$fecha'";
                $r = ejecutaSQL($qry);
                if(mysql_num_rows($r) > 0){
                    $qry = "DELETE FROM dictamen WHERE Fecha = '$fecha'";
                    if(ejecutaSQL($qry))
                        echo "Dictamenes anteriores de la fecha ".$fecha." han sido borrados.<br>";
                    else
                        echo "No se borraron los dictamenes anteriores a la fecha ".$fecha;
                }else{
                    echo "Primer dictamen en fecha: ".$fecha."<br>";
                }           
                analizar_db($l, date("U", $fechaConsulta));
            }
        }
    }
    if (!isset($_GET['rango'])) {
        echo "<script type='text/javascript'>alert('Proceso Terminado');</script>";
    }
    
}

/**
 * Dictaminar para todas las personas que tengan una materia desde la fecha especificada hasta donde indique el rango, ya sea solo para mostrar la información o guardarla en la base de datos
 * @param $fecha
 * @param $forma
 * @param $range
 */
function dictaminarTodoRango($fecha, $forma, $range)
{      
    $untilDate = date($range);
    $currentDate = date($fecha);
    for ($c=1; $currentDate <= $untilDate ; $c++) {
        dictaminarTodo($currentDate, $forma);
        $currentDate = date('Y-m-d',strtotime("+".$c." days",strtotime($fecha)));
    }
    echo "<script type='text/javascript'>alert('Proceso Terminado');</script>";
}

/**
 * Dictaminar solo para una persona para la fecha especificada, ya sea solo para mostrar la información o guardarla en la base de datos
 * @param $fecha
 * @param $forma
 * @param $persona
 */
function dictaminarPersona($fecha, $forma, $persona)
{
    $fechaConsulta = strtotime($fecha);
    echo "<br>Generando Dictamen para fecha: " . date("Y-m-d 00:00:00", $fechaConsulta) . "<br>";
    echo "<br>LINEA: $persona <br>";   
    if ($forma == 'print') analizar_imp($persona, date("U", $fechaConsulta));
    elseif ($forma == 'database'){
        $qry = "SELECT d.ID FROM dictamen d, asignaciones a, personas p WHERE Fecha ='$fecha' AND d.ID_Asignacion =  a.ID AND a.ID_Persona = p.ID AND p.NSS = '$persona'";
        $r = ejecutaSQL($qry);
        if(mysql_num_rows($r) > 0){
            while ($row = mysql_fetch_assoc($r)) {
                $qry = "DELETE FROM dictamen WHERE ID = ". $row['ID'];
                if(!ejecutaSQL($qry))
                    echo "Error borrando dictamen de fecha ".$fecha.".<br>";
                else
                    echo "Dictamenes anteriores de la fecha ".$fecha." han sido borrados.<br>";
            }        
            
        }     
        analizar_db($persona, date("U", $fechaConsulta));    
    } 
    if (!isset($_GET['rango'])) {
        echo "<script type='text/javascript'>alert('Proceso Terminado');</script>";
    }
}

/**
 * Dictaminar para todas las personas que tengan una materia desde la fecha especificada hasta donde indique el rango, ya sea solo para mostrar la información o guardarla en la base de datos
 * @param $fecha
 * @param $forma
 * @param $persona
 * @param $range
 */
function dictaminarPersonaRango($fecha, $forma, $persona, $range)
{      
    $untilDate = date($range);
    $currentDate = date($fecha);
    for ($c=1; $currentDate <= $untilDate ; $c++) { 
        dictaminarPersona($currentDate, $forma, $persona);
        $currentDate = date('Y-m-d',strtotime("+".$c." days",strtotime($fecha)));
    }
    echo "<script type='text/javascript'>alert('Proceso Terminado');</script>";
}

/**
 *Verifica el Timestamp de los checadores es mayor a la hora actual -10 minutos
 *
*/
function validarChecadores()
{
    global $servidor;
    global $usuarioBD;
    global $pass;
    global $base;
    $date=date('Y-m-d H:i:s');

    $desconectDevices=array();
    $con = mysqli_connect ($servidor, $usuarioBD, $pass, $base);
    $sql = ("SELECT Maquina, Timestamp FROM dispositivos WHERE Timestamp < $date-INTERVAL 10 MINUTE AND Activo=1");
    $result = mysqli_query($con,$sql);
    if ($result->num_rows == 0) {
       $var="1";
    } else {
        $var=$result;
    }
    mysqli_close($con);
    return $var;
}

