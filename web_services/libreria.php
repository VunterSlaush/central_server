<?php

header("Content-Type: text/html; charset=utf-8");
// header("Content-Type: application/json; charset=utf-8");
ini_set('max_execution_time', 0);
include_once('./utilities/helpers.php');
/* Funciones utilitarias SQL
   Deben ser declaradas las variables
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;
   en el script que manda llamar esta libreria
*/

/*Valores de Accesos para los catalogos del Dashboard

    Lectura     1       1       1       1       1       1
    Escritura   2       2       2       0       0       0
    Modificar   3       3       0       3       0       0
    Delete      1       0       0       0       1       0
    _____________________________________________________
    Total       7       6       3       4       2       1

*/

$menuDashboard = array('Administradores',
                       'Roles',
                       'Grupos',
                       'Personas',
                       'Espacios',
                       'Servicios',
                       'Asignaciones',
                       'Reportes',
                       'Dias_no_laborales',
                       'Dispositivos');
$bannedRomms = array();

function ejecutaSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    mysqli_select_db($link, $base);
    $res = mysqli_query($link, $sql);

    if (!$res) {
        error("Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql, "E");
        return 0;
    }
    mysqli_close($link);
    return $res;
}

function insertaSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass)) {
        echo "Error: No se pudo conectar con la base de datos";
        return FALSE;
    }
    mysqli_select_db($link, $base);
    $res = mysqli_query($link,$sql);

    if (contains("vinculacion_persona",$sql)){
        return $res;
    }

    if (contains("identificador",$sql)){
        return $res;
    }

    if (!$res) {
        echo "Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql;
        return FALSE;
    }

    if (contains("pagos_mem",$sql)){
        $resp = mysqli_affected_rows($link);
        return $resp;
    }

    $resp = mysqli_insert_id($link);
    mysqli_close($link);
    return $resp;
}

function updateSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    mysqli_select_db($link, $base);
    $res = mysqli_query($link, $sql);
    if (!$res) {
        error("Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql, "E");
        return 0;
    }
    $resp = mysqli_affected_rows($link);
    mysqli_close($link);
    return $resp;
}


function deleteSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    mysqli_select_db($link, $base);
    $res = mysqli_query($link, $sql);
    if (!$res) {
        error("Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql, "E");
        return 0;
    }
    $resp = mysqli_affected_rows($link);
    mysqli_close($link);
    return $resp;
}
/* Funciones propias del sistema, seccion DEBUG */

