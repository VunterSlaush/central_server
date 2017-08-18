<?php
session_start();
include("conf.php");
header("Content-Type: application/json; charset=utf-8");
global $servidor;
global $base;
global $usuarioBD;
global $pass;

/**
 * Created by IntelliJ IDEA.
 * User: cesar
 * Date: 7/01/16
 * Time: 10:13 AM
 */
switch ($_GET['tipo']) {
    case 'publicidad':
        $get= array_keys($_GET);
        $id=$get[0];
        $dir = $_SERVER["DOCUMENT_ROOT"].dirname($_SERVER['PHP_SELF'])."/"."../checador/img/publicidad/";
        foreach ($_FILES as $imagen) {
            // Se establece el fichero con el nombre original
            $newImagen = $dir."".$imagen["name"];
            $tamano=getimagesize($imagen['tmp_name']);
            //Validar que la resolucion de a imagen sea 1024px por 768px
            if($tamano[0]!=1025 && $tamano[1]!=769){
                echo json_encode(array("s"=>0, "m"=>"La imagen no cumple con la resolucion aceptada (1024 x 768)"));
                continue;
            } else {
                // Si el archivo ya existe, no lo guardamos
                if (file_exists($newImagen)){
                    echo json_encode(array('s' => 0, 'm' => 'Ya hay una imagen registrada con el mismo nombre'));
                } else{
                    // Copiamos de la dirección temporal al directorio final
                    if (filesize($imagen["tmp_name"])) {
                        if (!(move_uploaded_file($imagen["tmp_name"], $newImagen))) {
                            echo json_encode(array("s"=>0, "m"=>"Error al subir imagen"));
                        } else {
                            chmod($newImagen, 0666);
                            if (!$con = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
                                echo("Error de conexion");
                            } else {
                                $sql = "SELECT * FROM publicidad where Ruta='{$imagen['name']}'";
                                if ($publicidad = mysqli_query($con, $sql)) {
                                    if (mysqli_num_rows($publicidad) != 0) {
                                        echo json_encode(array('s' => 0, 'm' => 'Ya hay una imagen registrada con el mismo nombre'));
                                    } else {
                                        $sql = "INSERT INTO publicidad (Ruta, Owner, Activo) VALUES ('{$imagen['name']}','uvmSICH.co','1') ";
                                        if (mysqli_query($con, $sql)) {
                                            $id=mysqli_insert_id();
                                            echo json_encode(array('s' => 1, 'm' => 'Imagen agregada correctamente', 'd'=>$id));
                                        } else {
                                            echo json_encode(array('s' => 0, 'm' => 'No se pudo agregar la imagen'));
                                        }
                                    }
                                } else {
                                    echo json_encode(array('s' => 0, 'm' => 'Error al buscar imagenes de publicidad'));
                                }
                            }
                        }

                    }
                }
            }
        }
        break;
    case 'Inicio':
        $get= array_keys($_GET);
        $id=$get[0];
        $dir = $_SERVER["DOCUMENT_ROOT"].dirname($_SERVER['PHP_SELF'])."/"."../checador/img/base/";
        foreach ($_FILES as $imagen) {
            // Se establece el fichero con el nombre original
            $newImagen = $dir."".$imagen["name"];
            $tamano=getimagesize($imagen['tmp_name']);
           // $find(explode(".",$dir."".$imagen['name']));
            //Validar que la resolucion de a imagen sea 1024px por 768px
            if($tamano[0]<1024 && $tamano[1]<768 && $tamano[0]>1025 && $tamano[1]>769){
                echo json_encode(array("s"=>0, "m"=>"La imagen no cumple con la resolucion aceptada (1024 x 768)"));
                continue;
            } else {
                if (filesize($imagen["tmp_name"])) {
                    if (!(move_uploaded_file($imagen["tmp_name"], $newImagen))) {
                        echo json_encode(array("s"=>0, "m"=>"Error al subir imagen"));
                    } else {
                        chmod($newImagen, 0666);
                        if (unlink($dir."checador_fondo.png")) {
                            rename($newImagen,$dir."checador_fondo.png");
                            echo json_encode(array('s' => 1, 'm' => 'Imagen agregada correctamente'));
                        }else{
                            echo json_encode(array('s' => 0, 'm' => 'Error al cambiar imagen.'));
                        }
                    }
                }                
            }
        }
        break;
}
