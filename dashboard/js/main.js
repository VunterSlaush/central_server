//FUNCIONES Y PARAMETROS
var navMenus = [];
var id_admin = 0;
$.xhrPool = [];

$.xhrPool.abortAll = function () {
  $(this).each(function (idx, jqXHR) {
    jqXHR.abort();
  });
  $.xhrPool = [];
};

var removeAttr = jQuery.fn.removeAttr;
$.fn.removeAttr = function () {
  if (!arguments.length) {
    this.each(function () {
      // Looping attributes array in reverse direction
      // to avoid skipping items due to the changing length
      // when removing them on every iteration.
      for (var i = this.attributes.length - 1; i >= 0; i--) {
        if (this.attributes[i].name != "class" && this.attributes[i].name != "id") {
          $(this).removeAttr(this.attributes[i].name);
        }
      }
    });

    return this;
  }

  return removeAttr.apply(this, arguments);
};

function showSimpleNoty(texto, lugar, tipo, tiempo) {
  noty({
    text: texto,
    layout: lugar,
    type: tipo,
    dismissQueue: true,
    maxVisible: 5,
    killer: false,
    timeout: tiempo,
    closeWith: ['click']//, 'button', 'hover', 'backdrop']
  });
}

function showOptionNoty(texto, lugar, tipo, code1, code2) {
  noty({
    text: texto,
    type: tipo,
    dismissQueue: true,
    layout: lugar,
    theme: 'defaultTheme',
    modal: true,
    closeWith: ['click', 'button'],//, 'button', 'hover', 'backdrop']
    buttons: [
      {
        addClass: 'btn btn-default', text: 'Cancelar', onClick: function ($noty) {
          $noty.close();
          var toExec = new Function(code1);
          toExec();
        }
      },
      {
        addClass: 'btn btn-danger', text: 'Ok', onClick: function ($noty) {
          $noty.close();
          var toExec = new Function(code2);
          toExec();
        }
      }
    ]
  });
}

function restartContent(){
  $('#content').html('<div class="row"> <div class="box col-md-12"> <div class="box-inner"> <div class="box-header well"> <h2 id="titulo"><i class="glyphicon glyphicon-info-sign"></i> Index </h2> <div class="box-icon"> <!--<a href="#" class="btn btn-setting btn-round btn-default" id="btnAgregar" style="display: none;">--> <a href="#" id="btnFigpo" class="btn btn-round btn-default" style="display: none;"> <i class="glyphicon glyphicon-file"></i> </a> <a href="#" id="btnAgregar" class="btn btn-round btn-default" style="display: none;"> <i class="glyphicon glyphicon-plus-sign"></i> </a> <a href="#" id="btnMinimize" class="btn btn-minimize btn-round btn-default"> <i class="glyphicon glyphicon-chevron-up"></i> </a> </div> </div> <div class="box-content"> <div id="contenido"> </div> </div> </div> </div> </div>');
}

function notyErrorAcceso() {
  Administradores.session().done(function (data){
    if(data.s==1) showSimpleNoty("No tienes el nivel de acceso para realizar esta operación", "center", "warning", 0);
    else{
      alert(data.m);
      window.location.href = "";
    }
  });
}

