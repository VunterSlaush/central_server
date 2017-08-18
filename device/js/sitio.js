/**
 * Constante que guarda el tiempo en miliseguntos para actualizar diferentes variables del checador.
 * @const {number}
 */
//TODO: Modificar la constante INTERVALO_ACTUALIZACION para cambiar el tiempo de actualización de varios elementos del checador.
var INTERVALO_ACTUALIZACION = 60000;
/**
 * Constante que guarda el tiempo de espera para que se muestre el carrusel
 * @const {number}
 */
//TODO: Modificar la constante "ESPERA_CARRUSEL" para cambiar el tiempo de espera para que se muestre el carrusel.
var ESPERA_CARRUSEL = 1;
/**
 * Constante que guarda el tiempo en milisegundos que tarda en cambiar de imagenes el carrusel
 */
//TODO: Modificar la constante TIEMPO_CARRUSEL para cambiar el tiempo que se muestra cada imagen.
var TIEMPO_CARRUSEL = 10000;
/**
 * Constante que guarda el tiempo en milisegundos para cancelar una checada online si no obtiene una respuesta en dicho tiempo.
 */
//TODO: Modificar la constante CHECADA_ONLINE_TIMEOUT para cambiar el tiempo de respuesta maxima de una checada online
var CHECADA_ONLINE_TIMEOUT = 2000;
/**
 *  Constante que guarda el tiempo en milisegundos en el que se muestra la publicidad antes de mostrar si una checada fue correcta o invalida.
 */
//TODO: Modificar la constante MOSTRAR_RESULTADO_CHECADA para mostrar cuanto tiempo se muestra la publicidad antes de mostrar un resultado.
var MOSTRAR_RESULTADO_CHECADA = 6000;
/**
 *  Constante que guarda el tiempo en milisegundos en el que se muestra el resultado de una checada.
 */
//TODO: Modificar la constante FINALIZAR_CHECADA para cambiar el tiempo que dura el mensaje de checada y cerrar la publicidad.
var FINALIZAR_CHECADA = 3000;


/**
 * Guarda la instancia del reloj flipClock
 * @var {integer} clock
 */
var clock;
/**
 * Guarda el numero de publicidad que se debe mostrar.
 */
var contador = 1;
/**
 * Guarda la cantidad de imagenes de publicidad para checada existen en el sistema.
 * */
var numPub = 0;
/**
 * Contador para saber con que indice guardar las checadas offline en local storage.
 */
var checadasOff = 0;
/**
 * Contador para saber cuanto tiempo lleva el checador inactivo
 */
var idle_cnt = ESPERA_CARRUSEL;
/**
 * Bandera para determinar si se muestra o no el carrusel
 */
var showCarrusel = false;
/**
 * Guarda el estado del checador donde se determina si hay conexión a internet o puede alcanzar el servidor.
 *  0 = No hay conexión a intenet, 1 = Conexión limitada, 2 = Conexión Normal }
 */
var onLine = 2;
/**
 * Objeto que guarda las huellas digitales para mandarlas el daemon
 */
var dataHuellas = {};

/*
* Variable para saber si las huellas estan o no activadas!
*/
var lectorActivado = true;

$(document).ready(function () {

  //Testeando BD
  db.createDB();
  db.initTables();

    //Verificar si existe en Local Storage el item de sesion y host
    if (localStorage.getItem("host") && localStorage.getItem("sesion")) {
        var maquina = localStorage.getItem("host");
        var pass = localStorage.getItem("sesion");
        login(maquina,pass,1);
    }
    else {
        alert("No existe la sesión");
        mostrarLogin();
    }
});

/**
 * Muestra un formulario para iniciar sesión en la maquina deseada.
 */
function mostrarLogin() {
    $('#login').show();
    $('#nameHost,#passHost').keypress(function (e) {
        if (e.which == 13) $("#btnLogin").click();
    });
    $("#btnLogin").click(function () {
        var maquina = $('#nameHost').val();
        var pass = $('#passHost').val();
        login(maquina,pass,0)
    });
}

