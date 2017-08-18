/**
* Created by tianshi on 3/04/15.
*/

//data pasada a construir modal

var accionTipo;
var accionIdp;
var accionNombre;

var ControlEmpleados = {
  datosCambio :false,
  editandoData: {},

  construirModal: function (tipo,idp, nombre) {
    accionTipo = tipo;
    accionIdp = idp;
    accionNombre = nombre;
    ControlHuellas.tipoControl = "ControlEmpleados";
    ControlRfdi.tipoControl = "ControlEmpleados";


    //init camera constraints
    camaraControl.actualConstraint = camaraControl.qvgaConstraint;

    if (tipo == 'mod'){
      $(".modal-header").attr("id-tipo", idp).html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Modificar Empleado: ' + nombre + '</h3>');
    }else{
      $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Nuevo Empleado</h3>');
    }
    $(".modal-content").css('height','700px');
    $(".modal-body").html(
      '<div role="tabpanel">' +
      '<ul class="nav nav-tabs" role="tablist">' +
      '<li role="presentation" class="active"><a id="hyperDatos" href="#datos" aria-controls="datos" role="tab" data-toggle="tab"><h4>Datos</h4> </a></li> ' +
      '<li role="presentation"><a id="hyperHuellas" href="#huellas" aria-controls="huellas" role="tab" data-toggle="tab"><h4>Biometrico</h4></a></li>' +
      '<li role="presentation"><a id="hyperRfdi" href="#rfdi" aria-controls="docs" role="tab" data-toggle="tab"><h4>RFID</h4> </a></li>' +
      '<li role="presentation"><a id="hyperDocumentos" href="#docs" aria-controls="docs" role="tab" data-toggle="tab"><h4>Documentos</h4> </a></li></ul>' +
      '<div class="tab-content"> ' +
      '<div role="tabpanel" class="tab-pane in active" id="datos"><p id="datosCont" style="margin-top: 20px;"></p></div>' +
      '<div role="tabpanel" class="tab-pane in active" id="docs"><p id="docsCont" style="margin-top: 20px;"></p></div>' +
      '<div role="tabpanel" class="tab-pane in active" id="huellas"><p id="huellasCont" style="margin-top: 20px;"></p></div>' +
      '<div role="tabpanel" class="tab-pane in active" id="rfdi"><p id="rfdiCont" style="margin-top: 20px;"></p></div>' +
      '</div>'
    );
    $(".modal-footer").hide();
    $('.nav a').click(function (e) {
      e.preventDefault();
      if (!$(this).parent().hasClass('active')) {
        $(this).tab('show');
        var idTab = $(this).attr('id');
        switch (idTab) {
          case "hyperHuellas":
          if (tipo != "mod"){
            ControlEmpleados.showDocsTab(tipo,idp, nombre);
            showOptionNoty('Debe guardar antes de continuar. ', 'center', 'warning', "$('#hyperDatos').click();", ''+
            "$('#hyperDatos').click();");
          }else{
            if (ControlEmpleados.datosCambio){
              $('#huellasCont').html('');
              showOptionNoty('Debe guardar antes de continuar. ', 'center', 'warning', "ControlEmpleados.saveEditingData(); ControlEmpleados.showHuellasTab($('.modal-header').attr('id-tipo'));", ''+
              "ControlEmpleados.saveEditingData(); $('#hyperDatos').click();");
            }else{
              $('#huellasCont').html('');
              ControlEmpleados.showHuellasTab($('.modal-header').attr('id-tipo'));
            }
          }
          break;
          case "hyperDatos":
          if (tipo == 'mod')
            ControlEmpleados.showDatosTab(tipo,idp, nombre);
          else
            ControlEmpleados.showDatosTab(tipo);
          break;
          case "hyperDocumentos":
          if (tipo == 'mod')
            ControlEmpleados.showDocsTab(tipo,idp, nombre);
          else
            ControlEmpleados.showDocsTab(tipo);
          break;
          case "hyperRfdi":
            ControlEmpleados.showRfdiTab($('.modal-header').attr('id-tipo'));
          break;
        }
      }
    });

    $('#myModal').attr("class", "modal fade modal-wide").modal('show');

    // Cargar el contenido de la primera pestaña
    if (tipo == 'mod')
    ControlEmpleados.showDatosTab(tipo,idp, nombre);
    else
    ControlEmpleados.showDatosTab(tipo);


    $('#myModal').off('hide.bs.modal');
    $('#myModal').on('hide.bs.modal',function functionName() {
      ControlEmpleados.datosCambio = false;
      $('input').off('keyup');
    });
  },
  showHuellasTab: function (idp) {
    $(".modal-footer").hide();
    //Peticion de Hellas
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "getIdentificadores",tipo:"fmd", idP: idp},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        var hasIndiceDer = false;
        var hasIndiceIzq = false;
        var tableContainer = document.createElement('table');
        tableContainer.setAttribute('width', '100%');
        var trContainer = document.createElement('tr');
        var tdLeftPanel = document.createElement('td');
        tdLeftPanel.setAttribute('width', '50%');
        var tdRightPanel = document.createElement('td');
        tdRightPanel.setAttribute('width', '50%');
        tdRightPanel.setAttribute('style', "vertical-align: top;");

        if (data.s == 1) {
          var division = document.createElement('div');
          division.setAttribute('class', 'row');
          //aqui se construye la cabecera
          var tabla = document.createElement('table');
          tabla.setAttribute('id', 'tabla-misHuellas');
          tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
          var thead = document.createElement('thead');
          var tr = document.createElement('tr');
          var th = document.createElement('th');
          th.innerHTML = "Descripción Huella";
          tr.appendChild(th);
          var th2 = document.createElement('th');
          th2.innerHTML = "Acciones";
          tr.appendChild(th2);
          thead.appendChild(tr);
          tabla.appendChild(thead);
          var tbody = document.createElement('tbody');
          //aqui se construye cada uno de los elementos
          var tr2 = [];
          var td = [];
          var td2 = [];

          if (data.m != "No se encontraron resultados"){
            for (var i = 0; i < data.d.length; i++) {
              td[i] = document.createElement('td');
              tr2[i] = document.createElement('tr');
              td[i].innerHTML = data.d[i]['descripcion'];
              tr2[i].appendChild(td[i]);
              td2[i] = document.createElement('td');
              td2[i].innerHTML = '<a href="#" class="btn btn-danger btn-xs" id="btnDelHuellaPersona" nombre-tipo="' + data.d[i]['descripcion'] + '"><i class="glyphicon glyphicon-remove-sign">	Eliminar</a>';
              tr2[i].appendChild(td2[i]);
              tbody.appendChild(tr2[i]);

              switch (data.d[i]['descripcion']) {
                case 'indice_der':
                  hasIndiceDer = true;
                break;
                case 'indice_izq':
                  hasIndiceIzq = true;
                break;
              }
            }
          }

          tabla.appendChild(tbody);
          tdLeftPanel.appendChild(tabla);
        }
        else {
          tdLeftPanel.innerHTML = '<div class="alert alert-danger" style="text-align: center"><strong>Oh snap!  </strong>' + data.m + '</div>';
        }

        tdRightPanel.innerHTML = ''+
        '<div id="fingerEnabled">'+
          '<div id="desHuella" class="form-group col-md-9">'+
            '<label class="control-label" for="descripcionHuella" style="display:block;"> Descripción de la huella (*)</label>'+
            '<a class="btn btn-info btn-sm" id="btnHuellaDer" href="#" style="margin-right:10px;" disabled> Indice DER </a>'+
            '<a class="btn btn-info btn-sm" id="btnHuellaIzq" href="#" style="margin-right:10px;" disabled> Indice IZQ </a>'+
            '<a class="btn btn-info btn-sm" id="btnHuellaOtro" href="#" style="margin-right:10px;" disabled> Otro </a>'+
            '<input type="text" class="form-control" id="descripcionHuella" placeholder="Ingresa la descripción de la huella a almacenar" style="margin-top:10px;">'+
          '</div>'+
          '<div class="col-md-3" style="padding-top: 15px; text-align: center;">'+
            '<img id="theLoader" style="display: none;" src="img/ajax-loaders/the-loader.gif" width="50px" height="50px"/>'+
          '</div>'+
          '<div class="col-md-12">'+
            '<textarea id="statusLector" readonly="" rows="10" style="resize: none; width: 100%;"> </textarea>'+
            '<input type="hidden" id="fmdInput"></div><div class="col-md-12" style="text-align: center;">'+
            '<button id="btnIniciarLector" class="btn btn-warning btn-md" style="width: 120px;">Buscar Lector </button>'+
            '<button id="btnIniciarEnrollment" class="btn btn-success btn-md" style="width: 120px;">Iniciar Registro </button>'+
            '<button id="btnGuardarHuella" class="btn btn-primary btn-md" style="width: 120px;">Guardar Huella </button>'+
          '</div>'+
        '</div>';

        trContainer.appendChild(tdLeftPanel);
        trContainer.appendChild(tdRightPanel);
        tableContainer.appendChild(trContainer);
        $("#huellasCont").html('').append(tableContainer);
        $("#fingerEnabled *").prop('disabled', true);

        $('#tabla-misHuellas').dataTable({
          "sDom": "<'row'<'col-md-7 text-left'f><'col-md-5 text-right insert-btn'>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>", //<'col-md-6 text-left'l>
          "sPaginationType": "bootstrap",
          "oLanguage": {
            "sLengthMenu": "_MENU_ registros por pagina",
            "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
            "sZeroRecords": "No se encontró ningún registro",
            "sInfoEmpty": "No existen registros",
            "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
            "sSearch": "Búsqueda: ",
            "oPaginate": {
              "sFirst": "Primero",
              "sLast": "Ultimo",
              "sNext": "Siguiente",
              "sPrevious": "Anterior"
            }
          },
          "pageLength": 5
        });

        if (hasIndiceDer){
          $('#btnHuellaDer').addClass('disabled');
        }

        if (hasIndiceIzq){
          $('#btnHuellaIzq').addClass('disabled');
        }

        $('.insert-btn').html('<a class="btn btn-info btn-sm" id="btnNuevaHuella" href="#"><i class="glyphicon glyphicon-plus-sign icon-white"></i> Registrar Nueva Huella </a>');
        $('#descripcionHuella').hide();

        $('#btnHuellaDer').off('click');
        $('#btnHuellaDer').on('click',function(e) {
          e.preventDefault();
          $(this).addClass('selected');
          $('#btnHuellaOtro,#btnHuellaIzq').removeClass('selected');
          $('#descripcionHuella').hide();
          $('#descripcionHuella').val('indice_der');
        });

        $('#btnHuellaIzq').off('click');
        $('#btnHuellaIzq').on('click',function(e) {
          e.preventDefault();
          $(this).addClass('selected');
          $('#btnHuellaOtro,#btnHuellaDer').removeClass('selected');
          $('#descripcionHuella').hide();
          $('#descripcionHuella').val('indice_izq');
        });

        $('#btnHuellaOtro').off('click');
        $('#btnHuellaOtro').on('click',function(e) {
          e.preventDefault();
          $(this).addClass('selected');
          $('#btnHuellaIzq,#btnHuellaDer').removeClass('selected');
          $('#descripcionHuella').val('');
          $('#descripcionHuella').show();
        });
      },
      error: function () {
        mensajeCarga(false);
        showSimpleNoty("Error fatal al buscar huellas", "center", "error", 0);
      }
    }); // Fin petición AJAX
  },

  showRfdiTab: function (idp) {
    $(document).off('keypress');
    $(".modal-footer").hide();
    //Peticion de identificadores
    $.ajax({
      url: WS_LECTOR_URL,
      data: {ws: "getIdentificadores", tipo: "rfid", idP: idp},
      type: "POST",
      dataType: "json",
      beforeSend: function() {
        mensajeCarga(true);
      },
      success: function (data) {
        mensajeCarga(false);
        var tableContainer = document.createElement('table');
        tableContainer.setAttribute('width', '100%');
        var trContainer = document.createElement('tr');
        var tdLeftPanel = document.createElement('td');
        tdLeftPanel.setAttribute('width', '50%');
        var tdRightPanel = document.createElement('td');
        tdRightPanel.setAttribute('width', '50%');
        tdRightPanel.setAttribute('style', "vertical-align: top;");

        if (data.s == 1) {
          var division = document.createElement('div');
          division.setAttribute('class', 'row');
          //aqui se construye la cabecera
          var tabla = document.createElement('table');
          tabla.setAttribute('id', 'tabla-misRFDI2');
          tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
          var thead = document.createElement('thead');
          var tr = document.createElement('tr');
          var th = document.createElement('th');
          th.innerHTML = "Descripción";
          tr.appendChild(th);
          var th2 = document.createElement('th');
          th2.innerHTML = "Acciones";
          tr.appendChild(th2);
          thead.appendChild(tr);
          tabla.appendChild(thead);
          var tbody = document.createElement('tbody');
          //aqui se construye cada uno de los elementos
          var tr2 = [];
          var td = [];
          var td2 = [];

          if (data.m != "No se encontraron resultados"){
            for (var i = 0; i < data.d.length; i++) {
              td[i] = document.createElement('td');
              tr2[i] = document.createElement('tr');
              td[i].innerHTML = data.d[i]['descripcion'];
              tr2[i].appendChild(td[i]);
              td2[i] = document.createElement('td');
              td2[i].innerHTML = '<a href="#" class="btn btn-danger btn-xs" id="btnDelRfdiPersona" nombre-tipo="' + data.d[i]['descripcion'] + '"><i class="glyphicon glyphicon-remove-sign">	Eliminar</a>';
              tr2[i].appendChild(td2[i]);
              tbody.appendChild(tr2[i]);
            }
          }

          tabla.appendChild(tbody);
          tdLeftPanel.appendChild(tabla);
        }
        else {
          tdLeftPanel.innerHTML = '<div class="alert alert-danger" style="text-align: center"><strong>Oh snap!  </strong>' + data.m + '</div>';
        }

        tdRightPanel.innerHTML = ''+
        '<div id="fingerEnabled">'+
          '<div id="desRfdi" class="form-group col-md-9">'+
            '<label class="control-label" for="descripcionRfdi" style="display:block;"> Descripción: </label>'+
            '<input type="text" class="form-control" id="descripcionRfdi" placeholder="Ingresa la descripción" style="margin-top:10px;">'+
          '</div>'+
          '<div class="col-md-3" style="padding-top: 15px; text-align: center;">'+
            '<img id="theLoader" style="display: none;" src="img/ajax-loaders/the-loader.gif" width="50px" height="50px"/>'+
          '</div>'+
          '<div class="col-md-12">'+
            '<textarea id="statusRfdi" readonly="" rows="10" style="resize: none; width: 100%;"> </textarea>'+
            '<input type="hidden" id="rfdiInput"></div><div class="col-md-12" style="text-align: center;">'+
            '<button id="btnIniciarCaptura" class="btn btn-success btn-md" style="width: 120px;">Iniciar Captura </button>'+
            '<button id="btnGuardarRfdi" class="btn btn-primary btn-md" style="width: 120px;">Guardar</button>'+
          '</div>'+
        '</div>';

        trContainer.appendChild(tdLeftPanel);
        trContainer.appendChild(tdRightPanel);
        tableContainer.appendChild(trContainer);
        $("#rfdiCont").html('').append(tableContainer);
        $("#fingerEnabled *").prop('disabled', true);

        $('#tabla-misRFDI2').dataTable({
          "sDom": "<'row'<'col-md-7 text-left'f><'col-md-5 text-right insert-btn'>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>", //<'col-md-6 text-left'l>
          "sPaginationType": "bootstrap",
          "oLanguage": {
            "sLengthMenu": "_MENU_ registros por pagina",
            "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
            "sZeroRecords": "No se encontró ningún registro",
            "sInfoEmpty": "No existen registros",
            "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
            "sSearch": "Búsqueda: ",
            "oPaginate": {
              "sFirst": "Primero",
              "sLast": "Ultimo",
              "sNext": "Siguiente",
              "sPrevious": "Anterior"
            }
          },
          "pageLength": 5
        });


        $('.insert-btn').html('<a class="btn btn-info btn-sm" id="btnNuevaRfdi" href="#"><i class="glyphicon glyphicon-plus-sign icon-white"></i> Registrar Tarjeta </a>');
      },
      error: function () {
        mensajeCarga(false);
        showSimpleNoty("Error fatal al buscar huellas", "center", "error", 0);
      }
    }); // Fin petición AJAX
  },

  showDatosTab: function (tipo,idp, nombre) {
    $("#datosCont").html(''+
    '<div class="row">'+
      '<div class="col-xs-3"> '+
        '<div class="camera-container" style="width: 200px;height: 200px;margin: 0;border: solid;position: relative;top: 0;left: 0;"> '+
          '<div style="width: 100%;height: 100%;position: absolute;top: 0;left: 0;">'+
            '<a id="btnUpload" class="btn btn-primary" style="position: absolute;z-index: 1;height: 20%;bottom: 5px;width: 95%;left: 2.5%;">Examinar</a>'+
            '<input type="file" id="uploadInput" name="uploadInput"  value="" style="display:none" accept="image/jpg, image/jpeg">'+
          '</div>'+
          '<a href="#" id="btnImageAdd"> <img src="img/photo-camera.png" style="width: 25px;height: 25px;float: right;position: relative;z-index: 1;margin-right: 5px;margin-top: 5px;"></a>'+
          '<a href="#" id="btnImageDelete" style=""> <img src="img/delete.png" style="width: 25px;height: 25px;float: right;z-index: 1;position: relative;margin-right: 5px;margin-top: 5px;top: 0;left: 0;"></a>'+
          '<img id="userImage" src="" style="width: 100%;height: 100%;position: absolute;top: 0;left: 0;">'+
        '</div>'+
      '</div>'+
      '<div class="col-xs-9"> '+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE1" class="form-group">'+
            '<label class="control-label" for="user">Usuario*</label>'+
            '<input type="text" class="form-control" id="user" name="user" placeholder="Ingrese Usuario" autocomplete="new-password"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE2" class="form-group">'+
            '<label class="control-label" for="pass">Contraseña*</label>'+
            '<input type="password" class="form-control" id="pass" name="pass" placeholder="Ingrese Contraseña" autocomplete="new-password"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE18" class="form-group">'+
            '<label class="control-label" for="nMembresia"># Empleado*</label>'+
            '<input type="text" class="form-control" id="nMembresia" name="nMembresia" placeholder="Ingrese # empelado"> '+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="col-xs-9"> '+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE4" class="form-group">'+
            '<label class="control-label" for="nombre">Nombre*</label>'+
            '<input type="text" class="form-control" id="nombre" name="nombre" placeholder="Ingrese Nombre"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE5" class="form-group">'+
            '<label class="control-label" for="apellidoP">Apellido P.*</label>'+
            '<input type="text" class="form-control" id="apellidoP" name="apellidoP" placeholder="Ingrese Apellido P."> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE6" class="form-group">'+
            '<label class="control-label" for="apellidoM">Apellido M.*</label>'+
            '<input type="text" class="form-control" id="apellidoM" name="apellidoM" placeholder="Ingrese Apellido M."> '+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="col-xs-9"> '+
      '<div class="form-container col-xs-4"> '+
        '<div id="mE14" class="form-group">'+
          '<label class="control-label" for="genero">Genero</label>'+
          '<select class="form-control" id="genero" name="genero"><option value="masculino"> Masculino </option><option value="femenino"> Femenino </option></select> '+
        '</div>'+
      '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE17" class="form-group">'+
            '<label class="control-label" for="estatus">Estatus</label>'+
            '<select class="form-control" id="estatus" name="estatus"><option value="1"> Activo </option><option value="0"> Inactivo </option></select> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-4"> '+
          '<div id="mE16" class="form-group">'+
            '<label class="control-label" for="nip">NIP Acceso</label>'+
            '<input type="text" class="form-control" id="nip" name="nip" placeholder="Ingrese NIP"> '+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="row" style="margin-top: 1%;">'+
      '<div class="col-xs-12"> '+
        '<div class="form-container col-xs-6"> '+
          '<div id="mE7" class="form-group">'+
            '<label class="control-label" for="direccion">Dirección</label>'+
            '<input type="text" class="form-control" id="direccion" name="direccion" placeholder="Ingrese dirección"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE8" class="form-group">'+
            '<label class="control-label" for="telefono">Teléfono</label>'+
            '<input type="text" class="form-control" id="telefono" name="telefono" placeholder="Ingrese teléfono"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE9" class="form-group">'+
            '<label class="control-label" for="celular">Celular</label>'+
            '<input type="text" class="form-control" id="celular" name="celular" placeholder="Ingrese celular"> '+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="row">'+
      '<div class="col-xs-12"> '+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE10" class="form-group">'+
            '<label class="control-label" for="correo">Correo</label>'+
            '<input type="email" class="form-control" id="correo" name="correo" placeholder="Ingrese correo"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE11" class="form-group">'+
            '<label class="control-label" for="rfc">RFC</label>'+
            '<input type="text" class="form-control" id="rfc" name="rfc" placeholder="Ingrese RFC"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE12" class="form-group">'+
            '<label class="control-label" for="fecha-nac">Fecha Nacimiento</label>'+
            '<input type="date" class="form-control" id="fecha-nac" name="fecha-nac"> '+
          '</div>'+
        '</div>'+
        '<div class="form-container col-xs-3"> '+
          '<div id="mE13" class="form-group">'+
            '<label class="control-label" for="tipo-sangre">Tipo de Sangre</label>'+
            '<select class="form-control" id="tipo-sangre" name="tipo-sangre"> <option value="O-"> O- </option> <option value="O"> O </option> <option value="A-"> A- </option> <option value="A"> A </option> <option value="B-"> B- </option> <option value="B"> B </option> <option value="AB-"> AB- </option> <option value="AB"> AB </option> </select> '+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>');

    $('#btnUpload').off("click");
    $('#btnUpload').on('click', function(event) {
      event.preventDefault();
      $('#uploadInput').click();
    });

    $('#uploadInput').off('change');
    $('#uploadInput').change(function () {
        var reader = new FileReader();
        var file = $('#uploadInput')[0].files[0];
        var ext = $('#uploadInput').val().split('.').pop().toLowerCase();


        if (typeof(file) != "undefinded"){
          if (ext != 'jpeg' && ext != 'jpg'){
            showSimpleNoty("Solo se permiten imagenes jpeg o jpg", "center", "warning", 1000);

          } else if (file.size < 1048576) {
            $(reader).on("load",function(){
              $('#userImage').attr('src',reader.result);
            });

            if (file) reader.readAsDataURL(file);

          }else{
            showSimpleNoty("Tamaño maximo permitido: 1 MB", "center", "warning", 1000);
          }
        }

    });

    $('input,select').off('keyup');
    $('input,select').on('keyup change',function(){
      ControlEmpleados.datosCambio = true;
    });

    $('input').on('keyup',function(){
      ControlEmpleados.datosCambio = true;
    });

    if (tipo == "mod"){
      ControlEmpleados.blockInputs(false);

      if (!ControlEmpleados.datosCambio) {
        Personas.consultPersonaId(idp).done(function(data) {
          if (data.s == 1){
            $('#nombre').val(data.d.persona[0].nombre);
            $('#apellidoP').val(data.d.persona[0].ap);
            $('#apellidoM').val(data.d.persona[0].am);
            $('#direccion').val(data.d.persona[0].direccion);
            $('#telefono').val(data.d.persona[0].tel);
            $('#celular').val(data.d.persona[0].cel);
            $('#correo').val(data.d.persona[0].email);
            $('#rfc').val(data.d.persona[0].rfc);
            $('#fecha-nac').val(data.d.persona[0].Fecha);
            $('#tipo-sangre').val(data.d.persona[0].tipoSangre);
            $('#genero').val(data.d.persona[0].Genero);
            $('#nip').val(data.d.persona[0].NIP);
            $('#estatus').val(data.d.persona[0].estatus);
            if (data.d.persona[0].estatus == 0) ControlEmpleados.blockInputs(true);

            $('#nMembresia').val(data.d.persona[0].nMembresia);
            $('#user').val(data.d.persona[0].username);
            $('#pass').val(data.d.persona[0].password);
            if (data.d.persona[0].img != ''){
              var d = new Date();
              $('#userImage').attr('src',' ');
              $('#userImage').attr('src',WS_ROOT+data.d.persona[0].img+'?dt='+(+new Date()));
            }
          }
        });
      }else{
        $('#user').val(ControlEmpleados.editandoData.user);
        $('#pass').val(ControlEmpleados.editandoData.pass);
        $('#nombre').val(ControlEmpleados.editandoData.nombre);
        $('#apellidoP').val(ControlEmpleados.editandoData.pellidoP);
        $('#apellidoM').val(ControlEmpleados.editandoData.pellidoM);
        $('#direccion').val(ControlEmpleados.editandoData.direccion);
        $('#telefono').val(ControlEmpleados.editandoData.telefono);
        $('#celular').val(ControlEmpleados.editandoData.celular);
        $('#correo').val(ControlEmpleados.editandoData.correo);
        $('#rfc').val(ControlEmpleados.editandoData.rfc);
        $('#fecha-nac').val(ControlEmpleados.editandoData.fecha_nac);
        $('#tipo-sangre').val(ControlEmpleados.editandoData.tipo_sangre);
        $('#genero').val(ControlEmpleados.editandoData.genero);
        $('#nMembresia').val(ControlEmpleados.editandoData.nMembresia);
        $('#nip').val(ControlEmpleados.editandoData.nip);
        $('#userImage').attr('src',ControlEmpleados.editandoData.imageData);
        $('#estatus').val(ControlEmpleados.editandoData.estatus);
        if (ControlEmpleados.editandoData.estatus == 0) ControlEmpleados.blockInputs(true);

      }
    }

    $(".modal-footer").show();
    if (tipo == 'mod')
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal" style="float:left;">Cancelar</a> ' +
    '<a href="#" class="btn btn-danger" id="btnEliminar" id-tipo="'+$('.modal-header').attr('id-tipo')+'" tipo="empleado" style="float:left;">Eliminar</a> ' +
    '<a href="#" class="btn btn-primary" id="btnSaveReg" tipo="empleado"  accion="' + tipo + '" style="float:right;"> Guardar </a>');
    else
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal" style="float:left;">Cancelar</a> ' +
    '<a href="#" class="btn btn-primary" id="btnSaveReg" tipo="empleado"  accion="' + tipo + '" style="float:right;"> Guardar </a>');

    $('#cameraModal .modal-footer').css('text-align','center');
  },

  blockInputs: function (option) {
    $('#user').attr('disabled',option);
    $('#pass').attr('disabled',option);
    $('#nombre').attr('disabled',option);
    $('#apellidoP').attr('disabled',option);
    $('#apellidoM').attr('disabled',option);
    $('#direccion').attr('disabled',option);
    $('#telefono').attr('disabled',option);
    $('#celular').attr('disabled',option);
    $('#correo').attr('disabled',option);
    $('#rfc').attr('disabled',option);
    $('#fecha-nac').attr('disabled',option);
    $('#tipo-sangre').attr('disabled',option);
    $('#genero').attr('disabled',option);
    $('#nMembresia').attr('disabled',option);
    $('#nip').attr('disabled',option);

    //desactivar o activar botones de control de camara
    $('#btnImageAdd').attr('disabled',option);
    $('#btnImageDelete').attr('disabled',option);
  },

  showDocsTab: function (tipo,idp, nombre) {

    // Grupos.consultMiembros(id).done(function (data) {
    var division = document.createElement('div');
    division.setAttribute('class', 'row');
    //aqui se construye la cabecera
    var tabla = document.createElement('table');
    tabla.setAttribute('id', 'tabla-docs');
    tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.innerHTML = "Documento";
    tr.appendChild(th);
    var th2 = document.createElement('th');
    th2.innerHTML = "Fecha";
    tr.appendChild(th2);
    var th3 = document.createElement('th');
    th3.innerHTML = "Accion";
    tr.appendChild(th3);
    thead.appendChild(tr);
    tabla.appendChild(thead);
    var tbody = document.createElement('tbody');
    //aqui se construye cada uno de los elementos
    var td = [];
    var td2 = [];
    var td3 = [];
    var tr = [];

    //Crear datos de prueba, se deberian pedir al servidor
    //primero
    tr[0] = document.createElement('tr');

    td[0] = document.createElement('td');
    td[0].innerHTML = "Acta_nacimiento.pdf";
    tr[0].appendChild(td[0]);

    td2[0] = document.createElement('td');
    td2[0].innerHTML = "23/dic/2016 6:00";
    tr[0].appendChild(td2[0]);

    td3[0] = document.createElement('td');
    $(td3[0]).html('<a class="btn btn-success btn-setting" id="btnVer" href="#" id-tipo="" ><i class="glyphicon glyphicon-barcode icon-white"></i>  Ver </a> ' +
    '<a class="btn btn-danger" id="btnEliminar" href="#" tipo="doc" id-tipo=""><i class="glyphicon glyphicon-trash icon-white"></i> Eliminar    </a> ');
    tr[0].appendChild(td3[0]);

    tbody.appendChild(tr[0]);

    //segundo
    tr[1] = document.createElement('tr');

    td[1] = document.createElement('td');
    td[1].innerHTML = "Comp_dom.pdf";
    tr[1].appendChild(td[1]);

    td2[1] = document.createElement('td');
    td2[1].innerHTML = "10/ene/2017 10:20";
    tr[1].appendChild(td2[1]);

    td3[1] = document.createElement('td');
    $(td3[1]).html('<a class="btn btn-success btn-setting" id="btnVer" href="#" id-tipo="" ><i class="glyphicon glyphicon-barcode icon-white"></i>  Ver </a> ' +
    '<a class="btn btn-danger" id="btnEliminar" href="#" tipo="doc" id-tipo=""><i class="glyphicon glyphicon-trash icon-white"></i> Eliminar    </a> ');
    tr[1].appendChild(td3[1]);

    tbody.appendChild(tr[1]);

    //tercer dato de prueba
    tr[2] = document.createElement('tr');

    td[2] = document.createElement('td');
    td[2].innerHTML = "comp_medico.pdf";
    tr[2].appendChild(td[2]);

    td2[2] = document.createElement('td');
    td2[2].innerHTML = "10/ene/2017 11:20";
    tr[2].appendChild(td2[2]);

    td3[2] = document.createElement('td');
    $(td3[2]).html('<a class="btn btn-success btn-setting" id="btnVer" href="#" id-tipo="" ><i class="glyphicon glyphicon-barcode icon-white"></i>  Ver </a> ' +
    '<a class="btn btn-danger" id="btnEliminar" href="#" tipo="doc" id-tipo=""><i class="glyphicon glyphicon-trash icon-white"></i> Eliminar    </a> ');
    tr[2].appendChild(td3[2]);

    tbody.appendChild(tr[2]);
    //fin datos de prueba

    tabla.appendChild(tbody);
    $("#docsCont").html(tabla);
    $('#tabla-docs').dataTable({
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
    // });

    $(".modal-footer").show();
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal" style="float:left;">Cancelar</a> ' +
    '<a id="newFile" href="#" class="btn btn-success" style="float:right;">Nuevo</a>' +
    '<input type="file" id="fileInput" name="fileInput" value="" style="display:none" accept="application/pdf">');

    $('#newFile').off('click');
    $('#newFile').click(function(event) {
      event.preventDefault();
      $('#fileInput').click();
    });

    $('#fileInput').off('change');
    $('#fileInput').on('change', function() {
      var reader = new FileReader();
      file = $('#fileInput')[0];

      if (!file.files.length){
        showSimpleNoty("No se seleccionó ningun archivo","center","warning",2000);
        return;
      }

      reader.onload = function () {
        var data = reader.result;

        splitted = splitBase64Into(data,200000);
        console.log(splitted);
        // sendFileSplitted(0,splitted.length,splitted,$(".modal-header").attr("id-tipo"));
      };

      reader.readAsDataURL(file.files[0]);
    });
  },

  activateButton: function(tipo) {
    switch (tipo) {
      case 'indice_der':
        $('#btnHuellaDer').removeClass('disabled');
      break;
      case 'indice_izq':
        $('#btnHuellaIzq').removeClass('disabled');
      break;
    }
  },

  saveEditingData: function () {
    ControlEmpleados.editandoData.user = $('#user').val();
    ControlEmpleados.editandoData.pass = $('#pass').val();
    ControlEmpleados.editandoData.nombre = $('#nombre').val();
    ControlEmpleados.editandoData.pellidoP = $('#apellidoP').val();
    ControlEmpleados.editandoData.pellidoM = $('#apellidoM').val();
    ControlEmpleados.editandoData.direccion = $('#direccion').val();
    ControlEmpleados.editandoData.telefono = $('#telefono').val();
    ControlEmpleados.editandoData.celular = $('#celular').val();
    ControlEmpleados.editandoData.correo = $('#correo').val();
    ControlEmpleados.editandoData.rfc = $('#rfc').val();
    ControlEmpleados.editandoData.fecha_nac = $('#fecha-nac').val();
    ControlEmpleados.editandoData.tipo_sangre = $('#tipo-sangre').val();
    ControlEmpleados.editandoData.genero = $('#genero').val();
    ControlEmpleados.editandoData.nMembresia = $('#nMembresia').val();
    ControlEmpleados.editandoData.nip = $('#nip').val();
    ControlEmpleados.editandoData.imageData = $('#userImage').attr('src');
    ControlEmpleados.editandoData.estatus = $('#estatus').val();

  }

};

