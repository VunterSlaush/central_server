var ControlRfdi = {
  dataHuellas: {},
  cancelFlag: false,
  errorCnt: 0,
  SEND_HUELLA_DELAY: 1,
  tipoControl: "",

  deleteRfdi: function (idp, descripcion) {
    // Eliminacion completa de la Huella especificada
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "deleteIdentificador", idP: idp, tipo:"rfid", detalle: descripcion},
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
            ControlEmpleados.showRfdiTab(idp);
          }else if (ControlHuellas.tipoControl == "ControlSocios"){
            ControlSocios.showRfdiTab(idp);
          }
        }
        else {
          showSimpleNoty(data.m, "center", "warning", 0);
        }
      },
      error: function () {
        showSimpleNoty("Error en el servicio para eliminar tarjeta", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  },

  saveRfdi: function (idp, detalle, rfdi){
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "saveIdentificador", idP:idp, detalle:detalle, rfid:rfdi},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        if (data.s == 1 && data.m == "Identificador registrado exitosamente") {
          showSimpleNoty(data.m, "center", "success", 5000);
          if (ControlRfdi.tipoControl == "ControlEmpleados"){
            ControlEmpleados.showRfdiTab(idp);
          }else if (ControlHuellas.tipoControl == "ControlSocios"){
            ControlSocios.showRfdiTab(idp);
          }

        }
        else {
          showSimpleNoty(data.m, "center", "warning", 0);
          actualizarTextArea(data.m+"\n");
          resetButtons();
        }
      },
      error: function () {
        showSimpleNoty("Error en el servicio para guardar identificador", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  },

  getIdentificadoresRfdi: function (idp) {
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "getIdentificadores", tipo:"rfid", idP: idp},
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
        }
      },
      error: function () {
        showSimpleNoty("Error fatal al buscar tarjetas en servidor", "center", "error", 0);
        mensajeCarga(false);
      }
    }); // Fin petición AJAX
  }

}

// Eventos asociados al lector de tarjetas

$(document).off("click", "#btnDelRfdiPersona");
$(document).on("click", "#btnDelRfdiPersona", function () {
  var access;
  if (ControlHuellas.tipoControl == "ControlEmpleados"){
    access = navMenus[7];
  }else if (ControlHuellas.tipoControl == "ControlSocios"){
    access = navMenus[4];
  }

  Administradores.ConsultAccess(id_admin, access, 'del').done(function (data) {
    if (data.s == 1) {
      var idp = $(".modal-header").attr("id-tipo");
      var tarjeta = $(this).attr('nombre-tipo');
      var accion = "ControlRfdi.deleteRfdi(" + idp + ", '" + tarjeta + "');";
      showOptionNoty("¿Seguro que quieres eliminar esta tarjeta?", "center", "warning", "", accion);
    }
    else notyErrorAcceso();
  });

});

$(document).off("click", "#btnNuevaRfdi");
$(document).on("click", "#btnNuevaRfdi", function () {
  $("#descripcionRfdi, #statusRfdi, #btnIniciarCaptura, #fmdInput").prop('disabled', false);
  $(this).hide();
});


$(document).off("click", "#btnIniciarCaptura");
$(document).on("click", "#btnIniciarCaptura", function () {
  $(this).prop('disabled', true);
  //$("#btnCancelarLector").prop('disabled', false);
  actualizarTextArea("Iniciando... \nIngresar ID RFDI\n");
  $('#rfdiInput').val('');

  $(document).on('keypress', function(event) {
    if (event.which == 13){
      $(document).off('keypress');
      $('#btnGuardarRfdi').prop('disabled', false);
      actualizarTextArea("ID capturado:**********\n");
      return;
    }

    $('#rfdiInput').val($('#rfdiInput').val()+""+event.key)
    console.log($('#rfdiInput').val());
  });
});

$(document).off("click", "#btnGuardarRfdi");
$(document).on("click", "#btnGuardarRfdi", function () {
  var descripcion = $("#descripcionRfdi").val();
  var rfdi = $("#rfdiInput").val();
  var idp = $("div.modal-header").attr("id-tipo");

  if (rfdi == '') {
    showSimpleNoty("No existe un identificador para guardar", "center", "warning", 0);
  }
  else {
    if (descripcion == '') {
      $('#desRfdi').attr('class', 'form-group has-error col-md-9');
      showSimpleNoty('No has ingresado la descripción de la tarjeta', 'center', 'warning', 0);
    }
    else {
      $('#desRfdi').attr('class', 'form-group has-success col-md-9');
      ControlRfdi.saveRfdi(idp, descripcion, rfdi);
    }
  }
});

$('#myModal').one('hide.bs.modal', function() {
  $(document).off('keypress');
});

function resetButtons() {
  $('#btnIniciarCaptura').prop('disabled', false);
  $('#btnGuardarRfdi').prop('disabled', true);
  $("#rfdiInput").val('');
}

function actualizarTextArea(texto) {
  $("#statusRfdi").val($("#statusRfdi").val() + texto).scrollTop($('#statusRfdi')[0].scrollHeight);
}
