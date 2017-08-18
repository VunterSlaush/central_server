var ControlHuellas = {
  dataHuellas: {},
  cancelFlag: false,
  errorCnt: 0,
  SEND_HUELLA_DELAY: 1,
  tipoControl: "",

  deleteFingerPrint: function (idp, fingerPrint) {
    // Eliminacion completa de la Huella especificada
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "deleteIdentificador", idP: idp, tipo: "fmd", detalle: fingerPrint},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        if (data.s == 1) {
          showSimpleNoty(data.m, "center", "success", 5000);

          if (ControlHuellas.tipoControl == "ControlEmpleados"){
            ControlEmpleados.showHuellasTab(idp);
          }else if (ControlHuellas.tipoControl == "ControlSocios"){
            ControlSocios.showHuellasTab(idp);
          }
        }
        else {
          showSimpleNoty(data.m, "center", "warning", 0);
        }
      },
      error: function () {
        showSimpleNoty("Error en el servicio para eliminar huella", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  },

  saveFingerPrint: function (idp, detalle, fmd){
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "saveIdentificador", idP:idp, detalle:detalle, fmd:fmd},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        if (data.s == 1) {
          showSimpleNoty(data.m, "center", "success", 5000);
          if (ControlHuellas.tipoControl == "ControlEmpleados"){
            ControlEmpleados.showHuellasTab(idp);
          }else if (ControlHuellas.tipoControl == "ControlSocios"){
            ControlSocios.showHuellasTab(idp);
          }

        }
        else {
          showSimpleNoty(data.m, "center", "warning", 0);
        }
      },
      error: function () {
        showSimpleNoty("Error en el servicio para guardar huella", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  },

  getHuellasWS: function () {
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "getIdentificadores", tipo:"fmd"},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        if (data.s == 0) {
          showSimpleNoty(data.m, "center", "warning", 5000);
        }
        else {
          $("#btnIniciarLector").prop('disabled', true);
          ControlHuellas.cancelFlag = false;
          ControlHuellas.dataHuellas = data.d;
          ControlHuellas.getStatusServer();
        }
      },
      error: function () {
        showSimpleNoty("Error fatal al buscar huellas en servidor", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  },

  getStatusServer: function () {
    if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
      $.ajax({
        url: "http://localhost?ws=getStatusServer",
        type: "GET",
        dataType: "json",
        success: function (data) {
          mensajeCarga(false);
          console.log(data.m);
          if (data.s == 1 && data.m == "Esperando num huella") {
            $("#statusLector").val($("#statusLector").val() + "Cargando base de datos  ").scrollTop($('#statusLector')[0].scrollHeight);
            $('#theLoader').hide();
            ControlHuellas.sendNumeroHuellas();
          }
          else {
            ControlHuellas.errorCnt++;
            $("#statusLector").val(this.val() + data.m + "\n").scrollTop(this[0].scrollHeight);
            if (ControlHuellas.errorCnt >= 10) {
              $('#theLoader').hide();
              showSimpleNoty(data.m, "center", "warning", 0);
              $("#btnIniciarLector").prop('disabled', false);
            }
            else {
              setTimeout(function () {
                ControlHuellas.getStatusServer();
              }, 1000);
            }
          }
        },
        error: function () {
          mensajeCarga(false);
          ControlHuellas.errorCnt++;
          console.log("Error al buscar lector");
          $("#statusLector").val($("#statusLector").val() + 'Error al buscar lector\n').scrollTop($('#statusLector')[0].scrollHeight);
          if (ControlHuellas.errorCnt >= 10) {
            $('#theLoader').hide();
            showSimpleNoty("Error al buscar lector", "center", "error", 0);
            $("#btnIniciarLector").prop('disabled', false);
            ControlHuellas.errorCnt = 0;
          }
          else {
            setTimeout(function () {
              ControlHuellas.getStatusServer();
            }, 1000);
          }
        },
        beforeSend: function(){
          mensajeCarga(true);
          $('#theLoader').show();
        }
      }); // Fin petición AJAX
    }
    else {
      ControlHuellas.errorCnt = 0;
    }
  },

  sendNumeroHuellas: function () {
    if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
      $.ajax({
        url: "http://localhost",
        data: {ws: "numHuellas", num: ControlHuellas.dataHuellas.length},
        type: "GET",
        dataType: "json",
        success: function (data) {
          console.log(data.m);
          $("#statusLector").append($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
          if (data.s == 1 && data.m == "Esperando huella") {
            ControlHuellas.sendHuella(0);
          }
          else {
            $('#theLoader').hide();
            setTimeout(function () {
              ControlHuellas.errorCnt++;
              ControlHuellas.getStatusServer();
            }, 1000);
          }
        },
        error: function () {
          console.log("Error al enviar número de huellas");
          $("#statusLector").val($("#statusLector").val() + "Error al enviar número de huellas\n").scrollTop($('#statusLector')[0].scrollHeight);
          $('#theLoader').hide();
          setTimeout(function () {
            ControlHuellas.errorCnt++;
            ControlHuellas.getStatusServer();
          }, 1000);
        },
        beforeSend: function(){
          $('#theLoader').show();
        }
      }); // Fin petición AJAX
    }
    else {
      ControlHuellas.errorCnt = 0;
      $.xhrPool.abortAll();
    }
  },

  sendHuella: function (indexToSend) {
    if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
      var vFMD = ControlHuellas.dataHuellas[indexToSend]['fmd'];
      var idFMD = ControlHuellas.dataHuellas[indexToSend]['NSS'];
      var timestampFMD = ControlHuellas.dataHuellas[indexToSend]['timestamp'];
      $.ajax({
        url: "http://localhost",
        data: {ws: 'sendHuella', fmd: vFMD, nss: idFMD, timestamp: timestampFMD},
        type: "GET",
        dataType: "json",
        success: function (data) {
          setTimeout(function() {
            console.log(data.m);
            if (data.s == 0) {
              showSimpleNoty(data.m, "center", "warning", 0);
              $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
              $('#theLoader').hide();
              setTimeout(function () {
                ControlHuellas.errorCnt++;
                ControlHuellas.getStatusServer();
              }, 1000);
            }
            else {
              if (data.m == "next") {
                $("#statusLector").val($("#statusLector").val() + ".").scrollTop($('#statusLector')[0].scrollHeight);
                if (isNaN(data.d)){
                  var aux = data.d;
                  data.d = aux.replace(',','');
                }
                ControlHuellas.sendHuella(data.d);
              }
              if (data.m == "ok") {
                $('#theLoader').hide();
                $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
                $("#btnIniciarEnrollment").prop('disabled', false);
              }
            }
          },ControlHuellas.SEND_HUELLA_DELAY);
        },
        error: function () {
          $('#theLoader').hide();
          console.log("Error fatal al enviar huella");
          //$("#statusLector").val($("#statusLector").val() + "Error fatal al enviar huella" + "\n").scrollTop($('#statusLector')[0].scrollHeight);
          setTimeout(function () {
            ControlHuellas.errorCnt++;
            ControlHuellas.getStatusServer();
          }, 1000);
        },
        beforeSend: function(){
          $('#theLoader').show();
        }
      }); // Fin petición AJAX
    }
    else {
      ControlHuellas.errorCnt = 0;
      $.xhrPool.abortAll();
    }
  },

  startEnrolment: function(){
    if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
      if (!ControlHuellas.cancelFlag) {
        $.ajax({
          url: "http://localhost",
          data: {ws: "startEnrollment"},
          type: "GET",
          dataType: "json",
          success: function (data) {
            mensajeCarga(false);
            console.log(data.m);
            if (data.s == 0) {
              $("#btnIniciarLector").prop('disabled', false);
              $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
              showSimpleNoty(data.m, "center", "warning", 0);
            }
            else {
              if (data.m == "Ingresa un dedo" || data.m == "Ingresa mismo dedo") {
                $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
                ControlHuellas.startEnrolment();
              }
              else if (data.m == "Huella capturada") {
                $('#theLoader').hide();
                $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
                $("#fmdInput").val(data.d);
                $("#btnIniciarEnrollment, #btnGuardarHuella").prop('disabled', false);
                //$("#btnCancelarLector").prop('disabled', true);
              }
              else if (data.m == "Huella ya existe") {
                $('#theLoader').hide();
                $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
                $("#btnIniciarEnrollment").prop('disabled', false);
                //$("#btnCancelarLector").prop('disabled', true);
              }
              else {
                $('#theLoader').hide();
                $("#btnIniciarLector").prop('disabled', false);
                $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
                showSimpleNoty("Error en comunicación con el lector", "center", "warning", 0);
              }
            }
          },
          error: function () {
            mensajeCarga(false);
            $('#theLoader').hide();
            console.log("Error de comunicación con el lector");
            $("#statusLector").val($("#statusLector").val() + "Error de comunicación con el lector\n").scrollTop($('#statusLector')[0].scrollHeight);
            showSimpleNoty("Error de comunicación con el lector", "center", "error", 0);
            $("#btnIniciarLector").prop('disabled', false);
            $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
          },
          /*beforeSend: function(){
            $('#theLoader').show();
            mensajeCarga(true);
          }*/
        }); // Fin petición AJAX
      }
      else {
        ControlHuellas.cancelFlag = false;
      }
    }
    else {
      ControlHuellas.errorCnt = 0;
      $.xhrPool.abortAll();
    }
  },



}