function mostrarModalCamara() {
  $('#takeSnap').attr("disabled", true);
  // $('#myModal').modal('hide');

  console.log("id tipo!"+accionIdp);
  $("#cameraModal .modal-header").html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button><div id="description">Nuevo Socio</div>');
  $("#cameraModal .modal-header").css('text-align','center');
  $("#cameraModal .modal-header").attr('id-tipo',accionIdp);

  $("#cameraModal .modal-content").css('height','auto');
  $("#cameraModal .modal-content").css('text-align','center');

  $("#cameraModal .modal-body").css('text-align','center');
  $("#cameraModal .modal-body").html(
    '<div style="overflow: auto;">'+
      '<div style="">'+
        '<label for="devices" style="">Camara:</label>'+
        '<select id="devices" name="devices" style=""></select>'+
      '</div>'+
    '</div>'+
    '<div id="videoConstraints" style="text-align:center;margin:5px 0px 5px 0px">'+
       '<a href="#" id="qvga" class="btn btn-primary"> QVGA </a>'+
       '<a href="#" id="vga" class="btn btn-primary"> VGA </a>'+
       '<a href="#" id="hd" class="btn btn-primary"> HD </a>'+
       '<a href="#" id="fullHd" class="btn btn-primary"> Full HD </a>'+
       '<p id="actualRes"> </p>'+
    '</div>'+
    '<div id="videoOutput">'+
      '<video id="video" autoplay></video>'+
      '<canvas id="canvas" style="display:none;"></canvas>'+
    '</div>'
  );
  $("#cameraModal .modal-footer").html(
    '<button id="takeSnap" type="button" class="btn btn-primary" style="zoom: 1.5;width: 70%;height: 40px;">'+
      '<p><img src="img/thefullreflexcamera_slr_camera_4626.png" alt="" width="20px" height="20px" style="vertical-align:middle">'+
        'Capturar'+
      '</p>'+
    '</button>'+
    '<h2 id="uploadMsg" style="display:none;"> </h2>'+
    '<img id="uploadAnim"src="img/ajax-loader.gif" style="display:none;">'
  );

  $('#takeSnap').attr("disabled", true);

  camaraControl.setListeners(true);

  camaraControl.video_rec = document.getElementById('video');
  camaraControl.videoSelect = $('#devices')[0];

  camaraControl.startStream(camaraControl.actualConstraint);

  $('#description').html('<h2> Nueva Imagen</h2>');

  $("#cameraModal").modal('show');
}

