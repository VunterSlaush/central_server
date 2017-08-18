<?php
/**
 * Created by IntelliJ IDEA.
 * User: tianshi
 * Date: 19/01/15
 * Time: 04:05 PM
 */

/**
 * @param $sql
 * @return bool|int|mysqli_result
 */
function ejecutaSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    //mysqli_select_db($base, $link);
    $res = mysqli_query($link, $sql);
    if (!$res) {
        error("Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql, "E");
        return 0;
    }
    mysqli_close($link);
    return $res;
}

/**
 * @param $sql
 * @return int|string
 */
function insertaSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    //mysqli_select_db($base, $link);
    $res = mysqli_query($link, $sql);
    if (!$res) {
        echo "Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql;
        return 0;
    }
    $resp = mysqli_insert_id($link);
    mysqli_close($link);
    return $resp;
}

/**
 * @param $sql
 * @return int
 */
function updateSQL($sql)
{
    global $servidor;
    global $base;
    global $usuarioBD;
    global $pass;

    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    //mysqli_select_db($base, $link);
    $res = mysqli_query($link, $sql);
    if (!$res) {
        error("Error: No se pudo hacer consulta a la base de datos :: " . mysqli_error($link) . " :: " . $sql, "E");
        return 0;
    }
    if (!$link = mysqli_connect($servidor, $usuarioBD, $pass, $base)) {
        error("Error: No se pudo conectar con la base de datos", "E");
        return 0;
    }
    $resp = mysqli_affected_rows($link);
    mysqli_close($link);
    return $resp;
}

/**
 * FUNCION que guarda los logs de lo ocurrido en el analisis u otras funciones
 * @param string $string Cadena con informacion para guardar en el log
 * @param string $tipo
 * @return int|string
 */
function error($string, $tipo)
{
    $r = insertaSQL("INSERT INTO log (descripcion, tipo) VALUES ('$string', '$tipo')");
    return $r;
}
