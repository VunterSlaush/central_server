<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
ini_set('max_execution_time', 0);
include("conf.php");

global $servidor;
global $base;
global $usuarioBD;
global $pass;
global $MY_SESSION_ADMIN;
global $tiempoGruposGeneral;
$responsable = "NULL";
$diaSemana = array("lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo");
//Verifica si existe una sesiÃ³n, para poder acceder a los servicios.
if (!isset($_SESSION[$MY_SESSION_ADMIN])) {
    echo json_encode(array("s" => 0, "m" => "No has iniciado sesiÃ³n"));
} //Si existe la sesiÃ³n se puede acceder a los siguientes servicios.
else {
    #---------------------------------------------------------
    # NEW RELIC                                             --
    #                                                       --
    if (extension_loaded('newrelic')) {
        newrelic_set_appname($base . "_" . $_POST["ws"]);
    }
    #---------------------------------------------------------
    switch ($_POST["ws"]) {
        case "cargaAsignaciones":
            if (!empty($_POST['data'])) cargaAignaciones($_POST['data']);
            else echo json_encode(array("s" => 0, "m" => "No existe informaciÃ³n"));
            break;
        case "cargaAdmin":
            if (!empty($_POST['data'])) cargaAdmin($_POST['data']);
            else echo json_encode(array("s" => 0, "m" => "No existe informaciÃ³n"));
            break;
        case "DBdocentes":
            if (!empty($_POST['data'])) sendDocentes($_POST['data']);
            else echo json_encode(array("s" => 0, "m" => "No existe informaciÃ³n"));
            break;
        case "Agrupacion":
            if (!empty($_POST['data'])) createGroups($_POST['data']);
            else echo json_encode(array("s" => 0, "m" => "No existe informaciÃ³n"));
            break;
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}
//Funcion para cargar un FIGPO de Asignaciones
function cargaAignaciones($datos)
{
    global $responsable;
    global $diaSemana;
    $rawAsignaciones = array(); //Variable para guardar las asignaciones filtradas, sin procesamiento.
    $estadoCarga = array(); //Variable para guardar el "log" de la carga de las asignaciones.
    $toProcess = json_decode($datos, true);

    if (isset($_POST['responsible'])) {
        $responsable = $_POST['responsible'];
    }//Recibe los errores encontrados en el parserFIGO
    /*foreach ($getErrors as $error) {
        //$error = array_map('utf8_decode', $error);
        $error = array_map('trim', $error);
        $tempE = array("periodo" => $error['periodo'], "nivel" => $error['nivel'], "departamento" => $error['departamento'], "materia" => $error['materia'], "titulo" => $error['titulo'], "fechaInicio" => $error['fechaInicio'], "fechaFin" => $error['fechaFin'], "crn" => $error['crn'], "grupo" => $error['grupo'], "componente" => $error['componente'], "nss" => $error['nss'], "nombrePersona" => $error['nombrePersona'], "correo" => $error['correo'], "lunes" => array("hi" => "", "hf" => "", "salon" => ""), "martes" => array("hi" => "", "hf" => "", "salon" => ""), "miercoles" => array("hi" => "", "hf" => "", "salon" => ""), "jueves" => array("hi" => "", "hf" => "", "salon" => ""), "viernes" => array("hi" => "", "hf" => "", "salon" => ""), "sabado" => array("hi" => "", "hf" => "", "salon" => ""), "domingo" => array("hi" => "", "hf" => "", "salon" => ""), "Tipo_error" => $error['Tipo_error']);
        for ($x = 0; $x < count($diaSemana); $x++) {
            $timeArray = explode(" ", $error[$diaSemana[$x]], 3);
            $tempE[$diaSemana[$x]]['hi'] = $timeArray[0];
            $tempE[$diaSemana[$x]]['hf'] = $timeArray[1];
            $tempE[$diaSemana[$x]]['salon'] = $timeArray[2];
        }
        //Guarda errores recibidos del parserFIGPO
        array_push($errorAsignacion, $tempE);
    }*/

    //Modificar los datos de entrada del POST
    foreach ($toProcess as $data) {
        //$data = array_map('utf8_decode', $data);
        $data = array_map('trim', $data);
        //$pattern="/^([0-1][0-9]|[2][0-3])[\:]([0-5][0-9])$/";//Expresion regular para validar la hora de inicio y fin
        $erroresHorario=0;
        $temp = array("periodo" => $data['periodo'], "nivel" => $data['nivel'], "departamento" => $data['departamento'], "materia" => $data['materia'], "titulo" => $data['titulo'], "fechaInicio" => $data['fechaInicio'], "fechaFin" => $data['fechaFin'], "crn" => $data['crn'], "grupo" => $data['grupo'], "componente" => $data['componente'], "nss" => $data['nss'], "nombrePersona" => $data['nombrePersona'], "correo" => $data['correo'], "lunes" => array("hi" => "", "hf" => "", "salon" => ""), "martes" => array("hi" => "", "hf" => "", "salon" => ""), "miercoles" => array("hi" => "", "hf" => "", "salon" => ""), "jueves" => array("hi" => "", "hf" => "", "salon" => ""), "viernes" => array("hi" => "", "hf" => "", "salon" => ""), "sabado" => array("hi" => "", "hf" => "", "salon" => ""), "domingo" => array("hi" => "", "hf" => "", "salon" => ""), "Tipo_error" => "");
        //Validar horario y salon
        for ($x = 0; $x < count($diaSemana); $x++) {
            if (!empty($data[$diaSemana[$x]])) {
                $timeArray = explode(" ", $data[$diaSemana[$x]], 3);
                if (empty($timeArray[0])) {
                    $temp['Tipo_error'] .= "Error en la captura de horario de " .$diaSemana[$x]. ", ";
                    $temp[$diaSemana[$x]]['hi'] = $timeArray[0];
                    $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                    $temp[$diaSemana[$x]]['salon'] = $timeArray[2];
                    $erroresHorario++;
                    continue;
                } else {
                    $temp[$diaSemana[$x]]['hi'] = $timeArray[0];
                    if (empty($timeArray[1])) {
                        $temp['Tipo_error'] .= "Error en la captura de horario de " .$diaSemana[$x]. ", ";
                        $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                        $temp[$diaSemana[$x]]['salon'] = $timeArray[2];
                        $erroresHorario++;
                        continue;
                    } else {
                        $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                        if (empty($timeArray[2])) {
                            $temp['Tipo_error'] .= "".$diaSemana[$x]. " no contiene Salon, ";
                            $temp[$diaSemana[$x]]['salon'] = $timeArray[2];
                            $erroresHorario++;
                            continue;
                        } else {
                            $temp[$diaSemana[$x]]['salon'] = $timeArray[2];
                            if (strtotime($timeArray[0]) > strtotime($timeArray[1])) {
                                $temp['Tipo_error'] .= "".$diaSemana[$x]."La hora de entrada es mayor a la hora de salida, ";
                                $erroresHorario++;
                                continue;
                            }
                        }
                    }
                }
            }
        }
        //Gardar en la variable arrayAsignaciones los registros que pasaron el filtro con la informacion que nos interesa.
        array_push($rawAsignaciones, $temp);
    }
    createGroups($rawAsignaciones);
}
//Generar la compactacion de las asignaturas si existe mÃ¡s de un registro
function createGroups($rawAsignaciones){
    global $diaSemana;
    if($_POST['tipo']==1){
        $rawAsignaciones = json_decode($rawAsignaciones, true);
    }
    $stopFlag = false; //Variable para controlar el ciclo de asignaciones.
    $finalAsignaciones = array(); //Variable para guardar las asignaciones procesadas y listas para cargar al sistema.
    while (!$stopFlag) {
        $groupAsignaciones = array();
        $finalGroup = array();
        //Si solamente queda un elemento en el arreglo $rawAsignaciones
        if (count($rawAsignaciones) == 1 || count($rawAsignaciones)==0) {
            array_push($finalAsignaciones, array_shift($rawAsignaciones));
            $stopFlag = true;
        } else {
            array_push($groupAsignaciones, array_shift($rawAsignaciones));
            //Busqueda por el arreglo $rawAsignaciones para conocer si se debe agrupar con otra materia
            foreach ($rawAsignaciones as $key => $value) {
                $value["Tipo_error"]="";
                if ($value['materia'] == $groupAsignaciones[0]['materia'] && $value['grupo'] == $groupAsignaciones[0]['grupo'] && $value['nss'] == $groupAsignaciones[0]['nss'] && $value['nombrePersona']==$groupAsignaciones[0]['nombrePersona']) {
                    array_push($groupAsignaciones, $rawAsignaciones[$key]);
                    unset($rawAsignaciones[$key]);
                }
            }
            if (count($rawAsignaciones) == 0)
                $stopFlag = true;
            //Verificar existe 2 o mÃ¡s materias para agrupar
            if (count($groupAsignaciones) == 1) {
                array_push($finalAsignaciones, $groupAsignaciones[0]);
            } else {
                //Generar la agrupacion de materias con respecto a los horarios y al crn
                $nComb = combinaciones(range(0,count($groupAsignaciones)-1));
                $grouped = false;
                for ($i=0; $i < count($nComb); $i++) { 
                    $posibleGroup = array('s'=>false,'a'=>array(),'c'=>array());
                    for ($j=0; $j < count($nComb[$i]); $j++) { 
                        array_push($posibleGroup['a'], $groupAsignaciones[$j]);
                        array_push($posibleGroup['c'], $j);
                    }
                    $posibleGroup = checkGroup($posibleGroup); 
                    if ($posibleGroup['s']) {
                        array_push($finalAsignaciones, groupAsig($posibleGroup['a']));                    
                        if (!(count($groupAsignaciones) == count($posibleGroup['c']))) 
                            for ($k=0; $k < count($groupAsignaciones); $k++)  
                                if (!in_array($k, $posibleGroup['c'])) 
                                    array_push($finalAsignaciones, $groupAsignaciones[$k]);
                        $grouped=true;
                        break;
                    }
                }
                if (!$grouped) 
                    for ($k=0; $k < count($groupAsignaciones); $k++)  
                            array_push($finalAsignaciones, $groupAsignaciones[$k]);
            }
        }
    }
    echo json_encode(array("s" => 0, "m" => "Registros de FIGPO analizados correctamente", "d" => $finalAsignaciones));
}

function permute($items, $perms = array( )) {
    if (empty($items)) {
        $return = array($perms);
    }  else {
        $return = array();
        for ($i = count($items) - 1; $i >= 0; --$i) {
            $newitems = $items;
            $newperms = $perms;
            list($foo) = array_splice($newitems, $i, 1);
            array_unshift($newperms, $foo);
            $return = array_merge($return, permute($newitems, $newperms));
         }
    }
    return $return;
}

function combinaciones($array) {
    $results = array(array( ));

    foreach ($array as $element)
        foreach ($results as $combination)
            array_push($results, array_merge(array($element), $combination));   
                
    $array = $results;
    $results = array();
    foreach($array as $c){
        foreach(permute($c) as $s){
            array_push($results,$s);
        }
    }
    $array = $results;
    $results = array();

    for ($i=0; $i < count($array) ; $i++)
        if (count($array[$i]) > 1) 
            array_push($results, $array[$i]);
    $max=0;
    $array = $results;
    $results = array();
    foreach ($array as $value) {
        if (count($value)>$max) {
            $max=count($value);
        }
    }
    for ($i=$max; $i > 1 ; $i--) { 
        foreach ($array as $value) {
            if (count($value)==$i) {
                array_push($results, $value);
            }
        }
    }   
    
    return $results;
}

function groupAsig($groupAsignaciones) {
    global $diaSemana;
    $finalGroup = array_shift($groupAsignaciones);
    foreach ($groupAsignaciones as $asig) {
        for ($x = 0; $x < count($diaSemana); $x++) {            
            if($finalGroup[$diaSemana[$x]]['hi'] == "" && $asig[$diaSemana[$x]]['hi'] == ""){
                continue;
            }
            elseif($finalGroup[$diaSemana[$x]]['hi'] == "" && $asig[$diaSemana[$x]]['hi'] != ""){
                $finalGroup[$diaSemana[$x]]['hi'] = $asig[$diaSemana[$x]]['hi'];
                $finalGroup[$diaSemana[$x]]['salon']= $asig[$diaSemana[$x]]['salon'];
            }
            elseif($finalGroup[$diaSemana[$x]]['hi'] != "" && $asig[$diaSemana[$x]]['hi'] == ""){
                $finalGroup[$diaSemana[$x]]['hi'] = $finalGroup[$diaSemana[$x]]['hi'];
                $finalGroup[$diaSemana[$x]]['salon'] = $finalGroup[$diaSemana[$x]]['salon'];
            }
            elseif($finalGroup[$diaSemana[$x]]['hi'] != "" && $asig[$diaSemana[$x]]['hi'] != ""){
                if (strtotime($finalGroup[$diaSemana[$x]]['hi']) > strtotime($asig[$diaSemana[$x]]['hi'])) {
                    $finalGroup[$diaSemana[$x]]['hi'] = $asig[$diaSemana[$x]]['hi'];
                    $finalGroup[$diaSemana[$x]]['salon'] = $asig[$diaSemana[$x]]['salon'];
                }else{
                    $finalGroup[$diaSemana[$x]]['hi'] = $finalGroup[$diaSemana[$x]]['hi'];
                    $finalGroup[$diaSemana[$x]]['salon'] = $finalGroup[$diaSemana[$x]]['salon'];
                }
            }
            #
            #   Calculo para hora final (hf)
            #           
            if($finalGroup[$diaSemana[$x]]['hf'] == "" && $asig[$diaSemana[$x]]['hf'] == ""){
                continue;
            }
            elseif($finalGroup[$diaSemana[$x]]['hf'] == "" && $asig[$diaSemana[$x]]['hf'] != ""){
                $finalGroup[$diaSemana[$x]]['hf'] = $asig[$diaSemana[$x]]['hf'];
            }
            elseif($finalGroup[$diaSemana[$x]]['hf'] != "" && $asig[$diaSemana[$x]]['hf'] == ""){
                $finalGroup[$diaSemana[$x]]['hf'] = $finalGroup[$diaSemana[$x]]['hf'];
            }
            elseif($finalGroup[$diaSemana[$x]]['hf'] != "" && $asig[$diaSemana[$x]]['hf'] != ""){
                if (strtotime($finalGroup[$diaSemana[$x]]['hf']) < strtotime($asig[$diaSemana[$x]]['hf'])) {
                    $finalGroup[$diaSemana[$x]]['hf'] = $asig[$diaSemana[$x]]['hf'];               
                }else{
                    $finalGroup[$diaSemana[$x]]['hf'] = $finalGroup[$diaSemana[$x]]['hf'];
                }
            }
            if ($finalGroup['crn'] > $asig['crn'])
                $finalGroup['crn'] = $asig['crn'];
        }
    }
    return $finalGroup;
}

function checkGroup($posibleGroup) {
    global $diaSemana,$tiempoGruposGeneral;
    $groupAsignaciones = $posibleGroup['a'];
    $finalGroup = array_shift($groupAsignaciones);
    foreach ($groupAsignaciones as $asig) {
        for ($x = 0; $x < count($diaSemana); $x++) {
            if (((strtotime($asig[$diaSemana[$x]]['hi']) > strtotime($finalGroup[$diaSemana[$x]]['hi'])) && (strtotime($asig[$diaSemana[$x]]['hi']) < strtotime($finalGroup[$diaSemana[$x]]['hf']))) || ((strtotime($finalGroup[$diaSemana[$x]]['hi']) > strtotime($asig[$diaSemana[$x]]['hi'])) && (strtotime($finalGroup[$diaSemana[$x]]['hi']) < strtotime($asig[$diaSemana[$x]]['hf'])))) {
                return $posibleGroup;
            }else{            
                if($finalGroup[$diaSemana[$x]]['hi'] == "" && $asig[$diaSemana[$x]]['hi'] == ""){
                    continue;
                }                
                elseif($finalGroup[$diaSemana[$x]]['hi'] != "" && $asig[$diaSemana[$x]]['hi'] != ""){
                    if (strtotime($finalGroup[$diaSemana[$x]]['hi']) > strtotime($asig[$diaSemana[$x]]['hi'])){                        
                        if (!strtotime($finalGroup[$diaSemana[$x]]['hi']) <= strtotime($asig[$diaSemana[$x]]['hf'])+($tiempoGruposGeneral*60)){
                            // echo $diaSemana[$x]."**".$asig[$diaSemana[$x]]['hf']." fg - asig ".$finalGroup[$diaSemana[$x]]['hi']."<br>";
                            return $posibleGroup;
                        }
                    }else{
                        if (!(strtotime($asig[$diaSemana[$x]]['hi']) <= strtotime($finalGroup[$diaSemana[$x]]['hf'])+($tiempoGruposGeneral*60))){
                            return $posibleGroup;
                        }
                    }
                }
            }   
        }
    }
    $posibleGroup['s']=true;    
    return $posibleGroup;
}

function sendDocentes($datos){
    global $responsable;
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;
    global $diaSemana;
    if (isset($_POST['responsible'])) {
        $responsable = $_POST['responsible'];
    }
    $getData = json_decode($datos, true);
    $estadoCarga = array(); //Variable para guardar el "log" de la carga de las asignaciones.
    $registred=0;
    $noRegistred=0;
    $errores_str="";
    foreach ($getData as $key => $asignacion) {
        $tmp=$asignacion;
        $idServicio = 0;
        $idPersona = 0;
        $idEspacio = 0;
        $idAsignacion = 0;
        if (!$con = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
            echo("Error de conexion");
        } else {
            //$status=array
            $estadoTemp = array("servicio" => array(), "persona" => array(), "asignacion" => array(), "datos" =>array(), "noInsert" => 0,  "flag" => false, "update" => false, "changes" => 'None');
            array_push($estadoTemp['datos'], $asignacion['crn'].", ".$asignacion['titulo'].", ".$asignacion['nombrePersona']);
            //Verificar si existe un servicio
            $sql = " SELECT ID FROM servicios WHERE Codigo = '{$asignacion['materia']}' ";
            if ($servicio = mysqli_query($con, $sql)) {
                //SI el servicio ya existe => Actualizar el campo Activo a 1
                //ELSE => Insertar en la base de datos.
                if (mysqli_num_rows($servicio) != 0) {
                    //array_push($estadoTemp['servicio'], "Servicio " . $asignacion['materia'] . " ya existe");
                    while ($row = mysqli_fetch_array($servicio)) {
                        $sql = " UPDATE servicios SET Activo = 1, Nivel = '{$asignacion['nivel']}' WHERE ID = '$row[ID]' ";
                        mysqli_query($con, $sql);
                        $idServicio = $row['ID'];
                    }
                } else {
                    $sql = "INSERT INTO servicios (Codigo, Titulo, ID_Tipo_Servicio, Departamento, Nivel) VALUES ('{$asignacion['materia']}', '{$asignacion['titulo']}', 1, '{$asignacion['departamento']}', '{$asignacion['nivel']}') ";
                    if (mysqli_query($con, $sql)) {
                        $idServicio = mysqli_insert_id($con);
                        //array_push($estadoTemp['servicio'], "Nuevo Servicio Resgistrado: " . $asignacion['materia']);
                    } else {
                        $tmp["Tipo_error"].= "Error al tratar de insertar nuevo Servicio";
                        array_push($estadoTemp['servicio'], "Error al tratar de insertar nuevo servicio, ");
                        $estadoTemp['noInsert']++;
                    }
                }
            } else {
                $tmp["Tipo_error"].= "Error al buscar servicio,";
                array_push($estadoTemp['servicio'], "Error al buscar servicios, ");
                $estadoTemp['noInsert']++;
            }
            ////////////////////////////////////////////////////////////////////////////////Verificar si existe una persona
            ////Si hay concidencia en la busqueda de la persona por NSS
            $sql = " SELECT ID FROM personas WHERE NSS = '{$asignacion['nss']}' ";
            if ($personaNSS = mysqli_query($con, $sql)) {
                //SI la persona ya existe => Actualizar el campo Activo a 1
                //ELSE => Insertar en la base de datos.
                if (mysqli_num_rows($personaNSS) != 0) {
                    //array_push($estadoTemp['persona'], "Persona: " . $asignacion['nss'] . " ya existe");
                    while ($row = mysqli_fetch_array($personaNSS)) {
                        $idPersona=$row['ID'];
                        if ($asignacion['correo'] == "")
                            mysqli_query($con, "UPDATE personas SET Activo = 1 WHERE ID = '$row[ID]' ");
                        else
                            mysqli_query($con, "UPDATE personas SET Activo = 1, Email ='{$asignacion['correo']}'  WHERE ID = '$row[ID]' ");
                    }
                } else {
                    $personaArray = explode(" ", $asignacion['nombrePersona'], 3);
                    $sql = " INSERT INTO personas (NSS, Nombre, ApellidoP, ApellidoM, Detalle) VALUES ('{$asignacion['nss']}', '$personaArray[2]', '$personaArray[0]', '$personaArray[1]', 'Nuevo profesor')";
                    if (mysqli_query($con, $sql)) {
                        if ($idPersona = mysqli_insert_id($con)) {
                            //array_push($estadoTemp['persona'], "Nueva Persona Resgistrada: " . $asignacion['nss']);
                            $sql = " INSERT INTO identificador (ID_Persona, ID1) VALUES ('$idPersona', '{$asignacion['nss']}') ";
                            if (mysqli_query($con, $sql)) {
                                //array_push($estadoTemp['persona'], "Identificador registrado correctamente");
                            } else {
                                $tmp["Tipo_error"].="Error al registrar Identificador, ";
                                array_push($estadoTemp['persona'], "Error al registrar Identificador");
                                $estadoTemp['noInsert']++;
                            }
                        } else {
                            $tmp["Tipo_error"].="Error al tratar de insertar nueva persona, ";
                            array_push($estadoTemp['persona'], "Error al tratar de insertar nueva persona");
                            $estadoTemp['noInsert']++;
                        }
                    } else {
                        $tmp["Tipo_error"].="Error al tratar de insertar nueva persona, ";
                        array_push($estadoTemp['persona'], "Error al tratar de insertar nueva persona");
                        $estadoTemp['noInsert']++;
                    }
                }

                ////Revisar si existen el rol 'Profesor' registrado
                $sql = "SELECT * FROM roles WHERE Nombre='Profesor'";
                if ($result = mysqli_query($con, $sql)) {
                    if (mysqli_num_rows($result)==1) {
                        $ID = mysqli_fetch_assoc($result);
                        $ID = (int) $ID['ID'];
                        //array_push($estadoTemp['persona'],"Ya existe rol 'Profesor'");
                    } else{
                        $sql= "INSERT INTO roles (Nombre, Activo) VALUES ('Profesor', 1)";
                        if ($result=mysqli_query($con, $sql)) {
                            $sql = "SELECT * FROM roles WHERE Nombre='Profesor'";
                            $ID = mysqli_fetch_assoc(mysqli_query($con,$sql));
                            $ID = (int) $ID['ID'];
                            //array_push($estadoTemp['persona'], "Rol'Profesor'registrado correctamente");
                        } else {
                            $tmp["Tipo_error"].="Error al registrar rol Profesor, ";
                            array_push($estadoTemp['persona'], "Error al registar rol 'Profesor'");
                            $estadoTemp['noInsert']++;
                        }
                    }
                } else {
                    $tmp["Tipo_error"].="Error al buscar rol Profesor, ";
                    array_push($estadoTemp['persona'], "Error al buscar rol 'Profesor'");
                    $estadoTemp['noInsert']++;
                }
                ////Revisar si existe un rol asignado para un profesor
                $sql = " SELECT * FROM asignacion_roles WHERE ID_Persona = '$idPersona' ";
                if ($rolAsignado = mysqli_query($con, $sql)) {
                    if (mysqli_num_rows($rolAsignado) == 0) {
                        $sql = " INSERT INTO asignacion_roles (ID_Rol, ID_Persona) VALUES ('$ID', '$idPersona') ";
                        if (mysqli_query($con, $sql)) {
                            //array_push($estadoTemp['asignacion'], "asignacion_rol registrado correctamente");
                        } else {
                            $tmp["Tipo_error"].="Error al registrar asignacion-rol, ";
                            array_push($estadoTemp['asignacion'], "eor al registrar asignacion_Rol");
                            $estadoTemp['noInsert']++;
                        }
                    } else {
                        $sql = " UPDATE asignacion_roles SET ID_Rol='$ID' WHERE ID_Persona='$idPersona' ";
                        if (mysqli_query($con, $sql)) {
                            //array_push($estadoTemp['asignacion'], "asignacion_Rol actualizado");
                        } else {
                            $tmp["Tipo_error"].="Error al actualizar asignacion-rol, ";
                            array_push($estadoTemp['asignacion'], "Error al actualizar asignacion_Rol");
                            $estadoTemp['noInsert']++;
                        }
                    }
                } else {
                    $tmp["Tipo_error"].="Error al buscar asignacion-rol, ";
                    array_push($estadoTemp['persona'], "Error al buscar asignacion_rol");
                    $estadoTemp['noInsert']++;
                }
            } else {
                $tmp["Tipo_error"].="Error al buscar persona por NSS, ";
                array_push($estadoTemp['persona'], "Error al buscar Persona por NSS");
                $estadoTemp['noInsert']++;
            }
            /////////////////////////////////////////////////////////////Registrar asignaciones
            ////Conocer el espacio o salon
            $salon = "";
            for ($x = 0; $x < count($diaSemana); $x++) {
                if ($asignacion[$diaSemana[$x]]['salon'] != "") {
                    $salon = $asignacion[$diaSemana[$x]]['salon'];
                    break;
                }
            }
            if ($salon != "") {
                ////Verificar que exista un salon si no se registra uno nuevo
                $sql = " SELECT ID FROM espacios WHERE Nombre = '$salon' ";
                if ($espacio = mysqli_query($con, $sql)) {
                    //SI el espacio ya existe se cambia su estatus de Activo a 1
                    //ELSE se registra uno nuevo
                    if (mysqli_num_rows($espacio) != 0) {
                        //array_push($estadoTemp['asignacion'], "Espacio " . $salon . " ya existe");
                        while ($row = mysqli_fetch_array($espacio)) {
                            $sql = " UPDATE espacios set Activo = 1 WHERE ID='$row[ID]' ";
                            mysqli_query($con, $sql);
                            $idEspacio = $row['ID'];
                        }
                    } else {
                        $sql = "INSERT INTO espacios (Nombre, Capacidad, ID_Tipo) VALUES ('$salon', ' ', 1) ";
                        if (mysqli_query($con, $sql)) {
                            //array_push($estadoTemp['asignacion'], "Nuevo Espacio Resgistrado: " . $salon);
                            $idEspacio = mysqli_insert_id($con);
                        } else {
                            $tmp["Tipo_error"].="Error al tratar de registrar nuevo espacio, ";
                            array_push($estadoTemp['asignacion'], "Error al tratar de registrar nuevo espacio");
                            $estadoTemp['noInsert']++;
                        }
                    }
                } else {
                    $tmp["Tipo_error"].="Error al buscar espacio, ";
                    array_push($estadoTemp['asignacion'], "Error al buscar espacio");
                    $estadoTemp['noInsert']++;
                }
                ////Verificar que la fecha de inicio y fin esten en formato Ingles.
                if ((bool)strtotime($asignacion['fechaInicio']) && (bool)strtotime($asignacion['fechaInicio'])) {
                    $tempFI = explode("/", $asignacion['fechaInicio'], 3);
                    $tempFF = explode("/", $asignacion['fechaFin'], 3);
                    if (checkdate($tempFI[0], $tempFI[1], $tempFI[2]) && checkdate($tempFF[0], $tempFF[1], $tempFF[2])) {
                        ////Verificar si existe una asignacion
                        $sql = "SELECT asig.ID as id, asig.FechaInicio as fechaInicio, asig.FechaFin as fechaFin, asig.ID_Persona as id_p FROM asignaciones AS asig
                                 INNER JOIN servicios AS ser ON asig.ID_Servicio = ser.ID
                                 WHERE CRN = '{$asignacion['crn']}'
                                 AND ser.Codigo = '{$asignacion['materia']}'
                                 AND ser.Nivel = '{$asignacion['nivel']}'
                                 AND asig.Activo = 1";                                                                  
#echo "-----------------------------------------------------\n" . $sql . "\n";
                        if ($asignation = mysqli_query($con, $sql)) {                           
                            if (mysqli_num_rows($asignation) != 0) {
                                $p=mysqli_fetch_array($asignation);
                                $sol="SELECT NSS as nss FROM personas WHERE ID = '{$p['id_p']}'";               
                                if($nssQ=mysqli_query($con,$sol)){                                                                      
                                    $requ="SELECT * FROM detalle_asignacion WHERE ID_Asignacion = '{$p['id']}'";
#echo $requ . "\n";
                                    $changes="Cambios: </br>";     
                                    $changesAH="";
                                    $changesNH="";                                                          
                                    $changeFlag=false;     

                                    if($res=mysqli_query($con,$requ)){                                
                                    
                                        $field=array("fechaInicio","fechaFin");
                                        foreach ($field as $value){ 
                                            $date=date_create($p[$value]);
                                            $date=date_format($date,"m/d/Y");
                                            $date2=date("m/d/Y", strtotime($asignacion[$value]));     
#echo $p[$value]."--\n";
#echo $asignacion[$value]."--\n";                                                  
#echo $date."++\n";
#echo $date2."++\n";                                        
                                          if($date2 != $date){
                                              $changeFlag=true;
                                              $changes.= $date." -> ".$date2."</br>";
                                          }
                                        }
                                        $Nss=mysqli_fetch_array($nssQ); 
                                        if ($asignacion["nss"] != $Nss["nss"]) {
                                          $changeFlag=true;
                                          $changes.= $Nss["nss"]." -> ".$asignacion[$value]."</br>";
                                        }

                                        $diasSemana = array('L','M','Mi','J','V','S','D');
                                        $diasAsignacion = array('L' => array('hi' =>'','hf' =>''),'M' => array('hi' =>'','hf' =>''),'Mi' => array('hi' =>'','hf' =>''),'J' => array('hi' =>'','hf' =>''),'V' => array('hi' =>'','hf' =>''),'S' => array('hi' =>'','hf' =>''),'D' => array('hi' =>'','hf' =>''));                                        
                                        $aHorario = $diasAsignacion;   

                                        $changesNH.="Nuevo horario:</br>";
                                        for ($x = 0; $x < count($diaSemana); $x++) {
                                            if ($asignacion[$diaSemana[$x]]['hi'] != "" || $asignacion[$diaSemana[$x]]['hf'] != "") {
                                                if ($x == 2) $dia = strtoupper($diaSemana[$x][0]) . $diaSemana[$x][1];
                                                else $dia = strtoupper($diaSemana[$x][0]);
                                                $diasAsignacion[$dia]['hi'] = $asignacion[$diaSemana[$x]]['hi'].":00";
                                                $diasAsignacion[$dia]['hf'] = $asignacion[$diaSemana[$x]]['hf'].":00";
                                                
                                            } else continue;
                                        }          
            
                                        $changesAH.="Horario anterior:</br>";  
                                        while($row=mysqli_fetch_array($res)){
                                            $rowDay = $row['Dia'];
                                            $aHorario[$rowDay]['hi'] = $row['HoraInicio'];
                                            $aHorario[$rowDay]['hf'] = $row['HoraFin'];
                                            $changesAH.="Hi: ".$aHorario[$rowDay]['hi']." Hf: ".$aHorario[$rowDay]['hf']."</br>";
                                            if($row['HoraInicio'] != $diasAsignacion[$rowDay]['hi'] || $row['HoraFin'] != $diasAsignacion[$rowDay]['hf']){
                                                $changeFlag=true;
                                                $changesNH.=$rowDay." - Hi: ".$row['HoraInicio']."Hf: ".$row['HoraFin']."</br>Hi: ".$diasAsignacion[$rowDay]['hi']." Hf: ".$diasAsignacion[$rowDay]['hf']."</br>";
                                            }
                                        }
                                                                 
                                        foreach ($diasSemana as $Day) {
#echo $Day . "        " . $aHorario[$Day]['hi'] . "-----" . $diasAsignacion[$Day]['hi'] ."********". $aHorario[$Day]['hf'] ."-------". $diasAsignacion[$Day]['hf'] . "\n";
                                            if ($aHorario[$Day]['hi'] != $diasAsignacion[$Day]['hi'] or $aHorario[$Day]['hf'] != $diasAsignacion[$Day]['hf']) {
                                                $changeFlag=true;
                                            }                                        
                                        }
                                    }else{
                                        array_push($estadoTemp['asignacion'], "Error al cargar detalles de asignación");
                                        $estadoTemp['noInsert']++;                                        
                                    }
                                    if ($changeFlag) {
                                        $yesterday=date("Y-m-d", strtotime( '-1 days' ) );
                                        $today=date("Y-m-d", strtotime( '0 days' ) );
                                        $sql="UPDATE asignaciones SET Activo = 0, FechaFin = '$yesterday'  WHERE ID = '{$p['id']}'";                                                                                   
                                        if (mysqli_query($con,$sql)) {
                                            $sql = "INSERT INTO asignaciones (ID_Grupo, ID_Espacio, ID_Servicio, ID_Persona, FechaInicio, FechaFin, Periodo, CRN, ID_Administrativo, Forma) values ('1', '$idEspacio', '$idServicio', '$idPersona', STR_TO_DATE('{$asignacion['fechaInicio']}', '%m/%d/%Y'), STR_TO_DATE('{$asignacion['fechaFin']}', '%m/%d/%Y'), '{$asignacion['periodo']}', '{$asignacion['crn']}', $responsable, 'figpo')";
#echo $sql . "\n";
                                            if (mysqli_query($con,$sql)) {
                                                if ($nID = mysqli_insert_id($con)) {                                             
                                                    for ($x = 0; $x < count($diaSemana); $x++) {
                                                        if ($asignacion[$diaSemana[$x]]['hi'] != "" || $asignacion[$diaSemana[$x]]['hf'] != "") {
                                                            if ($x == 2) $dia = strtoupper($diaSemana[$x][0]) . $diaSemana[$x][1];
                                                            else $dia = strtoupper($diaSemana[$x][0]);
                                                            $sql = "INSERT INTO detalle_asignacion (ID_Asignacion, Dia, HoraInicio, HoraFin) VALUES ('$nID', '$dia', '{$asignacion[$diaSemana[$x]]['hi']}', '{$asignacion[$diaSemana[$x]]['hf']}') ";
                                                            if (mysqli_query($con, $sql)){
                                                                //Correcto
                                                            }else{
                                                                array_push($estadoTemp['asignacion'], "Error al tratar de registrar nuevo Detalle Asignacion dia " . $diaSemana[$x]);
                                                                $estadoTemp['noInsert']++;
                                                            }
                                                        }
                                                    }
                                                    $estadoTemp['update']=true;
                                                    $estadoTemp['changes']=$changes.$changesAH.$changesNH;                                    
                                                } else {
                                                    $tmp["Tipo_error"].="Error al seleccionar asignacion, " ;
                                                    array_push($estadoTemp['asignacion'], "Error al seleccionar asignacion");
                                                    $estadoTemp['noInsert']++;
                                                }
                                            }else{
                                                array_push($estadoTemp['asignacion'], "Error al insertar asignación");
                                                $estadoTemp['noInsert']++;                                        
                                            }                                            
                                        }else{
                                            array_push($estadoTemp['asignacion'], "Error al modificar asignación");
                                            $estadoTemp['noInsert']++;                                        
                                        }
                                    }else{
                                        array_push($estadoTemp['asignacion'], "Ya existe");
                                        $estadoTemp['flag']=true;
                                        $registred++;
                                    }
                                }else{
                                    $tmp["Tipo_error"].="Error al seleccionar NSS, " ;
                                    array_push($estadoTemp['asignacion'], "Error al seleccionar NSS");
                                    $estadoTemp['noInsert']++;
                                }
                            } else {
                                ////Registrar nueva asignacion
                                $sql = "INSERT INTO asignaciones (ID_Grupo, ID_Espacio, ID_Servicio, ID_Persona, FechaInicio, FechaFin, Periodo, CRN, ID_Administrativo, Forma) values ('1', '$idEspacio', '$idServicio', '$idPersona', STR_TO_DATE('{$asignacion['fechaInicio']}', '%m/%d/%Y'), STR_TO_DATE('{$asignacion['fechaFin']}', '%m/%d/%Y'), '{$asignacion['periodo']}', '{$asignacion['crn']}', $responsable, 'figpo')";
#echo "\n".$sql."\n";
                                if (mysqli_query($con, $sql)) {
                                    if ($idAsignacion = mysqli_insert_id($con)) {
                                        //array_push($estadoTemp['asignacion'], "Nueva Asignacion con CRN: " . $asignacion['crn']);
                                    } else {
                                        $tmp["Tipo_error"].="Error al seleccionar asignacion, " ;
                                        array_push($estadoTemp['asignacion'], "Error al seleccionar asignacion");
                                        $estadoTemp['noInsert']++;
                                    }
                                } else {
                                    $tmp["Tipo_error"].="Error al registrar Identificador, ";
                                    array_push($estadoTemp['asignacion'], "Error al tratar de insertar nueva asignacion");
                                    $estadoTemp['noInsert']++;
                                }

                                ////Registrar detalles_asignacion
                                for ($x = 0; $x < count($diaSemana); $x++) {
                                    if ($asignacion[$diaSemana[$x]]['hi'] != "" || $asignacion[$diaSemana[$x]]['hf'] != "") {
                                        if ($x == 2) $dia = strtoupper($diaSemana[$x][0]) . $diaSemana[$x][1];
                                        else $dia = strtoupper($diaSemana[$x][0]);
                                        $sql = "INSERT INTO detalle_asignacion (ID_Asignacion, Dia, HoraInicio, HoraFin) VALUES ('$idAsignacion', '$dia', '{$asignacion[$diaSemana[$x]]['hi']}', '{$asignacion[$diaSemana[$x]]['hf']}') ";
                                        if (mysqli_query($con, $sql)) {
                                            //array_push($estadoTemp['asignacion'], "Dia " . $diaSemana[$x] . " de " . $asignacion[$diaSemana[$x]]['hi'] . " a " . $asignacion[$diaSemana[$x]]['hf'] . " registrado");

                                        } else {
                                            array_push($estadoTemp['asignacion'], "Error al tratar de registrar nuevo Detalle Asignacion dia " . $diaSemana[$x]);
                                            $estadoTemp['noInsert']++;
                                        }
                                    } else continue;
                                }
                            }
                        } else {
                            array_push($estadoTemp['asignacion'], "Error al buscar asignaciones");
                            $estadoTemp['noInsert']++;
                        }
                    } else {
                        array_push($estadoTemp['asignacion'], "Error en el formato de Fecha Inicio o Fecha Fin");
                        $estadoTemp['noInsert']++;
                    }
                } else {
                    array_push($estadoTemp['asignacion'], "Error, Fecha Inicio o Fecha Fin puede que no sean fechas validas");
                    $estadoTemp['noInsert']++;
                }
            } else {
                array_push($estadoTemp['asignacion'], "No existe salón en el registro");
                $estadoTemp['noInsert']++;
            }
            array_push($estadoCarga, $estadoTemp);
            mysqli_close($con);
            if($estadoTemp['noInsert']!=0){
                $noRegistred++;
                $errores_str.="/*/CRN: ".$asignacion['crn']." ".join(", ",$estadoTemp['asignacion']);
            }
        }

    }
    echo json_encode(array("s" => 1, "m" => "Carga correcta de FIGPO", "d" => $getData, "r" => $registred, "nr" => $noRegistred, 't' => $estadoCarga, 'errores' => $errores_str));
}
//Funcion para cargar Administrativos
function cargaAdmin($datos)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;
    global $diaSemana;
    $stopFlag = false; //Variable para controlar el ciclo de asignaciones.
    $rawAsignaciones = array(); //Variable para guardar las asignaciones filtradas, sin procesamiento.
    $finalAsignaciones = array(); //Variable para guardar las asignaciones procesadas y listas para cargar al sistema.
    $errorAsignacion=array();
    $estadoCarga = array(); //Variable para guardar el "log" de la carga de las asignaciones.
    $toProcess = json_decode($datos, true);
    $getErrors= json_decode($_POST['errors'], true);
    $responsable = "NULL";
    if (isset($_POST['responsible'])) {
        $responsable = $_POST['responsible'];
    }
    # TODO: Camios para nueva instancia.
    #  Elementos estaticos:
    #   idServicio = ID del servicio que pertenece a Estancia en Campus
    #   idGrupo = ID del grupo de Administrativos
    #   idEspacio =  ID del espacio con nombre UVM Campus Gdl Sur

    //Recibe los errores encontrados en el parserFIGO
    foreach ($getErrors as $error) {
        $error = array_map('utf8_decode', $error);
        $error = array_map('trim', $error);
        $tempE = array("nss" => $error['nss'], "nombre" => $error['nombre'], "ap" => $error['apellidoP'], "am" => $error['apellidoM'], "detalle" => $error['detalle'], "espacio" => $error['espacio'], "fechaInicio" => $error['fechaInicio'], "fechaFin" => $error['fechaFin'], "periodo" => $error['periodo'], "lunes" => array("hi" => "", "hf" => ""), "martes" => array("hi" => "", "hf" => ""), "miercoles" => array("hi" => "", "hf" => ""), "jueves" => array("hi" => "", "hf" => ""), "viernes" => array("hi" => "", "hf" => ""), "sabado" => array("hi" => "", "hf" => ""), "domingo" => array("hi" => "", "hf" => ""), "tipo_error" => $error['tipo_error']);
        for ($x = 0; $x < count($diaSemana); $x++) {
                if (!empty($error[$diaSemana[$x]])) {
                   $timeArray = explode(" ", $error[$diaSemana[$x]], 2);
                   $tempE[$diaSemana[$x]]['hi'] = $timeArray[0];
                   $tempE[$diaSemana[$x]]['hf'] = $timeArray[1];
                }
            }
        //Guarda errores recibidos del parserFIGPO
        array_push($errorAsignacion, $tempE);
    }
    //Modificar los datos de entrada del POST
    foreach ($toProcess as $data) {
            $data = array_map('utf8_decode', $data);
            $data = array_map('trim', $data);
            //$pattern="/^([0-1][0-9]|[2][0-3])[\:]([0-5][0-9])$/";//Expresion regular para validar la hora de inicio y fin
            $erroresHorario=0;
            $temp = array("nss" => $data['nss'], "nombre" => $data['nombre'], "ap" => $data['apellidoP'], "am" => $data['apellidoM'], "detalle" => $data['detalle'], "espacio" => $data['espacio'], "fechaInicio" => $data['fechaInicio'], "fechaFin" => $data['fechaFin'], "periodo" => $data['periodo'], "lunes" => array("hi" => "", "hf" => ""), "martes" => array("hi" => "", "hf" => ""), "miercoles" => array("hi" => "", "hf" => ""), "jueves" => array("hi" => "", "hf" => ""), "viernes" => array("hi" => "", "hf" => ""), "sabado" => array("hi" => "", "hf" => ""), "domingo" => array("hi" => "", "hf" => ""), "tipo_error" => $data['tipo_error']);
            //Validar Horario 
            for ($x = 0; $x < count($diaSemana); $x++) {
                if (!empty($data[$diaSemana[$x]])) {
                   $timeArray = explode(" ", $data[$diaSemana[$x]], 3);
                   if (empty($timeArray[0])) {
                      $temp['tipo_error'] .= "Error en la captura de horario de ". $diaSemana[$x] . ", ";
                      $temp[$diaSemana[$x]]['hi'] = $timeArray[0];
                      $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                      $erroresHorario++;
                      continue;
                   } else {
                       $temp[$diaSemana[$x]]['hi'] = $timeArray[0];
                       if (empty($timeArray[1])) {
                          $temp['tipo_error'] .= "Error en la captura de horario de ". $diaSemana[$x] . ", ";
                          $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                          $erroresHorario++;
                          continue;
                       } else {
                           $temp[$diaSemana[$x]]['hf'] = $timeArray[1];
                           if (strtotime($timeArray[0]) > strtotime($timeArray[1])) {
                              $temp['tipo_error'].="".$diaSemana[$x]. "La hora de entrada es mayor a la hora de salida, ";
                              $erroresHorario++;
                              continue;
                           }
                       }
                   }
                }
            }
            //Validar formato de fecha
            $tempFI = explode("/", $temp['fechaInicio'], 3);
            $tempFF = explode("/", $temp['fechaFin'], 3);
            $eFI=true;
            $eFF=true;
            if (!checkdate($tempFI[0], $tempFI[1], $tempFI[2])) {
               $temp['Tipo_error'] .= "Formato de Fecha de Inicio incorrecto, ";
               $eFI=false;
            }
            if (!checkdate($tempFF[0], $tempFF[1], $tempFF[2])) {
                  $eFF=false;
                  $temp['Tipo_error'] .= "Formato de Fecha de Fin incorrecto, ";
            }
            if ($erroresHorario!=0 || $eFI==false || $eFF==false ) {
               array_push($errorAsignacion, $temp);
            } else {
               array_push($finalAsignaciones, $temp);
            }
            //Gardar en la variable arrayAsignaciones los registros que pasaron el filtro con la informacion que nos interesa.
            //array_push($finalAsignaciones, $temp);
    }
    if (count($errorAsignacion)!=0) {
       echo json_encode(array("s" =>0, "m" => "Error al cargar FIGPO, el archivo contiene errores", "d" => $errorAsignacion));
    } else {
        if (!$con = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
           die("Error de conexion");
        } else {
            //$rows=count($finalAsignaciones);
            foreach ($finalAsignaciones as $key => $asignacion) {
               $idPersona = 0;
               $idAsignacion = 0;
               $estadoTemp = "";
               ////////////////////////////////////////////////////////////////////////////////Verificar si existe una persona
               ////Si hay concidencia en la busqueda de la persona por NSS
               $sql = " SELECT ID FROM personas WHERE NSS = '{$asignacion['nss']}' ";
               if ($personaNSS = mysqli_query($con, $sql)) {
                  //SI la persona ya existe => Actualizar el campo Activo a 1
                  //ELSE => Insertar en la base de datos.
                  if (mysqli_num_rows($personaNSS) != 0) {
                     $estadoTemp .= "Persona: <b>" . $asignacion['nss'] . "</b> ya existe <br>";
                     while ($row = mysqli_fetch_array($personaNSS)) {
                           mysqli_query($con, "UPDATE personas SET Activo = 1, Detalle = '{$asignacion['detalle']}'  WHERE ID = '$row[ID]' ");
                           $idPersona = $row['ID'];
                     }
                  } else {
                      $sql = " INSERT INTO personas (NSS, Nombre, ApellidoP, ApellidoM, Detalle) VALUES ('{$asignacion['nss']}', '{$asignacion['nombre']}', '{$asignacion['am']}', '{$asignacion['ap']}', '{$asignacion['detalle']}')";
                     if (mysqli_query($con, $sql)) {
                         if ($idPersona = mysqli_insert_id($con)) {
                            $estadoTemp .= "Nueva Persona Resgistrada: <b>" . $asignacion['nss'] . "</b> <br>";
                            $sql = " INSERT INTO identificador (ID_Persona, ID1) VALUES ('$idPersona', '{$asignacion['nss']}') ";
                            if (mysqli_query($con, $sql)) {
                                $estadoTemp .= "&emsp;Identificador registrado correctamente <br>";
                            } else {
                                $estadoTemp .= "&emsp;Error al registrar Identificador <br>";
                            }
                        } else {
                            $estadoTemp .= "Error al tratar de insertar nueva persona <br>";
                        }
                    } else {
                        $estadoTemp .= "Error al tratar de insertar nueva persona <br>";
                    }
                }

                ////Registra Area en la tabla servicios.
                $sql="SELECT ID FROM servicios where Titulo='{$asignacion['detalle']}' ";
                if ($result = mysqli_query($con,$sql)) {
                    if (mysqli_num_rows($result)!=0) {
                        $service = mysqli_fetch_assoc($result);
                        $service = (int) $service['ID'];
                        $estadoTemp .= "Servicio ".$asignacion['detalle']. " ya existe <br>";
                    } else {
                        $sql="INSERT INTO servicios (Codigo, Titulo, ID_Tipo_Servicio, Departamento, Nivel, Activo) VALUES ('AD', '{$asignacion['detalle']}', 1, 'Administrativo', 'AD', 1)";
                        if (mysqli_query($con,$sql)){
                            $sql="SELECT ID FROM servicios where Titulo='{$asignacion['detalle']}' ";
                            $service=mysqli_fetch_assoc(mysqli_query($con,$sql));
                            $service = (int) $service['ID'];
                            $estadoTemp .= "Nuevo servicio registrado: [".$asignacion['detalle']."]";
                        } else {
                            $estadoTemp .= "Error al registrar nuevo servicio";
                        }
                    }
                } else {
                    $estadoTemp .= "Error al buscar servicio";
                }
                ////Revisar si existe un espacio registrado
                $sql = "SELECT ID FROM espacios WHERE Nombre='{$asignacion['espacio']}' ";
                if ($result= mysqli_query($con, $sql)) {
                    if (mysqli_num_rows($result)==1){
                        $place=mysqli_fetch_assoc($result);
                        $place= (int) $place['ID'];
                        $estadoTemp.= "Ya existe el espacio ".$asignacion['espacio'].".";
                    } else {
                        $sql = "INSERT INTO espacios (Nombre, Capacidad, ID_Tipo, Activo) VALUES ('{$asignacion['espacio']}', 0, 6, 1)";
                        if (mysqli_query($con,$sql)) {
                            $sql="SELECT ID FROM espacios WHERE Nombre='{$asignacion['espacio']}' ";
                            $place=mysqli_fetch_assoc(mysqli_query($con, $sql));
                            $place= (int) $place['ID'];
                            $estadoTemp .= "Nuevo espacio ".$asignacion['espacio']." registrado";
                        } else {
                            $estadoTemp .= "Error al registrar el espacio ".$asignacion['espacio'].".";
                        }
                    }
                } else {
                    $estadoTemp.= "Error en la busqueda de espacio";
                }
                ////Revisar si existen el rol 'Administrativo' registrado
                $sql = "SELECT ID FROM roles WHERE Nombre='Administrativo'";
                if ($result= mysqli_query($con, $sql)) {
                    if (mysqli_num_rows($result)==1){
                        $ID = mysqli_fetch_assoc($result);
                        $ID = (int) $ID['ID'];
                        $estadoTemp .= "Ya existe rol ".$ID .".";
                    } else{
                        $sql= "INSERT INTO roles (Nombre, Activo) VALUES ('Administrativo', 1)";
                        if (mysqli_query($con, $sql)) {
                            $sql = "SELECT ID FROM roles WHERE Nombre='Administrativo'";
                            $ID = mysqli_fetch_assoc(mysqli_query($con,$sql));
                            $ID = (int) $ID['ID'];
                            $estadoTemp .= "Rol 'Administrativo' registrado correctamente";
                        } else {
                            $estadoTemp .= "Error al registar Rol 'Administrativo'";
                        }
                    }
                } else {
                    $estadoTemp .= "Error al buscar rol 'Administrativo'";
                }
                ////Revisar si existe un rol asignado para un Administrativo
                $sql = " SELECT * FROM asignacion_roles WHERE ID_Persona = '$idPersona' ";
                if ($rolAsignado = mysqli_query($con, $sql)) {
                    if (mysqli_num_rows($rolAsignado) == 0) {
                        $sql = " INSERT INTO asignacion_roles (ID_Rol, ID_Persona) VALUES ('$ID', '$idPersona') ";
                        if (mysqli_query($con, $sql)) {
                            $estadoTemp .= "&emsp;Rol registrado correctamente <br>";
                        } else {
                            $estadoTemp .= "&emsp;Error al registrar Rol <br>";
                        }
                    } else {
                        $sql = " UPDATE asignacion_roles SET ID_Rol='$ID' WHERE ID_Persona='$idPersona' ";
                        if (mysqli_query($con, $sql)) {
                            $estadoTemp .= "&emsp;Rol actualizado <br>";
                        } else {
                            $estadoTemp .= "&emsp;Error al actualizar Rol <br>";
                        }
                    }
                } else {
                    $estadoTemp .= "&emsp;Error al buscar Roles <br>";
                }
                ////Revisar si existe grupo 'Administrativos'
                $sql="SELECT ID FROM grupos where Nombre='Administrativos'";
                if ($result=mysqli_query($con,$sql)) {
                    if (mysqli_num_rows($result)==1) {
                        $group = mysqli_fetch_assoc($result);
                        $group = (int) $group['ID'];
                        $estadoTemp .= "Grupo 'Administrativos' ya existe";
                    } else {
                        $sql="INSERT INTO grupos (Nombre, ID_Rol, Activo) VALUES ('Administrativos', '$ID', 1)";
                        if (mysqli_query($con,$sql)) {
                            $sql = "SELECT ID FROM grupos where Nombre='Administrativos'";
                            $group = mysqli_fetch_assoc(mysqli_query($con, $sql));
                            $group = (int) $group['ID'];
                            $estadoTemp .= "Grupo 'Administrativos' registrado correctamente";
                        } else {
                            $estadoTemp .= "Error al registrar grupo";
                        }
                    }
                } else {
                    $estadoTemp .= "Error al buscar grupo 'Administrativos'";
                }

            } else {
                $estadoTemp .= "&emsp;Error al buscar Persona por NSS <br>";
            }
            /////////////////////////////////////////////////////////////Registrar asignaciones
            ////Verificar que la fecha de inicio y fin esten en formato Ingles.
            if ((bool)strtotime($asignacion['fechaInicio']) && (bool)strtotime($asignacion['fechaInicio'])) {
                $tempFI = explode("/", $asignacion['fechaInicio'], 3);
                $tempFF = explode("/", $asignacion['fechaFin'], 3);
                if (checkdate($tempFI[0], $tempFI[1], $tempFI[2]) && checkdate($tempFF[0], $tempFF[1], $tempFF[2])) {
                    ////Verificar si existe una asignacion
                    $sql = " SELECT asig.ID FROM asignaciones AS asig
                         INNER JOIN servicios AS ser ON asig.ID_Servicio = ser.ID
                         INNER JOIN personas AS per on asig.ID_Persona = per.ID
                         WHERE ser.ID = '$service' AND per.NSS = '{$asignacion['nss']}'
                         AND Periodo = '{$asignacion['periodo']}'
                         AND FechaInicio = STR_TO_DATE('{$asignacion['fechaInicio']}', '%m/%d/%Y')
                         AND FechaFin = STR_TO_DATE('{$asignacion['fechaFin']}', '%m/%d/%Y') ";
                    if ($asignation = mysqli_query($con, $sql)) {
                        if (mysqli_num_rows($asignation) != 0) {
                            $estadoTemp .= "AsignaciÃ³n ya registrada <br>";
                        } else {
                            ////Registrar nueva asignacion
                            $sql = "INSERT INTO asignaciones (ID_Grupo, ID_Espacio, ID_Servicio, ID_Persona, FechaInicio, FechaFin, Periodo, CRN, ID_Administrativo, Forma) values ('$group', '$place', '$service', '$idPersona', STR_TO_DATE('{$asignacion['fechaInicio']}', '%m/%d/%Y'), STR_TO_DATE('{$asignacion['fechaFin']}', '%m/%d/%Y'), '{$asignacion['periodo']}', '', $responsable, 'figpo') "; //'{$asignacion['periodo']}', '{$asignacion['crn']}')";
                            if (mysqli_query($con, $sql)) {
                                if ($idAsignacion = mysqli_insert_id($con)) {
                                    $estadoTemp .= "Nueva Asignacion <br>";
                                } else {
                                    $estadoTemp .= "Error al seleccionar asignacion <br>";
                                }
                            } else {
                                $estadoTemp .= "Error al tratar de insertar nueva asignacion <br>";
                            }

                            ////Registrar detalles_asignacion
                            for ($x = 0; $x < count($diaSemana); $x++) {
                                if ($asignacion[$diaSemana[$x]]['hi'] != "" || $asignacion[$diaSemana[$x]]['hf'] != "") {
                                    if ($x == 2) $dia = strtoupper($diaSemana[$x][0]) . $diaSemana[$x][1];
                                    else $dia = strtoupper($diaSemana[$x][0]);
                                    $sql = "INSERT INTO detalle_asignacion (ID_Asignacion, Dia, HoraInicio, HoraFin) VALUES ('$idAsignacion', '$dia', '{$asignacion[$diaSemana[$x]]['hi']}', '{$asignacion[$diaSemana[$x]]['hf']}') ";
                                    if (mysqli_query($con, $sql)) {
                                        $estadoTemp .= "&emsp;Dia <b>" . $diaSemana[$x] . "</b> de <b>" . $asignacion[$diaSemana[$x]]['hi'] . "</b> a <b>" . $asignacion[$diaSemana[$x]]['hf'] . "</b> registrado <br>";

                                    } else {
                                        $estadoTemp .= "&emsp;Error al tratar de registrar nuevo Detalle Asignacion <br>";
                                    }
                                } else continue;
                            }
                        }
                    } else {
                        $estadoTemp .= "Error al buscar asignaciones <br>";
                    }
                } else {
                    $estadoTemp .= "Error en el formato de Fecha Inicio o Fecha Fin<br>";
                }
            } else {
                $estadoTemp .= "Error en el formato de Fecha Inicio o Fecha Fin<br>";
            }

            $estadoTemp .= "<hr>";
            array_push($estadoCarga, $estadoTemp);
        }
        echo json_encode(array("s" => 1, "m" => "Carga correcta de Administrativos", "d" => $estadoCarga));
    }

  }
    mysqli_close($con);
}