function login(maquina,password,phase)
{
  $.ajax({
      url: "../web_services/serviciosChecador.php?servicio=loginChecador",
      data: {maquina: maquina, pass: password, phase: phase},
      type: "POST",
      dataType: "json",
      success: function (data) {
          if (data.s == 1) {
              auth();
              mostrarChecador();
          }
          else {
              localStorage.clear();
              alert(data.m);
          }
      },
      error: function () {
          alert("Error al realizar login");
      }
  }); // Fin petición AJAX
}


/**
 * Muestra todos los elementos del checador despues de hacer login y define coportamientos para dichos elementos
 */
function mostrarChecador()
{
    $(document).off("keydown");
    $('body').css({"background-image": "url(img/base/checador_fondo.png?" + new Date().getTime() +")"});
    $('#login').hide();
    $('#contenedor-checador').show();

    // Cerrar el modal despues de determinado tiempo
    $('#myModal').on('show.bs.modal', function () {
        var myModal = $(this);
        clearTimeout(myModal.data('hideInterval'));
        myModal.data('hideInterval', setTimeout(function () {
            if (contador > numPub) {
                contador = 1;
            }
            $(document).off("keypress");

            $('.text-publicidad').hide().html("");
            $('#myModal').modal('hide');
            $("#contenido").show();
            $("#btnEntrar").attr("disabled", false);
            $('#nss').val("").focus().keypress(function (e) {
                idle_cnt = ESPERA_CARRUSEL;
                if (e.which == 13) {
                    if (!$("#btnEntrar").is(':disabled')) {
                        $(this).off("keypress");
                        $("#btnEntrar").click();
                    }
                }
            });
        }, 90000));
    });

    // Configuracion para el reloj
    clock = $('.clock').FlipClock({
        clockFace: 'TwentyFourHourClock',
        showSeconds: false
    });

    getServerTime();

    autoConectarPuerta();

    //Obtener lista de profesores para checadas offline
    //getProfesores();
    //Obtener asignaciones de profesores que tienen clases para determinado día


    $("#btnEntrar").click(function ()
    {
      if ($(this).text() == '...')
      {
        $(this).text('Abrir Puerta');
        expandirTeclado()
      }else
      {
        checar();
      }

    });

    $('#nss').keypress(function (e) {
        idle_cnt = ESPERA_CARRUSEL;
        if (e.which == 13) {
            if (!$("#btnEntrar").is(':disabled')) {
                $(this).off("keypress");
                $("#btnEntrar").click();
            }
        }
    }).focus();

    window.addEventListener("offline", function () {
        onLine = 0;
        $('#verde').hide();
        $('#amarillo').hide();
        $('#rojo').show();
        if (!localStorage.getItem('log')) {
            var time = (clock.getTime().time);
            var d = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
            d = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
            localStorage.setItem('log', "Se perdió la conexión a Internet:  " + d);
        }
    });

    window.addEventListener("online", function () {
        semaforoVerde();
    });

    setInterval(function () {
        //Manejo del carrusel
        if (showCarrusel == true) {
            if (idle_cnt == 0) {
                if ($('#maximage').hasClass('mc-cycle') && !$("#myModal").hasClass('in')) {
                    handleCarrusel();
                }
                else {
                    idle_cnt = ESPERA_CARRUSEL;
                }
            }
            else {
                idle_cnt--;
            }
        }
        if (onLine != 0) {
            //Enviar petición sencilla al servidor para conocer si es alcanzable
            $.ajax({
                url: "../web_services/serviciosChecador.php?servicio=getTime",
                data: {device: localStorage.getItem('host')},
                type: "GET",
                timeout: 5000,
                success: function (data) {
                    if (data.s == 1) {
                        setClockTime(data.d);
                        semaforoVerde();
                    }

                    //Verificar si existen elementos en el log
                    if (localStorage.getItem('log') && onLine == 2) {
                        var logUno = localStorage.getItem('log');
                        $.ajax({
                            url: "../web_services/serviciosChecador.php?servicio=newLog",
                            data: {device: localStorage.getItem('host'), msj: logUno},
                            type: "POST",
                            dataType: "json",
                            success: function () {
                                localStorage.removeItem('log');
                                var time = (clock.getTime().time);
                                var d = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
                                d = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
                                var msjTemp = "Reconexión a Internet:  " + d;
                                $.post("../web_services/serviciosChecador.php?servicio=newLog", {
                                    device: localStorage.getItem('host'),
                                    msj: msjTemp
                                });
                            },
                            error: function () {
                                semaforoAmarillo();
                            }
                        }); // Fin petición AJAX
                    }
                    //Verificar si existen elementos en LocalStorage para enviar al servidor
                    if (localStorage.length > 6 && onLine == 2) {
                        $.each(localStorage, function (key, values) {
                            if (onLine != 2) return false;
                            if (!(key == 'host' || key == 'sesion' || key == 'personasDB' || key == 'asignacionesDB' || key == 'log' || key == 'carrusel')) {
                                if (!key) {
                                    localStorage.removeItem(key);
                                }
                                else {
                                    var valor = JSON.parse(values);
                                    $.ajax({
                                        async: false,
                                        url: "../web_services/serviciosChecador.php?servicio=checadoPubOffline",
                                        data: {
                                            nss: valor.nss,
                                            pub: valor.pubId,
                                            devID: valor.devID,
                                            periodo: valor.fecha,
                                            hostName: localStorage.getItem('host'),
                                            llave: key
                                        },
                                        type: "POST",
                                        timeout: 5000,
                                        dataType: "json",
                                        success: function (data) {
                                            localStorage.removeItem(data.d.llave);
                                            semaforoVerde();
                                        },
                                        error: function () {
                                            semaforoAmarillo();
                                        }
                                    }); // Fin petición AJAX
                                }
                            }
                        });
                    }
                },
                error: function () {
                    semaforoAmarillo();
                }
            }); // Fin petición AJAX
        }
    }, INTERVALO_ACTUALIZACION);

    getHuellasDB();

    changePuerta(false);
}