function analizar_imp($nss, $fecha)
{
    /*funcion que analiza las incidencias de un elemento que tiene asignado un NSS en la fecha indicada
    1. Obtener pila de incidencias
    2. Obtener pila de servicios
    3. Inicializar variables
    4. Inciar maquina de estados
    5. Guardar informaci�n del analisis en la BD del dictamen
    5.E Imprimir informaci�n del analisis (si la variable $imp==1)*/

    global $Pi;
    global $Ps;
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;
    global $tiempoRetardoBach;        // Tiempo de tolerancia de entrada para BB, BC y BS
    global $tiempoAbandonoBach;        // Tiempo de tolerancia de salida para BB, BC y BS
    global $tiempoEntradaBach;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaBach;        //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueBach;        //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoLic;        // Tiempo de tolerancia de entrada para LS y GL
    global $tiempoAbandonoLic;        // Tiempo de tolerancia de salida para LS y GL
    global $tiempoEntradaLic;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaLic;        //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueLic;        //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoEjecPos;    // Tiempo de tolerancia de entrada para LX, PC, PT
    global $tiempoAbandonoEjecPos;    // Tiempo de tolerancia de salida para LX, PC, PT
    global $tiempoEntradaEjecPos;    //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaEjecPos;    //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueEjecPos;    //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoAdmin;    // Tiempo de tolerancia de entrada para Administrativos
    global $tiempoAbandonoAdmin;    // Tiempo de tolerancia de salida para Administrativos
    global $tiempoEntradaAdmin;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaAdmin;        //Rango de tiempo para aceptar una incidencia de salida
    global $bannedRomms;               //Lista de salones con asistencia automatica

    //1. Obtener pila de incidencias del nss para el d�a $fecha que es un timestamp donde $FI = 2014-02-22 00:00:00 y $FF = 2014-02-22 23:59:59
    $flagS = FALSE;
    $flagI = FALSE;

    //1.1 Obtenemos el ID a partir del numero de nomina del trabajador
    $sql = "SELECT p.ID FROM personas p WHERE p.NSS='$nss'";
    if (!$r = ejecutaSQL($sql)) {
        echo "ERROR 0: No se puedo hacer el Query";
    } elseif (mysqli_num_rows($r) == 0) {
        echo "<b>La persona no existe</b><hr><br>";
    } else {
        $l = mysql_fetch_assoc($r);
        $id_persona = $l['ID'];

        echo "Analizando para la persona : $nss($id_persona) en la fecha $fecha";

        //1.2 Obtenemos las incidencias
        $Pi = array();
        $FI = date("Y-m-d 00:00:00", $fecha);
        $FF = date("Y-m-d 23:59:59", $fecha);
        $sql = "SELECT a.Periodo FROM checado a, personas p
                WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND a.Periodo > '$FI' AND a.Periodo < '$FF' ORDER BY a.Periodo ASC ";
        //echo $sql;
        if (!$r = ejecutaSQL($sql)) {
            echo "<br><b>ERROR 1: NO SE PUDO HACER CONSULTA.</b>";
        } elseif (mysqli_num_rows($r) == 0) {
            echo("<br><b>WARNING 1: NO HAY INCIDENCIAS PARA ESE DIA</b>");
        }
        echo "<br>Fetch de incidencias:  <br>";
        while ($l = mysql_fetch_assoc($r)) {
            print_r($l);
            echo "<br>";
            array_push($Pi, $l['Periodo']);
        }
        if ((count($Pi) % 2) != 0) {
            echo "<br><b>ERROR 2: EL NUMERO DE INCIDENCIAS ES IMPAR, HAY QUE REVISAR EL CASO</b><br>";
        }

        //2. Obtener pila de servicios vigentes para este dia

        //2.2 Obtenemos los horarios de los servicios del dia de la semana en cuestion; por cada servicio registrado, buscamos la coincidencia entre el dia de la semana del detalle y el dia de consulta
        $d = date("N", $fecha);
        switch ($d) {
            case "1" :
                $d = "L";
                break;
            case "2" :
                $d = "M";
                break;
            case "3" :
                $d = "Mi";
                break;
            case "4" :
                $d = "J";
                break;
            case "5" :
                $d = "V";
                break;
            case "6" :
                $d = "S";
                break;
            case "7" :
                $d = "D";
                break;
        }

        $Ps = array();
        //print_r($Pa);
        $FI = date("Y-m-d", $fecha);
        $sql = "SELECT s.Titulo, s.Nivel, a.ID as ID_ASIGNACION, a.ID_SERVICIO, e.Nombre as salon, a.FechaInicio, a.FechaFin, a.CRN, d.Dia, d.HoraInicio, d.HoraFin
                FROM asignaciones a, detalle_asignacion d, servicios s, espacios e
                WHERE a.ID_Persona=$id_persona
                AND a.FechaInicio<='$FI'
                AND a.FechaFin >= '$FI'
                AND a.Activo = 1
                AND d.ID_Asignacion = a.ID
                AND d.Dia = '$d' AND ID_SERVICIO <> 1
                AND s.ID=a.ID_SERVICIO
                AND e.ID = a.ID_Espacio
                ORDER BY d.HoraInicio ASC ";
        //ERROR: AQUI PUEDE ESTAR EL TEMA DEL ORDENAMIENTO
        //echo $sql;
        $qry="SELECT nivel FROM dias_no_laborales WHERE Activo = 1 AND dia = '".date("Y-m-d", $fecha)."'";
        $h=ejecutaSQL($qry);
        $nFeriados=array();
        if (mysqli_num_rows($h)!=0) {
            while ($fi = mysql_fetch_assoc($h)){
                array_push($nFeriados, $fi['nivel']);
            }
        }
        $b=0;
        $t=0;
        if ($r = ejecutaSQL($sql)) {
            //echo "<BR>" . $sql;
            echo "Lista de asignaciones <br> ";
            while ($ll = mysql_fetch_assoc($r)) {
                    $t++;
                    if (in_array($ll['Nivel'], $nFeriados)){
                        echo "<b>DIA NO LABORAL:</b><br>";
                        echo "Materia: ".$ll['Titulo']." <br>";
                        echo "Nivel: ".$ll['Nivel']."<br>";
                        $b++;
                    }else{
                        echo "<b>ASIGNACION</b><br>";
                        print_r($ll);
                        echo "<br>";
                        $Ri = strtotime(date("Y-m-d", $fecha) . " " . $ll['HoraInicio']);
                        $Rs = strtotime(date("Y-m-d", $fecha) . " " . $ll['HoraFin']);
                        array_push($Ps, array("ID" => $ll['ID_SERVICIO'], "NOMBRE" => $ll['Titulo'], "NIVEL" => $ll['Nivel'], "Ri" => $Ri, "Rs" => $Rs, "Salon"=>$ll['salon']));
                    }
            }
        }
        if ($b==$t) {
            echo "<b>DIA NO LABORAL EN NINGUN NIVEL.</b>";
            echo "<br><hr>";
            return;
        }
        if (count($Ps) == 0) echo "<b>WARNING 3: NO HAY ASIGNACIONES PARA ESE DIA</b>";
        else {
            //3. Inicializar variables
            $resultado = "";

            //4. La maquina ya esta inicializada en el archivo conf.php

            //Antes de entrar al proceso de la maquina debemos revisar si el n�mero de incidencias es = 0,
            // si asi fuera entonces todas las asignaciones son iguales a falta.
            echo "<br> Numero de Incidencias: " . count($Pi);
            if (count($Pi) == 0 && count($Ps) > 0) {
                while ($serv = array_shift($Ps)) {
                    if(!in_array($serv['Salon'], $bannedRomms)){
                        echo "<br> Asignaci&oacute;n: ";
                        print_r($serv);
                        echo "<b>RESULTADO = AUSENCIA</b>";
                    }else{
                        echo "<br> Asignaci&oacute;n: ";
                        print_r($serv);
                        echo "<b>RESULTADO = ASISTENCIA</b>";
                    }
                }
                echo "<br>////////////////////////////**********************//////////////////////////////<br><br>";
            } //Aqui se agrupan las asignaciones por nivel y se les da tratamiento de acuerdo al tipo.
            else {
                $asigBBCS = array();
                $asigLS = array();
                $asigLX = array();
                $asigAD = array();
                foreach ($Ps as $asignacion) {
                    if(in_array($asignacion['Salon'], $bannedRomms));
                    elseif ($asignacion['NIVEL'] == 'AD') {
                        $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoAdmin * 60);
                        $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoAdmin * 60);
                        array_push($asigAD, $asignacion);
                    } elseif ($asignacion['NIVEL'] == 'BB' || $asignacion['NIVEL'] == 'BC' || $asignacion['NIVEL'] == 'BS') {
                        $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoBach * 60);
                        $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoBach * 60);
                        array_push($asigBBCS, $asignacion);
                    } elseif ($asignacion['NIVEL'] == 'LX' || $asignacion['NIVEL'] == 'PC' || $asignacion['NIVEL'] == 'PT' || $asignacion['NIVEL'] == 'MO' || $asignacion['NIVEL'] == 'SC') {
                        $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoEjecPos * 60);
                        $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoEjecPos * 60);
                        array_push($asigLX, $asignacion);
                    } elseif ($asignacion['NIVEL'] == 'LC' || $asignacion['NIVEL'] == 'GL' ||  $asignacion['NIVEL'] == 'NC' || $asignacion['NIVEL'] == 'CD') {
                        $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoLic * 60);
                        $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoLic * 60);
                        array_push($asigLS, $asignacion);
                    }
                }//Fin foreach Ps
                if (count($asigBBCS) > 0) {
                $tempEntrada = ($tiempoRetardoBach + $tiempoEntradaBach) * 60;
                $tempSalida = ($tiempoAbandonoBach + $tiempoSalidaBach) * 60;
                $tempBloque = $espacioBloqueBach + $tiempoRetardoBach + $tiempoAbandonoBach;
                echo "<br><b>Realizando dictamen para preparatoria </b> ";
                while (count($asigBBCS) > 0) {
                    if (count($asigBBCS) == 1) {
                        $espInQu = array();
                        echo "<br><b>Evaluando solo 1 asignaci&oacute;n</b>";
                        foreach ($Pi as $incid) {
                            $incidTemp = strtotime($incid);
                            if ($incidTemp >= ($asigBBCS[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigBBCS[0]['Rs'] + $tempSalida)) {
                                array_push($espInQu, $incid);
                            }
                        }
                        # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                        if (count($espInQu) > 2) {
                            $first = $espInQu[0];
                            $last = end($espInQu);
                            $espInQu = array($first, $last);
                        }
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($espInQu);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($asigBBCS);
                        echo "<br><br>";
                        maquina_imp($espInQu, $asigBBCS);
                        array_shift($asigBBCS);
                    } else {
                        $espAsQu = array();
                        $espInQu = array();
                        $flagNoBlock = false;
                        $curAsig = array_shift($asigBBCS);
                        while (!$flagNoBlock) {
                            if (!count($asigBBCS) > 0) {
                                array_push($espAsQu, $curAsig);
                                $flagNoBlock = true;
                            } else {
                                $tempTime = ($asigBBCS[0]['Ri'] - $curAsig['Rs']) / 60;
                                # Verificar que la diferencia de tiempo no sea menor a 0
                                if ($tempTime < 0) {
                                    echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                }
                                echo "<br>tempTime = " . $tempTime;
                                if ($tempTime <= $tempBloque) {
                                    echo " true";
                                    array_push($espAsQu, $curAsig);
                                    $curAsig = array_shift($asigBBCS);
                                } else {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                }
                            }
                        }
                        foreach ($Pi as $incid) {
                            $lastAs = end($espAsQu);
                            $incidTemp = strtotime($incid);
                            if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($lastAs['Rs'] + $tempSalida)) {
                                array_push($espInQu, $incid);
                            }
                        }
                        # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                        if (count($espInQu) > 2) {
                            $first = $espInQu[0];
                            $last = end($espInQu);
                            $espInQu = array($first, $last);
                        }
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($espInQu);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($espAsQu);
                        echo "<br><br>";
                        maquina_imp($espInQu, $espAsQu);
                    }
                }
                echo "<b>Evaluacion prepa terminada</b><br>";
            }    // Fin IF asignaciones de prepa > 0
                if (count($asigLS) > 0) {
                    $tempEntrada = ($tiempoRetardoLic + $tiempoEntradaLic) * 60;
                    $tempSalida = ($tiempoAbandonoLic + $tiempoSalidaLic) * 60;
                    $tempBloque = $espacioBloqueLic + $tiempoRetardoLic + $tiempoAbandonoLic;
                    echo "<br><b>Realizando dictamen para LS </b> ";
                    while (count($asigLS) > 0) {
                        if (count($asigLS) == 1) {
                            $espInQu = array();
                            echo "<br><b>Evaluando solo 1 asignaci&oacute;n</b>";
                            foreach ($Pi as $incid) {
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($asigLS[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigLS[0]['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($asigLS);
                            echo "<br><br>";
                            maquina_imp($espInQu, $asigLS);
                            array_shift($asigLS);
                        } else {
                            $espAsQu = array();
                            $espInQu = array();
                            $flagNoBlock = false;
                            $curAsig = array_shift($asigLS);
                            while (!$flagNoBlock) {
                                if (!count($asigLS) > 0) {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                } else {
                                    $tempTime = ($asigLS[0]['Ri'] - $curAsig['Rs']) / 60;
                                    # Verificar que la diferencia de tiempo no sea menor a 0
                                    if ($tempTime < 0) {
                                        echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                    }
                                    echo "<br>tempTime = " . $tempTime;
                                    //Caso para 30 min de diferencia
                                    if ($tempTime <= $tempBloque) {
                                        echo " true";
                                        array_push($espAsQu, $curAsig);
                                        $curAsig = array_shift($asigLS);
                                    } else {
                                        array_push($espAsQu, $curAsig);
                                        $flagNoBlock = true;
                                    }
                                }
                            }
                            foreach ($Pi as $incid) {
                                $temp = end($espAsQu);
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($temp['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($espAsQu);
                            echo "<br><br>";
                            maquina_imp($espInQu, $espAsQu);
                        }
                    }
                    echo "<b>Evaluacion LS terminada</b><br>";
                } // Fin IF asignaciones de LS > 0
                if (count($asigLX) > 0) {
                    $tempEntrada = ($tiempoRetardoEjecPos + $tiempoEntradaEjecPos) * 60;
                    $tempSalida = ($tiempoAbandonoEjecPos + $tiempoSalidaEjecPos) * 60;
                    $tempBloque = $espacioBloqueEjecPos + $tiempoRetardoEjecPos + $tiempoAbandonoEjecPos;
                    echo "<br><b>Realizando dictamen para LX</b> ";
                    while (count($asigLX) > 0) {
                        if (count($asigLX) == 1) {
                            $espInQu = array();
                            echo "<br><b>Evaluando solo 1 asignaci&oacute;n</b>";
                            foreach ($Pi as $incid) {
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($asigLX[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigLX[0]['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($asigLX);
                            echo "<br><br>";
                            maquina_imp($espInQu, $asigLX);
                            array_shift($asigLX);
                        } else {
                            $espAsQu = array();
                            $espInQu = array();
                            $flagNoBlock = false;
                            $curAsig = array_shift($asigLX);
                            while (!$flagNoBlock) {
                                if (!count($asigLX) > 0) {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                } else {
                                    $tempTime = ($asigLX[0]['Ri'] - $curAsig['Rs']) / 60;
                                    # Verificar que la diferencia de tiempo no sea menor a 0
                                    if ($tempTime < 0) {
                                        echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                    }
                                    echo "<br>tempTime = " . $tempTime;
                                    //Caso para 30 min de diferencia
                                    if ($tempTime <= $tempBloque) {
                                        echo " true";
                                        array_push($espAsQu, $curAsig);
                                        $curAsig = array_shift($asigLX);
                                    } else {
                                        array_push($espAsQu, $curAsig);
                                        $flagNoBlock = true;
                                    }
                                }
                            }
                            foreach ($Pi as $incid) {
                                $temp = end($espAsQu);
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($temp['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($espAsQu);
                            echo "<br><br>";
                            maquina_imp($espInQu, $espAsQu);
                        }
                    }
                    echo "<b>Evaluacion LX terminada</b><br>";
                } // Fin IF asignaciones de Lx > 0
                if (count($asigAD) > 0) {
                    /*echo "<br><b>Realizando dictamen para AD </b> ";
                    foreach ($asigAD as $asig) {
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($Pi);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($asig);
                        echo "<br><br>";
                        maquina_imp($Pi, array($asig));
                    }
                    echo "<b>Evaluacion AD terminada</b><br>";*/

                    $tempEntrada = ($tiempoRetardoAdmin + $tiempoEntradaAdmin) * 60;
                    $tempSalida = ($tiempoAbandonoAdmin + $tiempoSalidaAdmin) * 60;

                    echo "<br><b>Realizando dictamen para AD </b> ";
                    foreach ($asigAD as $asig) {
                        $espInQu = array();
                        foreach ($Pi as $incid) {
                            $incidTemp = strtotime($incid);
                            if ($incidTemp >= ($asig['Ri'] - $tempEntrada) && $incidTemp <= ($asig['Rs'] + $tempSalida)) {
                                array_push($espInQu, $incid);
                            }
                        }
                        # Manejo de las incidencias. Si hay m�s de 2 de agarra la primera y la ultima
                        if (count($espInQu) > 2) {
                            $first = $espInQu[0];
                            $last = end($espInQu);
                            $espInQu = array($first, $last);
                        }
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($espInQu);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($asig);
                        echo "<br><br>";
                        maquina_imp($espInQu, array($asig));
                    }
                    echo "<b>Evaluacion AD terminada</b><br>";


                }
            } //Fin Else Si Pi = 0 y Ps > 0
        }
        echo "<br><hr>";
    }
}

function maquina_imp($incidencias, $asignaciones)
{
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;
    global $maquina;

    $sPi = $incidencias;
    $sPs = $asignaciones;
    $flagS = FALSE;
    $flagI = FALSE;
    $state = S0;
    if (count($sPi) > 0)
        $inc = $sPi[0];
    else $inc = 0;
    $inc = strtotime($inc);
    $serv = $sPs[0];
    while (!$flagI && !$flagS) {
        echo "<br> =================================================================================";
        echo "<br> Analizando las siguientes variables: <br> Incidencia: ";
        print_r($inc);
        echo "<br> Servicio: ";
        print_r($serv);
        echo "<br> Estado: $state";
        echo "<br> Descripcion de la Pila de Incidencias: <br>";
        print_r($sPi);
        echo "<br> Descripcion de la Pila de Servicios: <br>";
        print_r($sPs);
        echo "<br> ---------------------------";

        switch ($state) {
            case S0:
                $event = exe_imp(S0);
                $state = $maquina[$event][$state];
                break;
            case S1:
                $event = exe_imp(S1);
                $state = $maquina[$event][$state];
                break;
            case S2:
                $event = exe_imp(S2);
                $state = $maquina[$event][$state];
                break;
            case S3:
                $event = exe_imp(S3);
                $state = $maquina[$event][$state];
                break;
            case S4:
                $event = exe_imp(S4);
                $state = $maquina[$event][$state];
                break;
            case S5:
                $event = exe_imp(S5);
                $state = $maquina[$event][$state];
                break;
            case S6:
                $event = exe_imp(S6);
                $state = $maquina[$event][$state];
                break;
            case S7:
                $event = exe_imp(S7);
                $state = $maquina[$event][$state];
                break;
            case S8:
                $event = exe_imp(S8);
                $state = $maquina[$event][$state];
                break;
            default:
                echo "Entro en el default";
                break;
        }
        echo "<br>Nuevo estado: $state";
    }

    if (count($sPs) > 0) {
        while ($serv = array_shift($sPs)) {
            echo "<br> Asignaci&oacute;n: ";
            print_r($serv);
            echo "<b>RESULTADO = FALTA</b>";
        }
    }

    echo "<br><br> Informacion residual: ";
    echo "<br> Descripcion de la Pila de Incidencias: <br>";
    print_r($sPi);
    echo "<br>";
    echo "Descripcion de la Pila de Servicios: <br>";
    print_r($sPs);
    echo "<br>";
    echo "////////////////////////////**********************//////////////////////////////<br><br>";
}

function exe_imp($S)
{
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;

    $inc = intval($inc);
    $serv['Rs'] = intval($serv['Rs']);
    $serv['Ri'] = intval($serv['Ri']);

    switch ($S) {
        case S0:
            if (count($sPi) == 0 || count($sPs) == 0) {
                echo "<br><b>Finalizando maquina en S0</b>";
                $flagI = TRUE;
                $flagS = TRUE;
                return (E1);
            } else {
                echo "<br> Ejecutando S0:";
                echo "<br> I : " . $inc;
                echo "<br> RI: " . $serv['Ri'];
                echo "<br> RS: " . $serv['Rs'];
                echo "<br> -----";
                echo "<br> I-RI:" . ($inc - $serv['Ri']);
                echo "<br> I-RS:" . ($inc - $serv['Rs']);
                if ($inc < $serv['Ri']) {
                    echo "<br>Evento E1";
                    return (E1);
                }
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    echo "<BR>Evento E2";
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    echo "<BR>Evento E3";
                    return (E3);
                }
            }
            break;
        case S1:
            echo "<br> Ejecutando S1";
            $resultado = "Asistencia";
            echo "<br> RESULTADO = ASISTENCIA";
            if (!array_shift($sPi) || count($sPi) == 0) {
                $flagI = TRUE;
                echo "<br><b>Servicio evaluado " . $serv['ID'] . " - " . $serv['NOMBRE'] . "  , resultado: ABANDONO </b>";
                array_shift($sPs);
                return (E1);
            } else {
                $inc = intval(strtotime($sPi[0]));
                echo "<br> I : " . $inc;
                echo "<br> RI: " . $serv['Ri'];
                echo "<br> RS: " . $serv['Rs'];
                echo "<br> -----";
                echo "<br> I-RI:" . ($inc - $serv['Ri']);
                echo "<br> I-RS:" . ($inc - $serv['Rs']);
                if ($inc < $serv['Ri']) {
                    echo "<BR>Evento E1";
                    return (E1);
                }
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    echo "<BR>Evento E2";
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    echo "<BR>Evento E3";
                    return (E3);
                }
            }
            break;
        case S2:
            echo "<br> Ejecutando S2";
            $resultado = "Retardo";
            echo "<br>RESULTADO = RETARDO";
            if (!array_shift($sPi) || count($sPi) == 0) {
                $flagI = TRUE;
                echo "<br><b>Servicio evaluado " . $serv['ID'] . " - " . $serv['NOMBRE'] . "  , resultado: ABANDONO </b>";
                array_shift($sPs);
                return (E2);
            } else {
                $inc = intval(strtotime($sPi[0]));
                echo "<br> I : " . $inc;
                echo "<br> RI: " . $serv['Ri'];
                echo "<br> RS: " . $serv['Rs'];
                echo "<br> -----";
                echo "<br> I-RI:" . ($inc - $serv['Ri']);
                echo "<br> I-RS:" . ($inc - $serv['Rs']);
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    echo "<BR>Evento E2";
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    echo "<BR>Evento E3";
                    return (E3);
                }
            }
            break;
        case S3:
            echo "<br> Ejecutando S3";
            echo "<br> I : " . $inc;
            echo "<br> RI: " . $serv['Ri'];
            echo "<br> RS: " . $serv['Rs'];
            echo "<br> -----";
            echo "<br> I-RI:" . ($inc - $serv['Ri']);
            echo "<br> I-RS:" . ($inc - $serv['Rs']);
            $resultado = "Falta";
            echo "<br>RESULTADO = FALTA";
            if ($inc < $serv['Ri']) {
                echo "<BR>Evento E1";
                return (E1);
            }
            if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                echo "<BR>Evento E2";
                return (E2);
            }
            if ($inc > $serv['Rs']) {
                echo "<BR>Evento E3";
                return (E3);
            }
            break;
        case S4:
            echo "<br> Ejecutando S4";
            echo "<br> Pila Incidencias = " . count($sPi);
            if (count($sPi) > 1) {
                echo "<BR>Evento E4";
                return (E4);
            } else {
                echo "<BR>Evento E5";
                return (E5);
            }
            break;
        case S5:
            echo "<br> Ejecutando S5";
            $resultado = "Abandono";
            echo "<br>RESULTADO = ABANDONO";
            echo "<br><B>Servicio evaluado " . $serv['ID'] . " - " . $serv['NOMBRE'] . "  , resultado: " . $resultado . "</B>";
            if (!array_shift($sPi) || count($sPi) == 0) $flagI = TRUE;
            else $inc = intval(strtotime($sPi[0]));
            if (!array_shift($sPs) || count($sPs) == 0) $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            return (E1);
            break;
        case S6:
            echo "<br>Ejecutando S6";
            if ($resultado == "") {
                $resultado = "Asistencia";
                echo "RESULTADO = ASISTENCIA";
            }
            echo "<br><B>Servicio evaluado " . $serv['ID'] . " - " . $serv['NOMBRE'] . "  , resultado: " . $resultado . "</B>";
            if (!array_shift($sPs) || count($sPs) == 0) $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            echo "<br> I : " . $inc;
            echo "<br> RI: " . $serv['Ri'];
            echo "<br> RS: " . $serv['Rs'];
            echo "<br> -----";
            echo "<br> I-RI:" . ($inc - $serv['Ri']);
            echo "<br> I-RS:" . ($inc - $serv['Rs']);
            if ($inc < $serv['Ri']) {
                echo "<BR>Evento E1";
                return (E1);
            }
            if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                echo "<BR>Evento E2";
                return (E2);
            }
            if ($inc > $serv['Rs']) {
                echo "<BR>Evento E3";
                return (E3);
            }
            break;
        case S7:
            echo "<br>Ejecutadon S7";
            echo "<br><B>Servicio evaluado " . $serv['ID'] . " - " . $serv['NOMBRE'] . "  , resultado: " . $resultado . "</B>";
            if (!array_shift($sPs) || count($sPs) == 0) $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            return (E1);
            break;
        case S8:
            echo "<br> Ejecutando S8";
            echo "<br> Pila Incidencias = " . count($sPi);
            if (count($sPi) > 1) {
                echo "<BR>Evento E4";
                return (E4);
            } else {
                echo "<BR>Evento E5";
                return (E5);
            }
            break;
    }
}

// aqui empiezan las funciones en PRODUCCION

function error($string, $tipo)
{
    /*FUNCION que guarda los logs de lo ocurrido en el analisis u otras funciones*/
    $r = insertaSQL("INSERT INTO log (descripcion, tipo) VALUES ('$string', '$tipo')");
}

function dictamen($resultado, $revision, $fechaEvaluada, $idAsignacion, $idUsuario)
{
    /*FUNCION que guarda el dictamen en la BD */
    $r = insertaSQL("INSERT INTO dictamen(status, dictamen, fecha, id_asignacion, id_usuario) VALUES ('$revision', '$resultado', '$fechaEvaluada', '$idAsignacion', '$idUsuario')");
    error("dictamen($resultado, $revision, $fechaEvaluada, $idAsignacion, $idUsuario)", "I");
}

function dictamenHoras($resultado, $revision, $fechaEvaluada, $idAsignacion, $idUsuario, $hiR, $hfR)
{
    /*FUNCION que guarda el dictamen en la BD */
    $r = insertaSQL("INSERT INTO dictamen(status, dictamen, fecha, id_asignacion, id_usuario, hiR, hfR ) VALUES ('$revision', '$resultado', '$fechaEvaluada', '$idAsignacion', '$idUsuario', '$hiR', '$hfR')");
    error("dictamen($resultado, $revision, $fechaEvaluada, $idAsignacion, $idUsuario, $hiR, $hfR)", "I");
}

function analizar_db($nss, $fecha)
{
    /*funcion que analiza las incidencias de un elemento que tiene asignado un NSS en la fecha indicada y que guarda los resultados
      del analisis en la tabla de DICTAMEN
    1. Obtener pila de incidencias
    2. Obtener pila de servicios
    3. Inicializar variables
    4. Inciar maquina de estados
    5. Guardar informaci�n del analisis en la BD del dictamen
    5.E Imprimir informaci�n del analisis (si la variable $imp==1)*/

    global $Pi;
    global $Ps;
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;
    global $fechaEvaluada;
    global $revision;
    global $tiempoRetardoBach;        // Tiempo de tolerancia de entrada para BB, BC y BS
    global $tiempoAbandonoBach;        // Tiempo de tolerancia de salida para BB, BC y BS
    global $tiempoEntradaBach;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaBach;        //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueBach;        //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoLic;        // Tiempo de tolerancia de entrada para LS y GL
    global $tiempoAbandonoLic;        // Tiempo de tolerancia de salida para LS y GL
    global $tiempoEntradaLic;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaLic;        //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueLic;        //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoEjecPos;    // Tiempo de tolerancia de entrada para LX, PC, PT
    global $tiempoAbandonoEjecPos;    // Tiempo de tolerancia de salida para LX, PC, PT
    global $tiempoEntradaEjecPos;    //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaEjecPos;    //Rango de tiempo para aceptar una incidencia de salida
    global $espacioBloqueEjecPos;    //Tiempo para generar bloques de asignaciones
    global $tiempoRetardoAdmin;    // Tiempo de tolerancia de entrada para Administrativos
    global $tiempoAbandonoAdmin;    // Tiempo de tolerancia de salida para Administrativos
    global $tiempoEntradaAdmin;        //Rango de tiempo para aceptar una incidencia de entrada
    global $tiempoSalidaAdmin;        //Rango de tiempo para aceptar una incidencia de salida
    global $bannedRomms;              //Lista de salones con asistencia automatica


    //1. Obtener pila de incidencias del nss para el d�a $fecha que es un timestamp donde $FI = 2014-02-22 00:00:00 y $FF = 2014-02-22 23:59:59
    $flagS = FALSE;
    $flagI = FALSE;

    $fechaEvaluada = date("Y-m-d", $fecha);
    error("Fecha evaluacion: " . $fechaEvaluada, "I");
    $revision = "A";

    //1.1 Obtenemos el ID a partir del numero de nomina del trabajador
    $sql = "SELECT p.ID FROM personas p WHERE p.NSS='$nss'";
    if (!$persona = ejecutaSQL($sql)) {
        error("ERROR 0: No se puedo hacer el Query", "E");
    } elseif (mysqli_num_rows($persona) == 0) {
        echo "<b>La persona no existe</b><hr><br>";
        error("La persona no existe: $nss", "W");
    } else {
        $l_persona = mysql_fetch_assoc($persona);
        $id_persona = $l_persona['ID'];

        error("Analizando para la persona $nss($id_persona) en la fecha $fecha", "I");

        //1.2 Obtenemos las incidencias
        $Pi = array();
        $FI = date("Y-m-d 00:00:00", $fecha);
        $FF = date("Y-m-d 23:59:59", $fecha);
        $sql = "SELECT a.Periodo FROM checado a, personas p
                WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND a.Periodo > '$FI' AND a.Periodo < '$FF' ORDER BY a.Periodo ASC";
        //echo $sql;
        if (!$checadas = ejecutaSQL($sql)) {
            echo "<b>No se pudo cargar incidencias</b><hr><br>";
            error("ERROR analizar_db($nss, $fecha) 1: NO SE PUDO HACER CONSULTA.", "E");
        } elseif (mysqli_num_rows($checadas) == 0) {
            error("WARNING analizar_db($nss, $fecha) 1: NO HAY INCIDENCIAS PARA ESE DIA", "W");
        }
        while ($l_checada = mysql_fetch_assoc($checadas)) {
            error("Agregando Incidencia " . $l_checada['Periodo'], "I");
            array_push($Pi, $l_checada['Periodo']);
        }

        if ((count($Pi) % 2) != 0) {
            error("WARNING R analizar_db($nss, $fecha): Las incidencias son impares, se marca dictamen para revision.", "W");
            $revision = "R";
        }

        //2. Obtener pila de servicios vigentes para este dia

        //2.2 Obtenemos los horarios de los servicios del dia de la semana en cuestion; por cada servicio registrado, buscamos la coincidencia entre el dia de la semana del detalle y el dia de consulta
        $d = date("N", $fecha);
        switch ($d) {
            case "1" :
                $d = "L";
                break;
            case "2" :
                $d = "M";
                break;
            case "3" :
                $d = "Mi";
                break;
            case "4" :
                $d = "J";
                break;
            case "5" :
                $d = "V";
                break;
            case "6" :
                $d = "S";
                break;
            case "7" :
                $d = "D";
                break;
        }

        error("Dia a analizar: $d", "I");

        $Ps = array();
        $FI = date("Y-m-d", $fecha);
        $FF = $FI;
        //"AND ID_SERVICIO<>790 ".
        $sql = "SELECT s.Titulo, s.Nivel, a.ID AS ID_ASIGNACION, p.Nombre, a.ID_SERVICIO, e.Nombre as salon, a.FechaInicio, a.FechaFin, a.CRN, d.Dia, d.HoraInicio, d.HoraFin
            FROM asignaciones a, detalle_asignacion d, servicios s, espacios e, personas p
            WHERE a.ID_Persona=$id_persona
            AND p.ID = $id_persona
            AND a.FechaInicio<='$FI'
            AND a.FechaFin >= '$FF'
            AND a.Activo = 1
            AND d.ID_Asignacion = a.ID
            AND d.Dia = '$d' AND ID_SERVICIO <> 1
            AND s.ID = a.ID_SERVICIO
            AND a.ID_Espacio = e.ID
            ORDER BY d.HoraInicio ASC";

        $qry="SELECT nivel FROM dias_no_laborales WHERE Activo = 1 AND dia = '".date("Y-m-d", $fecha)."'";
        $h=ejecutaSQL($qry);
        $nFeriados=array();
        if (mysqli_num_rows($h)!=0) {
            while ($fi = mysql_fetch_assoc($h)){
                array_push($nFeriados, $fi['nivel']);
            }
        }
        $b=0;
        $t=0;

        if ($r = ejecutaSQL($sql)) {
            if (mysqli_num_rows($r) == 0) error("WARNING analizar_db($nss, $fecha) 2: NO HAY ASIGNACIONES PARA ESE DIA", "W");
            while ($ll = mysql_fetch_assoc($r)) {
                //aqui tambien se modifican los rangos inferiores y superiores, que son de quince minutos
                $t++;
                if (in_array($ll['Nivel'], $nFeriados)){
                    error("WARNING analizar_db($nss, $fecha) DIA NO LABORAL -".$ll['Titulo']."-".$ll['Nivel'], "W");
                    $b++;
                }else{
                    $Ri = strtotime(date("Y-m-d", $fecha) . " " . $ll['HoraInicio']);
                    $Rs = strtotime(date("Y-m-d", $fecha) . " " . $ll['HoraFin']);
                    array_push($Ps, array("ID" => $ll['ID_SERVICIO'], "ASIGNACION" => $ll['ID_ASIGNACION'], "NOMBRE" => $ll['Titulo'], "NIVEL" => $ll['Nivel'], "Ri" => $Ri, "Rs" => $Rs, "Salon"=>$ll['salon']));
                    error("analizar_db($nss, $fecha): Agregando servicio: " . $ll['Titulo'], "I");
                }
            }
        }
        if ($b==$t) {
            error("WARNING analizar_db($nss, $fecha) DIA NO LABORAL EN NINGUN NIVEL", "W");
            echo "<br><hr>";
            return;
        }
        if (count($Ps) == 0) error("WARNING analizar_db($nss, $fecha) 3: NO HAY ASIGNACIONES PARA ESE DIA", "W");
        else {
            //3. Inicializar variables
            $resultado = "";

            //Revisa que no sea dia feriado.

            $qry="SELECT nivel FROM dias_no_laborales WHERE Activo = 1 AND dia = '".date("Y-m-d", $fecha)."'";
            $h=ejecutaSQL($qry);
            $nFeriados=array();
            if (mysqli_num_rows($h)!=0) {
                while ($fi = mysql_fetch_assoc($h)){
                    array_push($nFeriados, $fi['nivel']);
                }
            }

            //4. La maquina ya esta inicializada en el archivo conf.php

            if (count($Pi) == 0 && count($Ps) > 0) {
                while ($serv = array_shift($Ps)) {
                    //reportar servicio como falta CON EL ID ASIGNACION
                    if(in_array($serv['NIVEL'], $nFeriados)){
                        $resultado = "A";
                        dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "Dia no laboral", "Dia no laboral");
                    }else{
                        if(!in_array($serv['Salon'], $bannedRomms)) {
                            $resultado = "AU";
                            error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
                            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "Sin Checada", "Sin Checada");
                        }else{
                            $resultado = "A";
                            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "EXC. Aula externa", "EXC. Aula externa");
                        }
                    }
                }
            } else {
                $asigBBCS = array();
                $asigLS = array();
                $asigLX = array();
                $asigAD = array();
                foreach ($Ps as $asignacion) {
                    if (in_array($asignacion['NIVEL'], $nFeriados)) {
                        $resultado = "A";
                        dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "Dia no laboral", "Dia no laboral");
                    }else{
                        if(in_array($asignacion['Salon'], $bannedRomms)) {
                            $resultado = "A";
                            dictamenHoras($resultado, $revision, $fechaEvaluada, $asignacion['ASIGNACION'], ID_USUARIO_MAQUINA, "EXC. Aula externa", "EXC. Aula externa");
                        }else{
                            if ($asignacion['NIVEL'] == 'AD') {
                                $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoAdmin * 60);
                                $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoAdmin * 60);
                                array_push($asigAD, $asignacion);
                            } elseif ($asignacion['NIVEL'] == 'BB' || $asignacion['NIVEL'] == 'BC' || $asignacion['NIVEL'] == 'BS') {
                                $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoBach * 60);
                                $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoBach * 60);
                                array_push($asigBBCS, $asignacion);
                            } elseif ($asignacion['NIVEL'] == 'LX' || $asignacion['NIVEL'] == 'PC' || $asignacion['NIVEL'] == 'PT' || $asignacion['NIVEL'] == 'MO' || $asignacion['NIVEL'] == 'SC') {
                                $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoEjecPos * 60);
                                $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoEjecPos * 60);
                                array_push($asigLX, $asignacion);
                            } elseif ($asignacion['NIVEL'] == 'LC' || $asignacion['NIVEL'] == 'GL' ||  $asignacion['NIVEL'] == 'NC' || $asignacion['NIVEL'] == 'CD') {
                                $asignacion['Ri'] = $asignacion['Ri'] + ($tiempoRetardoLic * 60);
                                $asignacion['Rs'] = $asignacion['Rs'] - ($tiempoAbandonoLic * 60);
                                array_push($asigLS, $asignacion);
                            }
                        }
                    }
                }//Fin foreach Ps
                if (count($asigBBCS) > 0) {
                    echo "<b>BS: </b>";
                    echo var_dump($asigBBCS) . "<br>";
                    $tempEntrada = ($tiempoRetardoBach + $tiempoEntradaBach) * 60;
                    $tempSalida = ($tiempoAbandonoBach + $tiempoSalidaBach) * 60;
                    $tempBloque = $espacioBloqueBach + $tiempoRetardoBach + $tiempoAbandonoBach;
                    error("Realizando dictamen para preparatoria", "I");
                    while (count($asigBBCS) > 0) {
                        if (count($asigBBCS) == 1) {
                            $espInQu = array();
                            error("Evaluando solo una asignaci&oacute;n", "I");
                            foreach ($Pi as $incid) {
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($asigBBCS[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigBBCS[0]['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($asigBBCS);
                            echo "<br><br>";
                            maquina_db($espInQu, $asigBBCS);
                            array_shift($asigBBCS);
                        } else {
                            $espAsQu = array();
                            $espInQu = array();
                            $flagNoBlock = false;
                            $curAsig = array_shift($asigBBCS);
                            while (!$flagNoBlock) {
                                if (!count($asigBBCS) > 0) {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                } else {
                                    $tempTime = ($asigBBCS[0]['Ri'] - $curAsig['Rs']) / 60;
                                    # Verificar que la diferencia de tiempo no sea menor a 0
                                    if ($tempTime < 0) {
                                        echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                        error("Warning: posible error de horario, diferencia menor a 0 entre asignaciones para el dia: $fecha y nss: $nss", "E");
                                    }
                                    if ($tempTime <= $tempBloque) {
                                        array_push($espAsQu, $curAsig);
                                        $curAsig = array_shift($asigBBCS);
                                    } else {
                                        array_push($espAsQu, $curAsig);
                                        $flagNoBlock = true;
                                    }
                                }
                            }
                            foreach ($Pi as $incid) {
                                $lastAs = end($espAsQu);
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($lastAs['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($espAsQu);
                            echo "<br><br>";
                            maquina_db($espInQu, $espAsQu);
                        }
                    }
                    error("Evaluacion prepa terminada", "I");
                }
                if (count($asigLS) > 0) {
                    echo "<b>LS: </b>";
                    echo var_dump($asigLS) . "<br>";
                    $tempEntrada = ($tiempoRetardoLic + $tiempoEntradaLic) * 60;
                    $tempSalida = ($tiempoAbandonoLic + $tiempoSalidaLic) * 60;
                    $tempBloque = $espacioBloqueLic + $tiempoRetardoLic + $tiempoAbandonoLic;
                    error("Realizando dictamen para LS", "I");
                    while (count($asigLS) > 0) {
                        if (count($asigLS) == 1) {
                            $espInQu = array();
                            error("Evaluando solo una asignaci&oacute;n", "I");
                            foreach ($Pi as $incid) {
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($asigLS[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigLS[0]['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($asigLS);
                            echo "<br><br>";
                            maquina_db($espInQu, $asigLS);
                            array_shift($asigLS);
                        } else {
                            $espAsQu = array();
                            $espInQu = array();
                            $flagNoBlock = false;
                            $curAsig = array_shift($asigLS);
                            while (!$flagNoBlock) {
                                if (!count($asigLS) > 0) {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                } else {
                                    $tempTime = ($asigLS[0]['Ri'] - $curAsig['Rs']) / 60;
                                    # Verificar que la diferencia de tiempo no sea menor a 0
                                    if ($tempTime < 0) {
                                        echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                        error("Warning: posible error de horario, diferencia menor a 0 entre asignaciones para el dia: $fecha y nss: $nss", "E");
                                    }
                                    //Caso para 30 min de diferencia
                                    if ($tempTime <= $tempBloque) {
                                        array_push($espAsQu, $curAsig);
                                        $curAsig = array_shift($asigLS);
                                    } else {
                                        array_push($espAsQu, $curAsig);
                                        $flagNoBlock = true;
                                    }
                                }
                            }
                            foreach ($Pi as $incid) {
                                $temp = end($espAsQu);
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($temp['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($espAsQu);
                            echo "<br><br>";
                            maquina_db($espInQu, $espAsQu);
                        }
                    }
                    error("Evaluacion LS terminada", "I");
                }
                if (count($asigLX) > 0) {
                    echo "<b>LX: </b>";
                    echo var_dump($asigLX) . "<br>";
                    /*$espAsQu = array();
                    $espInQu = array();*/
                    $tempEntrada = ($tiempoRetardoEjecPos + $tiempoEntradaEjecPos) * 60;
                    $tempSalida = ($tiempoAbandonoEjecPos + $tiempoSalidaEjecPos) * 60;
                    $tempBloque = $espacioBloqueEjecPos + $tiempoRetardoEjecPos + $tiempoAbandonoEjecPos;
                    error("Realizando dictamen para LX", "I");
                    while (count($asigLX) > 0) {
                        if (count($asigLX) == 1) {
                            $espInQu = array();
                            error("Evaluando solo una asignaci&oacute;n", "I");
                            foreach ($Pi as $incid) {
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($asigLX[0]['Ri'] - $tempEntrada) && $incidTemp <= ($asigLX[0]['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($asigLX);
                            echo "<br><br>";
                            maquina_db($espInQu, $asigLX);
                            array_shift($asigLX);
                        } else {
                            $espAsQu = array();
                            $espInQu = array();
                            $flagNoBlock = false;
                            $curAsig = array_shift($asigLX);
                            while (!$flagNoBlock) {
                                if (!count($asigLX) > 0) {
                                    array_push($espAsQu, $curAsig);
                                    $flagNoBlock = true;
                                } else {
                                    $tempTime = ($asigLX[0]['Ri'] - $curAsig['Rs']) / 60;
                                    # Verificar que la diferencia de tiempo no sea menor a 0
                                    if ($tempTime < 0) {
                                        echo '<br><b style="color: #ff0000;">Warning: posible error de horario, diferencia entre asignaciones (' . $tempTime . ')</b>';
                                        error("Warning: posible error de horario, diferencia menor a 0 entre asignaciones para el dia: $fecha y nss: $nss", "E");
                                    }
                                    //Caso para 30 min de diferencia
                                    if ($tempTime <= $tempBloque) {
                                        array_push($espAsQu, $curAsig);
                                        $curAsig = array_shift($asigLX);
                                    } else {
                                        array_push($espAsQu, $curAsig);
                                        $flagNoBlock = true;
                                    }
                                }
                            }
                            foreach ($Pi as $incid) {
                                $temp = end($espAsQu);
                                $incidTemp = strtotime($incid);
                                if ($incidTemp >= ($espAsQu[0]['Ri'] - $tempEntrada) && $incidTemp <= ($temp['Rs'] + $tempSalida)) {
                                    array_push($espInQu, $incid);
                                }
                            }
                            if (count($espInQu) > 2) {
                                $first = $espInQu[0];
                                $last = end($espInQu);
                                $espInQu = array($first, $last);
                            }
                            echo "<br><b>Corriendo Maquina con:</b><br>";
                            echo "Incidencias: ";
                            print_r($espInQu);
                            echo "<br>";
                            echo "Asignaciones: ";
                            print_r($espAsQu);
                            echo "<br><br>";
                            maquina_db($espInQu, $espAsQu);
                        }
                    }
                    error("Evaluacion LX terminada", "I");
                }
                if (count($asigAD) > 0) {
                    /*echo "<b>AD: </b>";
                    echo var_dump($asigAD) . "<br>";
                    error("Realizando dictamen para AD", "I");
                    foreach ($asigAD as $asig) {
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($Pi);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($asig);
                        echo "<br><br>";
                        maquina_db($Pi, array($asig));
                        error("Evaluacion AD: " . $asig['NOMBRE'], "I");
                    }*/
                    $tempEntrada = ($tiempoRetardoAdmin + $tiempoEntradaAdmin) * 60;
                    $tempSalida = ($tiempoAbandonoAdmin + $tiempoSalidaAdmin) * 60;

                    error("Realizando dictamen para AD", "I");
                    foreach ($asigAD as $asig) {
                        $espInQu = array();
                        foreach ($Pi as $incid) {
                            $incidTemp = strtotime($incid);
                            if ($incidTemp >= ($asig['Ri'] - $tempEntrada) && $incidTemp <= ($asig['Rs'] + $tempSalida)) {
                                array_push($espInQu, $incid);
                            }
                        }
                        if (count($espInQu) > 2) {
                            $first = $espInQu[0];
                            $last = end($espInQu);
                            $espInQu = array($first, $last);
                        }
                        echo "<br><b>Corriendo Maquina con:</b><br>";
                        echo "Incidencias: ";
                        print_r($espInQu);
                        echo "<br>";
                        echo "Asignaciones: ";
                        print_r($asig);
                        echo "<br><br>";
                        maquina_db($espInQu, array($asig));
                        error("Evaluacion AD: " . $asig['NOMBRE'], "I");
                    }
                    error("Evaluacion AD terminada", "I");
                }
            }
        }
        echo "<br><hr>";
    }
}

function maquina_db($incidencias, $asignaciones)
{
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;
    global $fechaEvaluada;
    global $revision;
    global $maquina;

    $sPi = $incidencias;
    $sPs = $asignaciones;
    $flagS = FALSE;
    $flagI = FALSE;
    $state = S0;
    if (count($sPi) > 0)
        $inc = $sPi[0];
    else $inc = 0;
    $inc = strtotime($inc);
    $serv = $sPs[0];
    while (!$flagI && !$flagS) {
        error("Estado " . $state, "I");
        switch ($state) {
            case S0:
                $event = exe_db(S0);
                $state = $maquina[$event][$state];
                break;
            case S1:
                $event = exe_db(S1);
                $state = $maquina[$event][$state];
                break;
            case S2:
                $event = exe_db(S2);
                $state = $maquina[$event][$state];
                break;
            case S3:
                $event = exe_db(S3);
                $state = $maquina[$event][$state];
                break;
            case S4:
                $event = exe_db(S4);
                $state = $maquina[$event][$state];
                break;
            case S5:
                $event = exe_db(S5);
                $state = $maquina[$event][$state];
                break;
            case S6:
                $event = exe_db(S6);
                $state = $maquina[$event][$state];
                break;
            case S7:
                $event = exe_db(S7);
                $state = $maquina[$event][$state];
                break;
            case S8:
                $event = exe_db(S8);
                $state = $maquina[$event][$state];
                break;
            default:
                echo "Entro en el default";
                break;
        }
    }
    //Si quedaron servicios en la pila entonces hay que marcarlos como FALTA
    //Analizamos la pila de servicios, si la pila de servicios todavia tiene elementos, eso indicara que todos los servicios que tiene pendientes son FALTA

    if (count($sPs) > 0) {
        while ($serv = array_shift($sPs)) {
            //reportar servicio como falta CON EL ID ASIGNACION
            $resultado = "F";
            error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "Sin Checada", "Sin Checada");
        }
    }
}

function exe_db($S)
{
    global $sPi;
    global $sPs;
    global $inc;
    global $serv;
    global $resultado;
    global $state;
    global $flagS;
    global $flagI;
    global $fechaEvaluada;
    global $revision;
    global $hiTemp;
    global $hfTemp;
    global $hiFlag;
    global $hfFlag;

    $inc = intval($inc);
    $serv['Rs'] = intval($serv['Rs']);
    $serv['Ri'] = intval($serv['Ri']);

    switch ($S) {
        case S0:
            echo "hiFlag en S0: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S0: " . var_dump($hfFlag) . "<br>";
            if (count($sPi) == 0 || count($sPs) == 0) {
                error("Finalizando maquina en S0", "I");
                $flagI = TRUE;
                $flagS = TRUE;
                return (E1);
            } else {
                $hiTemp = "";
                $hfTemp = "";
                $hiFlag = false;
                $hfFlag = false;
                if ($inc < $serv['Ri']) {
                    return (E1);
                }
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    return (E3);
                }
            }
            break;
        case S1:
            echo "hiFlag en S1: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S1: " . var_dump($hfFlag) . "<br>";
            $resultado = "A";
            if (!$hiFlag) {
                $hiTemp = date("H:i:s", $inc);
            }
            if (!array_shift($sPi) || count($sPi) == 0) {
                $flagI = TRUE;
                $resultado = "AB";
                error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
                dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, $hiTemp, "Sin Checada");
                array_shift($sPs);
                return (E1);
            } else {
                $inc = intval(strtotime($sPi[0]));
                if ($inc < $serv['Ri']) {
                    return (E1);
                }
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    return (E3);
                }
            }
            break;
        case S2:
            echo "hiFlag en S2: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S2: " . var_dump($hfFlag) . "<br>";
            $resultado = "R";
            if (!$hiFlag) {
                $hiTemp = date("H:i:s", $inc);
            }
            if (!array_shift($sPi) || count($sPi) == 0) {
                $flagI = TRUE;
                $resultado = "AB";
                error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
                dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, $hiTemp, "Sin Checada");
                array_shift($sPs);
                return (E3);
            } else {
                $inc = intval(strtotime($sPi[0]));
                if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                    return (E2);
                }
                if ($inc > $serv['Rs']) {
                    return (E3);
                }
            }
            break;
        case S3:
            $resultado = "F";
            if ($inc < $serv['Ri']) {
                return (E1);
            }
            if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                return (E2);
            }
            if ($inc > $serv['Rs']) {
                return (E3);
            }
            break;
        case S4:
            echo "hiFlag en S4: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S4: " . var_dump($hfFlag) . "<br>";
            if (count($sPi) > 1) {
                $hiFlag = true;
                return (E4);
            } else {
                return (E5);
            }
            break;
        case S5:
            echo "hiFlag en S5: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S5: " . var_dump($hfFlag) . "<br>";
            $resultado = "AB";
            $hfTemp = date("H:i:s", $inc);
            error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, $hiTemp, $hfTemp);
            if (!array_shift($sPi) || count($sPi) == 0)
                $flagI = TRUE;
            else $inc = intval(strtotime($sPi[0]));
            if (!array_shift($sPs) || count($sPs) == 0)
                $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            return (E1);
            break;
        case S6:
            echo "hiFlag en S0: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S0: " . var_dump($hfFlag) . "<br>";
            if ($resultado == "")
                $resultado = "A";
            $hfTemp = date("H:i:s", $inc);
            error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, $hiTemp, $hfTemp);
            if (!array_shift($sPs) || count($sPs) == 0)
                $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            if ($inc < $serv['Ri']) {
                return (E1);
            }
            if (($inc >= $serv['Ri']) && ($inc <= $serv['Rs'])) {
                return (E2);
            }
            if ($inc > $serv['Rs']) {
                return (E3);
            }
            break;
        case S7:
            error("Resultado para " . $serv['NOMBRE'] . " :" . $resultado, "I");
            $hfTemp = date("H:i:s", $inc);
            dictamenHoras($resultado, $revision, $fechaEvaluada, $serv['ASIGNACION'], ID_USUARIO_MAQUINA, "Sin Checada", $hfTemp);
            if (!array_shift($sPs) || count($sPs) == 0) $flagS = TRUE;
            else $serv = $sPs[0];
            $resultado = "";
            return (E1);
            break;
        case S8:
            echo "hiFlag en S8: " . var_dump($hiFlag) . "<br>";
            echo "hfFlag en S8: " . var_dump($hfFlag) . "<br>";
            if (count($sPi) > 1) {
                $hiFlag = true;
                return (E4);
            } else {
                return (E5);
            }
            break;
    }
}

function nss_por_asignacion_por_dia_asignatura($diaI, $diaF, $diaS)
{
    $result = array();
    $sql = "SELECT DISTINCT(p.NSS) FROM asignaciones a , detalle_asignacion d, personas p
             WHERE a.FechaInicio <= '$diaI'
             AND a.FechaFin >= '$diaF'
             AND d.ID_Asignacion = a.id
             AND d.Dia = '$diaS'
             AND a.ID_Persona = p.id
             AND a.ID_Servicio <> 1
             AND a.Activo = 1
             ORDER BY p.NSS ASC";
    //echo $sql;
    if (!$r = ejecutaSQL($sql)) {
        error("ERROR 1 nss_por_asignacion_por_dia_asignatura($diaI, $diaF, $diaS): NO SE PUDO HACER CONSULTA", "I");
        return 0;
    }
    while ($l = mysql_fetch_assoc($r)) {
        array_push($result, $l['NSS']);
    }
    return $result;
}


//SERVICIOS PARA LA ADMINISTRACION DEL SISTEMA

function verificarUsuario($user, $pass)
{
    $sql = " SELECT admin.ID, CONCAT(ApellidoP, ' ', ApellidoM, ' ', Nombre) as Persona, Acceso FROM personas as p
             INNER JOIN administradores AS admin ON ID_Persona = p.ID
             WHERE Username = '$user' AND Password = '$pass' ";

    $r = ejecutaSQL($sql);
    $info = array();
    if (mysqli_num_rows($r) == 1) {
        $row = mysqli_fetch_array($r);
        $row = array_map('utf8_encode', $row);
        $info['session'] = true;
        $info['person'] = $row['Persona'];
        $info['access'] = $row['Acceso'];
        error_log("LOG PERSONA:".$row['Acceso'],0);
        $info['id_person'] = $row['ID'];

        //echo var_dump($info);
    } else
        $info['session'] = false;
    return $info;
}

function roles()
{
    $sql = " SELECT ID, Nombre FROM roles WHERE Activo = 1 ORDER BY Nombre, ID  ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("id" => $row['ID'], "nombre" => $row['Nombre']);
    }
    $j2 = array("s" => 1, "m" => "Listado de roles correcto", "d" => array("roles" => $j1));
    echo json_encode($j2);
}

function aRol($nombre)
{
    $nombre = utf8_decode($nombre);
    $nombre = trim($nombre);
    $sql = " SELECT Acctivo, ID FROM roles WHERE Nombre LIKE '$nombre'";
    $r = ejecutaSQL($sql);
    $hacerGrupo = true;
    $goBack = false;
    $idRol = 0;
    if (mysqli_num_rows($r) == 1){
        $idRol = mysql_result($r, 0,"ID");
        if(mysql_result($r, 0,"Activo") == 1){
            echo json_encode(array("s" => 0, "m" => "El rol ya existe"));
            $hacerGrupo = false;
        }else{
            $sql = "UPDATE roles SET Activo = 1 WHERE Nombre LIKE '$nombre'";
            if(updateSQL($sql)==0){
                echo json_encode(array("s" => 0, "m" => "Error al a&ntilde;adir el rol"));
                $hacerGrupo = false;
            }
        }
    }else {
        $sql = "INSERT INTO roles (Nombre) VALUES ('$nombre') ";
        $idRol = insertaSQL($sql);
        if($idRol == 0){
            echo json_encode(array("s" => 0, "m" => "Error al a&ntilde;adir el roles"));
            $hacerGrupo = false;
        }
    }
    if($hacerGrupo){
        $sql = " SELECT Activo FROM grupos WHERE Nombre LIKE '$nombre' ";
        $r = ejecutaSQL($sql);
        if (mysqli_num_rows($r) == 0){
            if(mysql_result($r, 0,"Activo") == 0){
                $sql = "UPDATE grupos SET Activo = 1 WHERE Nombre LIKE '$nombre'";
                if(!ejecutaSQL($sql))
                    echo json_encode(array("s" => 1, "m" => "Rol y grupo de rol a&ntilde;adidos con &eacute;xito"));
                else $goBack = true;
            }
        }else{
            $sql = "INSERT INTO grupos (Nombre) VALUES ('$nombre') ";
            if(insertaSQL($sql) != 0)
                echo json_encode(array("s" => 1, "m" => "Rol y grupo de rol a&ntilde;adidos con &eacute;xito"));
            else $goBack = true;
        }
        if($goBack){
            $sql = "UPDATE roles SET Activo = 0 WHERE ID = '$idRol'";
            updateSQL($sql);
            echo json_encode(array("s" => 0, "m" => "Error al a&ntilde;adir el rol"));
        }
    }
}

function mRol($rol, $nombre)
{
    $nombre = utf8_decode($nombre);
    $nombre = trim($nombre);
    $qry = "SELECT g.ID FROM grupos g, roles r WHERE r.ID = '$rol' AND g.Nombre LIKE r.Nombre";
    $q = ejecutaSQL($qry);
    $sql = "UPDATE roles, grupos SET roles.Nombre = '$nombre', grupos.Nombre = '$nombre' WHERE roles.ID = '$rol' AND grupos.ID = '".mysql_result($q, 0,"ID")."'";
    if (updateSQL($sql) == 2){
        echo json_encode(array("s" => 1, "m" => "Rol y grupo de rol modificados con &eacute;xito"));
            // $sql = "UPDATE grupos SET grupos.Nombre = '$nombre' WHERE grupos.ID = '".mysql_result($q, 0,"ID")."'";
            // if(updateSQL($sql) == 1)
            //     echo json_encode(array("s" => 1, "m" => "Rol y grupo de rol modificados con &eacute;xito"));
            // else{
            //     $sql = "UPDATE roles SET Nombre = '".mysql_result($q, 0,"nombre")."' WHERE ID = '$rol' ";
            //     updateSQL($sql) == 1);
            //     echo json_encode(array("s" => 0, "m" => "No se modific&oacute; el rol"));
            // }
    }else
        echo json_encode(array("s" => 0, "m" => "No se modific&oacute; el rol"));
}

function eRol($rol,$deleteGrupo)
{
    $qry = "SELECT g.ID FROM grupos g, roles r WHERE r.ID = '$rol' AND g.Nombre LIKE r.Nombre";
    $q = ejecutaSQL($qry);
    $sql = "UPDATE roles SET Activo = 0  WHERE ID = '$rol' ";
    if (updateSQL($sql) == 1){
        if($deleteGrupo){
            $sql = " UPDATE grupos SET Activo = 0  WHERE ID = '".mysql_result($q, 0,"ID")."'";
            if (updateSQL($sql) == 1){
                echo json_encode(array("s" => 1, "m" => "Rol y Grupo elimindados con &eacute;xito"));
            }else echo json_encode(array("s" => 1, "m" => "Solo el rol fue elimindado con &eacute;xito"));
        }else echo json_encode(array("s" => 1, "m" => "Rol elimindado con &eacute;xito"));
    }
    else echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; el rol"));
}

function grupos()
{
    $byID = (isset($_POST["idg"])) ? "AND grupos.ID = ".$_POST["idg"] : "";
    $sql = "SELECT g.ID FROM grupos g, roles r WHERE g.Nombre = r.Nombre AND g.Activo = 1 AND r.Activo = 1";
    $resp = ejecutaSQL($sql);
    $gRol = array();
    while ($row = mysqli_fetch_array($resp)) {
        $row = array_map('utf8_encode', $row);
        array_push($gRol, $row['ID']);
    }
    $sql = " SELECT grupos.ID, grupos.Nombre as NomGrup FROM grupos WHERE grupos.Activo = 1 $byID ORDER BY NomGrup";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        if(in_array($row['ID'], $gRol))
            $j1[] = array("id" => $row['ID'], "nombreG" => $row['NomGrup'], "gRol"=>true);
        else $j1[] = array("id" => $row['ID'], "nombreG" => $row['NomGrup'], "gRol"=>false);
    }
    $j2 = array("s" => 1, "m" => "Listado de grupos correcto", "d" => array("grupos" => $j1));
    echo json_encode($j2);
}

function aGrupo($nombre)
{
    $nombre = trim(utf8_decode($nombre));
    $sql = " SELECT Nombre FROM grupos WHERE Nombre LIKE '$nombre' ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 0, "m" => "El grupo ya existe"));
    else {
        $sql = "INSERT INTO grupos (Nombre) VALUES ('$nombre') ";
        if(insertaSQL($sql))
            echo json_encode(array("s" => 1, "m" => "Grupo a&ntilde;adido con &eacute;xito"));
        else
            echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar el grupo"));
    }
}

function mGrupo($grupo, $nombre)
{
    $nombre = trim(utf8_decode($nombre));
    $sql = "SELECT * FROM roles r, grupos g WHERE r.Nombre = g.Nombre AND g.ID = '$grupo' AND r.Activo = 1";
    $r = ejecutaSQL($sql);
    if(mysqli_num_rows($r) == 1){
        echo json_encode(array("s" => 0, "m" => "El grupo esta asociado con un rol, modificar desde rol"));
    }else{
        $sql = " UPDATE grupos SET Nombre='$nombre' WHERE ID='$grupo' ";
        $r = updateSQL($sql);
        if ($r == 1)
            echo json_encode(array("s" => 1, "m" => "Grupo modificado con &eacute;xito"));
        else
            echo json_encode(array("s" => 0, "m" => "No se modific&oacute; el grupo"));
    }
}

function misGrupos($persona){
    $sql = "SELECT g.ID FROM grupos g, detalle_grupos dp WHERE dp.ID_Persona = {$persona} AND dp.ID_Grupo = g.ID AND g.Activo = 1";
    $inR = ejecutaSQL($sql);
    $sql = "SELECT g.ID, g.Nombre FROM grupos g WHERE g.Activo = 1";
    $outR = ejecutaSQL($sql);
    $in = array();
    $out = array();
    while ($row = mysqli_fetch_array($inR)) {
        $row = array_map('utf8_encode', $row);
        array_push($in, $row['ID']);
    }
    while ($row = mysqli_fetch_array($outR)) {
        $row = array_map('utf8_encode', $row);
        array_push($out, array("idg"=> $row['ID'], "nombreGrupo" => $row['Nombre']));
    }
    echo json_encode(array("s" => 1, "m" => "Grupos encontrados.", "d"=> array("in"=> $in, "out"=> $out)));
}

function eGrupo($grupo)
{
    $nombre = trim(utf8_decode($nombre));
    $sql = "SELECT * FROM roles r, grupos g WHERE r.Nombre = g.Nombre AND g.ID = '$grupo' AND r.Activo = 1";
    $r = ejecutaSQL($sql);
    if(mysqli_num_rows($r) == 1){
        echo json_encode(array("s" => 0, "m" => "El grupo esta asociado con un rol, no se puede eliminar"));
    }else{
        $sql = " UPDATE grupos SET Activo = 0  WHERE ID = '$grupo' ";
        $r = updateSQL($sql);
        if ($r == 1)
            echo json_encode(array("s" => 1, "m" => "Grupo elimindado con &eacute;xito"));
        else
            echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; el grupo"));
    }
}

function gMiembros($grupo)
{
    $sql = " SELECT p.ID, p.NSS, p.Nombre, p.ApellidoP, p.ApellidoM FROM personas p, detalle_grupos dg, grupos g
    WHERE g.ID = '$grupo'
    AND dg.ID_Grupo = g.ID
    AND p.ID = dg.ID_Persona
    AND g.Activo = 1 ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $nombre = $row['ApellidoP'] . " " . $row['ApellidoM'] . " " . $row['Nombre'];
        $j1[] = array("id" => $row['ID'], "nombre" => $nombre, "nss" => $row['NSS']);
    }
    $j2 = array("s" => 1, "m" => "Listado de miembros del grupo correcto", "d" => array("personas" => $j1));
    echo json_encode($j2);
}

function checkDeletePerson($grupo, $persona)
{
    $sql = "SELECT g.ID FROM grupos g, roles r, asignacion_roles ar WHERE ar.ID_Persona = '$persona' AND r.ID = ar.ID_Rol AND r.Nombre = g.Nombre AND g.ID = '$grupo'";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) > 0)
        echo json_encode(array("s" => 5, "m" => "El grupo a eliminar es el grupo de su rol, &iquest;Est&aacute; seguro que desea continuar&quest;"));
    else{
        ePdGrupo($grupo,$persona);
    }
}

