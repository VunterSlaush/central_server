<?php


function mysqli_result($res,$row=0,$col=0){ 
    $numrows = mysqli_num_rows($res); 
    if ($numrows && $row <= ($numrows-1) && $row >=0){
        mysqli_data_seek($res,$row);
        $resrow = (is_numeric($col)) ? mysqli_fetch_row($res) : mysqli_fetch_assoc($res);
        if (isset($resrow[$col])){
            return $resrow[$col];
        }
    }
    return false;
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }

    return (substr($haystack, -$length) === $needle);
}

function contains($needle, $haystack)
{
    return strpos($haystack, $needle) !== false;
}

function validAccion($accion){
    return $accion=="leer"||$accion=="esc"||$accion=="del"||$accion=="mod";
} 

function validMenu($menu,$menuDashboard){
    return in_array($menu, $menuDashboard);
}