// Eventos asociados al lector de huellas

$(document).off("click", "#btnDelHuellaPersona");
$(document).on("click", "#btnDelHuellaPersona", function () {
  var access;
  if (ControlHuellas.tipoControl == "ControlEmpleados"){
    access = navMenus[7];
  }else if (ControlHuellas.tipoControl == "ControlSocios"){
    access = navMenus[4];
  }

  Administradores.ConsultAccess(id_admin, access, 'del').done(function (data) {
    if (data.s == 1) {
      var idp = $(".modal-header").attr("id-tipo");
      var huella = $(this).attr('nombre-tipo');
      var accion = "ControlHuellas.deleteFingerPrint(" + idp + ", '" + huella + "'); " + ControlHuellas.tipoControl + ".activateButton('"+huella+"')";
      showOptionNoty("¿Seguro que quieres eliminar esta huella?", "center", "warning", "", accion);
    }
    else notyErrorAcceso();
  });
});

$(document).off("click", "#btnNuevaHuella");
$(document).on("click", "#btnNuevaHuella", function () {
  $("#descripcionHuella, #statusLector, #btnIniciarLector, #fmdInput").prop('disabled', false);
  $("#btnHuellaDer, #btnHuellaIzq, #btnHuellaOtro ").removeAttr('disabled');
  $(this).hide();
});

$(document).off("click", "#btnIniciarLector");
$(document).on("click", "#btnIniciarLector", function () {
  $("#statusLector").val('');
  ControlHuellas.getHuellasWS();
});

$(document).off("click", "#btnIniciarEnrollment");
$(document).on("click", "#btnIniciarEnrollment", function () {
  $(this).prop('disabled', true);
  //$("#btnCancelarLector").prop('disabled', false);
  ControlHuellas.startEnrolment();
});

$(document).off("click", "#btnGuardarHuella");
$(document).on("click", "#btnGuardarHuella", function () {
  var descripcion = $("#descripcionHuella").val();
  var fmd = $("#fmdInput").val();
  var idp = $("div.modal-header").attr("id-tipo");

  if (fmd == '') {
    showSimpleNoty("No existe una huella para guardar", "center", "warning", 0);
  }
  else {
    if (descripcion == '') {
      $('#desHuella').attr('class', 'form-group has-error col-md-9');
      showSimpleNoty('No has ingresado la descripción de la huella', 'center', 'warning', 0);
    }
    else {
      $('#desHuella').attr('class', 'form-group has-success col-md-9');
      ControlHuellas.saveFingerPrint(idp, descripcion, fmd);
    }
  }
});