/**
 * Obtiene los numeros de nomina y nombres de las personas en el checador.
 */
function getProfesores() {
    $.getJSON("../web_services/serviciosChecador.php?servicio=getPersonas", function (data) {
        localStorage.setItem('personasDB', JSON.stringify(data.d));
    });
}

/**
 *
 */


/**
 *
 */
function semaforoAmarillo() {
    onLine = 1;
    if (!localStorage.getItem('log')) {
        var time = (clock.getTime().time);
        var d = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
        d = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        localStorage.setItem('log', "No puede alcanzar al servidor: " + d);
    }
    $('#verde').hide();
    $('#amarillo').show();
    $('#rojo').hide();
}

/**
 *
 */
function semaforoVerde() {
    onLine = 2;
    $('#verde').show();
    $('#amarillo').hide();
    $('#rojo').hide();
}

/**
 *
 */
function checadaWeb() {
    var nss = $('#nss').val();
    checarOnline(nss, 0, 1);
}

/**
 * Inicia el proceso para checar con lector. El parametro nss es obligatorio
 * @param {string} nss
 */
function checadaLector(nss) {
    idle_cnt = ESPERA_CARRUSEL;
    $('#maximage').hide().cycle('pause');
    var canContinue = true;
    $('div#publicidad div').each(function () {
        if ($(this).is(':visible')) {
            canContinue = false;
            return false;
        }
    });

    if (canContinue) {
        console.log("Realizando checada con lector");
        $(document).off("keypress").off("mousemove");
        $("#btnEntrar").attr("disabled", true);
        $("#nss").blur().off("keypress");

        checarOnline(nss, 0, 2);
    }
    else {
        console.log("Checada en progreso");
    }
}