function sharedFunction(menu){
  $('ul.main-menu li a').each(function () {
    if ($($(this))[0].id == menu)
    $(this).parent().addClass('active');
    else
    $(this).parent().removeClass('active');
  });
  restartContent();
  $('#graphicRow').remove();
  $("#btnAgregar").show();
  $("#btnFigpo").hide();
  $('.btn-minimize').click(function (e) {
    e.preventDefault();
    var $target = $(this).parent().parent().next('.box-content');
    if ($target.is(':visible')) $('i', $(this)).removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    else                       $('i', $(this)).removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    $target.slideToggle();
  });
}
//DOCUMENT START
$(document).ready(function () {
  //START CODE
  $('#btnMinimize').hide();
  //inicializar reloj y fecha
  //TODO: Pedir hora desde el servidor
  //Auxiliares para obtener el dia y mes en texto
  var meses = ["Enero", "Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Noviembre","Diciembre"];
  var diaSemana = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

  function startTime() {
    //reloj
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    h = checkTime(h);
    m = checkTime(m);
    s = checkTime(s);

    $('#texto-hora').html(h+':'+m+':'+s);
    var t = setTimeout(startTime,500);

    //fecha
    var dia = today.getDay();
    var dd = today.getDate();
    var mm = today.getMonth();
    var yyyy = today.getFullYear();

    $('#texto-fecha').html(diaSemana[dia]+ ' '+dd+' de '+meses[mm]+' '+yyyy);
  }

  function checkTime(i) {
    if (i<10) {i ="0"+i}
    return i;
  }




  //iniciar fecha
  startTime();

  //Configuracion de palabras para plugin timeago
  jQuery.timeago.settings.strings = {
    suffixAgo: "",
    suffixFromNow: "a partir de ahora",
    seconds: "menos de un minuto",
    minute: "cerca de un minuto atrás",
    minutes: "hace %d minutos",
    hour: "cerca de una hora",
    hours: "cerca de %d horas",
    day: "un día",
    days: "hace %d días",
    month: "hace un mes",
    months: "hace %d meses",
    year: "hace un año",
    years: "hace %d años"
  };
  //Configuracion general y de mensaje cuando hay peticiones AJAX
  $.ajaxSetup({
    beforeSend: function (jqXHR) {
      $.xhrPool.push(jqXHR);
    },
    complete: function (jqXHR) {
      var index = $.xhrPool.indexOf(jqXHR);
      if (index > -1) {
        $.xhrPool.splice(index, 1);
      }
    }
  });

  //Buscar los permisos de la persona
  Administradores.Acceso().done(function (data) {
    if (data.s == 0 && data.m == 'NO HAS INICIADO SESION') {
      alert(data.m);
      window.location.href = "";
    }
    else {
      $('#persona').html(" " + data.d.persona);
      navMenus = data.d.menus;
      id_admin = data.d.id;
    }
  });

  //Cuando se carga el modal se pone el cursor en el primer elemento si es posible.
  $('#myModal').on('shown.bs.modal', function () {
    $(".first").first().focus();
  }).on('hide.bs.modal', function () {
    $(".modal-header").removeAttr();
    $(".modal-body").removeAttr();
    $(".modal-footer").removeAttr();
  }).on('hidden.bs.modal', function () {
    $('#myModal').attr("class", "modal fade normal");
  });
  //BOTONES

  //Funcionalidad del boton con ID = logout
  $(document).on("click", "#logout", function () {
    showOptionNoty('¿Seguro que quieres cerrar sesión?', 'center', 'warning', '', '$.post(WS_PRIVADOS_URL, {ws: "logout"}, function (data) { window.location.href = "";}, "json");');
  });

  $(document).on("click", "#btnImg", function () {
    if ($('#upImage').val().length) {
      var nombre = $('#upImage').val().replace(/C:\\fakepath\\/i, '').split('.');
      if (nombre[1] != "png" && nombre[1]!="jpg" && nombre[1]!="gif") {
        showSimpleNoty("Formato de imagen invalido, solo se aceptan imagenes con formato png, jpg y gif", "center", "warning", 2000);
      } else {
        var formulario = $("#formImage");
        //var datos=formulario.serialize();
        var archivo =new FormData();
        var tipo=$("#upImage").attr('tipo');
        for (var i=0;i<(formulario.find('input[type=file]').length);i++){
          archivo.append((formulario.find('input[type="file"]:eq('+i+')').attr("name")),((formulario.find('input[type="file"]:eq('+i+')')[0]).files[0]));
        }
        $.ajax({
          url: "../web_services/uploadImages.php?tipo=publicidad",
          data: archivo,
          type: "post",
          cache: false,
          contentType: false,
          processData: false,
          dataType: "json",
          beforeSend: function () {
            mensajeCarga(true);
          },
          success: function (data) {
            mensajeCarga(false);
            if(data.s == 1){
              showSimpleNoty(data.m, "center", "success", 5000);
              $('#formImage')[0].reset();
              $('#impacto').html("");
              $('#carrusel').html("");
              $('#impacto').html('<select multiple="multiple" id="imgPub" class="image-picker show-html"></select>');
              $('#carrusel').html('<select multiple="multiple" id="imgCarr" class="image-picker show-html"></select>');
              sitio.cargarPublicidad(idDev);
              return false;
            }else{
              showSimpleNoty(data.m, "center", "error", 5000);
              $('#formImage')[0].reset();
              return false;
            }
          },
          error: function (jqXHR, msgStatus, errorThrown) {
            console.log(jqXHR+"  "+msgStatus+"   "+errorThrown);
            showSimpleNoty("Error al cargar publicidad", "center", "error", 0);
            mensajeCarga(false);
          }
        }); // Fin petición AJAX
      }
    } else {
      showSimpleNoty("No has seleccionado ninguna imagen", "center", "warning", 2000);
    }
  });


  $(document).on("click", "#btnIni", function () {
    if ($('#upInicio').val().length) {
      var nombre = $('#upInicio').val().replace(/C:\\fakepath\\/i, '').split('.');
      if (nombre[1] != "png" && nombre[1]!="jpg" && nombre[1]!="gif") {
        showSimpleNoty("Formato de imagen invalido, solo se aceptan imagenes con formato png, jpg y gif", "center", "warning", 2000);
      } else {
        var formulario = $("#iniImage");
        var archivo =new FormData();
        var tipo=$("#upInicio").attr('tipo');
        for (var i=0;i<(formulario.find('input[type=file]').length);i++){
          archivo.append((formulario.find('input[type="file"]:eq('+i+')').attr("name")),((formulario.find('input[type="file"]:eq('+i+')')[0]).files[0]));
        }
        $.ajax({
          url: "../web_services/uploadImages.php?tipo=Inicio",
          data: archivo,
          type: "post",
          cache: false,
          contentType: false,
          processData: false,
          dataType: "json",
          beforeSend: function () {
            mensajeCarga(true);
          },
          success: function (data) {
            mensajeCarga(false);
            if(data.s == 1){
              showSimpleNoty(data.m, "center", "success", 5000);
              $('#iniImage')[0].reset();
              $('#btnDispositivos').click();
              return false;
            }else{
              showSimpleNoty(data.m, "center", "error", 5000);
              $('#iniImage')[0].reset();
              return false;
            }
          },
          error: function (jqXHR, msgStatus, errorThrown) {
            showSimpleNoty("Error al cargar publicidad", "center", "error", 0);
            mensajeCarga(false);
          }
        }); // Fin petición AJAX
      }
    } else {
      showSimpleNoty("No has seleccionado ninguna imagen", "center", "warning", 2000);
    }
  });

  $(document).on("click", "#btnSaveDisp", function () {
    var valuesID=[];
    var valuesCR=[];
    var isEmpty = false;
    var idDev = $(this).attr('id-tipo');
    idDev = idDev.substring(3,idDev.length);
    var maquina=$("#Maquina").val();
    var clave=$("#Pass").val();
    var des=$("#info").val();
    //var espacio=$("#selectSpace").chosen().val();
    //var grupos = $('#gruposSelect').chosen().val();
    //grupos = (grupos == null) ? "" : grupos.join();
    //$('#mE3').attr('class', 'form-group has-success');
    if (maquina == '') {
      $('#mE0').attr('class', 'form-group has-error');
      isEmpty = true;
    }
    else $('#mE0').attr('class', 'form-group has-success');
    if (clave == '') {
      $('#mE1').attr('class', 'form-group has-error');
      isEmpty = true;
    }

    if (isEmpty){
      showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
    } else{
      Dispositivos.modifyDispositivo(maquina, clave, des, null, idDev, null).done(function (data) {
        if (data.s == 1) {
          socket.emit('devices');
          $("#myModal").modal('hide');
          showSimpleNoty(data.m, 'center', 'success', 5000);
          $('#btnDispositivos').click();
          socket.emit('devices');
        }
        else{
          showSimpleNoty(data.m, 'center', 'error', 0);
        }
      });
    }
  });

  //Funcion para eliminar y mostrar los mensajes de los botones de la eliminación de los catalogos
  $(document).on("click", "#btnEliminar", function (e) {
    e.preventDefault();
    var btnElement = $(this);
    var tipo = $(btnElement).attr("tipo");
    var idTipo = $(btnElement).attr("id-tipo");
    switch (tipo) {
      case "admins":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'del').done(function (data) {
        if (data.s == 1) {
          var ida =  $(btnElement).attr("id-admin");
          showOptionNoty ('¿Seguro que quieres eliminar este administrador?', 'center', 'warning', '', 'Administradores.deletePersonAdmin('+ida+','+idTipo+')');
        }
        else notyErrorAcceso();
      });
      break;
      case "rol":
      Administradores.ConsultAccess(id_admin, navMenus[1], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty ('¿Seguro que quieres eliminar este rol? Las personas que tienen este rol pasaran al rol DEFAULT', 'center', 'warning', '', 'Roles.deleteRolWarning(' + idTipo + ')');
        }
        else notyErrorAcceso();
      });
      break;
      case "grupo":
      Administradores.ConsultAccess(id_admin, navMenus[2], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar este grupo?', 'center', 'warning', '',
          "Grupos.deleteGrupo(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnGrupos').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "persona":
      Administradores.ConsultAccess(id_admin, navMenus[3], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar a esta persona?', 'center', 'warning', '',
          "Personas.deletePersona(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "sitio.construirTablaDatos('personas',"+$(this).attr("id-rol")+",true);"+
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "espacio":
      Administradores.ConsultAccess(id_admin, navMenus[4], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar este espacio?', 'center', 'warning', '',
          "Espacios.deleteEspacio(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnEspacios').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "servicio":
      Administradores.ConsultAccess(id_admin, navMenus[5], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar este servicio?', 'center', 'warning', '',
          "Servicios.deleteServicio(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnServicios').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "asignacion":
      Administradores.ConsultAccess(id_admin, navMenus[6], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar esta asignación?', 'center', 'warning', '',
          "Asignacion.deleteAsignacion(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnAsignaciones').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "diaNoLaboral":
      Administradores.ConsultAccess(id_admin, navMenus[8], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar este dia como no laboral?', 'center', 'warning', '',
          "DnLaborales.deleteDay('" + idTipo + "').done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnNoLaborales').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "device":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar este dispositivo?', 'center', 'warning', '',
          "Dispositivos.deleteDispositivo('" + idTipo.substring(3,idTipo.length) + "').done(function (data) { " +
          "if(data.s == 1) {" +
          "socket.emit('devices');"+
          "$('#myModal').modal('hide');" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "noticias":
      Administradores.ConsultAccess(id_admin, navMenus[2], 'del').done(function (data) {
        if (data.s == 1) {
          console.log("Eliminar>",idTipo);
          idTipo = idTipo.replace('noti', '');
          showOptionNoty('¿Seguro que quieres eliminar esta noticia?', 'center', 'warning', '',
          "Noticias.delete(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnNoticias').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          " $('#myModal').modal('hide'); } else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;

      case "piscina":

          console.log("Eliminar>",idTipo);
          idTipo = idTipo.replace('noti', '');
          showOptionNoty('¿Seguro que quieres eliminar este Registro', 'center', 'warning', '',
          "Piscina.delete(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnPiscina').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          " $('#myModal').modal('hide'); } else showSimpleNoty(data.m, 'center', 'error', '0');}); ");

      break;
      case "notPush":
      Administradores.ConsultAccess(id_admin, navMenus[9], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar esta notificación ?', 'center', 'warning', '',
          "Noticias.delete(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnNoticias').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          " $('#myModal').modal('hide'); } else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }
        else notyErrorAcceso();
      });
      break;
      case "socio":
      Administradores.ConsultAccess(id_admin, navMenus[4], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar esta persona?', 'center', 'warning', '',
          "Personas.deletePersona(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnSocios').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          " $('#myModal').modal('hide'); } else showSimpleNoty(data.m, 'center', 'error', '0');}); ");

        }
        else notyErrorAcceso();
      });
      break;
      case "empleado":
      Administradores.ConsultAccess(id_admin, navMenus[7], 'del').done(function (data) {
        if (data.s == 1) {
          showOptionNoty('¿Seguro que quieres eliminar esta persona?', 'center', 'warning', '',
          "Personas.deletePersona(" + idTipo + ").done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnEmpleados').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          " $('#myModal').modal('hide'); } else showSimpleNoty(data.m, 'center', 'error', '0');}); ");

        }
        else notyErrorAcceso();
      });
      break;
    }
  });

  //Funcion para Activar registros a los distintos catálogos
  $(document).on("click", "#btnActivar", function (e) {
    e.preventDefault();
    var btnElement = $(this);
    var tipo = $(btnElement).attr("tipo");
    var idTipo = $(btnElement).attr("id-tipo");
    switch (tipo) {
      case "device":
      Administradores.ConsultAccess(id_admin, navMenus[9], 'mod').done(function (data) {
        if(data.s == 1){
          showOptionNoty('¿Seguro que quieres Activar este dispositivo?', 'center', 'warning', '',
          "Dispositivos.activarDispositivo('" + idTipo + "').done(function (data) { " +
          "if(data.s == 1) {" +
          "document.getElementById('btnDispositivos').click();" +
          "$('button.close').click();" +
          "showSimpleNoty(data.m, 'center', 'success', '5000');" +
          "} else showSimpleNoty(data.m, 'center', 'error', '0');}); ");
        }else notyErrorAcceso;
      });
      break;
    }
  });

  //Funcion para eliminar a una persona de un grupo
  $(document).on("click", "#btnDelPerGrp", function (e) {
    e.preventDefault();
    var idp = $(this).attr("id-persona");
    var idg = $(this).attr("id-grupo");
    var from = $(this).attr("fm");
    Grupos.checkDeletePerson(idg, idp).done(function (data) {
      if(data.s == 1){
        $('#close-modal').click();
        showSimpleNoty(data.m, "center", "success", 5000);
      }else if(data.s == 5){
        showOptionNoty(data.m, 'center', 'warning', '',
        "Grupos.deletePerson("+idg+","+idp+").done(function (data) { " +
        "if(data.s == 1) {" +
        "showSimpleNoty(data.m, 'center', 'success', '5000');" +
        "$('#close-modal').click();"+
        "} else{ showSimpleNoty(data.m, 'center', 'error', '0');}}); ");
      }else showSimpleNoty(data.m, "center", "error", 0);
    });
  });

  //Funcion para ver los miembros que pertenecen a un grupo
  $(document).on("click", "#btnVerGrupo", function (e) {
    var btnElement = $(this);
    //Modal Head
    var id = $(btnElement).attr("id-tipo");
    var ng = $(btnElement).attr("ng");
    //var idr = $(this).attr("idRol");
    $("div.modal-header").attr("id-grupo", id);
    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Grupo: ' + ng + ' </h3>');
    $(".modal-body").html('');
    //Modal Body
    Grupos.consultMiembros(id).done(function (data) {
      var division = document.createElement('div');
      division.setAttribute('class', 'row');
      //aqui se construye la cabecera
      var tabla = document.createElement('table');
      tabla.setAttribute('id', 'tabla-miGrupo');
      tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
      var thead = document.createElement('thead');
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.innerHTML = "NSS";
      tr.appendChild(th);
      var th2 = document.createElement('th');
      th2.innerHTML = "Nombre";
      tr.appendChild(th2);
      thead.appendChild(tr);
      tabla.appendChild(thead);
      var tbody = document.createElement('tbody');
      //aqui se construye cada uno de los elementos
      var td = [];
      var td2 = [];
      var td3 = [];
      var tr = [];
      for (var i = 0; i < data.d.personas.length; i++) {
        tr[i] = document.createElement('tr');

        td[i] = document.createElement('td');
        td[i].innerHTML = data.d.personas[i].nss;
        tr[i].appendChild(td[i]);

        td2[i] = document.createElement('td');
        td2[i].innerHTML = data.d.personas[i].nombre;
        tr[i].appendChild(td2[i]);

        tbody.appendChild(tr[i]);
      }
      tabla.appendChild(tbody);
      $(".modal-body").html(tabla);
      $('#tabla-miGrupo').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l><'col-md-6 text-right'f>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
          "sLengthMenu": "_MENU_ registros por pagina",
          "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
          "sZeroRecords": "No se encontró ningún registro",
          "sInfoEmpty": "No existen registros",
          "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
          "sSearch": "Búsqueda:",
          "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Ultimo",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
          }
        }
      });
    });
    //Modal Footer
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ');
    e.preventDefault();
    if (!$('#myModal').hasClass('in')) {
      $('#myModal').attr("class", "modal fade normal").modal('show');
    }
  });

  //Funcion para guardar personas a un grupo en específico
  $(document).on("click", "#btnSavePersonaGrupo", function (e) {
    e.preventDefault();
    var idg = $(this).attr("id-grupo");
    var idp = $(this).attr("id-persona");
    Grupos.addPerson(idg,idp).done(function(dataG){
      if(dataG.s==1){
        $('#close-modal').click();
        // sitio.construirTablaDatos('grupo',{idp:idp});
        showSimpleNoty(dataG.m, "center", "success", 5000);
      }else showSimpleNoty(dataG.m, "center", "error", 0);
    });
  });

  //Funcion para ver los detalles de la asignacion
  $(document).on("click", "#btnVerAsignacion", function (e) {
    //Modal Head
    var ida = $(this).attr("id-tipo");
    var na = $(this).attr("na");
    $("div.modal-header").attr("id-tipo", ida);
    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Detalle Asignación: ' + na + ' </h3>');
    $(".modal-body").html('<div> ' +
    '<table width="100%"> ' +
    '<tr>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkLunes"><input type="checkbox" id="checkLunes"> Lunes </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkMartes"><input type="checkbox" id="checkMartes"> Martes  </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkMiercoles"><input type="checkbox" id="checkMiercoles"> Miércoles </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkJueves"><input type="checkbox" id="checkJueves"> Jueves </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkViernes"><input type="checkbox" id="checkViernes"> Viernes </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkSabado"><input type="checkbox" id="checkSabado"> Sábado </input> </label> </td>' +
    '<td style="text-align:center;" width="130"> <label class="control-label" for="checkDomingo"><input type="checkbox" id="checkDomingo"> Domingo </input> </label> </td>' +
    '</tr> ' +
    '<tr>' +
    '<td> <div id="mE1" class="form-inline"> <input id="hiL" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiL">Inicio</label> </div> ' +
    '<div id="mE2" class="form-inline"> <input id="hfL" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfL">Fin</label> </div> </td> ' +
    '<td> <div id="mE3" class="form-inline"> <input id="hiM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiM">Inicio</label> </div> ' +
    '<div id="mE4" class="form-inline"> <input id="hfM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfM">Fin</label> </div> </td> ' +
    '<td> <div id="mE5" class="form-inline"> <input id="hiMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiMi">Inicio</label> </div> ' +
    '<div id="mE6" class="form-inline"> <input id="hfMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfMi">Fin</label> </div> </td> ' +
    '<td> <div id="mE7" class="form-inline"> <input id="hiJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiJ">Inicio</label> </div> ' +
    '<div id="mE8" class="form-inline"> <input id="hfJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfJ">Fin</label> </div> </td> ' +
    '<td> <div id="mE9" class="form-inline"> <input id="hiV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiV">Inicio</label> </div> ' +
    '<div id="mE10" class="form-inline"> <input id="hfV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfV">Fin</label> </div> </td>' +
    '<td> <div id="mE11" class="form-inline"> <input id="hiS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiS">Inicio</label> </div> ' +
    '<div id="mE12" class="form-inline"> <input id="hfS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfS">Fin</label> </div> </td>' +
    '<td> <div id="mE13" class="form-inline"> <input id="hiD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiD">Inicio</label> </div> ' +
    '<div id="mE14" class="form-inline"> <input id="hfD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hf">Fin</label> </div> </td> ' +
    '</tr> ' +
    '</table>' +
    '</div>');
    $('.timepicker').timepicker({
      showMeridian: false,
      minuteStep: 10,
      disableMousewheel: false,
    }).on('keydown', function(e) {
      e = e || window.event;
      if(e.keyCode == 9) {
        $(this).timepicker('hideWidget');
        console.log("tab pressed");
      }

    }).prop('disabled', true);
    $(':checkbox').change(function () {
      if ($('#checkLunes').prop('checked')) {
        $('#hiL').prop('disabled', false);
        $('#hfL').prop('disabled', false);
      }
      else {
        $('#hiL').prop('disabled', true);
        $('#hfL').prop('disabled', true);
        $('#mE1').attr('class', 'form-inline');
        $('#mE2').attr('class', 'form-inline');
      }
      if ($('#checkMartes').prop('checked')) {
        $('#hiM').prop('disabled', false);
        $('#hfM').prop('disabled', false);
      }
      else {
        $('#hiM').prop('disabled', true);
        $('#hfM').prop('disabled', true);
        $('#mE3').attr('class', 'form-inline');
        $('#mE4').attr('class', 'form-inline');
      }
      if ($('#checkMiercoles').prop('checked')) {
        $('#hiMi').prop('disabled', false);
        $('#hfMi').prop('disabled', false);
      }
      else {
        $('#hiMi').prop('disabled', true);
        $('#hfMi').prop('disabled', true);
        $('#mE5').attr('class', 'form-inline');
        $('#mE6').attr('class', 'form-inline');
      }
      if ($('#checkJueves').prop('checked')) {
        $('#hiJ').prop('disabled', false);
        $('#hfJ').prop('disabled', false);
      }
      else {
        $('#hiJ').prop('disabled', true);
        $('#hfJ').prop('disabled', true);
        $('#mE7').attr('class', 'form-inline');
        $('#mE8').attr('class', 'form-inline');
      }
      if ($('#checkViernes').prop('checked')) {
        $('#hiV').prop('disabled', false);
        $('#hfV').prop('disabled', false);
      }
      else {
        $('#hiV').prop('disabled', true);
        $('#hfV').prop('disabled', true);
        $('#mE9').attr('class', 'form-inline');
        $('#mE10').attr('class', 'form-inline');
      }
      if ($('#checkSabado').prop('checked')) {
        $('#hiS').prop('disabled', false);
        $('#hfS').prop('disabled', false);
      }
      else {
        $('#hiS').prop('disabled', true);
        $('#hfS').prop('disabled', true);
        $('#mE11').attr('class', 'form-inline');
        $('#mE12').attr('class', 'form-inline');
      }
      if ($('#checkDomingo').prop('checked')) {
        $('#hiD').prop('disabled', false);
        $('#hfD').prop('disabled', false);
      }
      else {
        $('#hiD').prop('disabled', true);
        $('#hfD').prop('disabled', true);
        $('#mE13').attr('class', 'form-inline');
        $('#mE14').attr('class', 'form-inline');
      }
    });
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ' +
    '<a href="#" id="saveDetalleAs" class="btn btn-primary"> Guardar Cambios </a>');
    e.preventDefault();
    if (!$('#myModal').hasClass('in')) {
      $('#myModal').attr("class", "modal fade modal-wide").modal('show');
    }
    else {
      $('#myModal').removeClass('normal').addClass('modal-wide');
    }
    $.post(WS_PRIVADOS_URL, {ws: "dAsignacion", ida: ida}, function (data) {
      var detalles = data.d['detalleAsignacion'];
      detalles.forEach(function (diaD) {
        switch (diaD.dia) {
          case "L":
          $('#checkLunes').prop('checked', true);
          $('#hiL').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfL').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "M":
          $('#checkMartes').prop('checked', true);
          $('#hiM').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfM').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "Mi":
          $('#checkMiercoles').prop('checked', true);
          $('#hiMi').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfMi').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "J":
          $('#checkJueves').prop('checked', true);
          $('#hiJ').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfJ').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "V":
          $('#checkViernes').prop('checked', true);
          $('#hiV').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfV').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "S":
          $('#checkSabado').prop('checked', true);
          $('#hiS').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfS').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
          case "D":
          $('#checkDomingo').prop('checked', true);
          $('#hiD').timepicker('setTime', diaD.hi).prop('disabled', false);
          $('#hfD').timepicker('setTime', diaD.hf).prop('disabled', false);
          break;
        }
      })
    }, 'json');
  });

  $(document).on("click", "#saveDetalleAs", function () {
    var btnElement = $(this);
    Administradores.ConsultAccess(id_admin, navMenus[6], 'mod').done(function (data) {
      if(data.s == 1){
        var ida = $("div.modal-header").attr("id-tipo");
        var detalles = {L: 'L', M: 'M', Mi: 'Mi', J: 'J', V: 'V', S: 'S', D: 'D'};
        var isEmpty = false;
        var hi;
        var hf;
        if ($('#checkLunes').prop('checked')) {
          hi = $('#hiL').val();
          hf = $('#hfL').val();
          if (hi == '') {
            $('#mE1').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE1').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE2').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE2').attr('class', 'form-inline has-success');
          detalles['L'] = hi + ' ' + hf;
        }
        else detalles['L'] = 0;
        if ($('#checkMartes').prop('checked')) {
          hi = $('#hiM').val();
          hf = $('#hfM').val();
          if (hi == '') {
            $('#mE3').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE3').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE4').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE4').attr('class', 'form-inline has-success');
          detalles['M'] = hi + ' ' + hf;
        }
        else detalles['M'] = 0;
        if ($('#checkMiercoles').prop('checked')) {
          hi = $('#hiMi').val();
          hf = $('#hfMi').val();
          if (hi == '') {
            $('#mE5').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE5').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE6').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE6').attr('class', 'form-inline has-success');
          detalles['Mi'] = hi + ' ' + hf;
        }
        else detalles['Mi'] = 0;
        if ($('#checkJueves').prop('checked')) {
          hi = $('#hiJ').val();
          hf = $('#hfJ').val();
          if (hi == '') {
            $('#mE7').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE7').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE8').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE8').attr('class', 'form-inline has-success');
          detalles['J'] = hi + ' ' + hf;
        }
        else detalles['J'] = 0;
        if ($('#checkViernes').prop('checked')) {
          hi = $('#hiV').val();
          hf = $('#hfV').val();
          if (hi == '') {
            $('#mE9').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE9').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE10').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE10').attr('class', 'form-inline has-success');
          detalles['V'] = hi + ' ' + hf;
        }
        else detalles['V'] = 0;
        if ($('#checkSabado').prop('checked')) {
          hi = $('#hiS').val();
          hf = $('#hfS').val();
          if (hi == '') {
            $('#mE11').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE11').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE12').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE12').attr('class', 'form-inline has-success');
          detalles['S'] = hi + ' ' + hf;
        }
        else detalles['S'] = 0;
        if ($('#checkDomingo').prop('checked')) {
          hi = $('#hiD').val();
          hf = $('#hfD').val();
          if (hi == '') {
            $('#mE13').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE13').attr('class', 'form-inline has-success');
          if (hf == '') {
            $('#mE14').attr('class', 'form-inline has-error');
            isEmpty = true;
          }
          else $('#mE14').attr('class', 'form-inline has-success');
          detalles['D'] = hi + ' ' + hf;
        }
        else detalles['D'] = 0;
        if (isEmpty) {
          showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
        }
        else {
          detalles = JSON.stringify(detalles);
          $.post(WS_PRIVADOS_URL, {
            ws: "hAsignacion",
            ida: ida,
            detalle: detalles
          }, function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnAsignaciones").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          }, 'json');
        }
      }else notyErrorAcceso();
    });
  });

  $(document).on("click", "#vDetallesNss", function () {
    $('#tipo-reporte').val(1);
    $('#tipo-reporte').change();
    setTimeout(function(){
      $('#txtNomina').val($(this).attr('nss'));
      $('#btnNomina').click();
    }, 500);
  });

  $(document).on("click", "#btnVerIncidencias", function () {
    var info = [];
    info['nss'] = $(this).attr("nss");
    info['fecha'] =  $(this).attr("fecha");
    info['registros'] =  $(this).attr("registros");
    sitio.construirModal(tipo, 'Mostrar', info);

  });
  //Funcion para editar los registros de los catálogos según corresponda
  $(document).on("click", "#btnModificar", function () {
    var btnElement = $(this);
    var tipo = $(btnElement).attr("tipo");
    var info = [];
    switch (tipo) {
      case "admins":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'mod').done(function (data) {
        if(data.s == 1){
          info['id'] = $(btnElement).attr("id-tipo");
          info['rol'] = $(btnElement).attr("id-rol");
          sitio.construirModal(tipo, 'mod', info);
          $("div.modal-header").attr("id-tipo", info['id']);
        }else notyErrorAcceso();
      });
      break;
      case "rol":
      Administradores.ConsultAccess(id_admin, navMenus[1], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          var nombre = $(btnElement).attr("nombre");
          sitio.construirModal(tipo, 'mod');
          $("div.modal-header").attr("id-tipo", id);
          $('#nombreRol').val(nombre);
        }else notyErrorAcceso();
      });
      break;
      case "grupo":
      Administradores.ConsultAccess(id_admin, navMenus[2], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          var nomGrupo = $(btnElement).attr("ng");
          $("div.modal-header").attr("id-tipo", id);
          info.idg = id;
          info.gRol = ($(btnElement).attr("gRol") == "true");
          $('#nombreGrupo').val(nomGrupo);
          sitio.construirModal(tipo, 'mod', info);
        }else notyErrorAcceso();
      });
      break;
      case "persona":
      Administradores.ConsultAccess(id_admin, navMenus[3], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          $("div.modal-header").attr("id-tipo", id);
          Personas.consultPersonaId(id).done(function (data) {
            info['rol'] = data.d.persona[0].rol;
            if(info['rol'] == 2){
              var tempinfo = data.d.persona[0].detalle.split(";");
              info['carrera'] = tempinfo[0];
              info['semestre'] = tempinfo[1];
              info['campus'] = tempinfo[2];
            }
            sitio.construirModal(tipo, 'mod', info);
            $('#nombrePer').val(data.d.persona[0].nombre);
            $('#aP').val(data.d.persona[0].ap);
            $('#aM').val(data.d.persona[0].am);
            $('#eMail').val(data.d.persona[0].email);
            $('#tel').val(data.d.persona[0].tel);
            $('#nss').val(data.d.persona[0].nss);
            $('#id1').val(data.d.persona[0].id1);
            $('#cel').val(data.d.persona[0].cel);
            if(info['rol'] != 2){
              $('#selectTitulo').val(data.d.persona[0].titulo).trigger('chosen:updated');
              $('#selectNivel').val(data.d.persona[0].nivel).trigger('chosen:updated');
              $('#detalle').val(data.d.persona[0].detalle);
              //$('#selectRol').val();
              $('#id2').val(data.d.persona[0].id2);
              $('#id3').val(data.d.persona[0].id3);
              if (data.d.persona[0].idAdmin != "") {
                $('#checkAdmin').prop('checked', true);
                $('#usuario').val(data.d.persona[0].user).prop('disabled', false);
                $('#mE15').show();
              }
            }
          });
        }else notyErrorAcceso();
      });
      break;
      case "espacio":
      Administradores.ConsultAccess(id_admin, navMenus[4], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          var espacio = $(btnElement).attr("nombre");
          var capacidad = $(btnElement).attr("capacidad");
          info['tipoEsp'] = $(btnElement).attr("tipoEspacio");
          sitio.construirModal(tipo, 'mod', info);
          $("div.modal-header").attr("id-tipo", id);
          $('#nombreEspacio').val(espacio);
          $('#selectCap').val(capacidad);
        }else notyErrorAcceso();
      });
      break;
      case "servicio":
      Administradores.ConsultAccess(id_admin, navMenus[5], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          var codigo = $(btnElement).attr("codigo");
          var nombre = $(btnElement).attr("titulo");
          var depa = $(btnElement).attr("depa");
          var nivel = $(btnElement).attr("nivel");
          var tipoServ = $(btnElement).attr("tipoServicio");
          sitio.construirModal(tipo, 'mod');
          $("div.modal-header").attr("id-tipo", id);
          $('#codigoServ').val(codigo);
          $('#nombreServ').val(nombre);
          $('#selectDep').val(depa).trigger('chosen:updated');
          $('#selectNivel').val(nivel).trigger('chosen:updated');
          $('#selectTipoServ').val(tipoServ).trigger('chosen:updated');
        }else notyErrorAcceso();
      });
      break;
      case "asignacion":
      Administradores.ConsultAccess(id_admin, navMenus[6], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr("id-tipo");
          var crn = $(btnElement).attr("crn");
          var periodo = $(btnElement).attr("periodo");
          var fi = $(btnElement).attr("fi");
          var ff = $(btnElement).attr("ff");
          info['persona'] = $(btnElement).attr("idp");
          info['espacio'] = $(btnElement).attr("ide");
          info['grupo'] = $(btnElement).attr("idg");
          info['servicio'] = $(btnElement).attr("ids");
          sitio.construirModal(tipo, 'mod', info);
          $("div.modal-header").attr("id-tipo", id);
          $("#crn").val(crn);
          $("#periodo").val(periodo);
          $("#feIn").val(fi);
          $("#feFi").val(ff);
        }else notyErrorAcceso();
      });
      break;
      case "diaNoLaboral":
      Administradores.ConsultAccess(id_admin, navMenus[8], 'mod').done(function (data) {
        if(data.s == 1){
          info['dia'] = $(btnElement).attr("dia");
          info['niveles'] =  $(btnElement).attr("niveles").split(',');
          sitio.construirModal(tipo, 'mod', info);
        }else notyErrorAcceso();
      });
      break;
      case "device":
      Administradores.ConsultAccess(id_admin, navMenus[9], 'mod').done(function (data) {
        if(data.s == 1){
          info['dev'] = $(btnElement).attr('id-dev');
          sitio.construirModal(tipo, 'mod', info);
        }else notyErrorAcceso();
      });
      break;
      case "cDoor":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'mod').done(function (data) {
        if(data.s == 1){
          info['dev'] = $(btnElement).attr('id-dev');
          sitio.construirModal(tipo, 'mod', info);
        }else notyErrorAcceso();
      });
      break;
      case "noticias":
      Administradores.ConsultAccess(id_admin, navMenus[2], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr('id-tipo');
          var fecha = $(btnElement).attr('fecha-tipo');
          var titulo = $(btnElement).attr('titulo-tipo');
          var vigencia = $(btnElement).attr('vigencia-tipo');
          sitio.construirModal(tipo, 'mod');

          $("div.modal-header").attr("id-tipo", id);
          $('#titulo').val(titulo);
          $('#txtFechaIni').val(fecha);
          $('#vigencia').val(vigencia);

        }else notyErrorAcceso();
      });
      break;

      case "socios":
      Administradores.ConsultAccess(id_admin, navMenus[4], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr('id-tipo');
          var nombre = $(btnElement).attr('nombre-tipo');
          ControlSocios.construirModal('mod',id, nombre);
        }else notyErrorAcceso();
      });
      break;
      case "empleados":
      Administradores.ConsultAccess(id_admin, navMenus[7], 'mod').done(function (data) {
        if(data.s == 1){
          var id = $(btnElement).attr('id-tipo');
          var nombre = $(btnElement).attr('nombre-tipo');
          ControlEmpleados.construirModal('mod',id, nombre);
        }else notyErrorAcceso();
      });
      break;
    }
  });

  //Funcion para agregar registros a los distintos catálogos
  $(document).on("click", "#btnAgregar", function (e) {
    var btnElement = $(this);
    var tipo = $(btnElement).attr("tipo");
    switch (tipo) {
      case "admins":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "rol":
      Administradores.ConsultAccess(id_admin, navMenus[1], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "grupo":
      Administradores.ConsultAccess(id_admin, navMenus[2], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add',{gRol:false});
        }else notyErrorAcceso();
      });
      break;
      case "persona":

          sitio.construirModal(tipo, 'add',{"rol":$(btnElement).attr("rol")});

      break;
      case "espacio":
      Administradores.ConsultAccess(id_admin, navMenus[4], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "servicio":
      Administradores.ConsultAccess(id_admin, navMenus[5], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "asignacion":
      Administradores.ConsultAccess(id_admin, navMenus[6], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "diaNoLaboral":
      Administradores.ConsultAccess(id_admin, navMenus[8], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "device":
      Administradores.ConsultAccess(id_admin, navMenus[9], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "cDoor":
      Administradores.ConsultAccess(id_admin, navMenus[0], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "noticias":
      //Administradores.ConsultAccess(id_admin, navMenus[2], 'esc').done(function (data) {
        //if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        //}else notyErrorAcceso();
      //});
      break;

      case "piscina":
          sitio.construirModal(tipo, 'add');
      break;

      case "notPush":

          sitio.construirModal(tipo, 'add');

      break;
      case "empleados":
          ControlEmpleados.construirModal('add');

      break;
      case "alberca":
      Administradores.ConsultAccess(id_admin, navMenus[9], 'esc').done(function (data) {
        if(data.s == 1){
          sitio.construirModal(tipo, 'add');
        }else notyErrorAcceso();
      });
      break;
      case "socios":

          ControlSocios.construirModal('add');

      break;
    }
  });

  //Funcion para guardar los los registros segun corresponda (Modificar o Agregar)
  $(document).off("click", "#btnSaveReg");
  $(document).on("click", "#btnSaveReg", function () {
    var tipo = $(this).attr('tipo');
    var accion = $(this).attr('accion');
    var isEmpty = false;
    switch (tipo) {
      case "admins":
      var accesos = {};
      for (var i = 0; i < navMenus.length; i++) {
        accesos[navMenus[i]] = {
          leer: $('#'+navMenus[i]+"_leer").is(':checked'),
          mod: $('#'+navMenus[i]+"_mod").is(':checked'),
          esc: $('#'+navMenus[i]+"_esc").is(':checked'),
          del: $('#'+navMenus[i]+"_del").is(':checked'),
        };
      }
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Administradores.Modify(id, nss, titulo, nombre, ap, am, mail, cel, tel, detalle, rol, id1, id2, id3, admin, user, contra, JSON.stringify(accesos)).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnAdmins").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }else {
          Administradores.Add(nss, titulo, nombre, ap, am, mail, cel, tel, detalle, rol, id1, id2, id3, admin, user, contra, JSON.stringify(accesos)).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnAdmins").click();
              showSimpleNoty(data.m, 'center', 'success', 3000);
            }else
            showSimpleNoty(data.m, 'center', 'error', 3000);
          });
        }
      break;
      case "rol":
      var rol = $('#nombreRol').val();
      if (rol == '') {
        $('#mE1').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE1').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }
      else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Roles.modifyRole(id, rol).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnRoles").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Roles.addRole(rol).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnRoles").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "grupo":
      var grupo = $('#nombreGrupo').val();
      if (grupo == '') {
        $('#mE1').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE1').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Grupos.modifyGrupo(id, grupo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnGrupos").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Grupos.addGrupo(grupo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnGrupos").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "persona":
      var nombre = $('#nombrePer').val();
      var ap = $('#aP').val();
      var am = $('#aM').val();
      var mail = $('#eMail').val();
      var tel = $('#tel').val();
      var rol = $('#selectRol').chosen().val();
      var id1 = $('#id1').val();
      var admin = 0;
      var user = "";
      var detalle ="";
      var titulo ="";
      var cel ="";
      var nss = $('#nss').val();
      var detalle ="";
      var id2 ="";
      var id3 ="";

      if($(this).attr('rol-tipo') == 2){
        titulo = "alumno";
        var c ="";
        if($('#selectCarrera').val()==10){
          if ($('#otroIn').val() == "" ) {
            $('#mE8').attr('class', 'form-group has-error');
            $('#otro').attr('class', 'form-group has-error');
            isEmpty = true;
          }else {
            $('#mE8').attr('class', 'form-group has-success');
            $('#otro').attr('class', 'form-group has-success');
            c= $('#otroIn').val();
          }
        }else{
          if ($('#selectCarrera').chosen().val() == "" ) {
            $('#mE8').attr('class', 'form-group has-error');
            isEmpty = true;
          }else {
            $('#mE8').attr('class', 'form-group has-success');
            c = $('#selectCarrera').chosen().val();
          }
        }
        if($('#selectSemestre').chosen().val() == ""){
          $('#mE9').attr('class', 'form-group has-error');
          isEmpty = true;
        }else{
          $('#mE9').attr('class', 'form-group has-success');
        }
        if($('#selectCampus').chosen().val() == ""){
          $('#mE10').attr('class', 'form-group has-error');
          isEmpty = true;
        }else{
          $('#mE10').attr('class', 'form-group has-success');
        }
        if(!isEmpty)
        detalle = c + ";" + $('#selectSemestre').chosen().val() + ";" + $('#selectCampus').chosen().val();
      }else{
        titulo = $('#selectTitulo').chosen().val();
        cel = $('#cel').val();
        //var nivel = $('#selectNivel').chosen().val();
        detalle = $('#detalle').val();
        id2 = $('#id2').val();
        id3 = $('#id3').val();
        $('#mE8').attr('class', 'form-group has-success');
        $('#mE9').attr('class', 'form-group has-success');
      }
      ////////////////////////
      $('#mE1').attr('class', 'form-group has-success');
      if (nss == '') {
        $('#mE2').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE2').attr('class', 'form-group has-success');
      if (nombre == '') {
        $('#mE3').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE3').attr('class', 'form-group has-success');
      if (ap == '') {
        $('#mE4').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE4').attr('class', 'form-group has-success');
      if (am == '') {
        $('#mE5').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE5').attr('class', 'form-group has-success');
      if (mail == '') {
        $('#mE6').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE6').attr('class', 'form-group has-success');
      $('#mE7').attr('class', 'form-group has-success');
      //$('#mE10').attr('class', 'form-group has-success');
      $('#mE11').attr('class', 'form-group has-success');
      if (id1 == '') {
        $('#mE12').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE12').attr('class', 'form-group has-success');
      $('#mE13').attr('class', 'form-group has-success');
      $('#mE14').attr('class', 'form-group has-success');



      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Personas.modifyPersona(id, titulo, nombre, ap, am, mail, tel, cel, nss, detalle, rol, id1, id2, id3, admin, user).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnPersonas").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Personas.addPersona(titulo, nombre, ap, am, mail, tel, cel, nss, detalle, rol, id1, id2, id3, admin, user).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnPersonas").click();
              showSimpleNoty(data.m, 'center', 'success', 3000);
            }
            else
            showSimpleNoty(data.m, 'center', 'error', 3000);
          });
        }
      }
      break;
      case "espacio":
      var espacio = $('#nombreEspacio').val();
      var capacidad = $('#selectCap').val();
      var tipo = $('#selectTipoEsp').chosen().val();
      if (espacio == '') {
        $('#mE1').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE1').attr('class', 'form-group has-success');
      if (capacidad < 0)
      $('#mE2').attr('class', 'form-group has-error');
      else $('#mE2').attr('class', 'form-group has-success');
      if (tipo == '') {
        $('#mE3').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE3').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }
      else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Espacios.modifyEspacio(id, espacio, capacidad, tipo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnEspacios").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Espacios.addEspacio(espacio, capacidad, tipo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnEspacios").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "diaNoLaboral":
      var fecha = $('#txtFechaBan').val();
      var niveles = '';
      if ($('#levList').chosen().val() != null) {
        niveles = $('#levList').chosen().val().join();
      }
      if (fecha == '') {
        $('#txtFechaBan').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#txtFechaBan').attr('class', 'form-group has-success');
      if (niveles.length < 1){
        $('#levList').attr('class', 'form-group has-error');
        isEmpty= true;
      }
      else
      $('#levList').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }
      else {
        if (accion == 'mod') {
          DnLaborales.modifyDay(fecha, niveles).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnNoLaborales").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          DnLaborales.addDay(fecha, niveles).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnNoLaborales").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "servicio":
      var codigo = $('#codigoServ').val();
      var nombre = $('#nombreServ').val();
      var depa = $('#selectDep').chosen().val();
      var nivel = $('#selectNivel').chosen().val();
      var tipo = $('#selectTipoServ').chosen().val();
      $('#mE1').attr('class', 'form-group has-success');
      if (nombre == '') {
        $('#mE2').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE2').attr('class', 'form-group has-success');
      $('#mE3').attr('class', 'form-group has-success');
      $('#mE4').attr('class', 'form-group has-success');
      if (tipo == '') {
        $('#mE5').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE5').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }
      else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Servicios.modifyServicio(id, codigo, nombre, depa, nivel, tipo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnServicios").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Servicios.addServicio(codigo, nombre, depa, nivel, tipo).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              document.getElementById("btnServicios").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "asignacion":
      var crn = $('#crn').val();
      var periodo = $('#periodo').val();
      var fi = $('#feIn').val();
      var ff = $('#feFi').val();
      var servicio = $('#selectServ').chosen().val();
      var persona = $('#selectPer').chosen().val();
      var grupo = $('#selectGrupo').chosen().val();
      var espacio = $('#selectEsp').chosen().val();
      $('#mE1').attr('class', 'form-group has-success');
      $('#mE0').attr('class', 'form-group has-success');
      if (servicio == '') {
        $('#mE2').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE2').attr('class', 'form-group has-success');
      if (persona == '') {
        $('#mE3').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE3').attr('class', 'form-group has-success');
      if (grupo == '' || grupo == null) {
        $('#mE4').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE4').attr('class', 'form-group has-success');
      if (espacio == '') {
        $('#mE5').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE5').attr('class', 'form-group has-success');
      if (fi == '') {
        $('#mE6').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE6').attr('class', 'form-group has-success');
      if (ff == '') {
        $('#mE7').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE7').attr('class', 'form-group has-success');
      if (isEmpty) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      }
      else {
        if (accion == 'mod') {
          var id = $("div.modal-header").attr("id-tipo");
          Asignacion.modifyAsignacion(id, grupo, espacio, servicio, persona, fi, ff, crn, periodo).done(function (data) {
            if (data.s == 1) {
              showSimpleNoty(data.m, 'center', 'success', 5000);
              $("#myModal").modal('hide');
              $("#btnAsignaciones").click();
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
        else {
          Asignacion.addAsignacion(grupo, espacio, servicio, persona, fi, ff, crn, periodo, id_admin).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              $("#btnAsignaciones").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
              showSimpleNoty("Recuerda cargar el horario para esta asignación", 'center', 'information', 0);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });
        }
      }
      break;
      case "dispositivo":
      var maquina = $("#Maquina").val();
      var clave = $("#Pass").val();
      var des=$("#info").val();
      //var espacio=$("#selectSpace").chosen().val();
      $('#mE4').attr('class', 'form-group has-success');
      if (maquina == '') {
        $('#mE0').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE0').attr('class', 'form-group has-success');
      if (clave == '') {
        $('#mE1').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE1').attr('class', 'form-group has-success');


      if (isEmpty){
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      } else{

          Dispositivos.addDispositivo(maquina, clave, des, espacio).done(function (data) {
            if (data.s == 1) {
              $("#myModal").modal('hide');
              $("#btnDispositivos").click();
              showSimpleNoty(data.m, 'center', 'success', 5000);
              socket.emit("devices"); // con esto actualizas los dispositivos
              //showSimpleNoty("Recuerda cargar las imagenes para este dispositio", 'center', 'information', 0);
            }
            else
            showSimpleNoty(data.m, 'center', 'warning', 0);
          });

      }
      break;

      case "cDoor":
      var maquina=$("#Maquina").val();
      var clave=$("#Password").val();
      var des=$("#info").val();
      if (maquina == '') {
        $('#mE0').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE0').attr('class', 'form-group has-success');
      if (clave == '') {
        $('#mE1').attr('class', 'form-group has-error');
        isEmpty = true;
      }
      else $('#mE1').attr('class', 'form-group has-success');
      if (isEmpty){
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
      } else{
        //TODO agregar al ws
        $("#myModal").modal('hide');
        $("#btnAccesos").click();

          // Dispositivos.addDispositivo(maquina, clave, des, espacio).done(function (data) {
          //   if (data.s == 1) {
          //     $("#myModal").modal('hide');
          //     $("#btnDispositivos").click();
          //     showSimpleNoty(data.m, 'center', 'success', 5000);
          //     showSimpleNoty("Recuerda cargar las imagenes para este dispositio", 'center', 'information', 0);
          //   }
          //   else
          //   showSimpleNoty(data.m, 'center', 'warning', 0);
          // });
      }
      break;
      case "socio":
        var id = "";
        var tipo_cuenta = $('#tipo-cuenta').val();
        var parentesco = $('#parentesco').val();
        var vinculo = $('#vincular').chosen().val();
        var nombre = $('#nombre').val();
        var apellidoP = $('#apellidoP').val();
        var apellidoM = $('#apellidoM').val();
        var direccion = $('#direccion').val();
        var telefono = $('#telefono').val();
        var correo = $('#correo').val();
        var fecha_nac = $('#fecha-nac').val();
        var tipo_sangre = $('#tipo-sangre').val();
        var genero = $('#genero').val();
        var nMembresia = $('#nMembresia').val();
        var nip = $('#nip').val();

        var imageData = $('#userImage').attr('src');
        var tipoMemb = $('#tipo-memb').val();

        var rol = 2;

        switch (tipo_cuenta) {
          case "asociado":
            rol = 4;
            break;
          case "visita":
            rol = 5;
            break;
        }

        ////////////////////////

        if (nombre == '') {
          $('#mE4').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE4').attr('class', 'form-group has-success');
        if (apellidoP == '') {
          $('#mE5').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE5').attr('class', 'form-group has-success');
        if (apellidoM == '') {
          $('#mE6').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE6').attr('class', 'form-group has-success');
        if (nMembresia == '') {
          $('#mE15').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else{
          $('#mE15').attr('class', 'form-group has-success');

          $('#mE1').attr('class', 'form-group has-success');
          $('#mE2').attr('class', 'form-group has-success');
          $('#mE3').attr('class', 'form-group has-success');
          $('#mE7').attr('class', 'form-group has-success');
          $('#mE8').attr('class', 'form-group has-success');
          $('#mE9').attr('class', 'form-group has-success');
          $('#mE10').attr('class', 'form-group has-success');
          $('#mE11').attr('class', 'form-group has-success');
          $('#mE12').attr('class', 'form-group has-success');
          $('#mE13').attr('class', 'form-group has-success');
          $('#mE14').attr('class', 'form-group has-success');
          $('#mE16').attr('class', 'form-group has-success');
          $('#mE17').attr('class', 'form-group has-success');
          $('#mE18').attr('class', 'form-group has-success');
        }


        if (isEmpty) {
          showSimpleNoty('Existen campos obligatorios vacíos', 'center', 'warning', 0);
        }else {
          if (accion == 'mod') {
            var id = $("div.modal-header").attr("id-tipo");
            //TODO mandar vinculos y parentesco
            Personas.modifyPersona(id,nombre,apellidoP,apellidoM,direccion,tipoMemb,telefono,celular,correo,rfc,fecha_nac,tipo_sangre,genero,nMembresia,nip,estatus,rol).done(function (data) {
              if (data.s == 1) {
                $("#myModal").modal('hide');
                document.getElementById("btnSocios").click();
                showSimpleNoty(data.m, 'center', 'success', 3000);
                if (vinculo && (ControlSocios.vinculoCambio != vinculo)){
                  Personas.vincularPersona(id,vinculo,parentesco).done(function(data) {
                    // if (data.s == 1){

                      ControlSocios.vinculoCambio ="";
                      $("#myModal").modal('hide');
                      document.getElementById("btnSocios").click();
                      showSimpleNoty(data.m, 'center', 'success', 3000);
                    // }
                    // else
                    // showSimpleNoty(data.m, 'center', 'error', 3000);
                  });
                }else
                  ControlSocios.vinculoCambio ="";

               var splitted;

               if(imageData.includes("base64")){
                 splitted = splitBase64Into(imageData,200000);
                 sendImageSplitted(0,splitted.length,splitted,id);
               }

              }
              else
              showSimpleNoty(data.m, 'center', 'warning', 0);
            });
          }
          else {
            Personas.addPersona(nombre,apellidoP,apellidoM,direccion,tipoMemb,telefono,celular,correo,rfc,fecha_nac,tipo_sangre,genero,nMembresia,nip,estatus,rol).done(function (data) {
              if (data.s == 1) {
                $("#myModal").modal('hide');
                document.getElementById("btnSocios").click();
                showSimpleNoty(data.m, 'center', 'success', 3000);

                var newId = data.d.idp;
                console.log("vinculo" + vinculo);
                if (vinculo && (ControlSocios.vinculoCambio != vinculo)){
                  Personas.vincularPersona(newId,vinculo,parentesco).done(function(data) {
                    // if (data.s == 1){
                      $("#myModal").modal('hide');
                      document.getElementById("btnSocios").click();
                      showSimpleNoty(data.m, 'center', 'success', 3000);
                    // }
                    // else
                    // showSimpleNoty(data.m, 'center', 'error', 3000);
                  });
                }

                var splitted;
                if (imageData){
                  if(imageData.includes("base64")){
                    splitted = splitBase64Into(imageData,200000);
                  }else{
                    var canvas = document.createElement('canvas');
                    canvas.width = $('#userImage').width();
                    canvas.height = $('#userImage').height();

                    canvas.getContext('2d').drawImage($('#userImage')[0],0,0);

                    splitted = splitBase64Into(canvas.toDataURL('image/jpeg','1.0'),200000);
                    console.log("splitted" + canvas.toDataURL('image/jpeg','1.0'));
                  }

                  sendImageSplitted(0,splitted.length,splitted,newId);
                }
              }
              else
              showSimpleNoty(data.m, 'center', 'error', 3000);
            });
          }
        }
      break;
      case "empleado":
        var id = "";
        var nombre = $('#nombre').val();
        var apellidoP = $('#apellidoP').val();
        var apellidoM = $('#apellidoM').val();
        var direccion = $('#direccion').val();
        var telefono = $('#telefono').val();
        var celular = $('#celular').val();
        var correo = $('#correo').val();
        var rfc = $('#rfc').val();
        var fecha_nac = $('#fecha-nac').val();
        var tipo_sangre = $('#tipo-sangre').val();
        var genero = $('#genero').val();
        var nip = $('#nip').val();
        var estatus = $('#estatus').val();
        var nMembresia = $('#nMembresia').val();
        var imageData = $('#userImage').attr('src');
        var user = $('#user').val();
        var pass = $('#pass').val();
        var rol = 3;

        ////////////////////////
        if (user == '') {
          $('#mE1').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE1').attr('class', 'form-group has-success');
        if (pass == '') {
          $('#mE2').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE2').attr('class', 'form-group has-success');
        if (nombre == '') {
          $('#mE4').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE4').attr('class', 'form-group has-success');
        if (apellidoP == '') {
          $('#mE5').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE5').attr('class', 'form-group has-success');
        if (apellidoM == '') {
          $('#mE6').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE6').attr('class', 'form-group has-success');
        if (nMembresia == '') {
          $('#mE18').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else {
          $('#mE15').attr('class', 'form-group has-success');

          $('#mE7').attr('class', 'form-group has-success');
          $('#mE8').attr('class', 'form-group has-success');
          $('#mE9').attr('class', 'form-group has-success');
          $('#mE10').attr('class', 'form-group has-success');
          $('#mE11').attr('class', 'form-group has-success');
          $('#mE12').attr('class', 'form-group has-success');
          $('#mE13').attr('class', 'form-group has-success');
          $('#mE14').attr('class', 'form-group has-success');
          $('#mE16').attr('class', 'form-group has-success');
          $('#mE17').attr('class', 'form-group has-success');
        }


        if (isEmpty) {
          showSimpleNoty('Existen campos obligatorios vacíos', 'center', 'warning', 0);
        }else {
          if (accion == 'mod') {
            var id = $("div.modal-header").attr("id-tipo");
            Personas.modifyPersona(id,nombre,apellidoP,apellidoM,direccion,"",telefono,celular,correo,rfc,fecha_nac,tipo_sangre,genero,nMembresia,nip,estatus,rol,user,pass).done(function (data) {
              if (data.s == 1) {
                $("#myModal").modal('hide');
                document.getElementById("btnEmpleados").click();
                showSimpleNoty(data.m, 'center', 'success', 3000);

                var splitted;

                if(imageData.includes("base64")){
                 splitted = splitBase64Into(imageData,200000);
                 sendImageSplitted(0,splitted.length,splitted,id);
                }

              }
              else
              showSimpleNoty(data.m, 'center', 'warning', 0);
            });
          }
          else {
            //TODO mandar vinculos y parentesco
            Personas.addPersona(nombre,apellidoP,apellidoM,direccion,"",telefono,celular,correo,rfc,fecha_nac,tipo_sangre,genero,nMembresia,nip,estatus,rol,user,pass).done(function (data) {
              if (data.s == 1) {
                $("#myModal").modal('hide');
                document.getElementById("btnEmpleados").click();
                showSimpleNoty(data.m, 'center', 'success', 3000);
                showSimpleNoty('Todos los privilegios activados', 'center', 'success', 3001);

                var newId = data.d.idp;

                var splitted;

                if (imageData){
                  if(imageData.includes("base64")){
                    splitted = splitBase64Into(imageData,200000);
                  }else{
                    var canvas = document.createElement('canvas');
                    canvas.width = $('#userImage').width();
                    canvas.height = $('#userImage').height();

                    canvas.getContext('2d').drawImage($('#userImage')[0],0,0);

                    splitted = splitBase64Into(canvas.toDataURL('image/jpeg','1.0'),200000);
                    console.log("splitted" + canvas.toDataURL('image/jpeg','1.0'));
                  }

                  sendImageSplitted(0,splitted.length,splitted,newId);
                }
              }
              else
              showSimpleNoty(data.m, 'center', 'error', 3000);
            });
          }
        }
      break;
      case "catalogo":
      /*Administradores.ConsultAccess(id_admin, navMenus[10], 'esc').done(function (data) {
        if(data.s == 1){
          showSimpleNoty("modificar catologo :)","center","success",3000);
        }else notyErrorAcceso();
      });*/
      break;

      case "noticias":
        var titulo = $('#noticeTitle').val();
        var imagen = $('#noticeImage').val();
        if (titulo == '')
        {
          $('#mE1').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE1').attr('class', 'form-group has-success');
        if (imagen == '') {
          $('#mE2').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE2').attr('class', 'form-group has-success');

        if (isEmpty)
        {
          showSimpleNoty('Existen campos obligatorios vacíos', 'center', 'warning', 0);
        }
        else
        {
          Noticias.add(titulo, imagen).done(function (data)
          {
            if (data.s == 1 || data.success == "true" || data.success) {
              $("#myModal").modal("hide");
              $("#btnNoticias").click();
            }
            else
            {
              showSimpleNoty('No se pudo agregar el registro', 'center', 'warning', 0);
            }

          });
        }

      break;



      case "piscina":
        var temp = $('#temp_piscina').val();
        if (temp == '')
        {
          $('#mE1').attr('class', 'form-group has-error');
          isEmpty = true;
        }
        else $('#mE1').attr('class', 'form-group has-success');

        if (isEmpty)
        {
          showSimpleNoty('la temperatura no puede estar vacia', 'center', 'warning', 0);
        }
        else
        {
          Piscina.add(temp).done(function (data) {
            if (data.s  == 1) {
              $("#myModal").modal("hide");
              $("#btnPiscina").click();
            }
            else
            {
              showSimpleNoty('No se pudo agregar el registro', 'center', 'warning', 0);
            }
          });
        }

      break;
    }
  });

  $(document).on("click", "#btnFigpo", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[6], 'esc').done(function (data) {
      if(data.s == 1){
        parserFIGPO.startParse();
      }else notyErrorAcceso();
    });
  });

  //Funcion para ver los detalles de la asignacion
  $(document).on("click", "#btnPerGrupo", function (e) {
    var btnElement = $(this);
    var idp = $(btnElement).attr("id-persona");
    Administradores.ConsultAccess(id_admin, navMenus[3], 'mod').done(function (data) {
      if(data.s==1){
        sitio.construirTablaDatos('grupo',{idp:idp});
      }else notyErrorAcceso();
    });
  });

  //Funcion para ver los detalles de la asignacion
  $(document).on("click", "#btnVerAccesos", function (e) {
    e.preventDefault();
    // ControlAccesos.construirModal($(this).attr("id-tipo"), $(this).attr("nombre-tipo"));
  });

  //////////////////////////////////////////////////////
  //            Botones de navegacion                 //
  //////////////////////////////////////////////////////
  $(document).on("click", "#btnDashboard", function (e) {
    sharedFunction('btnDashboard');
    $("#btnAgregar").hide();
    $('#btnMinimize').hide();
    $("#titulo").html('<i class="glyphicon glyphicon-info-sign"></i> Index ');
    $("#contenido").html('<div style="text-align: center"><img src="img/logofinal.jpg" width="847px" height="622px"></div>');
  });

  $(document).on("click", "#btnAdmins", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[0], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnAdmins');
        $("#titulo").html('<i class="glyphicon glyphicon-tag"></i> Administradores');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("admins");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnRoles", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[1], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnRoles');
        $("#titulo").html('<i class="glyphicon glyphicon-tag"></i> Administraci&oacute;n de Roles');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("roles");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnGrupos", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[2], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnGrupos');
        $("#titulo").html('<i class="glyphicon glyphicon-th"></i> Administraci&oacute;n de Grupos');
        //primero borramos el contenido anterior
        $("#contenido").html(" ");
        //despues devolvemos la tabla construida de grupos
        sitio.construirTabla("grupos");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnPersonas", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[3], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnPersonas');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-user"></i> Administraci&oacute;n de Personas');
        //primero borramos el contenido anterior
        $("#contenido").html(" ");
        //despues devolvemos la tabla construida de grupos
        sitio.construirTabla("personas");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnEspacios", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[4], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnEspacios');
        $("#titulo").html('<i class="glyphicon glyphicon-leaf"></i> Administraci&oacute;n de Espacios');
        //primero borramos el contenido anterior
        $("#contenido").html(" ");
        //despues devolvemos la tabla construida de grupos
        sitio.construirTabla("espacios");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnServicios", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[5], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnServicios');
        $("#titulo").html('<i class="glyphicon glyphicon-briefcase"></i> Administraci&oacute;n de Servicios');
        //primero borramos el contenido anterior
        $("#contenido").html(" ");
        //despues devolvemos la tabla construida de grupos
        sitio.construirTabla("servicios");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnAsignaciones", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[6], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnAsignaciones');
        $('#btnFigpo').show();
        $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Administraci&oacute;n de Asignaciones');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de grupos
        sitio.construirTabla("asignaciones");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnReportes", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[7], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnReportes');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-folder-open"></i> Reportes');
        $('#btnMinimize').show();
        var contentReport=''+
        '<p>Seleccionar la fecha del reporte:</p>' +
        '<select id="date-range">'+
        '<option value="1" selected>Por día</option>'+
        '<option value="2">Por rango de dias</option>'+
        '</select>'+
        '<div id="fiContainer" style="display:inline-block; margin-left: 30px;"><p>Fecha Inicial: <br><input type="text" name="txtFechaI" id="txtFechaI" /></p></div>' +
        '<div id="ffContainer" style="display:inline-block; margin-left: 30px; display:none;"><p>Fecha Final: <br><input type="text" name="txtFechaF" id="txtFechaF" /></p></div><br><br>' +
        '<p style="display:inline-block;">Seleccionar tipo de reporte: </p>' +
        '<select id="tipo-reporte" style="display:inline-block; margin-left: 10px;">'+
        '<option value="1" selected>NSS</option>'+
        '<option value="2">Nivel</option>'+
        '<option value="3">Dictamen</option>'+
        '</select><br>'+
        '<div id="dato-reporte">'+
        '</div>';
        $("#contenido").html(contentReport);
        $("#txtFechaI").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#txtFechaF").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#date-range").on('change', function() {
          if($(this).val() == 1){
            $("#ffContainer").css('display', 'none');
          }else{
            $("#ffContainer").css('display', 'inline-block');
          }
        });

        //Inicializar dato-reporte a NSS
        $("#dato-reporte").html(""+
        '<p style="display:inline-block;">Introduce el número de seguro social (NSS): '+
        '<select data-placeholder="Escoje una persona" id="selectPer" data-rel="chosen" class="chosen-select" style="display: none;" tabindex="-1" > ' +
        '<option value="" selected> </option> </select> <div style="text-align:center"><a href="#" id="btnRepAdmin" class="btn btn-success"> Administrativos</a> <a href="#" id="btnRepDocente" class="btn btn-info"> Docentes </a></div>');
        Personas.consultPersona('').done(function (data) {
          for (var i = 0; i < data.d.personas.length; i++)
          $("#selectPer").append("<option value=" + data.d.personas[i].id + ">" + data.d.personas[i].nombre + " " + data.d.personas[i].nss + "</option>");
          $("#selectPer").chosen({
            allow_single_deselect: true,
            no_results_text: "No se encontró la persona",
            width: "500px"
          });
        });

        $('#tipo-reporte').on('change', function() {
          if(parseInt($(this).val()) == 1){
            var tipoDato=""+
            '<p style="display:inline-block;">Introduce el número de seguro social (NSS): '+
            '<select data-placeholder="Escoje una persona" id="selectPer" data-rel="chosen" class="chosen-select" style="display: none;" tabindex="-1" > ' +
            '<option value="" selected> </option> </select> <div style="text-align:center"><a href="#" id="btnRepAdmin" class="btn btn-success"> Administrativos</a> <a href="#" id="btnRepDocente" class="btn btn-info"> Docentes </a></div>';
            Personas.consultPersona('').done(function (data) {
              for (var i = 0; i < data.d.personas.length; i++)
              $("#selectPer").append("<option value=" + data.d.personas[i].id + ">" + data.d.personas[i].nombre + " " + data.d.personas[i].nss + "</option>");
              $("#selectPer").chosen({
                allow_single_deselect: true,
                no_results_text: "No se encontró la persona",
                width: "500px"
              });
            });
            $("#dato-reporte").html(tipoDato);
            $("#btnRepAdmin").click(function () {
              console.log($(this).prop('id'));
            });
            $("#btnRepDocente").click(function () {
              console.log($(this).prop('id'));
            });
          }else if(parseInt($(this).val()) == 2){
            var tipoDato = ""+
            '<div class="controls">'+
            '<p style="display:inline-block;">Selecciona los niveles:  '+
            '<select name="txtNivel" id="txtNivel" multiple class="form-control" data-rel="chosen" style="display:inline-block;">';
            DnLaborales.getLevels().done(function (data) {
              if (data.s == 0) {
                if (data.m == 'No has iniciado sesión') {
                  alert(data.m);
                  window.location.href = "";
                }
                else {
                  showSimpleNoty(data.m, "center", "error", 0);
                }
              }else{
                var nivelesR = data.d;
                for (var i = 0; i < nivelesR.length; i++)
                if (nivelesR[i]!=null)
                tipoDato+= '<option value="'+nivelesR[i]+'">'+nivelesR[i]+'</option>';
                tipoDato+=''+
                '</select></p><br>' +
                '<div style="text-align:center"><a href="#" id="btnRepAdmin" class="btn btn-success"> Administrativos</a> <a href="#" id="btnRepDocente" class="btn btn-info"> Docentes </a></div>' +
                '</div>';
                $("#dato-reporte").html(tipoDato);
                $('[data-rel="chosen"],[rel="chosen"]').chosen();
                $("#btnRepAdmin").click(function () {
                  console.log($(this).prop('id'));
                });
                $("#btnRepDocente").click(function () {
                  console.log($(this).prop('id'));
                });
              }
            });
          }else if(parseInt($(this).val()) == 3){
            var tipoDato=""+
            '<p style="display:inline-block;">Selecciona el tipo de dictamen: '+
            '<select name="txtDictamen" id="txtDictamen" style="margin-right:20px; display:inline-block;"> ' +
            '<option value="AB">Abandono</option>'+
            '<option value="A">Asistencia</option>'+
            '<option value="AU">Ausencia</option>'+
            '<option value="F">Falta</option>'+
            '<option value="R">Retardo</option>'+
            '</select></p><br>'+
            '<div style="text-align:center"><a href="#" id="btnRepAdmin" class="btn btn-success"> Administrativos</a> <a href="#" id="btnRepDocente" class="btn btn-info"> Docentes </a></div>';
            $("#dato-reporte").html(tipoDato);
            $("#btnRepAdmin").click(function () {
              console.log($(this).prop('id'));
            });
            $("#btnRepDocente").click(function () {
              console.log($(this).prop('id'));
            });
          }
        });
        $("#btnNivel").click(function () {
          $('#graphicRow').remove();
          if($("#txtNivel").val() == null){
            showSimpleNoty("No se selecciono ningún nivel", "center", "warning", 0);
          }else{
            var fFinal = ($("#date-range").val() == 1) ? $("#txtFechaI").val() : $("#txtFechaF").val();
            sitio.reporte("nivel", $("#txtNivel").val().join(), $("#txtFechaI").val(), fFinal, "Creportes");
          }
        });
      }else{
        notyErrorAcceso();
      }
    });
  });


  $(document).on("click", "#btnTemas", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[7], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnTemas');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i>     Registro de Temas');
        $('#btnMinimize').show();
        //primero borramos el contenido anterior
        $("#contenido").html('<div id="tabla-asignaciones_wrapper" class="dataTables_wrapper no-footer"><div class="row"><div class="col-md-6 text-left"><div class="dataTables_length" id="tabla-asignaciones_length"><label>Registros por página: <select name="tabla-asignaciones_length" aria-controls="tabla-asignaciones" class=""><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> </label></div></div><div class="col-md-6 text-right"><div id="tabla-asignaciones_filter" class="dataTables_filter"><label>Búsqueda: <input type="search" class="" placeholder="" aria-controls="tabla-asignaciones"></label></div></div></div><table id="tabla-asignaciones" class="table table-striped table-bordered bootstrap-datatable datatable responsive dataTable no-footer" role="grid" aria-describedby="tabla-asignaciones_info"><thead><tr role="row"><th class="sorting_desc" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="CRN: activate to sort column ascending" style="width: 31.2222px;" aria-sort="descending">CRN</th><th class="sorting" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="Servicio: activate to sort column ascending" style="width: 126.222px;">Asignación</th><th class="sorting" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="Persona: activate to sort column ascending" style="width: 85.2222px;">Persona</th><th style="width: 78.2222px;" class="sorting" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="Fecha Inicio: activate to sort column ascending">Fecha Hora</th><th style="width: 78.2222px;" class="sorting" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="Fecha Fin: activate to sort column ascending">Tema</th><th style="width: 183.222px;" class="sorting" tabindex="0" aria-controls="tabla-asignaciones" rowspan="1" colspan="1" aria-label="Acciones: activate to sort column ascending">Descripción</th></tr></thead><tbody><tr role="row" class="odd"><td class="sorting_1">5137</td><td class="">INVESTIGACIÓN CIIDETEC PROFESOR</td><td>TORRES LOPEZ SARA LIZETTE (600539)</td><td class="">2016-09-23 14:25</td><td>Pruebas de concepto</td><td class="center">  Se dio a conocer los puntos de vista de los alumnos y se hicieron presentacion de los ...</td></tr><tr role="row" class="even"><td class="sorting_1">1511</td><td class="">METROLOGIA</td><td>DEL TORO DE LA PAZ DARIO (49816)</td><td class="">2016-11-22 12:22</td><td>Revision de claficiaciones</td><td class="center"> Revision de calificaciones</td></tr><tr role="row" class="odd"><td class="sorting_1">1348</td><td class="">FUND. HISTORICOS DE LA PSICO.</td><td>ARGUELLO LINO JOSE ARTURO (43470)</td><td class="">2016-11-22 11:00</td><td>Avance en proyectos</td><td class="center"> Se realizaron actividades para el avance de los proyectos finales  </td></tr><tr role="row" class="even"><td class="sorting_1">1338</td><td class="">ELAB. DE INSTR. DE MEDICION</td><td>CONTRERAS ARTURO (606712)</td><td class="">2016-11-22 13:15</td><td>Examen Parcial1</td><td class="center">  Dia de examen </td></tr><tr role="row" class="odd"><td class="sorting_1">1294</td><td class="">DESARROLLO DE SISTEMAS</td><td>CARLOS MANSILLA MIRIAM ALEJANDRA (607620)</td><td class="">2016-11-22 15:00</td><td>Sin registro</td><td class="center"> Sin registro  </td></tr></tbody></table><div class="row"><div class="col-md-12"><div class="dataTables_info" id="tabla-asignaciones_info" role="status" aria-live="polite">Mostrando 1 al 10 de 85 registros</div></div><div class="col-md-12 center-block"> <div id="botones_PDF_CSV" class="dt-buttons"></div><div class="dataTables_paginate paging_bootstrap pagination" id="tabla-asignaciones_paginate"><ul class="pagination"><li class="prev disabled"><a href="#">← Anterior</a></li><li class="active"><a href="#">1</a></li><li><a href="#">2</a></li><li><a href="#">3</a></li><li><a href="#">4</a></li><li><a href="#">5</a></li><li class="next"><a href="#">Siguiente → </a></li></ul></div></div></div></div>');
        $("#botones_PDF_CSV").html('<a id="boton_PDF" class="dt-button buttons-pdf buttons-html5" target="_blank" href="ejemplo_reporte_temas.pdf"><span>PDF</span></a><a class="dt-button buttons-csv buttons-html5" target="_blank" href="ejemplo_reporte_temas.csv"><span>CSV</span></a>');
      }else{
        notyErrorAcceso();
      }
    });
  });





  $(document).on("click", "#btnNoLaborales", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[8], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnNoLaborales');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-calendar"></i> Días festivos');
        $("#contenido").html(" ");
        sitio.construirTabla("diaNoLaboral");
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnDispositivos", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[9], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnDispositivos');
        $('#btnMinimize').show();
        $("#titulo").html('<i class="glyphicon glyphicon-phone"></i> Administraci&oacute;n de Dispositivos');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de grupos
        sitio.dispositivos();
      }else{
        notyErrorAcceso();
      }
    });
  });


  $(document).on("click", "#btnAccesos", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[0], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnAccesos');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-dashboard"></i> Control de Puertas');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de grupos
        sitio.control_puertas();
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnControlReportes", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[1], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnControlReportes');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-dashboard"></i> Reportes');
        $('#btnMinimize').hide();
        var contentReport=''+
        '<p>Seleccionar la fecha del reporte:</p>' +
        '<select id="date-range">'+
        '<option value="1" selected>Por día</option>'+
        '<option value="2">Por rango de dias</option>'+
        '</select>'+
        '<div id="fiContainer" style="display:inline-block; margin-left: 30px;"><p>Fecha Inicial: <br><input type="text" name="txtFechaI" id="txtFechaI" /></p></div>' +
        '<div id="ffContainer" style="display:inline-block; margin-left: 30px; display:none;"><p>Fecha Final: <br><input type="text" name="txtFechaF" id="txtFechaF" /></p></div><br><br>' +
        '<p style="display:inline-block;">Seleccionar tipo de reporte: </p>' +
        '<select id="tipo-reporte" style="display:inline-block; margin-left: 10px;">'+
        '<option value="1" selected>Empleado</option>'+
        '<option value="2">Socio</option>'+
        '</select><br>'+
        '<div id="dato-reporte">'+
        '</div>';
        $("#contenido").html(contentReport);
        $("#txtFechaI").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#txtFechaF").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#date-range").on('change', function() {
          if($(this).val() == 1){
            $("#ffContainer").css('display', 'none');
          }else{
            $("#ffContainer").css('display', 'inline-block');
          }
        });

        $("#dato-reporte").html(""+
        '<p style="display:inline-block;">Seleccionar Empleado: '+
        '<select data-placeholder="Escoje una persona" id="selectPer" data-rel="chosen" class="chosen-select" style="display: none;" tabindex="-1" > ' +
        '<option value="" selected> </option> </select> <div style="text-align:center"><a href="#" id="btnRepGenerar" class="btn btn-success"> Generar</a></div>');
        Personas.consultPersona('').done(function (data) {
          for (var i = 0; i < data.d.personas.length; i++)
          $("#selectPer").append("<option value=" + data.d.personas[i].id + ">" + data.d.personas[i].nombre + " " + data.d.personas[i].nss + "</option>");
          $("#selectPer").chosen({
            allow_single_deselect: true,
            no_results_text: "No se encontró la persona",
            width: "500px"
          });
        });

        $('#tipo-reporte').on('change', function() {
          if(parseInt($(this).val()) == 1){
            var tipoDato=""+
            '<p style="display:inline-block;">Seleccionar Empleado: '+
            '<select data-placeholder="Escoje una persona" id="selectPer" data-rel="chosen" class="chosen-select" style="display: none;" tabindex="-1" > ' +
            '<option value="" selected> </option> </select> <div style="text-align:center"><a href="#" id="btnRepGenerar" class="btn btn-success"> Generar</a>';
            Personas.consultPersona('').done(function (data) {
              for (var i = 0; i < data.d.personas.length; i++)
              $("#selectPer").append("<option value=" + data.d.personas[i].id + ">" + data.d.personas[i].nombre + " " + data.d.personas[i].nss + "</option>");
              $("#selectPer").chosen({
                allow_single_deselect: true,
                no_results_text: "No se encontró la persona",
                width: "500px"
              });
            });
            $("#dato-reporte").html(tipoDato);
          }else if(parseInt($(this).val()) == 2){
            var tipoDato=""+
            '<p style="display:inline-block;">Seleccionar Socio: '+
            '<select data-placeholder="Escoje una persona" id="selectPer" data-rel="chosen" class="chosen-select" style="display: none;" tabindex="-1" > ' +
            '<option value="" selected> </option> </select> <div style="text-align:center"><a href="#" id="btnRepGenerar" class="btn btn-success"> Generar</a></div>';
            Personas.consultPersona('').done(function (data) {
              for (var i = 0; i < data.d.personas.length; i++)
              $("#selectPer").append("<option value=" + data.d.personas[i].id + ">" + data.d.personas[i].nombre + " " + data.d.personas[i].nss + "</option>");
              $("#selectPer").chosen({
                allow_single_deselect: true,
                no_results_text: "No se encontró la persona",
                width: "500px"
              });
            });
            $("#dato-reporte").html(tipoDato);
          }
        });

        $("#btnRepGenerar").click(function () {
          // TODO Validar entradas del reporte.. prueba
          sitio.controlReporte("test", "test", "test", "test", "test");
        });
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnSociosReportes", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[5], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnSociosReportes');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-dashboard"></i> Reportes');
        $('#btnMinimize').hide();
        var contentReport=''+
        '<p>Seleccionar la fecha del reporte:</p>' +
        '<select id="date-range">'+
        '<option value="1" selected>Por día</option>'+
        '<option value="2">Por rango de dias</option>'+
        '</select>'+
        '<div id="fiContainer" style="display:inline-block; margin-left: 30px;"><p>Fecha Inicial: <br><input type="text" name="txtFechaI" id="txtFechaI" /></p></div>' +
        '<div id="ffContainer" style="display:inline-block; margin-left: 30px; display:none;"><p>Fecha Final: <br><input type="text" name="txtFechaF" id="txtFechaF" /></p></div><br><br>' +
        '<p style="display:inline-block;">Seleccionar tipo de reporte: </p>' +
        '<select id="tipo-reporte" style="display:inline-block; margin-left: 10px;">'+
        '<option value="1" selected>Estatus</option>'+
        '<option value="2">Tipo de Membresia</option>'+
        '<option value="3">No. de Visitantes</option>'+
        '<option value="4">Reporte de Hijos</option>'+
        '</select>'+
        '<p id="tipo-estatus-label"style="display:inline-block; margin-left: 15px;">Seleccionar estatus: </p>' +
        '<select id="tipo-estatus" style="display:inline-block; margin-left: 10px;">'+
        '<option value="1" selected>Suspendida</option>'+
        '<option value="2">Activa</option>'+
        '<option value="3">Pendiente de pago</option>'+
        '</select>'+
        '<p id="tipo-membresia-label"style="display:none; margin-left: 15px;">Seleccionar tipo membresia: </p>' +
        '<select id="tipo-membresia" style="display:none; margin-left: 10px;">'+
        '<option value="1" selected>Familiar</option>'+
        '<option value="2">Individual</option>'+
        '<option value="3">Foranea</option>'+
        '<option value="4">Viuda</option>'+
        '<option value="5">Jovenes</option>'+
        '</select>'+
        '<div style="text-align:center"><a href="#" id="btnRepGenerar" class="btn btn-success"> Generar</a>';

        $("#contenido").html(contentReport);
        $("#txtFechaI").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#txtFechaF").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#date-range").on('change', function() {
          if($(this).val() == 1){
            $("#ffContainer").css('display', 'none');
          }else {
            $("#ffContainer").css('display', 'inline-block');
          }
        });

        $('#tipo-reporte').on('change', function() {
          switch (parseInt($(this).val())) {
            case 1:
              $("#tipo-estatus-label").css('display', 'inline-block');
              $("#tipo-estatus").css('display', 'inline-block');
              $("#tipo-membresia-label").css('display', 'none');
              $("#tipo-membresia").css('display', 'none');
              break;
            case 2:
              $("#tipo-estatus-label").css('display', 'none');
              $("#tipo-estatus").css('display', 'none');
              $("#tipo-membresia-label").css('display', 'inline-block');
              $("#tipo-membresia").css('display', 'inline-block');
              break;
            default:
              $("#tipo-estatus-label").css('display', 'none');
              $("#tipo-estatus").css('display', 'none');
              $("#tipo-membresia-label").css('display', 'none');
              $("#tipo-membresia").css('display', 'none');
          }
        });

        $("#btnRepGenerar").click(function () {
          // TODO Validar entradas del reporte.. prueba
          sitio.sociosReporte("test", "test", "test", "test", "test");
        });
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnAlbercaReportes", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[7], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnAlbercaReportes');
        $("#btnAgregar").hide();
        $("#titulo").html('<i class="glyphicon glyphicon-leaf"></i> Reporte de Temperatura Alberca');
        $('#btnMinimize').hide();
        var contentReport=''+
        '<p>Seleccionar la fecha del reporte:</p>' +
        '<select id="date-range">'+
        '<option value="1" selected>Por día</option>'+
        '<option value="2">Por rango de dias</option>'+
        '</select>'+
        '<div id="fiContainer" style="display:inline-block; margin-left: 30px;"><p>Fecha Inicial: <br><input type="text" name="txtFechaI" id="txtFechaI" /></p></div>' +
        '<div id="ffContainer" style="display:inline-block; margin-left: 30px; display:none;"><p>Fecha Final: <br><input type="text" name="txtFechaF" id="txtFechaF" /></p></div><br><br>' +
        '<div style="text-align:center"><a href="#" id="btnRepGenerar" class="btn btn-success"> Generar</a>';

        $("#contenido").html(contentReport);
        $("#txtFechaI").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#txtFechaF").pickadate({
          format: 'yyyy-mm-dd',
          monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre ', 'Diciembre'],
          monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
          weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
          showMonthsShort: false,
          showWeekdaysFull: false
        });
        $("#date-range").on('change', function() {
          if($(this).val() == 1){
            $("#ffContainer").css('display', 'none');
          }else {
            $("#ffContainer").css('display', 'inline-block');
          }
        });

        $("#btnRepGenerar").click(function () {
          // TODO Validar entradas del reporte.. prueba
          sitio.albercaReporte("test", "test", "test", "test", "test");
        });
      }else{
        notyErrorAcceso();
      }
    });
  });


  $(document).on("click", "#btnNoticias", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[2], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnPiscina');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-bullhorn"></i> Comunicados - Noticias');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("noticias");
      }else{
        notyErrorAcceso();
      }
    });
  });


  $(document).on("click", "#btnPiscina", function (e) {

      sharedFunction('btnNoticias');
      $('#btnMinimize').hide();
      $("#titulo").html('<i class="glyphicon glyphicon-bullhorn"></i> Registros de temperatura de la piscina');
      //primero borramos el contenido anterior
      $("#contenido").html(' ');
      //despues devolvemos la tabla construida de roles
      sitio.construirTabla("piscina");

  });

  $(document).on("click", "#btnSocios", function (e) {

        sharedFunction('btnSocios');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-bookmark"></i> Socios');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("socios");

  });

  $(document).on("click", "#btnPagos", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[6], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnPagos');
        $('#btnMinimize').hide();
        $('#btnAgregar').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-bookmark"></i> Socios - Pagos');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("pagos");

      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnVisita", function (e) {
    var btnElement = $(this);
    //Modal Head
    var id = $(btnElement).attr("id-tipo");
    var nombre = $(btnElement).attr("nombre-tipo");

    $("div.modal-header").attr("id-visita", id);
    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Visitas: ' + nombre + ' </h3>');
    $(".modal-body").html('');

    //Modal Body
    Personas.consultPersonaV(id,"visitas").done(function (data) {
      var division = document.createElement('div');
      division.setAttribute('class', 'row');
      //aqui se construye la cabecera
      var tabla = document.createElement('table');
      tabla.setAttribute('id', 'tabla-visitas');
      tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
      var thead = document.createElement('thead');
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.innerHTML = "# Membresia";
      tr.appendChild(th);
      var th2 = document.createElement('th');
      th2.innerHTML = "Parentesco";
      tr.appendChild(th2);
      var th3 = document.createElement('th');
      th3.innerHTML = "Nombre";
      tr.appendChild(th3);
      thead.appendChild(tr);
      tabla.appendChild(thead);
      var tbody = document.createElement('tbody');
      //aqui se construye cada uno de los elementos
      var td = [];
      var td2 = [];
      var td3 = [];
      var tr = [];

      for (var i = 0; i < data.d.length; i++) {
        tr[i] = document.createElement('tr');

        td[i] = document.createElement('td');
        td[i].innerHTML = data.d[i].Nmembresia;
        tr[i].appendChild(td[i]);

        td2[i] = document.createElement('td');
        td2[i].innerHTML = data.d[i].parentesco;
        tr[i].appendChild(td2[i]);

        td3[i] = document.createElement('td');
        td3[i].innerHTML = data.d[i].Nombre;
        tr[i].appendChild(td3[i]);

        tbody.appendChild(tr[i]);
      }

      tabla.appendChild(tbody);
      $(".modal-body").html(tabla);
      $('#tabla-visitas').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l><'col-md-6 text-right'f>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
          "sLengthMenu": "_MENU_ registros por pagina",
          "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
          "sZeroRecords": "No se encontró ningún registro",
          "sInfoEmpty": "No existen registros",
          "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
          "sSearch": "Búsqueda:",
          "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Ultimo",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
          }
        }
      });
    });
    //Modal Footer
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ');
    e.preventDefault();
    if (!$('#myModal').hasClass('in')) {
      $('#myModal').attr("class", "modal fade normal").modal('show');
    }
  });

  $(document).on("click", "#btnPrivilegio", function (e) {
    var btnElement = $(this);
    //Modal Head
    var id = $(btnElement).attr("id-tipo");
    var nombre = $(btnElement).attr("nombre-tipo");

    $(".modal-content").css('height','auto');

    $("div.modal-header").attr("id-privilegio", id);
    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Privilegios: ' + nombre + ' </h3>');

    var AccesosChecks = '<div style="text-align:center;margin:10px;"><a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="all"> Seleccionar todos </a>'+
    '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="all" style="margin-left:20px;"> Deseleccionar todos </a></div>';

    AccesosChecks += '<div class="row">'+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Control Acceso</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
            '<div id="chk'+navMenus[0]+'" class="form-group" >'+
              '<label class="control-label" style="display:block;margin:0;">' + navMenus[0].replace(new RegExp("_", 'g'),' ') + '</label>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[0] +'_leer">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[0] +'_leer" tipo="'+navMenus[0]+'" checked> Leer </input> </label>' +
              '</div>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[0] +'_esc">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[0] +'_esc" tipo="'+navMenus[0]+'" checked> Añadir </input> </label>' +
              '</div>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[0] +'_mod">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[0] +'_mod" tipo="'+navMenus[0]+'" checked> Modificar </input> </label>' +
              '</div>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[0] +'_del">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[0] +'_del" tipo="'+navMenus[0]+'" checked> Eliminar </input> </label>' +
              '</div>' +
              '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[0]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
              '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[0]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
            '</div>'+
          '</div> '+
          '<div style="text-align:center;">'+
            '<div id="chk'+navMenus[1]+'" class="form-group" >'+
              '<label class="control-label" style="display:block;margin:0;">' + navMenus[1].replace(new RegExp("_", 'g'),' ') + '</label>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[1] +'_leer">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[1] +'_leer" tipo="'+navMenus[1]+'" checked> Leer </input> </label>' +
              '</div>' +
              '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[1]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
              '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[1]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
            '</div>'+
          '</div> '+
        '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Comunicados </h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
            '<div id="chk'+navMenus[2]+'" class="form-group" >'+
              '<label class="control-label" style="display:block;margin:0;">' + navMenus[2].replace(new RegExp("_", 'g'),' ') + '</label>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
                '<label class="control-label" for="'+ navMenus[2] +'_leer">' +
                '<input class="permisos" type="checkbox" id="'+ navMenus[2] +'_leer" tipo="'+navMenus[2]+'" checked> Leer </input> </label>' +
              '</div>' +
              '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
             '<label class="control-label" for="'+ navMenus[2] +'_esc">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[2] +'_esc" tipo="'+navMenus[2]+'" checked> Añadir </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[2] +'_mod">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[2] +'_mod" tipo="'+navMenus[2]+'" checked> Modificar </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[2] +'_del">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[2] +'_del" tipo="'+navMenus[2]+'" checked> Eliminar </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[2]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[2]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[3]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[3].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[3] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[3] +'_leer" tipo="'+navMenus[3]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[3] +'_esc">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[3] +'_esc" tipo="'+navMenus[3]+'" checked> Añadir </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[3]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[3]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
        '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Socios</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[4]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[4].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[4] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[4] +'_leer" tipo="'+navMenus[4]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[4] +'_esc">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[4] +'_esc" tipo="'+navMenus[4]+'" checked> Añadir </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[4] +'_mod">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[4] +'_mod" tipo="'+navMenus[4]+'" checked> Modificar </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[4] +'_del">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[4] +'_del" tipo="'+navMenus[4]+'" checked> Eliminar </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[4]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[4]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[5]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[5].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[5] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[5] +'_leer" tipo="'+navMenus[5]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[5]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[5]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[6]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[6].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[6] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[6] +'_leer" tipo="'+navMenus[6]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[6] +'_mod">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[6] +'_mod" tipo="'+navMenus[6]+'" checked> Modificar </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[6]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[6]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
        '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Empleados</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[7]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[7].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[7] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[7] +'_leer" tipo="'+navMenus[7]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[7] +'_esc">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[7] +'_esc" tipo="'+navMenus[7]+'" checked> Añadir </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[7] +'_mod">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[7] +'_mod" tipo="'+navMenus[7]+'" checked> Modificar </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[7] +'_del">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[7] +'_del" tipo="'+navMenus[7]+'" checked> Eliminar </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[7]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[7]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Restaurante</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[8]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[8].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[8] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[8] +'_leer" tipo="'+navMenus[8]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[8]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[8]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Soporte</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[9]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[9].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[9] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[9] +'_leer" tipo="'+navMenus[9]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[9]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[9]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '</div>'+
      '</div>'+
    '</div>';

    AccesosChecks += ''+
    '<div class="box col-xs-12">'+
      '<div class="box-inner">'+
        '<div class="box-header well">'+
          '<h2> Catalogo</h2>'+
          '<div class="box-icon">'+
            '<a href="#" class="btn btn-minimize btn-round btn-default minAccess"> <i class="glyphicon glyphicon-chevron-up" ></i> </a>'+
          '</div>'+
        '</div>'+
        '<div class="box-content">'+
          '<div style="text-align:center;">'+
          '<div id="chk'+navMenus[10]+'" class="form-group" >'+
          '<label class="control-label" style="display:block;margin:0;">' + navMenus[10].replace(new RegExp("_", 'g'),' ') + '</label>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[10] +'_leer">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[10] +'_leer" tipo="'+navMenus[10]+'" checked> Leer </input> </label>' +
          '</div>' +
          '<div class="checkbox" style="display:inline-block; margin-right: 15px;">' +
          '<label class="control-label" for="'+ navMenus[10] +'_mod">' +
          '<input class="permisos" type="checkbox" id="'+ navMenus[10] +'_mod" tipo="'+navMenus[10]+'" checked> Modificar </input> </label>' +
          '</div>' +
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnSelectAll" id-tipo="'+navMenus[10]+'"> <i class="glyphicon glyphicon-plus-sign"> </i></a>'+
          '<a href="#" class="btn btn-inverse btn-default btn-xs btnUnSelectAll" id-tipo="'+navMenus[10]+'" style="margin-left:20px;"> <i class="glyphicon glyphicon-minus-sign"> </i></a>'+
          '</div>'+
          '</div> '+
          '</div>'+
      '</div>'+
      '</div>'+
    '</div>';

    $('.modal-body').html(AccesosChecks);


    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ' +
    '<a href="#" class="btn btn-primary" id="btnSaveReg" tipo="admins" accion="mod"> Guardar </a>');

    $('.permisos').change(function(){
      if($(this).is(':checked')){
        $('#'+$(this).attr('tipo')+'_leer').prop("checked",true);
      }
    });

    $('.btn-minimize').click(function (e) {
      e.preventDefault();
      var $target = $(this).parent().parent().next('.box-content');
      if ($target.is(':visible')) $('i', $(this)).removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
      else                       $('i', $(this)).removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
      $target.slideToggle();
    });

    $('.minAccess').each(function(index, el) {
      $(this).click();
    });

    $('.btnSelectAll').click(function () {
      var menu = $(this).attr("id-tipo");
      if(menu == "all"){
        for (var i = 0; i < navMenus.length; i++) {
          $('#'+navMenus[i]+"_leer").prop('checked', true);
          $('#'+navMenus[i]+"_mod").prop('checked', true);
          $('#'+navMenus[i]+"_del").prop('checked', true);
          $('#'+navMenus[i]+"_esc").prop('checked', true);
        }
      }else{
        $('#'+menu+"_leer").prop('checked', true);
        $('#'+menu+"_mod").prop('checked', true);
        $('#'+menu+"_del").prop('checked', true);
        $('#'+menu+"_esc").prop('checked', true);
      }
    });
    $('.btnUnSelectAll').click(function () {
      var menu = $(this).attr("id-tipo");
      if(menu == "all"){
        for (var i = 0; i < navMenus.length; i++) {
          $('#'+navMenus[i]+"_leer").prop('checked', false);
          $('#'+navMenus[i]+"_mod").prop('checked', false);
          $('#'+navMenus[i]+"_del").prop('checked', false);
          $('#'+navMenus[i]+"_esc").prop('checked', false);
        }
      }else{
        $('#'+menu+"_leer").prop('checked', false);
        $('#'+menu+"_mod").prop('checked', false);
        $('#'+menu+"_del").prop('checked', false);
        $('#'+menu+"_esc").prop('checked', false);
      }
    });

      Administradores.ConsultAdmin(id).done(function (data){
        if(data.s == 1){
          for (var i = 0; i < navMenus.length; i++) {
            $('#'+navMenus[i]+"_leer").prop('checked', data.d.admins[0].Accesos[navMenus[i]].leer);
            $('#'+navMenus[i]+"_mod").prop('checked', data.d.admins[0].Accesos[navMenus[i]].mod);
            $('#'+navMenus[i]+"_del").prop('checked', data.d.admins[0].Accesos[navMenus[i]].del);
            $('#'+navMenus[i]+"_esc").prop('checked', data.d.admins[0].Accesos[navMenus[i]].esc);
          }
        }else{
          showSimpleNoty(data.m, "center", "error", 0);
        }
      });

    e.preventDefault();
    if (!$('#myModal').hasClass('in')) {
      $('#myModal').attr("class", "modal fade normal").modal('show');
    }
  });

  $(document).on("click", "#btnAsociados", function (e) {
    var btnElement = $(this);
    //Modal Head
    var id = $(btnElement).attr("id-tipo");
    var nombre = $(btnElement).attr("nombre-tipo");

    $("div.modal-header").attr("id-asociados", id);
    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Asociados: ' + nombre + ' </h3>');
    $(".modal-body").html('');
    //Modal Body
    Personas.consultPersonaV(id,"asociados").done(function (data) {
      var division = document.createElement('div');
      division.setAttribute('class', 'row');
      //aqui se construye la cabecera
      var tabla = document.createElement('table');
      tabla.setAttribute('id', 'tabla-asociados');
      tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
      var thead = document.createElement('thead');
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.innerHTML = "# Membresia";
      tr.appendChild(th);
      var th2 = document.createElement('th');
      th2.innerHTML = "Parentesco";
      tr.appendChild(th2);
      var th3 = document.createElement('th');
      th3.innerHTML = "Nombre";
      tr.appendChild(th3);
      thead.appendChild(tr);
      tabla.appendChild(thead);
      var tbody = document.createElement('tbody');
      //aqui se construye cada uno de los elementos
      var td = [];
      var td2 = [];
      var td3 = [];
      var tr = [];

      for (var i = 0; i < data.d.length; i++) {
        tr[i] = document.createElement('tr');

        td[i] = document.createElement('td');
        td[i].innerHTML = data.d[i].Nmembresia;
        tr[i].appendChild(td[i]);

        td2[i] = document.createElement('td');
        td2[i].innerHTML = data.d[i].parentesco;
        tr[i].appendChild(td2[i]);

        td3[i] = document.createElement('td');
        td3[i].innerHTML = data.d[i].Nombre;
        tr[i].appendChild(td3[i]);

        tbody.appendChild(tr[i]);
      }

      tabla.appendChild(tbody);
      $(".modal-body").html(tabla);
      $('#tabla-asociados').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l><'col-md-6 text-right'f>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
          "sLengthMenu": "_MENU_ registros por pagina",
          "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
          "sZeroRecords": "No se encontró ningún registro",
          "sInfoEmpty": "No existen registros",
          "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
          "sSearch": "Búsqueda:",
          "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Ultimo",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
          }
        }
      });
    });
    //Modal Footer
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ');
    e.preventDefault();
    if (!$('#myModal').hasClass('in')) {
      $('#myModal').attr("class", "modal fade normal").modal('show');
    }
  });

  $(document).on("click", "#btnEmpleados", function (e) {

        sharedFunction('btnEmpleados');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-user"></i> Empleados');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("empleados");

  });

  $(document).on("click", "#btnAlberca", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[0], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnAlberca');
        $('#btnMinimize').hide();
        $("#titulo").html('<i class=" glyphicon glyphicon-leaf"></i> Alberca');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        //despues devolvemos la tabla construida de roles
        sitio.construirTabla("alberca");

      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnCatalogo", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[10], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnCatalogo');
        $('#btnMinimize').hide();
        $('#btnAgregar').hide();
        $("#titulo").html('<i class=" glyphicon glyphicon-list-alt"></i> Catalogo de Servicios');
        //primero borramos el contenido anterior
        $("#contenido").html(' ');
        $('#contenido').html(''+
        '<div class="title" style="text-align:center"> <h3>Costo de membresias</h3> </div> '+
        '<div class="form-horizontal col-md-4 col-md-offset-4" style="float:none;">'+
          '<div id="mE0" class="form-group"> ' +
            '<label class="control-label col-sm-4" for="costoFamiliar">Familiar</label>' +
            '<div class="col-sm-8">'+
              '<input class="form-control" id="costoFamiliar" name="costoFamiliar" placeholder="Costo Familiar" value="$2800.00" readonly> ' +
            '</div>'+
          '</div>' +
          '<div id="mE1" class="form-group"> ' +
            '<label class="control-label col-sm-4" for="costoJoven">Joven</label>' +
            '<div class="col-sm-8">'+
              '<input class="form-control" id="costoJoven" name="costoJoven" placeholder="Costo Joven" value="$500.00" readonly> ' +
            '</div>'+
          '</div>' +
          '<div id="mE2" class="form-group"> ' +
            '<label class="control-label col-sm-4" for="costoIndividual">Individiual</label>' +
            '<div class="col-sm-8">'+
              '<input class="form-control" id="costoIndividual" name="costoIndividual" placeholder="Costo Individiual" value="$500.00" readonly> ' +
            '</div>'+
          '</div>' +
          '<div id="mE3" class="form-group"> ' +
            '<label class="control-label col-sm-4" for="costoForanea">Foranea</label>' +
            '<div class="col-sm-8">'+
              '<input class="form-control" id="costoForanea" name="costoForanea" placeholder="Costo Foranea" value="$700.00" readonly> ' +
            '</div>'+
          '</div>' +
          '<div id="mE4" class="form-group"> ' +
            '<label class="control-label col-sm-4" for="costoViuda">Viuda</label>' +
            '<div class="col-sm-8">'+
              '<input class="form-control" id="costoViuda" name="costoViuda" placeholder="Costo Viuda" value="$500.00" readonly> ' +
            '</div>'+
          '</div>' +
        '</div>'+
        '<div style="text-align: right;"">'+
          '<a href="#" class="btn btn-primary" id="btnSaveReg" tipo="catalogo" accion="mod" style="margin-right:80px;"> Actualizar </a>'+
        '</div>');
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnSoporte", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[9], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnSoporte');
        $('#btnMinimize').hide();
        $('#btnAgregar').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-briefcase"></i> Soporte');
        //primero borramos el contenido anterior
        $("#contenido").html('<div style="text-align:center;"><h1 style="text-align: center; margin-top: 5%;margin-bottom: 15%;"> PROXIMAMENTE</h1></div>');
      }else{
        notyErrorAcceso();
      }
    });
  });

  $(document).on("click", "#btnRestaurante", function (e) {
    Administradores.ConsultAccess(id_admin, navMenus[8], 'leer').done(function (data) {
      if(data.s == 1){
        sharedFunction('btnRestaurante');
        $('#btnMinimize').hide();
        $('#btnAgregar').hide();
        $("#titulo").html('<i class="glyphicon glyphicon-fire"></i> Restaurante');
        //primero borramos el contenido anterior
        $("#contenido").html('<div> <h1 style="text-align: center; margin-top: 15%;margin-bottom: 15%;"> PROXIMAMENTE</h1></div>');
      }else{
        notyErrorAcceso();
      }
    });
  });

  $('.accordion').on('click',function(){
    var active = $(this);
    $('.accordion').find('ul').css('display','none');
    $('.accordion').removeClass('active');
    active.find('ul').css('display','block');
    active.addClass('active');
   });
});

