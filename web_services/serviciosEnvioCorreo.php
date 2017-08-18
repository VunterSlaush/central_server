<?php
session_start();
include("conf.php");
include("libMail/class.phpmailer.php");
include("libMail/class.smtp.php");
include("sqlUtilery.php");
ini_set('max_execution_time', 0);
header("Content-Type: application/json; charset=utf-8");
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Headers: http://localhost, X-Requested-With, Content-Type, Accept');

global $servidor;
global $base;
global $usuarioBD;
global $pass;
global $MY_SESSION_ADMIN;
$DIR_SAVE_CARTAS = "/var/www/html/toSendMail/$base/";
$SERVER_SMTP = "smtp.1and1.mx";
$USUARIO_SMTP = "sich-notificaciones@jalisoft.com";
$CLAVE_SMTP = "SICHnoti2016";
$PUERTO_SMTP = "587";
$EMAIL_HOST = "sich-notificaciones@jalisoft.com";    
$DOMAIN_NAME = "http://checador.co/";
$LOGO_ESCUELA = "http://".$_SERVER['SERVER_NAME']."/checador/img/base/logo_carta.png";
$NOMBRE_RESP = "Mtro. Miguel Victoria Espina";
$PUESTO_RESP = "Rector Campus Guadalajara Sur";

$meses = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
$tipoDictamenColor = array('R' => '<span style="color:#A00000">RETARDO</span>', 'F' => '<span style="color:red">FALTA</span>', 'AB' => '<span style="color:orange">ABANDONO</span>', 'AU' => '<span style="color:#600000">AUSENCIA</span>', 'A' => '<span style="color:green">ASISTENCIA</span>');

# ----------------------------------------------------------------------
# Parametros validos para iniciar el manejo de cartas.
#       serviciosEnvioCorreo.php?
#           servicio = cronMail &
#           fecha = 2015-02-24 &
#           forma = save &
#           enviarReporte = true &
#           correos = [correos separados por ";" ] &
#           exclusion = [mysql query]
#
#_______________________________________________________________________

