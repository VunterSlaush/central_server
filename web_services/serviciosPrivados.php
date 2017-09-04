<?php
session_start();
include("conf.php");
include("libreria.php");
header("Content-Type: application/json; charset=utf-8");

global $base;
global $MY_SESSION_ADMIN;
global $MY_SESSION_PERSON;
global $MY_SESSION_ACCESS;
global $MY_SESSION_ID;
global $menuDashboard;

//Verifica si existe una sesión, si no existe ofrece la posibilidad de poder iniciar una.
if (!isset($_SESSION[$MY_SESSION_ADMIN])) {
    if ($_POST["ws"] == "login") {
        $user = $_POST["usuario"];
        $password = $_POST["password"];
        if (($user == '') || ($password == ''))
            echo json_encode(array("s" => 0, "m" => "Usuario o Contraseña Vacía"));
        else {
            $estado = verificarUsuario($user, $password);
            if ($estado['session']) {
                $_SESSION[$MY_SESSION_ADMIN] = time();
                $_SESSION[$MY_SESSION_PERSON] = $estado['person'];
                $_SESSION[$MY_SESSION_ACCESS] = $estado['access'];
                error_log("SETEANDO ACCESSOS". $estado['access'],0);
                $_SESSION[$MY_SESSION_ID] = $estado['id_person'];
                echo json_encode(array("s" => 1, "m" => "Login Correcto"));
            } else
                echo json_encode(array("s" => 0, "m" => "Usuario o Contraseña Incorrecta"));
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

        case "aAdmin":
            aAdmin();
            break;
        case "dAdmin":
            dAdmin();
            break;
        case "mAdmin":
            mAdmin();
            break;
        case "ConsultAccess":
            ConsultAccess();
            break;
        case "ConsultAdmin":
            GetAdmins();
            break;
        case "GetAdmins":
            GetAdmins();
            break;
        case "noticias":
            noticias();
            break;
        case "eNoticia":
              eNoticia($_POST["id"]);
              break;
        case "roles":
            roles();
            break;
        case "aRol":
            aRol($_POST["nuevoRol"]);
            break;
        case "mRol":
            mRol($_POST["idr"], $_POST["nombre"]);
            break;
        case "eRol":
            eRol($_POST["idr"], $_POST["delGrupo"]);
            break;

        case "grupos":
            grupos();
            break;
        case "aGrupo":
            aGrupo($_POST["nuevoGrupo"]);
            break;
        case "mGrupo":
            mGrupo($_POST["idg"], $_POST["nombre"]);
            break;
        case "eGrupo":
            eGrupo($_POST["idg"]);
            break;
        case "miembros":
            gMiembros($_POST["idg"]);
            break;
        case "misGrupos":
            misGrupos($_POST["idp"]);
            break;
        case "ePdGrupo":
            ePdGrupo($_POST["idg"], $_POST["idp"]);
            break;
        case "checkDeletePerson":
            checkDeletePerson($_POST["idg"], $_POST["idp"]);
            break;
        case "aPaGrupo":
            aPaGrupo($_POST["idg"], $_POST["idp"]);
            break;
        case "aPsaGrupo":
            aPsaGrupo($_POST["idg"], $_POST["idps"]);
            break;
        case "GruposDispositivo":
            gruposDispositivo($_POST["idd"]);
            break;

        case "lPersona":
            lPersona();
            break;
        case "lPersonaId":
            lPersonaId($_POST["idp"]);
            break;
        case "mPersona":
            mPersona($_POST["idp"]);
            break;
        case "aPersona":
            aPersona();
            break;
        case "ePersona":
            ePersona($_POST["idp"]);
            break;

        case "lEspacio":
            lEspacio();
            break;
        case "mEspacio":
            mEspacio($_POST["ide"], $_POST["nombre"], $_POST["capacidad"], $_POST["tipo"]);
            break;
        case "aEspacio":
            aEspacio($_POST["nombre"], $_POST["capacidad"], $_POST["tipo"]);
            break;
        case "eEspacio":
            eEspacio($_POST["ide"]);
            break;
        case "tEspacio":
            tEspacio();
            break;

        case "lServicio":
            lServicio();
            break;
        case "mServicio":
            mServicio($_POST["ids"], $_POST["titulo"], $_POST["idtipo"], $_POST["departamento"], $_POST["codigo"], $_POST["nivel"]);
            break;
        case "aServicio":
            aServicio($_POST["titulo"], $_POST["idtipo"], $_POST["departamento"], $_POST["codigo"], $_POST["nivel"]);
            break;
        case "eServicio":
            eServicio($_POST["ids"]);
            break;
        case "tServicio":
            tServicio();
            break;

        case "consultDias":
            consultDias();
            break;
        case "getLevels":
            getLevels();
            break;
        case "modifyDay":
            modifyDay($_POST["fecha"], $_POST["niveles"]);
            break;
        case "addDay":
            addDay($_POST["fecha"], $_POST["niveles"]);
            break;
        case "deleteDay":
            deleteDay($_POST["fecha"]);
            break;

        case "lAsignacion":
            lAsignacion();
            break;
        case "lAsignacion_Persona":
            lAsignacionPersona($_POST["idP"]);
            break;
        case "mAsignacion":
            mAsignacion($_POST["ida"], $_POST["idGrupo"], $_POST["idEspacio"], $_POST["idServicio"], $_POST["idPersona"], $_POST["fechaInicio"], $_POST["fechaFin"], $_POST["crn"], $_POST["periodo"]);
            break;
        case "cAsignacion":
            cAsignacion($_POST["idGrupo"], $_POST["idEspacio"], $_POST["idServicio"], $_POST["idPersona"], $_POST["fechaInicio"], $_POST["fechaFin"], $_POST["crn"], $_POST["periodo"]);
            break;
        case "eAsignacion":
            eAsignacion($_POST["ida"]);
            break;
        case "dAsignacion":
            dAsignacion($_POST["ida"]);
            break;
        case "hAsignacion":
            hAsignacion($_POST["ida"], $_POST["detalle"]);
            break;

        case "reporte" :
            reporte($_POST['tipo'], $_POST['dato'], $_POST['fi'], $_POST['ff']);
            break;

        case "getIncidencias" :
            getIncidencias($_POST['nss'], $_POST['fecha']);
            break;

        /*case "incidencias":
            dIncidencias($_POST["nss"], $_POST["dia"]);
            break;*/

        case "aAcceso":
            echo json_encode(array("s" => 1, "m" => "Info Acceso", "d" => array("persona" => $_SESSION[$MY_SESSION_PERSON], "id" => $_SESSION[$MY_SESSION_ID], "menus" => $menuDashboard)));
            break;

        case "login":
            echo json_encode(array("s" => 0, "m" => "Ya se inició la sesión"));
            break;

        case "logout":
            unset($_SESSION[$MY_SESSION_ADMIN]);
            unset($_SESSION[$MY_SESSION_PERSON]);
            unset($_SESSION[$MY_SESSION_ACCESS]);
            unset($_SESSION[$MY_SESSION_ID]);

            echo json_encode(array("s" => 1, "m" => "Sesíon Cerrada"));
            break;

        case "test":
            test();
            break;

        case "getDevice":
            getDevice();
            break;

        case "getPubImp":
            getPubImp($_POST['data']);
            break;

        case "getPubCarr":
            getPubCarr($_POST['data']);
            break;

        case "aDispositivo":
            aDispositivo();
            break;

        case "acDispositivo":
            acDispositivo();
            break;

        case "mDispositivo":
            mDispositivo();
            break;

        case "eDispositivo":
            eDispositivo();
            break;

        case "rDispositivo":
            rDispositivo();
            break;

        case "setImpacto":
            setImpacto();
            break;

        case "setCarrusel":
            setCarrusel();
            break;

        case "sessionChk":
            echo json_encode(array("s" => 1, "m" => "Sesion vigente"));
            break;

        case "piscinas":
          piscinas();
        break;

        case "aPiscina":
          aPiscina($_POST['temperatura']);
        break;

        case "ePiscina":
          ePiscina($_POST['id']);
        break;

        case "piscinaActual":
          piscinaActual();
        break;
        default:
            echo json_encode(array("s" => 0, "m" => "El servicio no existe"));
            break;
    }
}