function ePdGrupo($grupo, $persona)
{
    $sql = " DELETE FROM detalle_grupos WHERE ID_Persona = '$persona' AND ID_Grupo = '$grupo' ";
    if (updateSQL($sql) == 0)
        echo json_encode(array("s" => 0, "m" => "La persona no se elimin&oacute; el grupo"));
    else
        echo json_encode(array("s" => 1, "m" => "Persona eliminada del grupo con &eacute;xito"));
}

function aPaGrupo($grupo, $persona)
{
    $sql = " SELECT ID_Persona FROM detalle_grupos WHERE ID_Persona = '$persona' AND ID_Grupo = '$grupo' ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 0, "m" => "La persona ya existe en &eacute;ste grupo"));
    else {
        $sql = "INSERT INTO detalle_grupos VALUES ('$persona', '$grupo') ";
        insertaSQL($sql);
        echo json_encode(array("s" => 1, "m" => "Persona a&ntilde;adida al grupo con &eacute;xito"));
            // echo json_encode(array("s"=> 0, "m"=> "No se pudo a&ntilde;adir la persona al grupo"));
    }
}

function gruposDispositivo($idDisp)
{
    $sql = "SELECT ID_Grupo FROM detalle_dispositivos WHERE ID_Dispositivo = '$idDisp'";
    $in=array();
    $r = ejecutaSQL($sql);
    while($row = mysqli_fetch_array($r))
        array_push($in, $row['ID_Grupo']);
    $out = array();
    $sql = "SELECT ID, Nombre FROM grupos";
    $r = ejecutaSQL($sql);
    while($row = mysqli_fetch_array($r))
        array_push($out, array("id"=>$row['ID'],"nombre"=>$row['Nombre']));
    echo json_encode(array("s" => 1, "m" => "Busqueda con &eacute;xito", "d"=> array("in"=>$in,"out"=>$out)));
}