//Verifica si existe una sesión, para poder acceder a los servicios.
if (!isset($_SESSION[$MY_SESSION_ADMIN])) {
    if (isset($_GET['servicio']) && $_GET['servicio'] == "cronMail") {
        //Validación de que exista una fecha en el arametro $_GET['fecha']
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

                    # Si se va a trabajr como envio de mail
                    if ($_GET['forma'] == "mail") {
                        # Verificar que exista la variable grupo en la URL
                        if (isset($_GET['grupos'])) {
                            $grupos = explode(",", $_GET['grupos']);
                            $grupos = array_map("trim", $grupos);
                            workAsMail($_GET['fecha'], $grupos);
                        } # FIN Verificar que exista la variable grupo en la URL
                        else {
                            echo json_encode(array("s" => 0, "m" => "No ingresó grupos para trabajar"));
                        }
                    } # Si se va a trabajar como guardar correos
                    elseif ($_GET['forma'] == "save") {
                        # Verificar que exista una la variable "enviarReporte" en la URL y si enviarReportes es igual a "true" buscar los correos a los que se va a enviar
                        if (isset($_GET['enviarReporte']) && $_GET['enviarReporte'] == "true") {
                            # Verificar que existan correos
                            if (isset($_GET['correos']) && $_GET['correos'] != "") {
                                $mails = explode(";", $_GET['correos']);
                                $mails = array_map("trim", $mails);
                                workAsSave($_GET['fecha'], true, $mails);
                            } else {
                                workAsSave($_GET['fecha'], false, false);
                            }
                        } # Si no se encuentra la variable enviar forma, so toma como si fuera "false"
                        else {
                            workAsSave($_GET['fecha'], false, false);
                        }
                    } # Si la forma a trabajar es diferente a "save" o "mail"
                    else {
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
        case "enviarCorreosDia":
            break;
        case "savePlantilla":
            break;
        case "saveSmtpConfig":
            //$server, $user, $pass, $port, $host
            if (isset($_POST["servidor"]) && isset($_POST["usuario"]) && isset($_POST["pass"]) && isset($_POST["puerto"]) && isset($_POST["host"]) && isset($_POST["security"]))
                saveMailConfig($_POST["servidor"], $_POST["usuario"], $_POST["pass"], $_POST["puerto"], $_POST["host"], $_POST["security"]);
            else
                echo json_encode(array("s" => 0, "m" => "Faltan campos por enviar"));
            break;
        case "getSmtpConfig":
            getMailConfig();
            break;
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}

/**
 * @param $fecha
 * @param $grupos
 */
function workAsMail($fecha, $grupos)
{
    echo json_encode(array("s" => 1, "m" => "workAsMail | $fecha | " . implode(",", $grupos)));
    /*if ($correo != "") {
            $asunto = "";
            if ($tipo == "unico") {
                $date = strtotime($fecha);
                $date = date('d', $date) . " de " . $meses[date('n', $date)] . " de " . date('o', $date);
                $asunto = "[ " . $tipoDictamen[$data[0]['dictamen']] . " ] " . substr($data[0]['titulo'], 0, 25) . " " . $date;
            } elseif ($tipo == "grupo") {
                $tempDictamen = "";
                foreach ($data as $dictamen)
                    $tempDictamen .= $tipoDictamen[$dictamen['dictamen']] . " ";
                $asunto = str_replace(" ", " - ", trim($tempDictamen));
            }
            $envio = sendCorreo($correo, $asunto, $body);
            //$envio = sendCorreo("angelivan58@gmail.com rico.josue0@gmail.com", $asunto, $body);
            if ($envio['s'] == 1)
                return array("persona" => $nss, "s" => 1, "m" => "Carta enviada por correo");
            else
                return array("persona" => $nss, "s" => 0, "m" => "No se pudo enviar la carta por correo, " . $envio['m']);
        } else
            return array("persona" => $nss, "s" => 0, "m" => "Correo no enviado, falta dirección de correo");
     */
}

/**
 * @param $fecha
 * @param $enviarReporte
 * @param $correos
 */
function workAsSave($fecha, $enviarReporte, $correos)
{
    # Flujo cuando se guardan las cartas.
    # 1 - Eliminar la carpeta que contiene las cartas para el día seleccionado.
    # 2 - Obtener la información para generar las cartas enviando la fecha y filtro.
    # 3 - Por cada elemento del punto 2:
    # 3.1 - Crear cuerpo de la carta
    # 3.2 - Guardar la carta
    # 3.3 - Crear los elementos para el log
    # 4 - Guardar el cuerpo de la carta
    # 5 - Si la variable "enviarReporte" es igual a "true" se genera el cuerpo de la carta y se envia a cada correo;
    global $tipoDictamenColor;
    global $meses;
    global $base; 
    global $DIR_SAVE_CARTAS;
    global $SERVER_SMTP;
    global $USUARIO_SMTP; 
    global $CLAVE_SMTP;
    global $PUERTO_SMTP;
    global $EMAIL_HOST;     
    global $DOMAIN_NAME;

    //Paso 1
    delete_files($DIR_SAVE_CARTAS."/$fecha");
    //Paso 2
    if (isset($_GET['exclusion'])) {
        $exclusion = " AND nivel <> 'AD' " . $_GET['exclusion'];
    } else {
        $exclusion = " AND nivel <> 'AD' ";
    }

    $data = getDataToProccess($fecha, $exclusion);  
    if ($data['s'] == 1) {
        $cnt = $data['d'][1];
        $data = $data['d'][0];             
        $log = array();

        $header = '<table style="font-family: sans-serif;border-collapse: collapse;" align="center"><thead><tr>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">CRN</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Nombre</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Materia/s</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Nivel</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Dictamen/es</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Correo</p></th>'.
        '<th style="border: 4px solid #444866;color: #444866; font-weight: bold; background-color: #ffae3d;">'.
            '<p style="margin: 10px;">Link</p></th>'.
        '</tr></thead>';
        $tablas = array();
        $grp_keys = array_keys($data['grupos']);
        for ($i=0; $i < count($grp_keys); $i++){
            $tablas[$grp_keys[$i]]=$header;
        }        
        for ($i=0; $i < count($grp_keys); $i++) { 
            $infoPersonas = $data['grupos'][$grp_keys[$i]]["personas"];
            if (count($infoPersonas) == 0) {
                $tablas[$grp_keys[$i]] .= '<tr><td colspan="7" style="text-align: center; color: #444866; border: 4px solid #444866; font-weight: normal; background-color: white;">No existen registros</td></tr>';
            } else {
                foreach ($data['grupos'][$grp_keys[$i]]["personas"] as $carta) {                
#echo "<br>";
#var_dump($carta);
#echo "<br>";
                    $datos = $carta['info'];
                    $tipo = $carta['tipo'];
                    //Paso 3.1
                    $body = createBody($tipo, $carta['info']);
                    //Paso 3.2
                    $estado = saveMail($datos['nss'], $fecha, $tipo, $body);
                    if ($estado['s'] == 1) {
                        array_push($log, array("Carta" => "{$datos['nss']} Carta guardada"));
                        //Paso 3.3
                        if ($tipo=='grupo') {
                            $fila = '<tr><td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $datos[0]['nss'] . '</td><td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $datos[0]['nombre'] . '</td>';                            
                            $dictamen=$nivel=$materia='';
                            $materia .= $datos[0]['titulo']." - ";
                            foreach ($datos as $letter) {
                                $dictamen .= $tipoDictamenColor[$letter['dictamen']] . " - ";
                                $nivel .= $letter['nivel']. " - ";                                    
                            }
                            $materia .= rtrim($materia, " - ");                                
                            $dictamen = rtrim($dictamen, " - ");
                            $nivel = rtrim($nivel, " - ");
                            $link = $DOMAIN_NAME."/".$estado['d'];
                            $fila .= ''.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$materia.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$nivel.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$dictamen.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $carta['info'][0]['email']. '</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.
                            '<a href="'.$link.'"><button type="button" style="cursor: pointer;cursor:pointer; margin:3px; border: 0; color: #444866; background-color: #ffce61;">Carta</button></a></td></tr>';                                                        
                        }else{
                            $fila = '<tr><td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $datos['nss'] . '</td><td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $datos['nombre'] . '</td>';
                            $materia = $carta['info']['titulo'];
                            $dictamen = $tipoDictamenColor[$carta['info']['dictamen']] . " - ";
                            $nivel = $carta['info']['nivel'];

                            $materia = rtrim($materia, " - ");
                            $dictamen = rtrim($dictamen, " - ");
                            $nivel = rtrim($nivel, " - ");
                            $link = $DOMAIN_NAME."/".$estado['d'];
                            $fila .= ''.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$materia.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$nivel.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.$dictamen.'</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">' . $carta['info']['email']. '</td>'.
                            '<td style="border: 4px solid #444866; color: #444866; font-weight: normal; background-color: white; text-align: center;">'.
                            '<a href="'.$link.'"><button type="button" style="cursor: pointer;cursor:pointer; margin:3px; border: 0; color: #444866; background-color: #ffce61;">Carta</button></a></td></tr>';                            
                        }
                        $tablas[$grp_keys[$i]] .= $fila;
                    } else {
                        array_push($log, array("Carta" => "{$datos['nss']} : {$estado['d']}"));
                    }
                }
            }
        }

        $totales=array();
        $totalEstado = 0;
        $cnt_keys=array_keys($cnt);
        for ($i=0; $i < count($cnt_keys); $i++) { 
            $grupo = $cnt[$cnt_keys[$i]];
            $totales[$cnt_keys[$i]] = ($grupo['AB'] + $grupo['AU'] + $grupo['F'] + $grupo['R'] + $grupo['G']);
            $totalEstado += $totales[$cnt_keys[$i]];
        }
        
        $tablaEstado = ''.
            '<table style="text-align: center; border: 4px solid #444866; font-family: sans-serif; border-collapse: collapse; color: #444866;" align="center">'.
            '<tr>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;"></p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Abandono</p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Ausencia</p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Falta</p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Retardo</p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Bloque</p></th>'.
                '<th style="border: 4px solid #444866; font-weight: bold; background-color: #ffae3d;"><p style="margin:3px;">Total</p></th>'.
            '</tr>';           

        for ($i=0; $i < count($cnt_keys); $i++) { 
            $group = $cnt[$cnt_keys[$i]];            
            $niv = $data['grupos'][$cnt_keys[$i]]['niveles'];
            $name="";
            for ($j=0; $j < count($niv); $j++)   {
                $name.=$niv[$j].", ";
            }        
            $name = rtrim($name, ", ");  
            $tablaEstado .= ''.
            '<tr>'.
                '<td style="border: 4px solid #444866; background-color: #ffce61;"><b style="font-weight: bold;">'.$name.'</b></td>'.
                '<td style="border: 4px solid #444866;">' . $group['AB'] . '</td>'.
                '<td style="border: 4px solid #444866;">' . $group['AU'] . '</td>'.
                '<td style="border: 4px solid #444866;">' . $group['F'] . '</td>'.
                '<td style="border: 4px solid #444866;">' . $group['R'] . '</td>'.
                '<td style="border: 4px solid #444866;">' . $group['G'] . '</td>'.
                '<td style="border: 4px solid #444866;">' . $totales[$cnt_keys[$i]] . '</td>'.
            '</tr>';
        }

        $tablaEstado .= ''. 
            '<tr style="font-weight: bold; border: 4px solid #444866; background-color: #ffce61;">'.
                '<td colspan="6" style="font-size: 30px; text-align: right; background-color: #34bceb;"><b style="font-weight: bold; margin-right: 20px;">TOTAL</b></td>'.
                '<td>' . $totalEstado . '</td>'.
            '</tr></table>';

        $date = strtotime($fecha);
        $mailBody = '<meta charset="utf-8">' .
        '<h1 style="text-align: center; color: #444866;">SICH - Dictamen ' . date('d', $date) . " de " . $meses[date('n', $date)] . " de " . date('o', $date) . '</h1>' . $tablaEstado;
        
        $tabla_keys = array_keys($tablas);
        for ($i=0; $i < count($tabla_keys); $i++){
            $grupo = $tabla_keys[$i];
            $mailBody.='<h1 style="color: #444866;">'.$data['grupos'][$grupo]["titulo"].'</h1><br>' . $tablas[$grupo] .= '</table><br><hr>';
        }
                

        //Paso 4        
        if (!file_exists("/var/www/html/toSendMail/$base/$fecha/")) {
            mkdir("/var/www/html/toSendMail/$base/$fecha/", 0777, true);
        }
        if ($myfile = fopen("/var/www/html/toSendMail/$base/$fecha/reporte.html", "w+")) {
            fwrite($myfile, $mailBody);
            fclose($myfile);
            array_push($log, array("Reporte" => "Reporte guardado junto con cartas"));
        } else {
            array_push($log, array("Reporte" => "Error al guardar reporte"));
        }

        //Paso 5
        if ($enviarReporte) {
            //TODO: Configuración de SMTP y elementos del correo.    
            $mailConfig = array("serverSMTP" => $SERVER_SMTP, "usuarioSMTP" => $USUARIO_SMTP, "claveSMTP" => $CLAVE_SMTP, "puertoSMTP" => $PUERTO_SMTP, "emailHost" => $EMAIL_HOST, "security" => "tls");
            $mailSubjetct = 'Reporte de envío de correos para el día ' . $fecha;
            $mailAlias = "Reporte Dictaminador";
            $mailStatus = sendMail($mailConfig, $correos, $mailAlias, $mailSubjetct, $mailBody);
            // echo "\n\n" . $mailBody . "\n";
            if ($mailStatus['s'] == 1) {
                array_push($log, array("Reporte-mail" => "Reporte enviado por correo"));
            } else {
                array_push($log, array("Reporte-mail" => $mailStatus['m']));
            }

        } else {
            echo json_encode(array("s" => 1, "m" => "Cartas guardadas, no se envió en correo"));
        }
        echo json_encode(array("s" => 1, "m" => $log));
    } else {
        echo json_encode($data);
    }
}

/**
 * Hace muchas cosas
 * @param string $fecha Fecha en formato gringo
 * @param $restricciones
 * @return array Muy grande
 */
function getDataToProccess($fecha, $restricciones)
{
    $contadorGrupo = array("AB" => 0, "AU" => 0, "F" => 0, "R" => 0, "G" => 0);
    $contadores = array();
    $data = array("grupos"=>array());
    if (isset($_GET['grupos'])) {
        $nGrupos=$_GET['grupos'];
        for ($i=1; $i <= $nGrupos; $i++) { 
            if (isset($_GET['grupo'.$i])) {
                $g = explode(',',explode(";",$_GET['grupo'.$i])[0]);
                if (count($g)) {
                    $t = explode(";",$_GET['grupo'.$i])[1];
                    if(strlen($t)){
                        
                        $data["grupos"]["grupo".$i] = array();                     

                        $contadores['grupo'.$i] = $contadorGrupo;

                        $data["grupos"]["grupo".$i]["niveles"] = array();

                        foreach ($g as $level) {
                            array_push($data["grupos"]["grupo".$i]["niveles"],$level);
                        } 

                        $data["grupos"]["grupo".$i]["titulo"] = $t;

                        $data["grupos"]["grupo".$i]["personas"] = array();                     

                    }else{
                        return array("s" => 0, "m" => "El grupo ".$i." no tiene titulo.");//El grupo no tiene titulo.
                    }                                     
                }else{
                    return array("s" => 0, "m" => "El grupo ".$i." no tiene niveles.");//No hay niveles en el grupo.
                }                              
            }else{
                return array("s" => 0, "m" => "El grupo ".$i." no existe.");//No existe el grupo.
            }
        }//Fin del for de nGrupos.
    }else{
        return array("s" => 0, "m" => "No se definio la cantidad de grupos.");//No se definio el numero de grupos.
    }    
    $sql = "SELECT * FROM reportes WHERE fecha = '$fecha' $restricciones ORDER BY nss, horainicio ";
    if ($r = ejecutaSQL($sql)) {    
        if (mysqli_num_rows($r) == 0) {
            return array("s" => 0, "m" => "No hay dictamenes con estos parametros.");
        } else {
            // 1.- Despues de obtener tod@s los dictamenes, se genera una lista indexada por NSS
            $personas = array();
            while ($dictamen = mysqli_fetch_assoc($r)) {
                $dictamen = array_map('utf8_encode', $dictamen);
                $dictamen = array_map('trim', $dictamen);
                if (array_key_exists($dictamen['nss'], $personas)) {
                    $temp = array("dictamen" => $dictamen['dictamen'], "fecha" => $dictamen['fecha'], "hiR" => $dictamen['hiR'], "hfR" => $dictamen['hfR'],
                        "hiI" => $dictamen['horainicio'], "hfI" => $dictamen['horafin'], "titulo" => $dictamen['titulo'], "nivel" => $dictamen['nivel'],
                        "crn" => $dictamen['crn'], "nss" => $dictamen['nss'], "nombre" => $dictamen['nombre'], "email" => $dictamen['email']);
                    array_push($personas[$dictamen['nss']], $temp);
                } else {
                    $temp = array("dictamen" => $dictamen['dictamen'], "fecha" => $dictamen['fecha'], "hiR" => $dictamen['hiR'], "hfR" => $dictamen['hfR'],
                        "hiI" => $dictamen['horainicio'], "hfI" => $dictamen['horafin'], "titulo" => $dictamen['titulo'], "nivel" => $dictamen['nivel'],
                        "crn" => $dictamen['crn'], "nss" => $dictamen['nss'], "nombre" => $dictamen['nombre'], "email" => $dictamen['email']);
                    $personas["{$dictamen['nss']}"] = array($temp);
                }
            }                
            //2.- Por cada elemento de la lista 1, se generar los grupos por nivel.
            foreach ($personas as $key => $people) {
                global $espacioBloqueBach;       //Tiempo para generar bloques de asignaciones
                global $espacioBloqueLic;        //Tiempo para generar bloques de asignaciones
                global $espacioBloqueEjecPos;    //Tiempo para generar bloques de asignaciones

                $asig=array();
                $grupos_key=array_keys($data["grupos"]);
                for ($i=0; $i < count($grupos_key); $i++) { 
                    $asig["asig".$grupos_key[$i]] = array(); 
                }

                foreach ($people as $dictamenPersona) {
                    for ($i=0; $i < count($grupos_key); $i++) {
                        if (in_array($dictamenPersona['nivel'], $data["grupos"][$grupos_key[$i]]["niveles"])) {
                            array_push($asig["asig".$grupos_key[$i]], $dictamenPersona);
                        }
                    }
                }                      
                # -------------------------------------------------------------------------
                # Reglas para cada nivel:
                # -------------------------------------------------------------------------
                $ordered = array();
                $asigGK=array_keys($asig);
                for ($i=0; $i < count($asigGK); $i++) {
                    $asigGrupo = $asig[$asigGK[$i]];
                    if (count($asigGrupo) > 0) {
                        $group = substr($asigGK[$i],4);
                        $ordered[$group]=array();
                        foreach ($asigGrupo as $tempGrupo) {
                            if ($tempGrupo['nivel'] == "AD") {
                                if ( $tempGrupo['dictamen'] != "A"){
                                    $contadores[$group][$tempGrupo['dictamen']]++;
                                }
                                array_push($data["grupos"][$group]['personas'], array("tipo" => "unico", "info" => $tempGrupo));
                            }else{
                                array_push($ordered[$group], $tempGrupo);
                            }
                        }
                    }
                }

                if(count($ordered) > 0){
                    for ($i=0; $i < count($grupos_key); $i++){
                        $grupo = $grupos_key[$i];
                        $nivel = $ordered[$grupo];
                        while (count($nivel) > 0) {
                            if (count($nivel) == 1) {
                                if ($nivel[0]['dictamen'] != 'A'){
                                    $contadores[$grupo][$nivel[0]['dictamen']]++;
                                    array_push($data["grupos"][$grupo]['personas'], array("tipo" => "unico", "info" => $nivel[0]));
                                }                                        
                                array_shift($nivel);
                            } else {
                                $temporal = array();
                                $flagNoBlock = false;
                                $cRow = array_shift($nivel);
                                while (!$flagNoBlock) {
                                    if (!count($nivel) > 0) {
                                        array_push($temporal, $cRow);
                                        $flagNoBlock = true;
                                    } else {
                                        $tempTime = (strtotime($nivel[0]['hiI']) - strtotime($cRow['hfI'])) / 60;
                                        if ($tempTime <= $espacioBloqueBach) {
                                            array_push($temporal, $cRow);
                                            $cRow = array_shift($nivel);
                                        } else {
                                            array_push($temporal, $cRow);
                                            $flagNoBlock = true;
                                        }
                                    }
                                }
                                if (count($temporal) == 1) {
                                    if ($temporal[0]['dictamen'] != "A") {
                                        $contadores[$grupo][$temporal[0]['dictamen']]++;
                                        array_push($data["grupos"][$grupo]['personas'], array("tipo" => "unico", "info" => $temporal[0]));
                                    }
                                } else {
                                    $toSend = false;
                                    foreach ($temporal as $espDictamen) {
                                        if ($espDictamen['dictamen'] != "A") {
                                            $toSend = true;
                                            break;
                                        }
                                    }
                                    if ($toSend) {
                                        $contadores[$grupo]['G']++;
                                        array_push($data["grupos"][$grupo]['personas'], array("tipo" => "grupo", "info" => $temporal));
                                    }
                                }
                            }
                        }
                   
                    }
                }                                       
            }//Fin foreach personas
        }
        return array("s" => 1, "d" => array($data,$contadores));
    } else
        return array("s" => 0, "m" => "Error al buscar dictamenes");
}

/**
 * @param $tipo
 * @param $data
 * @return mixed|string
 */
function createBody($tipo, $data)
{
    global $tipoDictamenColor;
    global $meses;
    global $LOGO_ESCUELA;
    global $NOMBRE_RESP;
    global $PUESTO_RESP;

    $incidencias = getIncidenciasPersona($data['nss'], $data['fecha']);
    $rawBody = "";
    if ($tipo == "unico") {
        if ($data['dictamen'] == "R")
            $rawBody = file_get_contents("cartasTemplate/cartaUnicaR.mail");
        elseif ($data['dictamen'] == "AB")
            $rawBody = file_get_contents("cartasTemplate/cartaUnicaAB.mail");
        elseif ($data['dictamen'] == "F" || $data['dictamen'] == "AU")
            $rawBody = file_get_contents("cartasTemplate/cartaUnicaF-AU.mail");

        //Agregar la fecha
        $fecha = strtotime($data['fecha']);
        $fecha = date('d', $fecha) . " de " . $meses[date('n', $fecha)] . " de " . date('o', $fecha);
        $rawBody = str_replace("@FECHA_DICTAMEN", $fecha, $rawBody);
        $rawBody = str_replace("@LOGO_ESCUELA", $LOGO_ESCUELA, $rawBody);
        $rawBody = str_replace("@NOMBRE_RESP", $NOMBRE_RESP, $rawBody);
        $rawBody = str_replace("@PUESTO_RESP", $PUESTO_RESP, $rawBody);
        //Agregar el nombre de la persona
        $rawBody = str_replace("@NOMBRE_DOCENTE", $data['nombre'], $rawBody);
        $rawBody = str_replace("@RESULTADO_DICTAMEN", $tipoDictamenColor[$data['dictamen']], $rawBody);

        //Construir tabla con dictamenes
        $tablaDictamen =
            '<table style="table-layout:fixed;font-size:13px;font-family:arial,sans,sans-serif;border-collapse:collapse;border:1px solid #cccccc;margin-left:auto;margin-right:auto" dir="ltr" border="1" cellspacing="0" cellpadding="0">
            <colgroup><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"></colgroup>
            <thead>
            <tr style="height:21px">
            <th style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000"><span style="font-size:large">CLASE</span></td>
            <th style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000"><span style="font-size:large">DICTAMEN</span></td>
            <th style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;font-weight:bold;text-align:center;background-color:#6d9eeb" rowspan="1" colspan="2"><span style="font-size:large">ENTRADA</span></td>
            <th style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:#000000;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;font-weight:bold;text-align:center;background-color:#cccccc" rowspan="1" colspan="2"><span style="font-size:large">SALIDA</span></td>
            </tr>
            </thead>
            <tbody>
            <tr style="height:21px">
            <td style="padding:2px 3px;border:1px solid #000000;vertical-align:middle;text-align:center;width:200px" rowspan="2" colspan="1">
            <div style="max-height:41px"><span style="font-size:large"><strong>' . $data['nivel'] . ':</strong>&nbsp; ' . substr($data['titulo'], 0, 25) . '</span></div>
            </td>
            <td style="padding:2px 3px;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;font-weight:bold;color:#ff0000;vertical-align:middle;text-align:center" rowspan="2" colspan="1">
            <div style="max-height:41px"><span style="font-size:large;">' . $tipoDictamenColor[$data['dictamen']] . '</span></div>
            </td>
            <td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:#6d9eeb"><span style="font-size:large">Registrada</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:#6d9eeb"><span style="font-size:large">Institucional</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:#cccccc"><span style="font-size:large">Registrada</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;font-weight:bold;text-align:center;background-color:#cccccc"><span style="font-size:large">Institucional</span></td>
            </tr>
            <tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;text-align:center;background-color:#6d9eeb"><span style="font-size:large">' . $data['hiR'] . '</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;text-align:center;background-color:#6d9eeb"><span style="font-size:large">' . $data['hiI'] . '</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;text-align:center;background-color:#cccccc"><span style="font-size:large">' . $data['hfR'] . '</span></td>
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;text-align:center;background-color:#cccccc"><span style="font-size:large">' . $data['hfI'] . '</span></td>
            </tr>
            </tbody>
            </table>';
        $rawBody = str_replace("@TABLA_DICTAMEN", $tablaDictamen, $rawBody);

        //Contruir tabla de incidencias
        $tablaIncidencias =
            '<table style="table-layout:fixed;font-size:13px;font-family:arial,sans,sans-serif;border-collapse:collapse;border:1px solid #cccccc;margin-left:auto;margin-right:auto" dir="ltr" border="1" cellspacing="0" cellpadding="0"><colgroup><col width="120"><col width="131"></colgroup>
            <tbody>
            <tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border:1px solid #000000;text-align:center" rowspan="1" colspan="2"><strong><span style="font-size:large">Registro de Checadas</span></strong></td>
            </tr>
            <tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" rowspan="1" colspan="2"><strong><span style="font-size:large">Hora</span></strong></td>
            </tr>';
        if ($incidencias['s'] == 1) {
            if (count($incidencias['d']) == 0) {
                $tablaIncidencias .=
                    '<tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">Sin checada</span></td>
                </tr><tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" rowspan="1" colspan="2"><span style="font-size:large">Sin checada</span></td>
                </tr>';
            } else {
                foreach ($incidencias['d'] as $checada) {
                    $tablaIncidencias .= '<tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">' . $checada . '</span></td>
            </tr>';
                }
            }
        } else {
            $tablaIncidencias .=
                '<tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">Información no disponible</span></td>
                </tr>';
        }
        $tablaIncidencias .= '</tbody></table>';
        $rawBody = str_replace("@TABLA_INCIDENCIAS", $tablaIncidencias, $rawBody);
    } elseif ($tipo == "grupo") {
        foreach ($data as $asig) {
            // echo "<br>";
            // var_dump($asig['dictamen']);
            // echo "<br>";
            if ($asig['dictamen'] == "R") {
                $rawBody = file_get_contents("cartasTemplate/cartaGrupoR.mail");
                break;
            } elseif ($asig['dictamen'] == "AB") {
                $rawBody = file_get_contents("cartasTemplate/cartaGrupoAB.mail");
                break;
            } elseif ($data[0]['dictamen'] == "F" || $data['dictamen'] == "AU") {
                $rawBody = file_get_contents("cartasTemplate/cartaGrupoF-AU.mail");
                break;
            }
        }

        //Agregar la fecha
        $fecha = strtotime($data['fecha']);
        $fecha = date('d', $fecha) . " de " . $meses[date('n', $fecha)] . " de " . date('o', $fecha);
        $rawBody = str_replace("@FECHA_DICTAMEN", $fecha, $rawBody);

        //Agregar el nombre de la persona
        $rawBody = str_replace("@NOMBRE_DOCENTE", $data['nombre'], $rawBody);

        //Resultado del dictamen
        $tempDictamen = "";
        foreach ($data as $dictamen) {
            $tempDictamen .= $tipoDictamenColor[$dictamen['dictamen']] . "?";
        }
        $tempDictamen = str_replace("?", " - ", rtrim($tempDictamen, "?"));
        $rawBody = str_replace("@RESULTADO_DICTAMEN", $tempDictamen, $rawBody);

        //Construir tabla con dictamenes
        $tablaDictamen = '<table dir="ltr"border="1"cellspacing="0"cellpadding="0"style="table-layout:fixed;font-size:13px;font-family:arial,sans,sans-serif;border-collapse:collapse;border:1px solid rgb(204,204,204);margin-left:auto;margin-right:auto"><colgroup><col width="162"><col width="100"><col width="120"><col width="131"><col width="122"><col width="130"></colgroup><tbody><tr style="height:21px"><td rowspan="2"colspan="1"style="padding:2px 3px;border:1px solid rgb(0,0,0);vertical-align:top;text-align:center"><div style="max-height:41px"><span style="font-size:large">CLASE</span></div></td><td rowspan="2"colspan="1"style="padding:2px 3px;border-top-width:1px;border-top-style:solid;border-top-color:rgb(0,0,0);border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0);border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);vertical-align:top;text-align:center"><div style="max-height:41px"><span style="font-size:large">DICTAMEN</span></div></td><td rowspan="1"colspan="2"style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:rgb(0,0,0);border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);font-weight:bold;text-align:center;background-color:rgb(109,158,235)"><span style="font-size:large">ENTRADA</span></td><td rowspan="1"colspan="2"style="padding:2px 3px;vertical-align:bottom;border-top-width:1px;border-top-style:solid;border-top-color:rgb(0,0,0);border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0);border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);font-weight:bold;text-align:center;background-color:rgb(204,204,204)"><span style="font-size:large">SALIDA</span></td></tr><tr style="height:21px"><td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:rgb(109,158,235)"><span style="font-size:large">REGISTRADA</span></td><td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:rgb(109,158,235)"><span style="font-size:large">INSTITUCIONAL</span></td><td style="padding:2px 3px;vertical-align:bottom;font-weight:bold;text-align:center;background-color:rgb(204,204,204)"><span style="font-size:large">REGISTRADA</span></td><td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0);font-weight:bold;text-align:center;background-color:rgb(204,204,204)"><span style="font-size:large">INSTITUCIONAL</span></td></tr>';
        foreach ($data as $datos) {
            $tablaDictamen .= '<tr style="height:21px"><td style="padding:2px 3px;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);border-left-width:1px;border-left-style:solid;border-left-color:rgb(0,0,0);vertical-align:middle;text-align:center;border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0)"><span style="font-size:large"><strong>' . $datos['nivel'] . ':</strong>&nbsp; ' .
                $datos['titulo'] . '</span></td><td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0);border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);font-size:14.3000001907349px;font-weight:bold;color:rgb(255,165,0);text-align:center;background-color:rgb(249,249,249)"><span style="font-size:large">' .
                $tipoDictamenColor[$datos['dictamen']] . '</span></td><td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);text-align:center;background-color:rgb(109,158,235)"><span style="font-size:large"> ' .
                $datos['hiR'] . '</span></td><td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);text-align:center;background-color:rgb(109,158,235)"><span style="font-size:large"> ' .
                $datos['hiI'] . '</span></td><td style="padding:2px 3px;vertical-align:bottom;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);text-align:center;background-color:rgb(204,204,204)"><span style="font-size:large"> ' .
                $datos['hfR'] . '</span></td><td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:rgb(0,0,0);border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(0,0,0);text-align:center;background-color:rgb(204,204,204)"><span style="font-size:large"> ' .
                $datos['hfI'] . '</span></td></tr>';
        }
        $tablaDictamen .= '</tbody></table>';
        $rawBody = str_replace("@TABLA_DICTAMEN", $tablaDictamen, $rawBody);

        //Contruir tabla de incidencias
        $tablaIncidencias =
            '<table style="table-layout:fixed;font-size:13px;font-family:arial,sans,sans-serif;border-collapse:collapse;border:1px solid #cccccc;margin-left:auto;margin-right:auto" dir="ltr" border="1" cellspacing="0" cellpadding="0"><colgroup><col width="120"><col width="131"></colgroup>
            <tbody>
            <tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border:1px solid #000000;text-align:center" rowspan="1" colspan="2"><strong><span style="font-size:large">Registro de Checadas</span></strong></td>
            </tr>
            <tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" rowspan="1" colspan="2"><strong><span style="font-size:large">Hora</span></strong></td>
            </tr>';
        if ($incidencias['s'] == 1) {
            if (count($incidencias['d']) == 0) {
                $tablaIncidencias .=
                    '<tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">Sin checada</span></td>
                </tr><tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" rowspan="1" colspan="2"><span style="font-size:large">Sin checada</span></td>
                </tr>';
            } else {
                foreach ($incidencias['d'] as $checada) {
                    $tablaIncidencias .= '<tr style="height:21px">
            <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">' . $checada . '</span></td>
            </tr>';
                }
            }
        } else {
            $tablaIncidencias .=
                '<tr style="height:21px">
                <td style="padding:2px 3px;vertical-align:bottom;border-right-width:1px;border-right-style:solid;border-right-color:#000000;border-left-width:1px;border-left-style:solid;border-left-color:#000000;text-align:center;background-color:#cccccc" colspan="2"><span style="font-size:large">Información no disponible</span></td>
                </tr>';
        }
        $tablaIncidencias .= '</tbody></table>';
        $rawBody = str_replace("@TABLA_INCIDENCIAS", $tablaIncidencias, $rawBody);
    }

    return $rawBody;
}

/**
 * @param $nss
 * @param $dia
 * @return array
 */
function getIncidenciasPersona($nss, $dia)
{
    $sql = "SELECT Periodo FROM checado
            INNER JOIN personas ON ID_Persona = ID
            WHERE NSS = '$nss' AND Periodo LIKE '$dia%' ORDER BY Periodo ";
    if ($r = ejecutaSQL($sql)) {
        $checadas = array();
        while ($row = mysqli_fetch_assoc($r)) {
            $row = date("H:i:s", strtotime($row['Periodo']));
            array_push($checadas, $row);
        }
        return array("s" => 1, "d" => $checadas);
    } else
        return array("s" => 0, "d" => "No se puedo buscar incidencias");
}

/**
 * @param $nss
 * @param $fecha
 * @param $tipo
 * @param $body
 * @return array
 */
function saveMail($nss, $fecha, $tipo, $body)
{
    global $base;
    $cont = 0;
    $archivo = $fecha . "_" . $nss . "_" . $tipo . "_" . $cont;
    if (!file_exists("/var/www/html/toSendMail/$base/$fecha/")) {
        mkdir("/var/www/html/toSendMail/$base/$fecha/", 0777, true);
    }

    while (file_exists("/var/www/html/toSendMail/$base/$fecha/$archivo.html")) {
        $cont++;
        $archivo = $fecha . "_" . $nss . "_" . $tipo . "_" . $cont;
    }
    if ($myfile = fopen("/var/www/html/toSendMail/$base/$fecha/$archivo.html", "w+")) {
        fwrite($myfile, $body);
        fclose($myfile);
        return array("s" => 1, "d" => "toSendMail/$base/$fecha/$archivo.html");
    } else
        return array("s" => 0, "m" => "Error al guardar carta");
}

/**
 * @param $config
 * @param $destinatario
 * @param $sender
 * @param $asunto
 * @param $cuerpo
 * @return array
 */
function sendMail($config, $destinatario, $sender, $asunto, $cuerpo)
{
    //echo var_dump($config);
    $mail = new PHPMailer(true); //creamos la variable para enviar el correo
    $mail->IsSMTP();
    try {
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = $config['security'];
        $mail->Host = $config['serverSMTP'];
        $mail->Username = $config['usuarioSMTP'];
        $mail->Password = $config['claveSMTP'];
        $mail->Port = $config['puertoSMTP']; //el normal es 25, aqui se pone el numero de puerto que te haya dado el proveedor
        $mail->CharSet = 'UTF-8';

        $mail->From = $config['emailHost']; //Asi va a aparecer cuando le llegue el correo a la persona.
        $mail->FromName = $sender;

        foreach ($destinatario as $destino) {
            $mail->AddAddress($destino); // $destinatario=cuenta@gmail.com, aqui ponemos la cuenta a quien enviaremos el correo, OJO: solo se pone una y por cada cuenta a la que se quiera enviar el email se va agregando (AddAddress).
        }

        $mail->IsHTML(true);
        $mail->Subject = $asunto; //Subject del correo.

        $mail->Body = $cuerpo; //insertamos el body.

        if ($mail->Send()) {    //aqui lo que hay que hacer si se envió correctamente el mail
            $status = array("s" => 1);
        } else {
            $status = array("s" => 0, "m" => ($mail->ErrorInfo));
        }
    } catch (phpmailerException $e) {
        $status = array("s" => 0, "m" => ($mail->ErrorInfo));
    } catch (Exception $e) {
        $status = array("s" => 0, "m" => ($mail->ErrorInfo));
    }
    return $status;
}

/**
 * @return array|bool
 */
function getSavedMailConfig()
{
    if (file_exists("libMail/mailConfig.mail")) {
        $mailConfig = array();
        $temp = file_get_contents("libMail/mailConfig.mail");
        $temp = explode(";", $temp);
        $server = explode("=>", $temp[0], 2);
        $mailConfig[trim($server[0])] = trim($server[1]);
        $usuario = explode("=>", $temp[1], 2);
        $mailConfig[trim($usuario[0])] = trim($usuario[1]);
        $clave = explode("=>", $temp[2], 2);
        $mailConfig[trim($clave[0])] = trim($clave[1]);
        $puerto = explode("=>", $temp[3], 2);
        $mailConfig[trim($puerto[0])] = trim($puerto[1]);
        $host = explode("=>", $temp[4], 2);
        $mailConfig[trim($host[0])] = trim($host[1]);
        return $mailConfig;
    } else
        return false;
}

function saveMailConfig($server, $user, $pass, $port, $host, $security)
{
    $config = "serverSMTP => " . $server . "; usuarioSMTP => " . $user . "; claveSMTP => " . $pass . "; puertoSMTP => " . $port . "; emailHost =>" . $host . "; security =>" . $security . ";";
    if ($myfile = fopen("libMail/mailConfig.mail", "w+")) {
        fwrite($myfile, $config);
        fclose($myfile);
        return array("s" => 1, "m" => "Congiruación guardada");
    } else
        return array("s" => 0, "m" => "Error al guardar congiruación");
}

/**
 * @return array
 */
function getMailConfig()
{
    if (file_exists("libMail/mailConfig.mail")) {
        $mailConfig = array();
        $temp = file_get_contents("libMail/mailConfig.mail");
        $temp = explode(";", $temp);
        $server = explode("=>", $temp[0], 2);
        $mailConfig[trim($server[0])] = trim($server[1]);
        $usuario = explode("=>", $temp[1], 2);
        $mailConfig[trim($usuario[0])] = trim($usuario[1]);
        $clave = explode("=>", $temp[2], 2);
        $mailConfig[trim($clave[0])] = trim($clave[1]);
        $puerto = explode("=>", $temp[3], 2);
        $mailConfig[trim($puerto[0])] = trim($puerto[1]);
        $host = explode("=>", $temp[4], 2);
        $mailConfig[trim($host[0])] = trim($host[1]);
        $security = explode("=>", $temp[5], 2);
        $mailConfig[trim($security[0])] = trim($security[1]);
        return array("s" => 1, "m" => "Buscqueda de configuración correcta", "d" => $mailConfig);
    } else
        return array("s" => 0, "m" => "No existe archivo de configuración para SMTP");
}

/**
 * @param $target
 */
function delete_files($target)
{
    if (is_dir($target)) {
        $files = glob($target . '*', GLOB_MARK); //GLOB_MARK adds a slash to directories returned
        foreach ($files as $file) {
            delete_files($file);
        }
        rmdir($target);
    } elseif (is_file($target)) {
        unlink($target);
    }
}