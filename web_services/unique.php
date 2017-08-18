<?php
ini_set('max_execution_time', 0);
include("conf.php");
include("libreria.php");
header("Content-Type: text/html; charset=utf-8");

$file = fopen("personas.csv","r");

$c = 0;
$u = 0;
$e = array("err"=>0, "text"=>array());
while(!feof($file)){
	$c++;
	$temp = fgetcsv($file);
    $sql = " SELECT ID FROM personas WHERE NSS = '".$temp[0]."' ";
    $r = ejecutaSQL($sql);
    if (mysql_num_rows($r) == 1){
    	$id = mysql_result($r, 0,"ID");
          //Agrega los identificadores a la tabla identificador
        $sql = " INSERT INTO identificador VALUES (".$id.", '".$temp[0]."', '', '' ) ";
        if(insertaSQL($sql)==0){
        	$e['err']++;
        	array_push($e['text'], "No se asigno el identificador a la persona: ".$temp[0]);
        }else{
        	$u++;
        }
        //Agrega el rol de la persona a la tabla asignacion_roles
        if ($temp[1]=="personal") {
            $sql = " INSERT INTO asignacion_roles VALUES (1, $id) ";
        } elseif($temp[1]=="docente"){
            $sql = " INSERT INTO asignacion_roles VALUES (4, $id) ";
        }else{
        	$sql = " INSERT INTO asignacion_roles VALUES (2, $id) ";
        }
        if(insertaSQL($sql)!=0)
        	$u++;
        else{
        	$e['err']++;
        	array_push($e['text'], "No se asigno el rol a la persona: ".$temp[0]);
        }
    }else { 
        	$e['err']++;
        	array_push($e['text'], "No existe la persona: ".$temp[0]);
    }
}

echo $c." -> ".$u."/".$e['err']."<br>";

if($e['err'] > 0){
	for ($i=0; $i < $e['err']; $i++) { 
		echo $e['text'][$i]."<br>";
	}
}

fclose($file);
?>