function aPsaGrupo ($grupo, $personas){
    $personas = explode(",", $personas);
    $msg = "";
    foreach ($personas as $persona) {
        $sql = " SELECT ID_Persona FROM detalle_grupos WHERE ID_Persona = '$persona' AND ID_Grupo = '$grupo' ";
        $r = ejecutaSQL($sql);
        if (mysqli_num_rows($r) == 1)
            $msg.= $persona." ya existe en el grupo<br>";
        else {
            $sql = " SELECT ID FROM personas WHERE NSS = '$persona'";
            $r = ejecutaSQL($sql);
            if($r!=0){
                $idp = mysql_result($r, 0,"ID");
                $sql = "INSERT INTO detalle_grupos VALUES ('$idp', '$grupo') ";
                insertaSQL($sql);
                $msg.=$persona." a&ntilde;adida al grupo con &eacute;xito<br>";
            }else $msg.=$persona." no se encontro<br>";
        }
    }
    echo json_encode(array("s" => 1, "m" => $msg));
}

function lPersona()
{
    if (isset($_POST["idr"]))
        $sql = " SELECT p.ID, p.Nombre, p.ApellidoP, p.ApellidoM, p.NSS, r.Nombre AS Rol, r.ID AS idRol FROM personas p, asignacion_roles ar, roles r WHERE p.ID = ar.ID_Persona  AND r.ID = ar.ID_Rol AND ID_Rol = '{$_POST["idr"]}' AND p.Nombre LIKE '{$_POST["filtro"]}%' AND p.Activo = 1 ORDER BY p.ApellidoP, p.ApellidoM, p.NSS ";
    else
        $sql = " SELECT p.ID, p.Nombre, p.ApellidoP, p.ApellidoM, p.NSS, r.Nombre AS Rol, r.ID AS idRol FROM personas p, asignacion_roles ar, roles r WHERE p.ID = ar.ID_Persona AND r.ID = ar.ID_Rol AND p.Nombre LIKE '{$_POST["filtro"]}%' AND p.Activo = 1 ORDER BY p.ApellidoP, p.ApellidoM, p.NSS ";
        #$sql = " SELECT ID, Nombre, ApellidoP, ApellidoM, NSS FROM personas WHERE Nombre like '{$_POST["filtro"]}%' AND Activo = 1 ORDER BY ApellidoP, ApellidoM, NSS  ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    //if(mysqli_fetch_array($r) != 0) {
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $nombre = $row['ApellidoP'] . " " . $row['ApellidoM'] . " " . $row['Nombre'];
        $j1[] = array("id" => $row['ID'], "nombre" => $nombre, "nss" => $row['NSS'], "rol"=> $row['Rol'], "RolID"=> $row['idRol']);
    }
    $j2 = array("s" => 1, "m" => "Busqueda de personas correcta", "d" => array("personas" => $j1));
    //}
    //else $j2 = array("s"=> 0 , "m"=> "Busqueda de personas incorrecta");
    echo json_encode($j2);
}

