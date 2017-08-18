var socket = io('http://159.203.83.182:443');

socket.on('connect', function()
{
  socket.emit('type', 'device');
});

socket.on('reconnect',function ()
{
  auth();
});

/*
socket.on('connect_error', function(error){
    $.confirm({
      title: 'Alerta',
      content: "Error al conectar el servicio de administracion de puertas, Ok para reconectar",
      buttons: {
          ok: function () {
            socket.connect();
          },
          cancelar: function () {
            // salir de la pagina ..
          }
      }
  });
});*/
/*
socket.on('connect_timeout', function(error){
    $.confirm({
      title: 'Alerta',
      content: "Error al conectar el servicio de administracion de puertas, Ok para reconectar",
      buttons: {
          ok: function () {
            socket.connect();
          },
          cancelar: function () {
            // salir de la pagina ..
          }
      }
  });
});*/

socket.on('open',function()
{
  abrirPuerta();
});

socket.on('close',function()
{
  abrirPuerta(); /// ? ..
});


socket.on('loggedIn',function(data)
{
  //if(/*data.login && */localStorage.getItem("host") && localStorage.getItem("sesion"))
    //mostrarChecador();
  /*else
   mostrarLogin();*/
});

function cambiarEstado(id)
{
  var estado = $(id).attr('estado');
  if(estado == 'cerrado')
  {
    socket.emit('open',$(id).attr('id'));
    $(id).attr('estado','abierto');
  }
  else
  {
    socket.emit('close',$(id).attr('id'));
    $(id).attr('estado','cerrado');
  }
}


function auth(user,password)
{
  socket.emit('auth_device',{username:localStorage.getItem('host', user),
                             password:localStorage.getItem('sesion', password)
                            });
}