/**
 * Inicia el proceso para checar de forma online, si no lo puede realizar, va a realizar una checada offline
 * @param {string} nss
 * @param {number} pubId
 */
function checarOnline(nss, pubId, devId) {

    if (onLine == 2) {
        $.ajax({
            url: "../web_services/serviciosChecador.php?servicio=checadoPubOnlineNew",
            data: {nss: nss, pub: pubId, devID: devId, hostName: localStorage.getItem('host')},
            type: "POST",
            dataType: "json",
            timeout: CHECADA_ONLINE_TIMEOUT,
            success: function (data) {
                semaforoVerde();
                console.log(data);
                if (data.s == 1) {
                  checadaSuccess(data.d.nombre);
                }
                else {
                  checadaError();
                }
            },
            error: function () {
                semaforoAmarillo();
                checarOffline(nss, pubId, devId);
            }
        }); // Fin petición AJAX
    } //Fin IF onLine
    else {
        checarOffline(nss, pubId, devId);
    }
}


function checadaSuccess(nombre)
{
      if(nombre != null && nombre != '')
        $('#user_name').text(nombre)

      $('#checada_success').modal();
      abrirPuerta();
      setTimeout(function ()
      {   // ocultar modal
          $('#checada_success').modal('hide');
          $('#checador').show();
          $("#btnEntrar").attr("disabled", false);
          $('#nss').val('');
          $('#keyboard').hide();
          $('#btnEntrar').text('...');
      }, FINALIZAR_CHECADA);
}

function checadaError()
{
      showAutoDestructiveMessage('Registro no autorizado');
      setTimeout(function ()
      {

          $('#checador').show();
          $("#btnEntrar").attr("disabled", false);
          $('#nss').keypress(function (e) {
              idle_cnt = ESPERA_CARRUSEL;
              if (e.which == 13) {
                  if (!$("#btnEntrar").is(':disabled')) {
                      $(this).off("keypress");
                      $("#btnEntrar").click();
                  }
              }
          }).focus();
      }, FINALIZAR_CHECADA);
}

/**
 * Inicia el proceso para una checada offline.
 * @param {string} nss
 * @param {number} pubId
 */
function checarOffline(nss, pubId, devId) {
    var personasDB = JSON.parse(localStorage.getItem('personasDB'));
    if (nss in personasDB) {
        var persona = personasDB[nss];
        //Obtener la fecha y hora del reloj
        var time = (clock.getTime().time);
        var d = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
        d = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        //Guardar en local storage las variables
        while (localStorage.getItem(checadasOff)) {
            checadasOff++;
        }
        localStorage.setItem(checadasOff, JSON.stringify({
            nss: nss,
            fecha: d,
            pubId: pubId,
            devID: devId,
            hostId: localStorage.getItem('host')
        }));
        //Aumentar contador de las checadas
        checadasOff++;
        console.log(persona);
        checadaSuccess(persona);
    }
    else {
      checadaError();
    }
}


/**
 *
 */
function getServerTime() {
    $.getJSON("../web_services/serviciosChecador.php?servicio=getTime&device="+localStorage.getItem('host'), function (data) {
        if (data.s == 1) {
            setClockTime(data.d);
        }
    });
}

/**
 *
 * @param time
 */
function setClockTime(time) {
    var fecha = new Date(time['year'], (time['month'] - 1), time['day'], time['hour'], time['minute'], time['second']);
    clock.setTime(fecha);
}

/*
*
*/
function abrirPuerta()
{
  enviarComando('1',function (data) {
    let stringBuffer = String.fromCharCode.apply(null, new Uint16Array(data));
    console.log('data on puerta:'+stringBuffer);
    if(data.success == 'true' && data.res == 'OK')
      showPuertaAbiertaModal(false);
    else
      showPuertaAbiertaModal(true);
  });
}

/**
 *
 */
