var socket = io('https://devicescontroller.herokuapp.com');

socket.on('connect', function()
{
  socket.emit('type', 'dashboard');
  socket.emit('devices');
});

socket.on('devices_changed', function ()
{
    socket.emit('devices');
});

socket.on('devices_list',function (data)
{
  if ($('#btnAccesos').parent().prop('class') == 'active'){
    console.log(data);
    var estado;

    $("#btnAgregar").attr('tipo', 'cDoor').show();

    $("#contenido").html('</div><div id="doors"></div>');
    var code="";
    for (var i = 0; i < data.devices.length; i++)
    {
      if(data.devices[i].status)
        estado = 'Activo';
      else if(data.devices[i].status == null)
        estado = 'Inactivo';
      else if(!data.devices[i].status)
        estado = 'Activo'

        code +='<div class="col-md-3 col-sm-3 col-xs-6">'+
        '<div id=dev'+i+' data-toggle="tooltip" title="'+data.devices[i].maquina+'"   class="well top-block device-wrapper" pass="dispositivo'+i+'" des="descripcion dispositivo'+i+'">'+
          '<a id="dev'+i+'" class="btnConfig" onclick="modifyDevice(this.id) "href="#" style=" width: 30px; height: 30px; position: absolute; right: 10px; ">'+
          '<i class="glyphicon glyphicon-cog" style="margin-right: 15px;"> </i>'+
          '</a>'+
          '</span><img src="img/doorway.png">'+
          ' <div class="title" align="middle">'+data.devices[i].maquina+'</div>'+
          ' <div align="middle">Estado:<span class="state" estado="'+estado+'">'+estado+'</span></div>'+
          ' <div style="text-align:center">'+
              '<a href="#" estado="'+estado+'" id="'+data.devices[i].maquina+'" class="btn btn-success" onclick="cambiarEstado(this)" '+ (estado == "Activo" ? "" : "disabled" ) +'>Abrir</a>'+
           '</div></div></div>';

    }
    code+='<a class="btn btn-info btn-setting" id="btnModificar" style="display:none;" href="#" tipo="cDoor"></a>';
    $("#doors").html('<div class="row">'+code+'</div>');
  }
});

socket.on('disconnect', function (data) {
    console.log("Socket desconectado");
    if ($('#btnAccesos').parent().prop('class') == 'active'){
      console.log(data);
      $.ajax({
        url: WS_PRIVADOS_URL,
        data: {ws: "getDevice",type:"all"},
        type: "post",
        dataType: "json",
        beforeSend: function() {
          mensajeCarga(true);
        },
        success: function (data) {
          mensajeCarga(false);
          var code="";
          for(var i=0;i<data.d.length;i++){
            code +='<div class="col-md-3 col-sm-3 col-xs-6">'+
            '<div id=dev'+i+' data-toggle="tooltip" title="'+data.d[i].maquina+'"   class="well top-block device-wrapper" pass="dispositivo'+i+'" des="descripcion dispositivo'+i+'">'+
              '<a id="dev'+i+'" class="btnConfig" onclick="modifyDevice(this.id) "href="#" style=" width: 30px; height: 30px; position: absolute; right: 10px; ">'+
              '<i class="glyphicon glyphicon-cog" style="margin-right: 15px;"> </i>'+
              '</a>'+
              '</span><img src="img/doorway.png">'+
              ' <div class="title" align="middle">'+data.d[i].maquina+'</div>'+
              ' <div align="middle">Estado:<span class="state" estado="desconectado">desconectado</span></div></div></div>';
              // ' <div style="text-align:center">'+
              //     '<a href="#" estado="desconectado" id="'+data.d[i].maquina+'" class="btn btn-success" onclick="cambiarEstado(this)">Abrir</a>'+
              //  '</div></div></div>'
          }
          code+='<a class="btn btn-info btn-setting" id="btnModificar" style="display:none;" href="#" tipo="cDoor"></a>';
          $("#doors").html('<div class="row">'+code+'</div>');
        },
        error: function (jqXHR, msgStatus, errorThrown) {
          showSimpleNoty("Error al Cargar Dispositivos", "center", "error", 0);
          mensajeCarga(false);
        }
      }); // Fin petición AJAX
    }
});

    socket.on('status_changed', function(data) // TODO cambiar texto .. si es necesario?
    {
      console.log('Status Changed'+data.maquina);
      if(data.status)
        $('#'+data.maquina).attr('estado','abierto');
      else if(!data.status)
        $('#'+data.maquina).attr('estado','cerrado');
      else if(data.status == null)
        $('#'+data.maquina).attr('estado','inhabilitado');
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