function lPersonaId($idp)
{
    $sql = " SELECT pe.*, ID_Rol, ID1, ID2, BioID, ad.ID AS IdAdmin, Username FROM personas AS pe
                LEFT JOIN identificador AS ide ON pe.ID = ide.ID_Persona
                LEFT JOIN asignacion_roles AS ar ON pe.ID = ar.ID_Persona
                LEFT JOIN administradores AS ad ON pe.ID = ad.ID_Persona
                WHERE pe.ID = $idp AND pe.Activo = 1 ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    if (mysqli_num_rows($r) != 0) {
        while ($row = mysqli_fetch_array($r)) {
            $row = array_map('utf8_encode', $row);
            $row = array_map('trim', $row);
            $j1[] = array("id" => $row['ID'], "titulo" => $row['Titulo'], "nombre" => $row['Nombre'], "ap" => $row['ApellidoP'], "am" => $row['ApellidoM'], "email" => $row['Email'], "cel" => $row['Celular'], "tel" => $row['Telefono'], "detalle" => $row['Detalle'], "nss" => $row['NSS'], "rol" => $row['ID_Rol'], "id1" => $row['ID1'], "id2" => $row['ID2'], "id3" => $row['BioID'], "idAdmin" => $row['IdAdmin'], "user" => $row['Username']);
        }
        $j2 = array("s" => 1, "m" => "Detalle de persona correcto", "d" => array("persona" => $j1));
    } else $j2 = array("s" => 0, "m" => "Detalle de persona incorrecto");

    echo json_encode($j2);
}

function mPersona($persona)
{
    $values = "";
    $mensaje = "";
    //Crea la sentencia SQL para modificar la tabla de personas
    if (isset($_POST["titulo"])) {
        $temp = trim(utf8_decode($_POST["titulo"]));
        $values .= " Titulo = '$temp', ";
    }
    if (isset($_POST["nombre"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["nombre"])));
        $values .= " Nombre = '$temp', ";
    }
    if (isset($_POST["apaterno"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["apaterno"])));
        $values .= " ApellidoP = '$temp', ";
    }
    if (isset($_POST["amaterno"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["amaterno"])));
        $values .= " ApellidoM = '$temp', ";
    }
    if (isset($_POST["email"])) {
        $temp = trim(utf8_decode($_POST["email"]));
        $values .= " Email = '$temp', ";
    }
    if (isset($_POST["movil"])) {
        $temp = trim(utf8_decode($_POST["movil"]));
        $values .= " Celular = '$temp', ";
    }
    if (isset($_POST["fijo"])) {
        $temp = trim(utf8_decode($_POST["fijo"]));
        $values .= " Telefono = '$temp', ";
    }
    if (isset($_POST["detalle"])) {
        $temp = trim(utf8_decode($_POST["detalle"]));
        $values .= " Detalle = '$temp', ";
    }
    if (isset($_POST["nss"])) {
        $temp = trim(utf8_decode($_POST["nss"]));
        $values .= " NSS = '$temp' ";
    }
    //$values = utf8_decode($values);
    $sql = " UPDATE personas SET $values WHERE ID = $persona ";
    //Creacion del mensaje para la modificaci�n de la persona
    if (updateSQL($sql) == 1)
        $mensaje .= "Persona actualizada";
    else
        $mensaje .= "Persona no actualizada";

    //Modificar tabla identificador
    if (isset($_POST["id1"])) {
        $temp = trim(utf8_decode($_POST["id1"]));
        $values = " ID1 = '$temp', ";
    }
    if (isset($_POST["id2"])) {
        $temp = trim(utf8_decode($_POST["id2"]));
        $values .= " ID2 = '$temp', ";
    }
    if (isset($_POST["id3"])) {
        $temp = trim(utf8_decode($_POST["id3"]));
        $values .= " BioID = '$temp' ";
    }
    $sql = " UPDATE identificador SET $values WHERE ID_Persona = $persona ";
    //Creacion del mensaje para la modificaci�n de los identificadores
    if (updateSQL($sql) == 1)
        $mensaje .= ", identificadores actualizados";
    else
        $mensaje .= " , identificadores no actualizados";

    $idGanterior=0;
    $idGnuevo=0;
    //Modificaci�n de la tabla rol
    if (isset($_POST["idr"])) {
        if ($_POST["idr"] != "") {
            $sql = " UPDATE asignacion_roles SET ID_Rol = '{$_POST['idr']}' WHERE ID_Persona = $persona ";
            $qry = "SELECT g.ID FROM roles r, asignacion_roles ar, grupos g WHERE ar.ID_Persona = '$persona' AND ar.ID_Rol = r.ID AND g.Nombre = r.Nombre";
            $rQ = ejecutaSQL($qry);
            $idGanterior = mysql_result($rQ, 0,"ID");
            $qry = "SELECT g.ID FROM roles r, grupos g WHERE r.ID = '{$_POST['idr']}' AND g.Nombre = r.Nombre";
            $rQ = ejecutaSQL($qry);
            $idGnuevo = mysql_result($rQ, 0,"ID");
        } else
            $sql = " UPDATE asignacion_roles SET ID_Rol = '1' WHERE ID_Persona = $persona ";
    }

    //Creacion del mensaje para la modificaci�n del rol
    if (updateSQL($sql) == 1){
        $mensaje .= ", rol actualizado";
        $qry = "INSERT INTO detalle_grupos VALUES ('$persona','$idGnuevo')";
        if(ejecutaSQL($qry)){
            $qry = "DELETE FROM detalle_grupos WHERE ID_Persona = '$persona' AND ID_Grupo = '$idGanterior'";
            if(ejecutaSQL($qry)) $mensaje .= ", grupo actualizado";
            else $mensaje .= ", grupo no actualizado";
        }else $mensaje .= ", grupo no actualizado";
    }else
        $mensaje .= ", rol no actualizado";

    //Verifica si la persona a modificar es administrador
    if (isset($_POST["administrador"])) {
        //Verifica que exista el registro para modificarlo o crearlo
        if ($_POST["administrador"] == 1) {
            //Si existe el parametro "usuario" pasa a la siguiente validaci�n
            if (isset($_POST["usuario"])) {
                $sql = " SELECT ID FROM administradores WHERE ID_Persona = '$persona' ";
                //Si encuentra el registro lo modifica
                if (updateSQL($sql) == 1) {
                    $sql = " UPDATE administradores SET Username = '{$_POST["usuario"]}' WHERE ID_Persona = $persona  ";
                    $r3 = updateSQL($sql);
                } //Si no lo crea
                else {
                    if (isset($_POST["nss"]))
                        $sql = "INSERT INTO administradores (Username, Password, ID_Persona) VALUES ('{$_POST["usuario"]}', '{$_POST["nss"]}', '$persona') ";
                    else
                        $sql = "INSERT INTO administradores (Username, Password, ID_Persona) VALUES ('{$_POST["usuario"]}', '{$_POST["12345"]}', '$persona') ";
                    $r3 = updateSQL($sql);
                }
            }
            //Creacion del mensaje para la modificaci�n de la tabla administradores
            if ($r3 == 1)
                $mensaje .= ", cuenta de administrador actualizada";
            else
                $mensaje .= ", cuenta de administrador no actualizada";
        } else {
            $sql = " DELETE FROM administradores WHERE ID_Persona = '$persona' ";
            if (updateSQL($sql) == 0)
                $mensaje .= ", cuenta de administrador no eliminada";
            else
                $mensaje .= ", cuenta de administrador eliminada";
        }
    }

    echo json_encode(array("s" => 1, "m" => $mensaje));
}

function aPersona()
{
    if ($_POST["administrador"] == 1) {
        aAdmin();
    }else{
        $sql = " SELECT NSS, Activo FROM personas WHERE NSS = '{$_POST['nss']}' ";
        $r = ejecutaSQL($sql);
        if (mysqli_num_rows($r) == 1){
            $sql = " UPDATE personas SET Activo = 1  WHERE NSS = '{$_POST['nss']}' ";
            $rs = updateSQL($sql);
            if ($rs == 1)
                echo json_encode(array("s" => 1, "m" => "Persona activada con &eacute;xito"));
            else{
                if(mysql_result($r,0,'Activo')==1)
                    echo json_encode(array("s" => 0, "m" => "Persona ya existe"));
                else
                    echo json_encode(array("s" => 0, "m" => "No se activo a la persona"));
            }

        }else {
            //Agrega a la persona a la tabla personas
            $nom = strtoupper(trim(utf8_decode($_POST["nombre"])));
            $ap = strtoupper(trim(utf8_decode($_POST["apaterno"])));
            $am = strtoupper(trim(utf8_decode($_POST["amaterno"])));
            $sql = "INSERT INTO personas (NSS,Titulo, Nombre, ApellidoP, ApellidoM, Email, Celular, Telefono, Detalle )
                      VALUES ('{$_POST["nss"]}', '{$_POST["titulo"]}', '$nom', '$ap', '$am', '{$_POST["email"]}',
                '{$_POST["movil"]}', '{$_POST["fijo"]}', '{$_POST["detalle"]}') ";
            $id = insertaSQL($sql);
            //Agrega los identificadores a la tabla identificador
            $sql = " INSERT INTO identificador VALUES ({$id}, '{$_POST["id1"]}', '{$_POST["id2"]}', '{$_POST["id3"]}' ) ";
            insertaSQL($sql);
            //Agrega el rol de la persona a la tabla asignacion_roles
            if ($_POST["idr"] == "") {
                $sql = " INSERT INTO asignacion_roles VALUES ('1', {$id}) ";
            } else {
                $sql = " INSERT INTO asignacion_roles VALUES ('{$_POST["idr"]}', {$id}) ";
            }
            insertaSQL($sql);
            echo json_encode(array("s" => 1, "m" => "Persona a&ntilde;adida con &eacute;xito", "d" => array("idp" => $id)));
            //echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar la persona"));
        }
    }
}

function ePersona($persona)
{
    $sql = " UPDATE personas SET Activo = 0  WHERE ID = '$persona' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Persona elimindada con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; la persona"));
}

function lEspacio()
{
    $sql = " SELECT e.ID, e.Nombre AS NombreE, Capacidad, ID_Tipo, te.Nombre AS NombreT FROM espacios as e
                INNER JOIN tipos_espacios AS te ON e.ID_Tipo = te.ID
                WHERE Activo = 1 ORDER BY NombreE, Capacidad";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("id" => $row['ID'], "nombreE" => $row['NombreE'], "capacidad" => $row['Capacidad'], "idTipo" => $row['ID_Tipo'], "nombreT" => $row['NombreT']);
    }
    $j2 = array("s" => 1, "m" => "Listado de espacios correcto", "d" => array("espacios" => $j1));
    echo json_encode($j2);
}

function eEspacio($espacio)
{
    $sql = " UPDATE espacios SET Activo = 0  WHERE ID = '$espacio' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Espacio elimindado con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se elimino el espacio"));
}

function aEspacio($nombre, $capacidad, $tipo)
{
    $nombre = trim(utf8_decode($nombre));
    $sql = " SELECT Nombre FROM espacios WHERE Nombre LIKE '$nombre' ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 0, "m" => "El espacio ya existe"));
    else {
        $sql = "INSERT INTO espacios (Nombre, Capacidad, ID_Tipo) VALUES ('$nombre', '$capacidad', '$tipo') ";
        insertaSQL($sql);
        echo json_encode(array("s" => 1, "m" => "Espacio a&ntilde;adido con &eacute;xito"));
        //echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar el espacio"));
    }
}

function mEspacio($espacio, $nombre, $capacidad, $tipo)
{
    $nombre = trim(utf8_decode($nombre));
    $sql = " UPDATE espacios SET Nombre='$nombre', Capacidad='$capacidad', ID_Tipo='$tipo' WHERE ID='$espacio' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Espacio modificado con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se modific&oacute; el espacio"));
}

function tEspacio()
{
    $sql = " SELECT * FROM tipos_espacios ORDER BY Nombre, ID";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("id" => $row['ID'], "nombre" => $row['Nombre']);
    }
    $j2 = array("s" => 1, "m" => "Listado de tipos espacios correcto", "d" => array("tipoEspacios" => $j1));
    echo json_encode($j2);
}

function lServicio()
{
    $j1 = array();
    if (!isset($_POST["filtro"]))
        $sql = " SELECT s.ID, Titulo, ID_Tipo_Servicio, Departamento, Codigo, Nivel, Nombre  FROM servicios AS s
                    INNER JOIN tipos_servicios AS ts  ON ID_Tipo_Servicio = ts.ID
                    WHERE Activo = 1 ORDER BY Titulo, Codigo";
    else
        $sql = " SELECT s.ID, Titulo, ID_Tipo_Servicio, Departamento, Codigo, Nivel, Nombre FROM servicios AS s
                    INNER JOIN tipos_servicios AS ts  ON ID_Tipo_Servicio = ts.ID
                    WHERE Activo = 1 AND Titulo LIKE '{$_POST["filtro"]}%' ";
    $r = ejecutaSQL($sql);
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("id" => $row['ID'], "titulo" => $row['Titulo'], "id_tipo" => $row['ID_Tipo_Servicio'], "nombreT" => $row['Nombre'], "departamento" => $row['Departamento'], "codigo" => $row["Codigo"], "nivel" => $row["Nivel"]);
    }
    $j2 = array("s" => 1, "m" => "Listado de servicios correcto", "d" => array("servicios" => $j1));
    echo json_encode($j2);
}

function eServicio($servicio)
{
    $sql = " UPDATE servicios SET Activo = 0  WHERE ID = '$servicio' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Servicio elimindado con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; el servicio"));
}

function aServicio($titulo, $tipo, $departamento, $codigo, $nivel)
{
    $titulo = trim(utf8_decode($titulo));
    $departamento = $departamento;
    $sql = " SELECT Codigo FROM servicios WHERE Codigo LIKE '$codigo' ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 0, "m" => "El servicio ya existe"));
    else {
        $sql = "INSERT INTO servicios (Titulo, ID_Tipo_Servicio, Departamento, Codigo, Nivel) VALUES ('$titulo', '$tipo', '$departamento', '$codigo', '$nivel') ";
        $id = insertaSQL($sql);
        echo json_encode(array("s" => 1, "m" => "Servicio a&ntilde;adido con &eacute;xito", "d" => array("ids" => $id)));
        //echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar el servicio"));
    }
}

function mServicio($servicio, $titulo, $tipo, $departamento, $codigo, $nivel)
{
    $titulo = trim(utf8_decode($titulo));
    $sql = " UPDATE servicios SET Titulo='$titulo', ID_Tipo_Servicio=" . $tipo . ", Departamento='$departamento', Codigo='$codigo', Nivel='$nivel' WHERE ID='$servicio' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Servicio modificado con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se modific&oacute; el servicio"));
}

function tServicio()
{
    $sql = " SELECT * FROM tipos_servicios ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $j1[] = array("id" => $row['ID'], "nombre" => trim(utf8_encode($row['Nombre'])));
    }
    $j2 = array("s" => 1, "m" => "Listado de tipos servicios correcto", "d" => array("tipoServicios" => $j1));
    echo json_encode($j2);
}


function lAsignacion_Persona()
{
    $j2 = array("s" => 1, "m" => "Listado de asignaciones de Persona", "d" => array(
                          array("id_asignacion" => 45,"CRN"=> 546,"Periodo"=>"2017056","Nombre_asignacion"=>"Matematicas II","FInicio"=>"2017-07-01","FFin"=>"2017-10-01"),
                          array("id_asignacion" => 42,"CRN"=> 542,"Periodo"=>"2017056","Nombre_asignacion"=>"Historia II","FInicio"=>"2017-07-01","FFin"=>"2017-10-01")
                      ));
    echo json_encode($j2);
}



function lAsignacionPersona($persona){


     //id_asignacion, CRN, Periodo, Servicio, Fecha Inicia, Fecha Fin

     $sql = " SELECT asigs.id AS id_asignacion, CRN, Periodo, ser.titulo AS Servicio, FechaInicio AS Finicio, FechaFin AS Ffin FROM asignaciones AS asigs
                INNER JOIN servicios AS ser ON ser.id = asigs.ID_SERVICIO
                INNER JOIN personas AS pe ON asigs.ID_Persona = pe.ID
                WHERE pe.id='$persona'";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_assoc($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[]=$row;
    }
    $j2 = array("s" => 1, "m" => "Listado de asignaciones correcto", "d" => array("asignaciones" => $j1));
    //echo var_dump($j2);
    echo json_encode($j2);

}