function sendImageSplitted(index,total,dataImage,idp) {
  $.ajax({
    type: 'POST',
    data: {ws: "uploadImg", index_chunk: index+1, total_chunks: total, idp: idp,input_file:dataImage[index]},
    url: WS_PRIVADOS_URL,
    dataType : 'json',
    beforeSend: function () {
      mensajeCarga(true);
    },
    success: function(jsonData)
    {
      mensajeCarga(false);
      index++;
      if (index < total ) {
        console.log("imagen upload:",jsonData);
        //TODO: agregar feedback de carga
        sendImageSplitted(index,total,dataImage,idp);
      }else{
        console.log("imagen upload:",jsonData);
        if (jsonData.s == 1){
          showSimpleNoty("Imagen subida con exito", 'center', 'success', 3000);
          console.log("Imagen subida");

        }else{
          showSimpleNoty("Error al guardar imagen", 'center', 'warning', 3000);
          console.log("Error al guardar imagen");

        }
      }
    },
    error: function (jqXHR, msgStatus, errorThrown)
    {
      console.log("error en subida de imagen");
      showSimpleNoty("Error en subida de imagen", 'center', 'warning', 3000);
      mensajeCarga(false);
    }
  });
}

function splitBase64Into(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

function sendFileSplitted(index,total,dataFile,idp) {
  $.ajax({
    type: 'POST',
    data: {ws: "uploadFile", index_chunk: index+1, total_chunks: total, idp: idp,input_file:dataFile[index]},
    url: WS_PRIVADOS_URL,
    dataType : 'json',
    beforeSend: function () {
      mensajeCarga(true);
    },
    success: function(jsonData)
    {
      mensajeCarga(false);
      index++;
      if (index < total ) {
        console.log("file upload:",jsonData);
        //TODO: agregar feedback de carga
        sendFileSplitted(index,total,dataFile,idp);
      }else{
        console.log("imagen upload:",jsonData);
        if (jsonData.s == 1){
          showSimpleNoty("Archivo subido con exito", 'center', 'success', 3000);

        }else{
          showSimpleNoty("Error al guardar archivo", 'center', 'warning', 3000);
        }
      }
    },
    error: function (jqXHR, msgStatus, errorThrown)
    {
      showSimpleNoty("Error en subida de archivo", 'center', 'error', 3000);
      mensajeCarga(false);
    }
  });
}

function mensajeCarga(mostrar) {
  if (mostrar){
    $.blockUI({
      message: '<h2>Cargando, por favor espera </h2><br><img src="img/ajax-loaders/ajax-loader-7.gif">',
      css: {
        border: 'none',
        padding: '15px',
        backgroundColor: '#fff',
        '-webkit-border-radius': '10px',
        '-moz-border-radius': '10px',
        opacity: 1,
        color: '#000'
      }
    });
  }else{
    $.unblockUI();
  }
}

function getTimestamp() {
  var date = new Date();

  var month = date.getMonth();
  var day = date.getDate();
  var year = date.getFullYear();

  var hh = date.getHours();
  var mm = date.getMinutes();

  month = (month > 9 ? month : "0" + month);
  day = (day > 9 ? day : "0" + day);

  hh = (hh > 9 ? hh : "0" + hh);
  mm = (mm > 9 ? mm : "0" + mm);

  return year + "-" + month + "-" + day + " " + hh + ":" + mm;

}