$(document).off("click", "#btnImageAdd");
$(document).on("click", "#btnImageAdd", function (e) {
  e.preventDefault();
  console.log("btnImageAdd click");
  $('#takeSnap').attr("disabled", true);
  mostrarModalCamara();
});

$(document).off("click", "#btnImageDelete");
$(document).on("click", "#btnImageDelete", function (e) {
  e.preventDefault();
  showOptionNoty('¿Desea eliminar esta imagen? ', 'center', 'warning', '', ''+
  "eliminarImagen("+accionIdp+");");
});

function eliminarImagen(idp) {
  $.ajax({
    type: 'POST',
    data: {ws: "deleteImg", idp: idp},
    url: WS_PRIVADOS_URL, //TODO: actualizar direccion del ws
    dataType : 'json',
    beforeSend: function() {
      mensajeCarga(true);
    },
    success: function(data)
    {
        mensajeCarga(false);
        console.log("delete image:"+idp);
        if (data.s == 1){
          showSimpleNoty("Imagen eliminada con exito", 'center', 'success', 3000);
          $('#userImage').attr('src',' ');
        }else{
          showSimpleNoty("Error al eliminar imagen", 'center', 'warning', 3000);

        }
    },
    error: function (jqXHR, msgStatus, errorThrown)
    {
      mensajeCarga(false);
      showSimpleNoty("Error al eliminar imagen", 'center', 'warning', 3000);
    }
  });
}
$('#cameraModal').off('hide.bs.modal');
$('#cameraModal').on('hide.bs.modal',function functionName() {
  camaraControl.localStream = window.stream;

  if (camaraControl.localStream){
    if (camaraControl.localStream.active){
      camaraControl.localTrack.stop();
    }
  }
  $('#uploadAnim').hide();
  $('#takeSnap').show();
  $('#uploadMsg').hide();
  $('#video').show();
  $('#canvas').hide();

  ControlEmpleados.construirModal(accionTipo,accionIdp, accionNombre);
});