function lAsignacion()
{
    $sql = " SELECT a.*, g.Nombre AS NombreG, e.Nombre AS NombreE, s.Titulo, CONCAT(p.ApellidoP, ' ', p.ApellidoM, ' ', p.Nombre) AS Persona, p.NSS FROM asignaciones AS a
                INNER JOIN grupos AS g ON ID_Grupo = g.ID
                INNER JOIN espacios AS e ON ID_Espacio = e.ID
                INNER JOIN servicios AS s ON ID_Servicio = s.ID
                INNER JOIN personas AS p ON ID_Persona = p.ID
                WHERE a.Activo = 1 AND NOW()  BETWEEN FechaInicio AND FechaFin; ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("ida" => $row['ID'], "idg" => $row['ID_Grupo'], "nombreG" => $row['NombreG'], "ide" => $row['ID_Espacio'], "nombreE" => $row['NombreE'], "ids" => $row['ID_Servicio'], "titulo" => $row['Titulo'], "idp" => $row['ID_Persona'], "nombreP" => $row['Persona'], "nss" => $row['NSS'], "fi" => $row['FechaInicio'], "ff" => $row['FechaFin'], "crn" => $row["CRN"], "periodo" => $row["Periodo"]);
    }
    $j2 = array("s" => 1, "m" => "Listado de asignaciones correcto", "d" => array("asignaciones" => $j1));
    //echo var_dump($j2);
    echo json_encode($j2);
}

function cAsignacion($grupo, $espacio, $servicio, $persona, $fi, $ff, $crn, $periodo)
{
    $crn = trim(utf8_encode($crn));
    $responsable = "NULL";
    if (isset($_POST['responsible'])) {
        $responsable = $_POST['responsible'];
    }

    $sql = "SELECT ID FROM asignaciones WHERE ID_Servicio = '$servicio' AND Periodo = '$periodo' AND CRN = '$crn' AND FechaInicio = STR_TO_DATE('$fi', '%Y-%m-%d') AND FechaFin = STR_TO_DATE('$ff', '%Y-%m-%d') ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 0, "m" => "La asignaci&oacute;n ya existe"));
    else {
        $sql = "INSERT INTO asignaciones (ID_Grupo, ID_Espacio, ID_Servicio, ID_Persona, FechaInicio, FechaFin, CRN, Periodo, ID_Administrativo, Forma) VALUES ('$grupo', '$espacio', '$servicio', '$persona', STR_TO_DATE('$fi', '%Y-%m-%d'), STR_TO_DATE('$ff', '%Y-%m-%d'), '$crn', '$periodo', $responsable, 'manual' ) ";
        $id = insertaSQL($sql);
        echo json_encode(array("s" => 1, "m" => "Asignacion a&ntilde;adida con &eacute;xito", "d" => array("ida" => $id)));
        //echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar la asignaci�n"));
    }
}

function mAsignacion($asignacion, $grupo, $espacio, $servicio, $persona, $fi, $ff, $crn, $periodo)
{
    $crn = trim(utf8_decode($crn));
    $sql = " UPDATE asignaciones SET ID_Grupo='$grupo', ID_Espacio='$espacio', ID_Servicio='$servicio', ID_Persona='$persona', FechaInicio=STR_TO_DATE('$fi', '%Y-%m-%d'), FechaFin=STR_TO_DATE('$ff', '%Y-%m-%d'), CRN='$crn', Periodo='$periodo' WHERE ID='$asignacion' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Asignaci&oacute;n modificada con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se modific&oacute; la asignaci&oacute;n"));
}

function eAsignacion($asignacion)
{
    $sql = " UPDATE asignaciones SET Activo = 0  WHERE ID = '$asignacion' ";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Asignaci&oacute;n elimindada con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; la asignaci&oacute;n"));
}

function dAsignacion($asignacion)
{
    $sql = " SELECT * FROM detalle_asignacion WHERE ID_Asignacion = '$asignacion'  ";
    $r = ejecutaSQL($sql);
    $j1 = array();
    while ($row = mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $j1[] = array("dia" => $row['Dia'], "hi" => $row['HoraInicio'], "hf" => $row['HoraFin']);
    }
    $j2 = array("s" => 1, "m" => "Listado del detalle de asignaci&oacute;n correcto", "d" => array("detalleAsignacion" => $j1));
    echo json_encode($j2);
}

function hAsignacion($asignacion, $detalle)
{
    $detalle = json_decode($detalle, true);
    $mensaje = "";
    for ($x = 0; $x < 7; $x++) {
        $dia = $dayName = 0;
        switch ($x) {
            case 0:
                $dia = $detalle['L'];
                $dayName = "Lunes";
                break;
            case 1:
                $dia = $detalle['M'];
                $dayName = "Martes";
                break;
            case 2:
                $dia = $detalle['Mi'];
                $dayName = "Mi&eacute;rcoles";
                break;
            case 3:
                $dia = $detalle['J'];
                $dayName = "Jueves";
                break;
            case 4:
                $dia = $detalle['V'];
                $dayName = "Viernes";
                break;
            case 5:
                $dia = $detalle['S'];
                $dayName = "S&aacute;bado";
                break;
            case 6:
                $dia = $detalle['D'];
                $dayName = "Domingo";
                break;
        }
        if ($x == 2) $temp = $dayName[0] . $dayName[1];
        else $temp = $dayName[0];

        if ($dia == 0) {
            $sql = " SELECT ID_Asignacion, Dia FROM detalle_asignacion WHERE ID_Asignacion='$asignacion' AND Dia='$temp' ";
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) != 0) {
                $sql = " DELETE FROM detalle_asignacion WHERE ID_Asignacion='$asignacion' AND Dia='$temp' ";
                $r = ejecutaSQL($sql);
                $mensaje .= "D&iacute;a " . $dayName . " eliminado<br>";
            }
        } else {
            $dia = explode(" ", $dia, 2);
            if ($dia[0] == "" || $dia[1] == "") {
                $mensaje .= "D&iacute;a " . $dayName . " tiene hora faltante<br>";
            } else {
                $sql = " SELECT ID_Asignacion, Dia FROM detalle_asignacion WHERE ID_Asignacion='$asignacion' AND Dia='$temp' ";
                $r = ejecutaSQL($sql);
                if (mysqli_num_rows($r) != 0) {
                    $sql = " UPDATE detalle_asignacion SET HoraInicio = '$dia[0]', HoraFin = '$dia[1]' WHERE ID_Asignacion='$asignacion' and Dia='$temp' ";
                    $r = ejecutaSQL($sql);
                    $mensaje .= "D&iacute;a " . $dayName . " modificado<br>";
                } else {
                    $sql = " INSERT INTO detalle_asignacion VALUES ('$asignacion', '$temp', '$dia[0]', '$dia[1]') ";
                    $r = ejecutaSQL($sql);
                    $mensaje .= "D&iacute;a " . $dayName . " a&ntilde;adido<br>";
                }
            }
        }
    }
    echo json_encode(array("s" => 1, "m" => $mensaje));
}

function test()
{
    $sql = " SELECT ID FROM administradores WHERE ID_Persona = '87' ";
    $r = ejecutaSQL($sql);
    echo var_dump($r);
    echo var_dump(mysqli_num_rows($r));
    $r = updateSQL($sql);
    echo var_dump($r);
}

function reporte($tipo, $dato, $fi, $ff)
{
    switch ($tipo) {
        case "personal":
            $sql = "SELECT * from reportes where nss = '$dato' AND fecha >= '$fi' AND fecha <= '$ff' order by fecha ASC ";
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0)
                echo json_encode(array("s" => 0, "m" => "No hay registros en esas fechas o con ese n&uacute;mero de n&oacute;mina."));
            else {
                while ($l = mysqli_fetch_assoc($r)) {
                    $l = array_map('utf8_encode', $l);
                    $nss = $l['nss'];
                    $dia = $l['fecha'];
                    $l["incidencias"] = "";
                    $sql = " SELECT a.* ,d.Descripcion FROM checado a, personas p, dispositivos d WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND d.ID = a.ID_Dispositivo AND a.Periodo LIKE '{$dia}%' ORDER BY a.Periodo ASC ";
                    $r2 = ejecutaSQL($sql);
                    if (mysqli_num_rows($r2) == 0)
                        $l["incidencias"] = "s/reg";
                    else {
                        //$l["incidencias"] = array();
                        while ($in = mysql_fetch_assoc($r2)) {
                            $periodo = explode(" ", $in['Periodo'], 2);
                            //array_push($l["incidencias"], $periodo[1]);
                            $l["incidencias"] .= substr($periodo[1], 0, 5) . "!". $in['Descripcion'].",";
                        }
                    }
                    $resultado [] = $l;
                }
                echo json_encode(array("s" => 1, "m" => "Reporte generado", "d" => $resultado));
            }
            break;

        case "nivel":
            $sql='SELECT  DATE_FORMAT(dictamen.Fecha,"%d.%b") as Fecha, ifnull(retardo.retardo,0) as retardo,ifnull(asistencia.asistencia,0) as asistencia, ifnull(falta.falta,0) as falta, ifnull(abandono.abandono,0) as abandono , ifnull(ausencia.ausencia,0) as ausencia  FROM `dictamen`
                left join (SELECT COUNT(*) as retardo,    Fecha FROM `dictamen`
                join asignaciones on (asignaciones.ID = dictamen.ID_Asignacion)
                join servicios on (servicios.ID = asignaciones.ID_Servicio)
                where Fecha >= "'.$fi.'" and Fecha <= "'.$ff.'"  and Dictamen = "R" and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0  group by  Fecha) as retardo    on (retardo.Fecha = dictamen.Fecha)

                left join (SELECT COUNT(*) as asistencia, Fecha FROM `dictamen`
                join asignaciones on (asignaciones.ID = dictamen.ID_Asignacion)
                join servicios on (servicios.ID = asignaciones.ID_Servicio)
                where Fecha >= "'.$fi.'" and Fecha <= "'.$ff.'" and Dictamen = "A"  and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0  group by  Fecha) as asistencia on (asistencia.Fecha = dictamen.Fecha)

                left join (SELECT COUNT(*) as falta,      Fecha FROM `dictamen`
                join asignaciones on (asignaciones.ID = dictamen.ID_Asignacion)
                join servicios on (servicios.ID = asignaciones.ID_Servicio)
                where Fecha >= "'.$fi.'" and Fecha <= "'.$ff.'" and Dictamen = "F"  and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0  group by  Fecha) as falta      on (falta.Fecha = dictamen.Fecha)

                left join (SELECT COUNT(*) as abandono,   Fecha FROM `dictamen`
                join asignaciones on (asignaciones.ID = dictamen.ID_Asignacion)
                join servicios on (servicios.ID = asignaciones.ID_Servicio)
                where Fecha >= "'.$fi.'" and Fecha <= "'.$ff.'" and Dictamen = "AB" and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0  group by  Fecha) as abandono   on (abandono.Fecha = dictamen.Fecha)

                left join (SELECT COUNT(*) as ausencia,   Fecha FROM `dictamen`
                join asignaciones on (asignaciones.ID = dictamen.ID_Asignacion)
                join servicios on (servicios.ID = asignaciones.ID_Servicio)
                where Fecha >= "'.$fi.'" and Fecha <= "'.$ff.'" and Dictamen = "AU" and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0  group by  Fecha) as ausencia   on (ausencia.Fecha = dictamen.Fecha)

                where dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by  dictamen.Fecha';

            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0){
                echo json_encode(array("s" => 0, "m" => "No hay registros en esas fechas o con ese nivel."));
                exit();
            }else {
                $byDate=array();
                while ($l = mysql_fetch_assoc($r)) {
                    array_push($byDate, array(
                                "dia"=>$l["Fecha"],
                                "A"=>intval($l["asistencia"]),
                                "R"=>intval($l["retardo"]),
                                "AB"=>intval($l["abandono"]),
                                "AU"=>intval($l["ausencia"]),
                                "F"=>intval($l["falta"])
                                )
                            );
                }
            }
            $sql = 'SELECT DISTINCT personas.NSS,personas.Nombre,personas.ApellidoP, personas.ApellidoM, ifnull(retardo.retardo,0) as retardo,ifnull(asistencia.asistencia,0) as asistencia, ifnull(falta.falta,0) as falta, ifnull(abandono.abandono,0) as abandono , ifnull(ausencia.ausencia,0) as ausencia FROM `personas`
            left join (
                SELECT COUNT(*) as retardo,personas.NSS
                FROM `personas`
                LEFT JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
                LEFT JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
                LEFT JOIN dictamen ON ( dictamen.ID_Asignacion = asignaciones.ID )
                where FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0 and dictamen.dictamen = "R" and dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by   personas.NSS
                ORDER BY dictamen.Fecha ASC)as retardo    on (retardo.NSS = personas.NSS)

            left join (
                SELECT COUNT(*) as asistencia,personas.NSS
                FROM `personas`
                LEFT JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
                LEFT JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
                LEFT JOIN dictamen ON ( dictamen.ID_Asignacion = asignaciones.ID )
                where FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0 and dictamen.dictamen = "A" and dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by   personas.NSS
                ORDER BY dictamen.Fecha ASC)as asistencia    on (asistencia.NSS = personas.NSS)

            left join (
                SELECT COUNT(*) as falta,personas.NSS
                FROM `personas`
                LEFT JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
                LEFT JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
                LEFT JOIN dictamen ON ( dictamen.ID_Asignacion = asignaciones.ID )
                where FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0 and dictamen.dictamen = "F" and dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by   personas.NSS
                ORDER BY dictamen.Fecha ASC)as falta    on (falta.NSS = personas.NSS)

            left join (
                SELECT COUNT(*) as abandono,personas.NSS
                FROM `personas`
                LEFT JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
                LEFT JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
                LEFT JOIN dictamen ON ( dictamen.ID_Asignacion = asignaciones.ID )
                where FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0 and dictamen.dictamen = "AB" and dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by   personas.NSS
                ORDER BY dictamen.Fecha ASC)as abandono    on (abandono.NSS = personas.NSS)

            left join (
                SELECT COUNT(*) as ausencia,personas.NSS
                FROM `personas`
                LEFT JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
                LEFT JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
                LEFT JOIN dictamen ON ( dictamen.ID_Asignacion = asignaciones.ID )
                where FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0 and dictamen.dictamen = "AU" and dictamen.Fecha >= "'.$fi.'" and dictamen.Fecha <= "'.$ff.'"
                group by   personas.NSS
                ORDER BY dictamen.Fecha ASC)as ausencia    on (ausencia.NSS = personas.NSS)

            JOIN asignaciones ON ( asignaciones.ID_Persona = personas.ID )
            JOIN servicios ON ( servicios.ID = asignaciones.ID_Servicio )
            where asignaciones.Activo = 1 and FIND_IN_SET(servicios.Nivel,"'.$dato.'") >0';
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0){
                echo json_encode(array("s" => 0, "m" => "No hay personas con dictamen en estas fechas o esos niveles."));
                exit();
            }else {
                $byNss=array();
                while ($l = mysql_fetch_assoc($r)) {
                    array_push($byNss, array(
                                "nss"=>$l["NSS"],
                                "nombre"=>mb_convert_encoding($l["Nombre"], "HTML-ENTITIES", "ISO-8859-1")." ".mb_convert_encoding($l["ApellidoP"], "HTML-ENTITIES", "ISO-8859-1")." ".mb_convert_encoding($l["ApellidoM"], "HTML-ENTITIES", "ISO-8859-1"),
                                "A"=>$l["asistencia"],
                                "R"=>$l["retardo"],
                                "AB"=>$l["abandono"],
                                "AU"=>$l["ausencia"],
                                "F"=>$l["falta"]
                                )
                            );
                }
            }


            // $byNss=array(array("nss"=>"16364","nombre"=>"GONZALEZ ARANDA RAMON","A"=>10,"F"=>12,"AU"=>2,"AB"=>10,"R"=>4));
            $resultado=array("byDate"=>$byDate,"byNss"=>$byNss);
            echo json_encode(array("s" => 1, "m" => "Reporte generado", "d" => $resultado));
            exit();
            $sql = "SELECT * from reportes where nivel = '$dato' AND fecha >= '$fi' AND fecha <= '$ff' ORDER BY nss ASC";
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0)
                echo json_encode(array("s" => 0, "m" => "No hay registros en esas fechas o con ese nivel."));
            else {
                while ($l = mysql_fetch_assoc($r)) {
                    $l = array_map('utf8_encode', $l);
                    $nss = $l['nss'];
                    $dia = $l['fecha'];
                    $l["incidencias"] = "";
                    $sql = " SELECT a.* FROM checado a, personas p WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND a.Periodo LIKE '{$dia}%' ORDER BY a.Periodo ASC ";
                    $r2 = ejecutaSQL($sql);
                    if (mysqli_num_rows($r2) == 0)
                        $l["incidencias"] = "No hay incidencias para ese d&iacute;a";
                    else {
                        //$l["incidencias"] = array();
                        while ($in = mysql_fetch_assoc($r2)) {
                            $periodo = explode(" ", $in['Periodo'], 2);
                            //array_push($l["incidencias"], $periodo[1]);
                            $l["incidencias"] .= $periodo[1] . "<br>";
                        }
                    }
                    $resultado [] = $l;
                }
                echo json_encode(array("s" => 1, "m" => "Reporte generado", "d" => $resultado));
            }
            break;

        case "dictamen":
            $sql = "SELECT * from reportes where dictamen = '$dato' AND fecha >= '$fi' AND fecha <= '$ff' ORDER BY nss ASC ";
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0)
                echo json_encode(array("s" => 0, "m" => "No hay registros en esas fechas o con ese dictamen."));
            else {
               while ($l = mysqli_fetch_assoc($r)) {
                    $l = array_map('utf8_encode', $l);
                    $nss = $l['nss'];
                    $dia = $l['fecha'];
                    $l["incidencias"] = "";
                    $sql = " SELECT a.* ,d.Descripcion FROM checado a, personas p, dispositivos d WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND d.ID = a.ID_Dispositivo AND a.Periodo LIKE '{$dia}%' ORDER BY a.Periodo ASC ";
                    $r2 = ejecutaSQL($sql);
                    if (mysqli_num_rows($r2) == 0)
                        $l["incidencias"] = "s/reg";
                    else {
                        //$l["incidencias"] = array();
                        while ($in = mysqli_fetch_assoc($r2)) {
                            $periodo = explode(" ", $in['Periodo'], 2);
                            //array_push($l["incidencias"], $periodo[1]);
                            $l["incidencias"] .= substr($periodo[1], 0, 5) . "!". $in['Descripcion'].",";
                        }
                    }
                    $resultado [] = $l;
                }
                echo json_encode(array("s" => 1, "m" => "Reporte generado", "d" => $resultado));
            }
            break;
    }
}

