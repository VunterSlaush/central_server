var socketPuerta = io('http://localhost:1234'); // TODO CAMBIAR ESTO SI ES NECESARIO!
const ESPERA_TIMEOUT = 10000;

socketPuerta.on('puertoAbierto', function(data)
{
  $('#puertaButton').button('reset');
  $('#puertaModal').modal('hide');
  showAutoDestructiveMessage('Puerto conectado satisfactoriamente');
  $('#estado_puerto').val('conectado a '+data.puerto);
  $('#puertos').prop('disabled', true);
  $('#puerta').attr('style', 'background-color: #89c553');
  localStorage.setItem('puerto', data.puerto);
  localStorage.setItem('bauds', data.bauds);
  $('#puertaButton').text('Desconectar');
  $('#puertaButton').removeClass('btn-primary');
  $('#puertaButton').addClass('btn-danger');
});


socketPuerta.on('reconnect',function ()
{
  autoConectarPuerta();
});

socketPuerta.on('puerto_desconectado', function(data)
{
  localStorage.removeItem('bauds');
  localStorage.removeItem('puerto');
  desconectar();
});

socketPuerta.on('errorGeneral', function(data)
{
  showAutoDestructiveMessage(data.m);
});

socketPuerta.on('disconnect', function(data)
{
  desconectar();
});

function modalPuerta()
{
  vaciarSelect("#puertos");
  if(!localStorage.getItem("puerto") || !localStorage.getItem("bauds"))
    $("#puertos").prop('disabled',false);
  $('#puertaButton').prop('disabled',false);

  if($('#estado_puerto').val().indexOf('conectado') != -1 && $('#estado_puerto').val().indexOf('Desconectado') == -1)
    $('#puertaButton').text('Desconectar');
  $.ajax({
      url: "http://localhost:1234/puertos",
      type: "GET",
      timeout: 5000,
      success: function (data)
      {
        puertos = data.ports;
        $('#puertaModal').modal();
        for (var i = 0; i < puertos.length; i++)
        {
          $("#puertos").append('<option value="'+puertos[i].comName+'">'+puertos[i].comName+'</option>');
        }
      },
      error: function () {
        $('#puertaModal').modal();
        $('#estado_puerto').val('Error al conectar con el servidor');
        $("#puertos").prop('disabled',true);
        $('#puertaButton').prop('disabled',true);
      }
    });
}


function autoConectarPuerta()
{
  if (localStorage.getItem("puerto") && localStorage.getItem("bauds"))
  {
    button = $('#puertaButton');
    var puerto = localStorage.getItem("puerto");
    var bauds = localStorage.getItem("bauds");
    $('#puertos').val(puerto);
    $('#bauds').val(bauds);
    conectarPuerta(button,puerto);
  }
}

function conectarPuerta(btn,puerto)
{
  var puertoSeleccionado;

  if(puerto == null)
    puertoSeleccionado = $('#puertos').val();
  else
    puertoSeleccionado = puerto;

  console.log("PUERTO:"+puertoSeleccionado);
  var bauds = $('#bauds').val();

  if(bauds == '')
    showMessage('el campo de velocidad no puede estar vacio');
  else
  {
    $(btn).button('loading')
    $.ajax({
        url: "http://localhost:1234/verificarPuerto",
        type: "POST",
        timeout: 5000,
        data: {port:puertoSeleccionado},
        success: function (data)
        {
          if(data.success == "true")
          {
            abrirPuerto(puertoSeleccionado,bauds);
          }
          else
          {
            $('#puertaModal').hide();
            modalPuerta();
            $(btn).button('reset');
            $('#estado_puerto').val('Error');
            $('#puerta').attr('style', 'background-color: #999999');
          }
        },
        error: function ()
        {
          $(btn).button('reset');
          showMessage('Error al Conectar con el servidor');
          $('#estado_puerto').val('error');
          $('#puerta').attr('style', 'background-color: #999999');
        }
      });
  }


}


function abrirPuerto(puerto,bauds)
{
  socketPuerta.emit('abrirPuerto',{puerto:puerto,bauds:bauds});
  setTimeout(function()
  {
    if($('#puertaButton').text().indexOf('Cargando') != -1)
      desconectar();
  },ESPERA_TIMEOUT);
}

function enviarComando(comando, callback)
{
  socketPuerta.on('puerto_data',callback);
  socketPuerta.emit('enviarComando',{comando:comando});
}


function cerrarPuerto(btn)
{
  socketPuerta.emit('cerrarPuerto');
}

function desconectar()
{
  $('#estado_puerto').val('Desconectado');
  $('#puertos').prop('disabled', false);
  $('#puertaButton').addClass('btn-primary');
  $('#puertaButton').removeClass('btn-danger');
  $('#puertaButton').text('Conectar');
  $('#puertaButton').button('reset');
  $('#puerta').attr('style', 'background-color: #999999');
}

function vaciarSelect(select)
{
  $(select)
  .find('option')
  .remove()
  .end();
}

function showMessage(message)
{
  $.confirm({
    title: 'Alerta',
    content: message,
    buttons: {
          ok: function () {

          }
      }
  });
}