function handleCarrusel() {
    $('#nss').off("keypress");
    $('#checador').hide();
    $('#maximage').show().cycle('resume');
    $(document).keypress(function () {
        idle_cnt = ESPERA_CARRUSEL;
        $('#maximage').hide().cycle('pause');
        $(document).off("keypress").off("mousemove");
        $('#checador').show();
        $('#nss').focus().keypress(function (e) {
            idle_cnt = ESPERA_CARRUSEL;
            if (e.which == 13) {
                if (!$("#btnEntrar").is(':disabled')) {
                    $(this).off("keypress");
                    $("#btnEntrar").click();
                }
            }
        });
    }).mousemove(function () {
        idle_cnt = ESPERA_CARRUSEL;
        $('#maximage').hide().cycle('pause');
        $(document).off("keypress").off("mousemove");
        $('#checador').show();
        $('#nss').focus().keypress(function (e) {
            idle_cnt = ESPERA_CARRUSEL;
            if (e.which == 13) {
                if (!$("#btnEntrar").is(':disabled')) {
                    $(this).off("keypress");
                    $("#btnEntrar").click();
                }
            }
        });
    });
}

/**
 *
 * @param color
 */
function showHuellasOk(color) {
    $('#huellas').attr('style', 'background-color: ' + color).show();
    $('#fpOk').show();
    $('#fpBad').hide();
}

/**
 *
 * @param color
 */
function showHuellasBad(color) {
    $('#huellas').attr('style', 'background-color: ' + color).show();
    $('#fpOk').hide();
    $('#fpBad').show();
}

function changePuerta(isOpen)
{
  if (isOpen)
  {
      $('#door_close').hide();
      $('#door_open').show();
  }
  else
  {
    $('#door_close').show();
    $('#door_open').hide();
  }
}

/**
 *
 */
function getHuellasDB() {
    $.ajax({
        url: "../web_services/serviciosLector.php",
        data: {ws: "getHuellasC"},
        type: "POST",
        dataType: "json",
        success: function (data) {
            if (data.s == 1) {
                console.log(data.m);
                dataHuellas = data.d;
                showHuellasBad("#A4A4A4");
                getStatusServer();
            }
            else {
                console.log(data.m);
                showHuellasBad("#f8cd23");
                setTimeout(function () {
                    getHuellasDB();
                }, 10000);
            }
        },
        error: function () {
            showHuellasBad("#b62045");
            setTimeout(function () {
                getHuellasDB();
            }, 10000);
        }
    }); // Fin petición AJAX
}

/**
 *
 */
function getStatusServer() {
  if (lectorActivado) {
    $.ajax({
        url: "http://localhost",
        data: {ws: "getStatusServer"},
        type: "GET",
        dataType: "json",
        success: function (data) {
            if (data.s == 1 && data.m == "Esperando num huella") {
                console.log(data.m);
                showHuellasBad("#A4A4A4");
                sendNumeroHuellas();
            }
            else {
                console.log(data.m);
                showHuellasBad("#f8cd23");
                setTimeout(function () {
                    getStatusServer();
                }, 10000);

            }
        },
        error: function () {
            showHuellasBad("#b62045");
            setTimeout(function () {
                getStatusServer();
            }, 10000);
        }
    }); // Fin petición AJAX
  }

}

/**
 *
 */
function sendNumeroHuellas() {
    $.ajax({
        url: "http://localhost",
        data: {ws: "numHuellas", num: dataHuellas.length},
        type: "GET",
        dataType: "json",
        success: function (data) {
            if (data.s == 1 && data.m == "Esperando huella") {
                showHuellasBad("#A4A4A4");
                console.log(data.m);
                sendHuella(0);
            }
            else {
                showHuellasBad("#f8cd23");
                console.log(data.m);
                setTimeout(function () {
                    getStatusServer();
                }, 10000);
            }
        },
        error: function () {
            showHuellasBad("#b62045");
            setTimeout(function () {
                getStatusServer();
            }, 10000);
        }
    }); // Fin petición AJAX
}

/**
 *
 * @param indexToSend
 */