function consultDias()
{
    $sql="SELECT dia, nivel FROM dias_no_laborales WHERE Activo = 1";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No hay registros activos."));
    else{
        $resulta = array();
        $days=array();
        while ($f = mysql_fetch_assoc($r)) {
            if(in_array($f['dia'], $days)){
                array_push($resulta[$f['dia']],$f['nivel']);
            }else{
                array_push($days, $f['dia']);
                $resulta[$f['dia']]=array($f['nivel']);
            }
        }
        echo json_encode(array("s" => 1, "m" => "D&iacute;as encontrados", "d" => $resulta));
    }
}

function getLevels()
{
    $sql = "SELECT Nivel FROM  `servicios` WHERE Activo = 1";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No hay niveles activos."));
    else{
        $resulta = array();
        while ($f = mysql_fetch_assoc($r)) {
            if (!in_array($f['Nivel'], $resulta)) {
                array_push($resulta,$f['Nivel']);
            }
        }
        echo json_encode(array("s" => 1, "m" => "Niveles encontrados", "d" => $resulta));
    }
}

function deleteDay($date)
{
    $sql = " UPDATE dias_no_laborales SET Activo = 0 WHERE dia = '$date' ";
    $r = updateSQL($sql);
    if ($r > 0)
        echo json_encode(array("s" => 1, "m" => "Fecha desactivada con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se desactivo la fecha"));
}

function modifyDay($date, $niv)
{
    if ($niv == "" || empty($niv)){
        deleteDay($date);
        return;
    }

    $sql = "SELECT nivel FROM dias_no_laborales WHERE dia = '$date' AND Activo = 1";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 0){
        echo json_encode(array("s" => 0, "m" => "No hay registros activos."));
        return;
    }else{
        $c=0;
        $niv = explode(",",$niv);
        for ($i=0; $i < count($niv) ; $i++) {
            $sql = " SELECT Activo FROM dias_no_laborales WHERE dia = '$date' AND nivel = '$niv[$i]'";
            $r = ejecutaSQL($sql);
            if (mysqli_num_rows($r) == 0){
                $sql = "INSERT INTO dias_no_laborales (dia,nivel,Activo) VALUES ('$date','$niv[$i]',1)";
                $ins = ejecutaSQL($sql);
                if (!$ins){
                    echo json_encode(array("s" => 0, "m" => "Error al insertar fecha."));
                    return;
                }
            }else{
                while ($fi = mysql_fetch_assoc($r)) {
                    if ($fi['Activo']==0) {
                        $sql = " UPDATE dias_no_laborales SET Activo = 1 WHERE dia = '$date' AND nivel = '$niv[$i]' ";
                        $up = updateSQL($sql);
                        if ($up == 0){
                            echo json_encode(array("s" => 0, "m" => "Error al insertar fecha."));
                            return;
                        }
                    }
                }
            }
        }
        $sql = "SELECT nivel FROM dias_no_laborales WHERE dia = '$date' AND Activo = 1";
        $r = ejecutaSQL($sql);
        while ($fi = mysql_fetch_assoc($r)) {
            $n=$fi['nivel'];
            if (!in_array($n,$niv)) {
                $sql = " UPDATE dias_no_laborales SET Activo = 0 WHERE dia = '$date' AND nivel = '$n' ";
                $up = updateSQL($sql);
                if ($up == 0){
                    echo json_encode(array("s" => 0, "m" => "Error al insertar fecha."));
                    return;
                }
            }
        }
    }

    echo json_encode(array("s" => 1, "m" => "Actualizado con &eacute;xito"));
}

function addDay($date, $niv)
{
    $niv=explode(",", $niv);
    $c=0;
    for ($i=0; $i < count($niv) ; $i++) {
        $sql = " SELECT Activo FROM dias_no_laborales WHERE dia = '$date' AND nivel = '$niv[$i]' ";
        $r = ejecutaSQL($sql);
        if (mysqli_num_rows($r) == 0){
            $sql = "INSERT INTO dias_no_laborales (dia,nivel,Activo) VALUES ('$date','$niv[$i]',1)";
            $ins = ejecutaSQL($sql);
            if (!$ins){
                echo json_encode(array("s" => 0, "m" => "Error al insertar fecha."));
                return;
            }
        }else{
            while ($fi = mysql_fetch_assoc($r)) {
                if ($fi['Activo']==0) {
                    $sql = " UPDATE dias_no_laborales SET Activo = 1 WHERE dia = '$date' AND nivel = '$niv[$i]' ";
                    $up = updateSQL($sql);
                    if ($up == 0){
                        echo json_encode(array("s" => 0, "m" => "Error al insertar fecha."));
                        return;
                    }
                }
            }
        }
    }
    echo json_encode(array("s" => 1, "m" => "Fecha a&ntilde;adida con &eacute;xito."));
}

function getIncidencias($nss,$fecha){
    $sql = "SELECT p.ID FROM personas p WHERE p.NSS='$nss'";
    if (!$r = ejecutaSQL($sql)) {
        echo json_encode(array("s"=> 1, "m"=>"ERROR 0: No se puedo hacer el Query"));
    } elseif (mysqli_num_rows($r) == 0) {
        echo json_encode(array("s"=> 1, "m"=>"La persona no existe"));
    } else {
        $l = mysql_fetch_assoc($r);
        $id_persona = $l['ID'];
        $Pi = array();
        $fechas = explode(",", $fecha);
        $errores = array("total"=>0,"log" => array());
        foreach ($fechas as $f) {
            $FI = date("Y-m-d 00:00:00", strtotime($f));
            $FF = date("Y-m-d 23:59:59", strtotime($f));
            $sql = "SELECT a.Periodo, d.Descripcion FROM checado a, personas p, dispositivos d
                    WHERE a.ID_Persona = p.ID AND p.NSS = '$nss' AND a.Periodo > '$FI' AND a.Periodo < '$FF' AND d.ID = a.ID_Dispositivo ORDER BY a.Periodo ASC ";

            if (!$r = ejecutaSQL($sql)) {
                $errores["total"]++;
                array_push($errores["log"], "No se pudo hacer consulta del dia: ".$f);
            } elseif (mysqli_num_rows($r) == 0) {
                $errores["total"]++;
                array_push($errores["log"], "No incidencias para el dia: ".$f);
            }else{
                $Pi[$f]=array();
                while ($l = mysql_fetch_assoc($r)) {
                    array_push($Pi[$f], array(explode(" ",$l['Periodo'])[1],$l['Descripcion']));
                }
            }
        }
        echo json_encode(array("s"=> 0, "m"=>"","d"=> $Pi, "e"=>$errores));
    }
}

function getDevice(){

    if($_POST['type'] == "all")
        $sql="SELECT dispositivos.ID,dispositivos.Maquina, dispositivos.Clave, dispositivos.Descripcion, dispositivos.TimeStamp, espacios.ID AS idEsp, espacios.Nombre AS ubicacion, dispositivos.Activo AS state FROM dispositivos join espacios on (espacios.ID = dispositivos.ID_Espacio)";
    elseif($_POST['type'] == "inactive")
        $sql="SELECT dispositivos.ID,dispositivos.Maquina, dispositivos.Clave, dispositivos.Descripcion, dispositivos.TimeStamp, espacios.ID AS idEsp, espacios.Nombre AS ubicacion, dispositivos.Activo AS state FROM dispositivos join espacios on (espacios.ID = dispositivos.ID_Espacio)  WHERE dispositivos.Activo = 0 ";
    else
        $sql="SELECT dispositivos.ID,dispositivos.Maquina, dispositivos.Clave, dispositivos.Descripcion, dispositivos.TimeStamp, espacios.ID AS idEsp, espacios.Nombre AS ubicacion, dispositivos.Activo AS state FROM dispositivos join espacios on (espacios.ID = dispositivos.ID_Espacio)  WHERE dispositivos.Activo = 1 ";

    $r =ejecutaSQL($sql);
    $data=array();
    $dt1=new DateTime();
    while($row=mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $row = array_map('trim', $row);
        $dt2=new DateTime($row['TimeStamp']);
        $interval=$dt1->diff($dt2);
        $data[] = array("id" => $row['ID'], "maquina" => $row['Maquina'], "pass" => $row['Clave'], "descripcion" => $row['Descripcion'], "timestamp" => $row['TimeStamp'], "ubicacion" => $row['ubicacion'], "idEsp" => $row['idEsp'], "state" => $row['state']);
        //echo $interval->format('%a dias %H Horas %I Minutos');
    }
    echo json_encode(array("s" => 1, "m" => "Listado de dispositivos correcto", "d" =>$data));
}

function getInfoDevice($id){
    $sql="SELECT dispositivos.ID,dispositivos.Maquina, dispositivos.Clave, dispositivos.Descripcion FROM dispositivos where ID=$id";
    $r =ejecutaSQL($sql);
    $data=array();
    $dt1=new DateTime();
    while($row=mysqli_fetch_array($r)) {
        $row = array_map('utf8_encode', $row);
        $row = array_map('trim', $row);
        $dt2=new DateTime($row['TimeStamp']);
        $interval=$dt1->diff(Dt2);
        $data[] = array("id" => $row['ID'], "maquina" => $row['Maquina'], "pass" => $row['Clave'], "descripcion" => $row['Descripcion'], "ubicacion" => $row['ubicacion']);
        echo $interval->format('%M minutes');
    }
}

function getPubImp($idDev){
    $sql="SELECT publicidad.Ruta, publicidad.ID from checador_publicidad JOIN publicidad ON (publicidad.ID=checador_publicidad.ID_Publicidad) WHERE checador_publicidad.ID_Tipo_Publicidad='2' AND checador_publicidad.ID_Dispositivo='$idDev' AND checador_publicidad.Activo='1'";
    $r=ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No existe publicidad para este dispositivo."));
    else {
        $res = array();
        while ($l = mysql_fetch_assoc($r)) {
            $res[] = $l;
        }
        echo json_encode(array("s" => 1, "m" => "B&uacute;squeda publicidad exitosa", "d" => $res));
    }
}

function getPubCarr($idDev){
    $sql="SELECT publicidad.Ruta, publicidad.ID from checador_publicidad JOIN publicidad ON (publicidad.ID=checador_publicidad.ID_Publicidad) WHERE checador_publicidad.ID_Tipo_Publicidad='1' AND checador_publicidad.ID_Dispositivo='$idDev' AND checador_publicidad.Activo='1'";
    $r=ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 0)
        echo json_encode(array("s" => 0, "m" => "No existe publicidad para este dispositivo."));
    else {
        $res = array();
        while ($l = mysql_fetch_assoc($r)) {
            $res[] = $l;
        }
        echo json_encode(array("s" => 1, "m" => "B&uacute;squeda publicidad exitosa", "d" => $res));
    }
}

function aDispositivo(){
    $sql = " SELECT Activo FROM dispositivos WHERE maquina = '{$_POST['maquina']}'";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1){
        if(mysql_result($r, 0, 'Activo') == 1)
            echo json_encode(array("s" => 0, "m" => "Ya existe un dispositivo activo con el mismo nombre en el mismo espacio"));
        else
            echo json_encode(array("s" => 0, "m" => "Ya existe un dispositivo inactivo con el mismo nombre en el mismo espacio"));
    }else {
        $maquina = trim(utf8_decode($_POST["maquina"]));
        $clave = trim(utf8_decode($_POST["clave"]));
        $desc = trim(utf8_decode($_POST["descripcion"]));
        $sql = "INSERT INTO dispositivos (Maquina,Clave, Descripcion, id_Espacio) VALUES ('$maquina', '$clave','$desc', '1')";
        $id = insertaSQL($sql);
        if($id!=0){
            echo json_encode(array("s" => 1, "m" => "Dispositivo agregado con exito", "d" => array("idp" => $id)));
        }else{
            echo json_encode(array("s" => 0, "m" => "Error al agregar dispositivo", "d" =>NULL));
        }
    }
}

function acDispositivo()
{
    $sql = "UPDATE dispositivos SET Activo = 1  WHERE ID={$_POST['idDev']}";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Dispositivo activado con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se activo el dispositivo"));
}

function mDispositivo(){
    $sql="SELECT * FROM dispositivos where Maquina='{$_POST['maquina']}'";
    $r=ejecutaSQL($sql);
    if(mysqli_num_rows($r)==0){
      echo json_encode(array("s" => 0, "m" => "No se econtr&oacute; dispositivo."));
    }else{
        $sql = "UPDATE dispositivos SET Descripcion ='{$_POST['descripcion']}', Clave='{$_POST['clave']}', Maquina='{$_POST['maquina']}', ID_Espacio='{$_POST['idEsp']}' WHERE ID = '{$_POST['id_maquina']}' ";
        $r = updateSQL($sql);
        $sql = "SELECT ID FROM dispositivos WHERE Descripcion ='{$_POST['descripcion']}' AND Clave='{$_POST['clave']}' AND Maquina='{$_POST['maquina']}' AND ID ='{$_POST['id_maquina']}' ";
        $r = ejecutaSQL($sql);
        if (mysqli_num_rows($r) == 1){
            echo json_encode(array("s" => 1, "m" => "Dispositivo Actualizado"));
        } else{
            echo json_encode(array("s" => 0, "m" => "No se pudo Actualizar Dispositivo"));
        }
    }
}

function eDispositivo(){
    $sql = "SELECT Licencia FROM dispositivos WHERE ID={$_POST['idDisp']} AND Licencia = 1 AND Activo = 1";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1)
        echo json_encode(array("s" => 1, "m" => "El dispositivo tiene una licencia en uso, para desactivarlo es necesario desactivar la licencia."));
    else{
        $sql = "DELETE FROM dispositivos WHERE ID={$_POST['idDisp']}";
        $r = ejecutaSQL($sql);
        if ($r == 1)
            echo json_encode(array("s" => 1, "m" => "Dispositivo elimindado con &eacute;xito"));
        else
            echo json_encode(array("s" => 0, "m" => "No se elimin&oacute; el dispositivo"));
    }
}

function rDispositivo()
{
    $sql = "UPDATE dispositivos SET Licencia = 0  WHERE ID={$_POST['idDisp']}";
    $r = updateSQL($sql);
    if ($r == 1)
        echo json_encode(array("s" => 1, "m" => "Licencia reiniciada con &eacute;xito"));
    else
        echo json_encode(array("s" => 0, "m" => "No se reinicio la licencia el dispositivo"));
}

function setImpacto(){
    $s=0;
    $ns=0;
    foreach ($_POST['select'] as $value){
        $sql="SELECT * FROM checador_publicidad WHERE ID_Publicidad='$value' and ID_Tipo_Publicidad='2' and ID_Dispositivo='{$_POST['id_maquina']}'";
        $r=ejecutaSQL($sql);
        if(mysqli_num_rows($r)==0){
            $sql="INSERT INTO  checador_publicidad (ID_Publicidad, ID_Tipo_Publicidad, ID_Dispositivo, Activo) VALUES  ('$value', '2', {$_POST['id_maquina']}, '1')";
            insertaSQL($sql);
        } else {
            $row=mysqli_fetch_array($r);
                if($row['Activo']=="0") {
                    $sql = "UPDATE checador_publicidad SET Activo='1' WHERE checador_publicidad.ID_Dispositivo='{$_POST['id_maquina']}' and checador_publicidad.ID_Tipo_Publicidad='2' and checador_publicidad.ID_Publicidad= '$value'";
                    updateSQL($sql);
                    $s++;
                }
        }

    }
    foreach ($_POST['noSelect'] as $value){
        $sql="SELECT * FROM checador_publicidad WHERE ID_Publicidad='$value' and ID_Tipo_Publicidad='2' and ID_Dispositivo='{$_POST['id_maquina']}'";
        $r=ejecutaSQL($sql);
        if(mysqli_num_rows($r)==0){
            $sql="INSERT INTO checador_publicidad (ID_Publicidad, ID_Tipo_Publicidad, ID_Dispositivo, Activo) VALUES  ('$value', '2', '{$_POST['id_maquina']}', '0')";
            insertaSQL($sql);
        }
        else {
            $row=mysqli_fetch_array($r);
             if($row['Activo']=="1"){
                 $sql = "UPDATE checador_publicidad SET Activo='0' WHERE checador_publicidad.ID_Dispositivo='{$_POST['id_maquina']}' and checador_publicidad.ID_Tipo_Publicidad='2' and checador_publicidad.ID_Publicidad= '$value'";
                 updateSQL($sql);
                 $ns++;
             }
        }
    }
    if(($ns+$s)==(count($_POST['select'])+count($_POST['noSelect']))){
        echo json_encode(array("s" => 1, "m" =>"Publicidad de impacto directo actualizada correctamente"));
    }else{
        echo json_encode(array("s" => 0, "m" =>"No se pudo actualizar publicidad de impacto directo"));
    }
}

function setCarrusel(){
    $s=0;
    $ns=0;
    foreach ($_POST['select'] as $value){
        $sql="SELECT * FROM checador_publicidad WHERE ID_Publicidad='$value' and ID_Tipo_Publicidad='1' and ID_Dispositivo='{$_POST['id_maquina']}'";
        $r=ejecutaSQL($sql);
        if(mysqli_num_rows($r)==0){
            $sql="INSERT INTO  checador_publicidad (ID_Publicidad, ID_Tipo_Publicidad, ID_Dispositivo, Activo) VALUES  ('$value', '1', {$_POST['id_maquina']}, '1')";
            insertaSQL($sql);
        } else {
            $row=mysqli_fetch_array($r);
            if($row['Activo']=="0") {
                $sql = "UPDATE checador_publicidad SET Activo='1' WHERE checador_publicidad.ID_Dispositivo='{$_POST['id_maquina']}' and checador_publicidad.ID_Tipo_Publicidad='1' and checador_publicidad.ID_Publicidad= '$value'";
                updateSQL($sql);
                $s++;
            }
        }

    }
    foreach ($_POST['noSelect'] as $value){
        $sql="SELECT * FROM checador_publicidad WHERE ID_Publicidad='$value' and ID_Tipo_Publicidad='1' and ID_Dispositivo='{$_POST['id_maquina']}'";
        $r=ejecutaSQL($sql);
        if(mysqli_num_rows($r)==0){
            $sql="INSERT INTO checador_publicidad (ID_Publicidad, ID_Tipo_Publicidad, ID_Dispositivo, Activo) VALUES  ('$value', '1', '{$_POST['id_maquina']}', '0')";
            insertaSQL($sql);
        }
        else {
            $row=mysqli_fetch_array($r);
            if($row['Activo']=="1"){
                $sql = "UPDATE checador_publicidad SET Activo='0' WHERE checador_publicidad.ID_Dispositivo='{$_POST['id_maquina']}' and checador_publicidad.ID_Tipo_Publicidad='1' and checador_publicidad.ID_Publicidad= '$value'";
                updateSQL($sql);
                $ns++;
            }
        }
    }
    if(($ns+$s)==(count($_POST['select'])+count($_POST['noSelect']))){
        echo json_encode(array("s" => 1, "m" =>"Publicidad de carrusel actualizada correctamente"));
    }else{
        echo json_encode(array("s" => 0, "m" =>"No se pudo actualizar publicidad de carrusel"));
    }
}


function aAdmin(){
    $sql = " SELECT NSS, Activo, ID FROM personas WHERE NSS = '{$_POST['nss']}' ";
    $r = ejecutaSQL($sql);
    if (mysqli_num_rows($r) == 1){
        $sql = " UPDATE personas SET Activo = 1  WHERE NSS = '{$_POST['nss']}' ";
        $rs = updateSQL($sql);
        if ($rs == 1 || mysql_result($r,0,'Activo') == 1){
            $sql = " SELECT * FROM administradores WHERE ID_Persona = ".mysql_result($r,0,'ID');
            if(mysqli_num_rows(ejecutaSQL($sql)) != 0){
                if($_POST['pss'] != "")
                    $sql = " INSERT INTO administradores (Username, Password, ID_Persona, Acceso) VALUES ('{$_POST["usuario"]}', '{$_POST["pss"]}', {$id} ,'".pAccesos($_POST['accesos'],true)."') ";
                else
                    $sql = " INSERT INTO administradores (Username, Password, ID_Persona, Acceso) VALUES ('{$_POST["usuario"]}', '{$_POST["nss"]}', {$id} ,'".pAccesos($_POST['accesos'],true)."') ";
                $ida = insertaSQL($sql);
                if($ida != 0)
                    echo json_encode(array("s" => 1, "m" => "Persona activada y a&ntilde;adida con &eacute;xito", "d" => array("idp" => mysql_result($r,0,'ID'), "ida" => $ida)));
                else
                    echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar la persona"));
            }else{
                echo json_encode(array("s"=> 0, "m"=> "Esta persona ya es administrador"));
            }
        }
    }else {
        //Agrega a la persona a la tabla personas
        $nom = strtoupper(trim(utf8_decode($_POST["nombre"])));
        $ap = strtoupper(trim(utf8_decode($_POST["apaterno"])));
        $am = strtoupper(trim(utf8_decode($_POST["amaterno"])));
        $sql = "INSERT INTO personas (NSS,Titulo, Nombre, ApellidoP, ApellidoM, Email, Celular, Telefono, Detalle )
                  VALUES ('{$_POST["nss"]}', '{$_POST["titulo"]}', '$nom', '$ap', '$am', '{$_POST["email"]}',
            '{$_POST["movil"]}', '{$_POST["fijo"]}', '{$_POST["detalle"]}') ";
        $id = insertaSQL($sql);
        //Agrega los identificadores a la tabla identificador
        if($id != 0){
            $id1 = (isset($_POST["id1"])) ? $_POST["id1"] : $_POST["nss"];
            $id2 = (isset($_POST["id2"])) ? $_POST["id2"] : "";
            $id3 = (isset($_POST["id3"])) ? $_POST["id3"] : "";

            $sql = " INSERT INTO identificador VALUES ({$id}, '$id1', '$id2', '$id3' ) ";
            insertaSQL($sql);
            //Agrega el rol de la persona a la tabla asignacion_roles
            if (isset($_POST["idr"]) AND $_POST["idr"] == "") {
                $sql = " INSERT INTO asignacion_roles VALUES ('1', {$id}) ";
            } else {
                $sql = " INSERT INTO asignacion_roles VALUES ('{$_POST["idr"]}', {$id}) ";
            }
            insertaSQL($sql);
            if($_POST['pss'] != "")
                $sql = " INSERT INTO administradores (Username, Password, ID_Persona,Acceso) VALUES ('{$_POST["usuario"]}', '{$_POST["pss"]}', {$id} ,'".pAccesos($_POST['accesos'],true)."') ";
            else
                $sql = " INSERT INTO administradores (Username, Password, ID_Persona,Acceso) VALUES ('{$_POST["usuario"]}', '{$_POST["nss"]}', {$id} ,'".pAccesos($_POST['accesos'],true)."') ";
            $ida = insertaSQL($sql);
            if($ida != 0)
                echo json_encode(array("s" => 1, "m" => "Persona a&ntilde;adida con &eacute;xito", "d" => array("idp" => $id, "ida" => $ida)));
            else
                echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar al administrador"));
        }else
            echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar a la persona"));
    }
}

function dAdmin(){
    $msg="";
    if (isset($_POST['mode']) && $_POST['mode']=='all') {
        $sql = " UPDATE personas SET Activo = 0  WHERE ID = '{$_POST['idp']}' ";
        $r = updateSQL($sql);
        if($r!=0) $msg = "Persona y ";
    }
    $sql = " DELETE FROM administradores  WHERE ID = '{$_POST['ida']}' ";
    $r = ejecutaSQL($sql);
    if ($r){
        echo json_encode(array("s" => 1, "m" => $msg . "Administrador elimindado con exito"));
    }else{
        echo json_encode(array("s" => 0, "m" => "No se elimino al administrador"));
    }
}

function mAdmin(){
    $values = "";
    $mensaje = "";
    $persona = $_POST['idp'];
    //Crea la sentencia SQL para modificar la tabla de personas
    if (isset($_POST["titulo"])) {
        $temp = trim(utf8_decode($_POST["titulo"]));
        $values .= " Titulo = '$temp', ";
    }
    if (isset($_POST["nombre"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["nombre"])));
        $values .= " Nombre = '$temp', ";
    }
    if (isset($_POST["apaterno"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["apaterno"])));
        $values .= " ApellidoP = '$temp', ";
    }
    if (isset($_POST["amaterno"])) {
        $temp = strtoupper(trim(utf8_decode($_POST["amaterno"])));
        $values .= " ApellidoM = '$temp', ";
    }
    if (isset($_POST["email"])) {
        $temp = trim(utf8_decode($_POST["email"]));
        $values .= " Email = '$temp', ";
    }
    if (isset($_POST["movil"])) {
        $temp = trim(utf8_decode($_POST["movil"]));
        $values .= " Celular = '$temp', ";
    }
    if (isset($_POST["fijo"])) {
        $temp = trim(utf8_decode($_POST["fijo"]));
        $values .= " Telefono = '$temp', ";
    }
    if (isset($_POST["detalle"])) {
        $temp = trim(utf8_decode($_POST["detalle"]));
        $values .= " Detalle = '$temp', ";
    }
    if (isset($_POST["nss"])) {
        $temp = trim(utf8_decode($_POST["nss"]));
        $values .= " NSS = '$temp' ";
    }
    //$values = utf8_decode($values);
    $sql = " UPDATE personas SET $values WHERE ID = $persona ";
    //Creacion del mensaje para la modificaci�n de la persona
    if (updateSQL($sql) == 1)
        $mensaje .= "Persona actualizada";
    else
        $mensaje .= "Persona no actualizada";

    //Modificar tabla identificador
    if (isset($_POST["id1"])) {
        $temp = trim(utf8_decode($_POST["id1"]));
        $values = " ID1 = '$temp', ";
    }
    if (isset($_POST["id2"])) {
        $temp = trim(utf8_decode($_POST["id2"]));
        $values .= " ID2 = '$temp', ";
    }
    if (isset($_POST["id3"])) {
        $temp = trim(utf8_decode($_POST["id3"]));
        $values .= " BioID = '$temp' ";
    }
    $sql = " UPDATE identificador SET $values WHERE ID_Persona = $persona ";
    //Creacion del mensaje para la modificaci�n de los identificadores
    if (updateSQL($sql) == 1)
        $mensaje .= ", identificadores actualizados";
    else
        $mensaje .= " , identificadores no actualizados";

    //Modificaci�n de la tabla rol
    if (isset($_POST["idr"])) {
        if ($_POST["idr"] != "") {
            $sql = " UPDATE asignacion_roles SET ID_Rol = '{$_POST["idr"]}' WHERE ID_Persona = $persona ";
        } else
            $sql = " UPDATE asignacion_roles SET ID_Rol = '1' WHERE ID_Persona = $persona ";
    }

    //Creacion del mensaje para la modificaci�n del rol
    if (updateSQL($sql) == 1)
        $mensaje .= ", rol actualizado";
    else
        $mensaje .= ", rol no actualizado";

    //Modificar tabla administradores
    if (isset($_POST["usuario"])) {
        $temp = trim(utf8_decode($_POST["user"]));
        $values = " Username = '$temp', ";
    }
    if (isset($_POST["pss"])) {
        $temp = trim(utf8_decode($_POST["pss"]));
        $values .= " Password = '$temp', ";
    }
    if (isset($_POST["accesos"])) {
        $temp = pAccesos($_POST["accesos"],true);
        $values .= " Acceso = '$temp' ";
    }
    $sql = "UPDATE administradores SET $values WHERE ID_Persona = $persona ";
    if (updateSQL($sql) == 1) {
        $mensaje .= ", cuenta de administrador actualizada";
    }else
        $mensaje .= ", cuenta de administrador no actualizada";

    echo json_encode(array("s" => 1, "m" => $mensaje));
}

function GetAdmins(){
    $ad_ID = (isset($_POST['id'])) ? $_POST['id'] : "ad.ID_Persona";
    $sql = " SELECT pe.*, ID_Rol, ID1, ID2, BioID, ad.ID AS IdAdmin, ad.Username, ad.Password, ad.Acceso FROM personas AS pe
                LEFT JOIN identificador AS ide ON pe.ID = ide.ID_Persona
                LEFT JOIN asignacion_roles AS ar ON pe.ID = ar.ID_Persona
                LEFT JOIN administradores AS ad ON pe.ID = ad.ID_Persona
                WHERE pe.ID = ".$ad_ID." AND pe.Activo = 1 ";
    if($r = ejecutaSQL($sql)){
        while ($row = mysqli_fetch_array($r)) {
            $row = array_map('utf8_encode', $row);
            $row = array_map('trim', $row);
            $j1[] = array("id" => $row['ID'],"Accesos" => pAccesos($row['Acceso'],false), "titulo" => $row['Titulo'], "nombre" => $row['Nombre'], "ap" => $row['ApellidoP'], "am" => $row['ApellidoM'], "email" => $row['Email'], "cel" => $row['Celular'], "tel" => $row['Telefono'], "detalle" => $row['Detalle'], "nss" => $row['NSS'], "rol" => $row['ID_Rol'], "id1" => $row['ID1'], "id2" => $row['ID2'], "id3" => $row['BioID'], "ida" => $row['IdAdmin'], "user" => $row['Username'], "pass" => $row['Password']);
        }
        $j2 = array("s" => 1, "m" => "Busqueda de administradores correcta", "d" => array("admins" => $j1));
        echo json_encode($j2);
    }else{
        echo json_encode(array("s" => 0, "m" => "No se encontro ningun administrador"));
    }
}

function ConsultAccess(){
    global $MY_SESSION_ACCESS;
    if (isset($_POST['id'])) {
        if (isset($_POST['menu'])) {
            if (isset($_POST['accion'])) {
                if(isset($_SESSION[$MY_SESSION_ACCESS])){
                    $Acs = pAccesos($_POST['id'],false);
                    echo json_encode(array(
                                           "s" => ($Acs[$_POST['menu']][$_POST['accion']]) ? 1 : 0,
                                           "m" => "Acceso encontrado",
                                           "d"=>  $Acs[$_POST['menu']][$_POST['accion']]
                                           )
                                         );
                }else{
                    echo json_encode(array("s" => 0, "m" => "Sesion caducada, inicia sesion de nuevo"));
                }
            }else{
                echo json_encode(array("s" => 0, "m" => "Accion no especificada"));
            }
        }else{
            echo json_encode(array("s" => 0, "m" => "Menu no especificado"));
        }
    }else{
        echo json_encode(array("s" => 0, "m" => "Administrador no especificado."));
    }
}

function pAccesos($data,$dataInJson){
    global $menuDashboard;
    $sql = " SELECT Acceso FROM administradores
             WHERE id = '$data'";
    $r = ejecutaSQL($sql);
    $info = array();
    if (mysqli_num_rows($r) == 1)
    {
        $row = mysqli_fetch_array($r);
        $row = array_map('utf8_encode', $row);
        $access = $row['Acceso'];
        if($dataInJson){
            $access = json_decode($data, true);
            $acceso = "";
            foreach ($menuDashboard as $menu) {
                $tmp = 0;
                if($data[$menu]["leer"])
                    $tmp+=1;
                if($data[$menu]["esc"])
                    $tmp+=2;
                if($data[$menu]["mod"])
                    $tmp+=3;
                if($data[$menu]["del"])
                    $tmp+=1;
                $acceso.= strval($tmp);
            }
            return $acceso;
        }else{
            $accesos = array();
            // var_dump($_SESSION[$MY_SESSION_ACCESS]);
            for ($i=0; $i < count($menuDashboard); $i++) {
                $menuAccess = array('leer' => false,
                                    'esc' => false,
                                    'mod' => false,
                                    'del' => false);
                if(intval($access[$i]) > 0){
                    $menuAccess['leer'] = true;
                  //  if (in_array(intval($data[$i]), array(4,6,7)))
                        $menuAccess['esc'] = true;
                  //  if (in_array(intval($data[$i]), array(3,6,7)))
                        $menuAccess['mod'] = true;
                  //  if (in_array(intval($data[$i]), array(2,7)))
                        $menuAccess['del'] = true;
                }
                $accesos[$menuDashboard[$i]] = $menuAccess;
            }
            return $accesos;
        }
    }
    return array();

}


function noticias()
{
    $sql = "SELECT * FROM notificaciones";
    $noticias = [];
    $i = 0;
    if($r = ejecutaSQL($sql))
    {
        while ($row = mysqli_fetch_array($r))
        {
            $noticias[$i] = $row;
            $i++;
        }
        echo json_encode(array("s" => 1, "m" => "Noticias encontradas satisfactoriamente", "d" => $noticias));
    }
    else {
        echo json_encode(array("s" => 0, "m" => "Error al buscar las noticias"));
    }
}

function eNoticia($id)
{
    $sql = " DELETE FROM notificaciones WHERE id = '$id'";
    if (updateSQL($sql) == 0)
        echo json_encode(array("s" => 0, "m" => "la noticia no pudo ser eliminada"));
    else
        echo json_encode(array("s" => 1, "m" => "Noticia eliminada con exito"));
}

function aPiscina($temp)
{
  $sql = "INSERT INTO temperatura_piscina (temperatura) VALUES ('$temp') ";
  if(insertaSQL($sql))
      echo json_encode(array("s" => 1, "m" => "temperatura añadida con exito"));
  else
      echo json_encode(array("s"=> 0, "m"=> "No se pudo agregar la Temperatura"));
}

function piscinas()
{
  $sql = "SELECT * FROM temperatura_piscina";
  $piscinas = [];
  $i = 0;
  if($r = ejecutaSQL($sql))
  {
      while ($row = mysqli_fetch_array($r))
      {
          $piscinas[$i] = $row;
          $i++;
      }
      echo json_encode(array("s" => 1, "m" => "registros de temperatura encontrados satisfactoriamente", "d" => $piscinas));
  }
  else {
      echo json_encode(array("s" => 0, "m" => "Error al buscar los registros"));
  }
}

function piscinaActual()
{
  $sql = "SELECT * FROM temperatura_piscina order by id DESC LIMIT 1";

  $i = 0;
  if($r = ejecutaSQL($sql))
  {
      $row = mysqli_fetch_array($r);
      $piscina = $row;
      echo json_encode(array("s" => 1, "m" => "registros de temperatura encontrados satisfactoriamente", "d" => $piscina));
  }
  else {
      echo json_encode(array("s" => 0, "m" => "Error al buscar los registros"));
  }
}


function ePiscina($id)
{
  $sql = " DELETE FROM temperatura_piscina WHERE id = '$id'";
  if (updateSQL($sql) == 0)
      echo json_encode(array("s" => 0, "m" => "el registro no pudo ser eliminada"));
  else
      echo json_encode(array("s" => 1, "m" => "registro eliminado con exito"));
}