function sendHuella(indexToSend) {
    var vFMD = dataHuellas[indexToSend]['fmd'];
    var idFMD = dataHuellas[indexToSend]['nss'];
    $.ajax({
        url: "http://localhost",
        data: {ws: 'sendHuella', fmd: vFMD, nss: idFMD},
        type: "GET",
        dataType: "json",
        success: function (data) {
            if (data.s == 0) {
                showHuellasBad("#f8cd23");
                console.log(data.m);
                setTimeout(function () {
                    getStatusServer();
                }, 10000);
            }
            else {
                if (data.m == "next") {
                    showHuellasBad("#A4A4A4");
                    console.log(data.m);
                    sendHuella(data.d);
                }
                if (data.m == "ok") {
                    showHuellasBad("#A4A4A4");
                    console.log(data.m);
                    getStatusLector();
                }
            }
        },
        error: function () {
            showHuellasBad("#b62045");
            setTimeout(function () {
                getStatusServer();
            }, 10000);
        }
    }); // Fin petición AJAX

}

/**
 *
 */
function getStatusLector() {
  if (lectorActivado) {
    $.ajax({
        url: "http://localhost?ws=getStatusLector",
        type: "GET",
        dataType: "json",
        success: function (data) {
            if (data.s == 0) {
                showHuellasBad("#f8cd23");
                console.log(data.m);
                setTimeout(function () {
                    getStatusServer();
                }, 10000);
            }
            else {
                console.log(data.m);
                if (data.m == "Huella verificada") {
                    idle_cnt = ESPERA_CARRUSEL;
                    $('#maximage').hide().cycle('pause');
                    $(document).off("keypress").off("mousemove");
                    showHuellasOk("#1f84b8");
                    checadaLector(data.d);
                    getStatusLector();
                }
                else if (data.m == "Huella no identificada") {
                    //showHuellasOk("#f17721"); COMENTADO PARA TESTING!
                    getStatusLector();
                    abrirPuerta();
                }
                else if (data.m == "Esperando huella") {
                    showHuellasOk("#89c553");
                    getStatusLector();
                }
                else {
                    showHuellasBad("#f8cd23");
                    console.log(data.m);
                    setTimeout(function () {
                        getStatusServer();
                    }, 10000);
                }
            }
        },
        error: function (XMLHttpRequest) {
            showHuellasBad("#b62045");
            var sleep = 5000;
            if (XMLHttpRequest.readyState == 0) {
                sleep = 10000;
            }
            setTimeout(function () {
                getStatusServer();
            }, sleep);
        }
    }); // Fin petición AJAX
  }

}


function showAutoDestructiveMessage(message)
{
  $.confirm({
    title: '',
    content: message,
    autoClose: 'ok|3000', // aumentar este tiempo, si se cerrara la puerta aqui?
    buttons: {
        ok: function () {
          // Cerrar la puerta aqui?
        }
      }
  });
}

function toggleHuellas()
{
  lectorActivado = !lectorActivado;
  if (!lectorActivado) {
    showHuellasBad("#a39c9c");
  }
  else {
    showHuellasOk("#1f84b8");
    getStatusLector();
  }
}


function checar()
{
  if($('#nss').val() != '')
  {
    idle_cnt = ESPERA_CARRUSEL;
    $(this).attr("disabled", true);
    $("#nss").blur();
    checadaWeb();
  }
  else
  {
    showMessage('el NSS no puede estar vacio');
  }
}

function expandirTeclado()
{
    $('#keyboard').show();
}

function showPuertaAbiertaModal(error)
{
    if(error)
      $('#puerta_mensaje').text('No se puedo abrir la puerta');
    else
      $('#puerta_mensaje').text('Puerta Abierta');

    $('#modal_puerta_abierta').modal();
    setTimeout(function()
    {
      $('#modal_puerta_abierta').modal('hide');
    },3000);
}

function clickPuertaButton(btn)
{
  if($(btn).text() == 'Conectar')
    conectarPuerta(btn);
  else
    cerrarPuerto(btn);
}
