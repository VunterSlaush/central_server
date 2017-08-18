// /**
//  * Created by tianshi on 3/04/15.
//  */
//
// var dataHuellas = {};
// var cancelFlag = false;
// var errorCnt = 0;
//
// var ControlAccesos = {
//     construirModal: function (idp, nombre) {
//         $(".modal-header").attr("id-tipo", idp).html('<button type="button" class="close" data-dismiss="modal">×</button><h3>Control de Accesos: ' + nombre + '</h3>');
//         $(".modal-body").html(
//             '<div role="tabpanel">' +
//             '<ul class="nav nav-tabs" role="tablist">' +
//             '<li role="presentation" class="active"><a id="hyperHuellas" href="#huellas" aria-controls="huellas" role="tab" data-toggle="tab"><h4>Lector de Huellas</h4></a></li>' +
//             '<li role="presentation"><a id="hyperTest" href="#test" aria-controls="test" role="tab" data-toggle="tab"><h4>Test</h4> </a></li></ul> ' +
//             '<div class="tab-content"> ' +
//             '<div role="tabpanel" class="tab-pane in active" id="huellas"><p id="huellasCont" style="margin-top: 20px;"></p></div>' +
//             '<div role="tabpanel" class="tab-pane" id="test">Raw denim you probably havent heard of them jean shorts Austin. Nesciunt tofu stumptown aliqua, retro synth master cleanse. Mustache cliche tempor, williamsburg carles vegan helvetica. Reprehenderit butcher retro keffiyeh dreamcatcher synth. Cosby sweater eu banh mi, qui irure terry richardson ex squid. Aliquip placeat salvia cillum iphone. Seitan aliquip quis cardigan american apparel, butcher voluptate nisi qui.</div> ' +
//             '</div>'
//         );
//         $(".modal-footer").hide();
//         $(".nav a:first").tab('show');
//         $('.nav a').click(function (e) {
//             e.preventDefault();
//             if (!$(this).parent().hasClass('active')) {
//                 $(this).tab('show');
//                 var idTab = $(this).attr('id');
//                 switch (idTab) {
//                     case "hyperHuellas":
//                         $("#huellasCont").html('');
//                         ControlAccesos.showHuellasTab($(".modal-header").attr("id-tipo"));
//                         break;
//                     case "hyperTest":
//                         break;
//                 }
//             }
//         });
//
//         $('#myModal').attr("class", "modal fade modal-wide").modal('show');
//
//         // Cargar el contenido de la primera pestaña
//         ControlAccesos.showHuellasTab(idp);
//     },
//
//     showHuellasTab: function (idp) {
//         //Peticion de Hellas
//         $.ajax({
//             url: "../web_services/serviciosLector.php",
//             data: {ws: "getHuellasAdmin", id: idp},
//             type: "POST",
//             dataType: "json",
//             success: function (data) {
//                 var tableContainer = document.createElement('table');
//                 tableContainer.setAttribute('width', '100%');
//                 var trContainer = document.createElement('tr');
//                 var tdLeftPanel = document.createElement('td');
//                 tdLeftPanel.setAttribute('width', '50%');
//                 var tdRightPanel = document.createElement('td');
//                 tdRightPanel.setAttribute('width', '50%');
//                 tdRightPanel.setAttribute('style', "vertical-align: top;");
//
//                 if (data.s == 1) {
//                     var division = document.createElement('div');
//                     division.setAttribute('class', 'row');
//                     //aqui se construye la cabecera
//                     var tabla = document.createElement('table');
//                     tabla.setAttribute('id', 'tabla-misHuellas');
//                     tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
//                     var thead = document.createElement('thead');
//                     var tr = document.createElement('tr');
//                     var th = document.createElement('th');
//                     th.innerHTML = "Descripción Huella";
//                     tr.appendChild(th);
//                     var th2 = document.createElement('th');
//                     th2.innerHTML = "Acciones";
//                     tr.appendChild(th2);
//                     thead.appendChild(tr);
//                     tabla.appendChild(thead);
//                     var tbody = document.createElement('tbody');
//                     //aqui se construye cada uno de los elementos
//                     var tr2 = [];
//                     var td = [];
//                     var td2 = [];
//                     for (var i = 0; i < data.d.length; i++) {
//                         td[i] = document.createElement('td');
//                         tr2[i] = document.createElement('tr');
//                         td[i].innerHTML = data.d[i]['descripcion'];
//                         tr2[i].appendChild(td[i]);
//                         td2[i] = document.createElement('td');
//                         td2[i].innerHTML = '<a href="#" class="btn btn-danger btn-xs" id="btnDelHuellaPersona" nombre-tipo="' + data.d[i]['descripcion'] + '"><i class="glyphicon glyphicon-remove-sign">	Eliminar</a>';
//                         tr2[i].appendChild(td2[i]);
//                         tbody.appendChild(tr2[i]);
//                     }
//                     tabla.appendChild(tbody);
//                     tdLeftPanel.appendChild(tabla);
//                 }
//                 else {
//                     tdLeftPanel.innerHTML = '<div class="alert alert-danger" style="text-align: center"><strong>Oh snap!  </strong>' + data.m + '</div>';
//                 }
//
//                 tdRightPanel.innerHTML = '<div id="fingerEnabled"> <div id="desHuella" class="form-group col-md-9"><label class="control-label" for="descripcionHuella"> Descripción de la huella (*) </label> <input type="text" class="form-control" id="descripcionHuella" placeholder="Ingresa la descripción de la huella a almacenar"> </div><div class="col-md-3" style="padding-top: 15px; text-align: center;"><img id="theLoader" style="display: none;" src="img/ajax-loaders/the-loader.gif" width="50px" height="50px"/></div><div class="col-md-12"><textarea id="statusLector" readonly="" rows="10" style="resize: none; width: 100%;"> </textarea> <input type="hidden" id="fmdInput"></div><div class="col-md-12" style="text-align: center;"> <button id="btnIniciarLector" class="btn btn-warning btn-md" style="width: 120px;">Buscar Lector </button> <button id="btnIniciarEnrollment" class="btn btn-success btn-md" style="width: 120px;">Iniciar Registro </button> <button id="btnGuardarHuella" class="btn btn-primary btn-md" style="width: 120px;">Guardar Huella </button> </div></div>';
//
//                 trContainer.appendChild(tdLeftPanel);
//                 trContainer.appendChild(tdRightPanel);
//                 tableContainer.appendChild(trContainer);
//                 $("#huellasCont").html('').append(tableContainer);
//                 $("#fingerEnabled *").prop('disabled', true);
//
//                 $('#tabla-misHuellas').dataTable({
//                     "sDom": "<'row'<'col-md-7 text-left'f><'col-md-5 text-right insert-btn'>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>", //<'col-md-6 text-left'l>
//                     "sPaginationType": "bootstrap",
//                     "oLanguage": {
//                         "sLengthMenu": "_MENU_ registros por pagina",
//                         "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
//                         "sZeroRecords": "No se encontró ningún registro",
//                         "sInfoEmpty": "No existen registros",
//                         "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
//                         "sSearch": "Búsqueda: ",
//                         "oPaginate": {
//                             "sFirst": "Primero",
//                             "sLast": "Ultimo",
//                             "sNext": "Siguiente",
//                             "sPrevious": "Anterior"
//                         }
//                     },
//                     "pageLength": 5
//                 });
//                 $('.insert-btn').html('<a class="btn btn-info btn-sm" id="btnNuevaHuella" href="#"><i class="glyphicon glyphicon-plus-sign icon-white"></i> Registrar Nueva Huella </a>');
//
//             },
//             error: function () {
//                 showSimpleNoty("Error fatal al buscar huellas", "center", "error", 0);
//             }
//         }); // Fin petición AJAX
//     },
//
//     deleteFingerPrint: function (idp, fingerPrint) {
//         // Eliminacion completa de la Huella especificada
//         $.ajax({
//             url: "../web_services/serviciosLector.php",
//             data: {ws: "deleteHuellasAdmin", idp: idp, huella: fingerPrint},
//             type: "POST",
//             dataType: "json",
//             success: function (data) {
//                 if (data.s == 1) {
//                     showSimpleNoty(data.m, "center", "success", 5000);
//                     ControlAccesos.showHuellasTab(idp);
//                 }
//                 else {
//                     showSimpleNoty(data.m, "center", "warning", 0);
//                 }
//             },
//             error: function () {
//                 showSimpleNoty("Error en el servicio para eliminar huella", "center", "error", 0);
//             }
//         }); // Fin petición AJAX
//     },
//
//     saveFingerPrint: function (idp, detalle, fmd){
//         $.ajax({
//             url: "../web_services/serviciosLector.php",
//             data: {ws: "saveHuella", idp:idp, detalle:detalle, huella:fmd},
//             type: "POST",
//             dataType: "json",
//             success: function (data) {
//                 if (data.s == 1) {
//                     showSimpleNoty(data.m, "center", "success", 5000);
//                     ControlAccesos.showHuellasTab(idp);
//                 }
//                 else {
//                     showSimpleNoty(data.m, "center", "warning", 0);
//                 }
//             },
//             error: function () {
//                 showSimpleNoty("Error en el servicio para guardar huella", "center", "error", 0);
//             }
//         }); // Fin petición AJAX
//     },
//
//     getHuellasWS: function () {
//         $.ajax({
//             url: "../web_services/serviciosLector.php",
//             data: {ws: "getHuellasC"},
//             type: "POST",
//             dataType: "json",
//             success: function (data) {
//                 if (data.s == 0) {
//                    showSimpleNoty(data.m, "center", "warning", 5000);
//                 }
//                 else {
//                     $("#btnIniciarLector").prop('disabled', true);
//                     cancelFlag = false;
//                     dataHuellas = data.d;
//                     ControlAccesos.getStatusServer();
//                 }
//             },
//             error: function () {
//                 showSimpleNoty("Error fatal al buscar huellas en servidor", "center", "error", 0);
//             }
//         }); // Fin petición AJAX
//     },
//
//     getStatusServer: function () {
//         if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
//             $.ajax({
//                 url: "http://localhost?ws=getStatusServer",
//                 type: "GET",
//                 dataType: "json",
//                 success: function (data) {
//                     console.log(data.m);
//                     if (data.s == 1 && data.m == "Esperando num huella") {
//                         $("#statusLector").val($("#statusLector").val() + "Cargando base de datos  ").scrollTop($('#statusLector')[0].scrollHeight);
//                         $('#theLoader').hide();
//                         ControlAccesos.sendNumeroHuellas();
//                     }
//                     else {
//                         errorCnt++;
//                         $("#statusLector").val(this.val() + data.m + "\n").scrollTop(this[0].scrollHeight);
//                         if (errorCnt >= 10) {
//                             $('#theLoader').hide();
//                             showSimpleNoty(data.m, "center", "warning", 0);
//                             $("#btnIniciarLector").prop('disabled', false);
//                         }
//                         else {
//                             setTimeout(function () {
//                                 ControlAccesos.getStatusServer();
//                             }, 1000);
//                         }
//                     }
//                 },
//                 error: function () {
//                     errorCnt++;
//                     console.log("Error al buscar lector");
//                     $("#statusLector").val($("#statusLector").val() + 'Error al buscar lector\n').scrollTop($('#statusLector')[0].scrollHeight);
//                     if (errorCnt >= 10) {
//                         $('#theLoader').hide();
//                         showSimpleNoty("Error al buscar lector", "center", "error", 0);
//                         $("#btnIniciarLector").prop('disabled', false);
//                         errorCnt = 0;
//                     }
//                     else {
//                         setTimeout(function () {
//                             ControlAccesos.getStatusServer();
//                         }, 1000);
//                     }
//                 },
//                 beforeSend: function(){
//                     $.unblockUI();
//                     $('#theLoader').show();
//                 }
//             }); // Fin petición AJAX
//         }
//         else {
//             errorCnt = 0;
//         }
//     },
//
//     sendNumeroHuellas: function () {
//         if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
//             $.ajax({
//                 url: "http://localhost",
//                 data: {ws: "numHuellas", num: dataHuellas.length},
//                 type: "GET",
//                 dataType: "json",
//                 success: function (data) {
//                     console.log(data.m);
//                     $("#statusLector").append($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                     if (data.s == 1 && data.m == "Esperando huella") {
//                         ControlAccesos.sendHuella(0);
//                     }
//                     else {
//                         $('#theLoader').hide();
//                         setTimeout(function () {
//                             errorCnt++;
//                             ControlAccesos.getStatusServer();
//                         }, 1000);
//                     }
//                 },
//                 error: function () {
//                     console.log("Error al enviar número de huellas");
//                     $("#statusLector").val($("#statusLector").val() + "Error al enviar número de huellas\n").scrollTop($('#statusLector')[0].scrollHeight);
//                     $('#theLoader').hide();
//                     setTimeout(function () {
//                         errorCnt++;
//                         ControlAccesos.getStatusServer();
//                     }, 1000);
//                 },
//                 beforeSend: function(){
//                     $.unblockUI();
//                     $('#theLoader').show();
//                 }
//             }); // Fin petición AJAX
//         }
//         else {
//             errorCnt = 0;
//             $.xhrPool.abortAll();
//         }
//     },
//
//     sendHuella: function (indexToSend) {
//         if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
//             var vFMD = dataHuellas[indexToSend]['fmd'];
//             var idFMD = dataHuellas[indexToSend]['nss'];
//             $.ajax({
//                 url: "http://localhost",
//                 data: {ws: 'sendHuella', fmd: vFMD, nss: idFMD},
//                 type: "GET",
//                 dataType: "json",
//                 success: function (data) {
//                     console.log(data.m);
//                     if (data.s == 0) {
//                         showSimpleNoty(data.m, "center", "warning", 0);
//                         $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                         $('#theLoader').hide();
//                         setTimeout(function () {
//                             errorCnt++;
//                             ControlAccesos.getStatusServer();
//                         }, 1000);
//                     }
//                     else {
//                         if (data.m == "next") {
//                             $("#statusLector").val($("#statusLector").val() + ".").scrollTop($('#statusLector')[0].scrollHeight);
//                             ControlAccesos.sendHuella(data.d);
//                         }
//                         if (data.m == "ok") {
//                             $('#theLoader').hide();
//                             $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                             $("#btnIniciarEnrollment").prop('disabled', false);
//                         }
//                     }
//                 },
//                 error: function () {
//                     $('#theLoader').hide();
//                     console.log("Error fatal al enviar huella");
//                     $("#statusLector").val($("#statusLector").val() + "Error fatal al enviar huella" + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                     setTimeout(function () {
//                         errorCnt++;
//                         ControlAccesos.getStatusServer();
//                     }, 1000);
//                 },
//                 beforeSend: function(){
//                     $.unblockUI();
//                     $('#theLoader').show();
//                 }
//             }); // Fin petición AJAX
//         }
//         else {
//             errorCnt = 0;
//             $.xhrPool.abortAll();
//         }
//     },
//
//     startEnrolment: function(){
//         if($('#hyperHuellas').parent().hasClass('active') && $('#myModal').hasClass('in')) {
//             if (!cancelFlag) {
//                 $.ajax({
//                     url: "http://localhost",
//                     data: {ws: "startEnrollment"},
//                     type: "GET",
//                     dataType: "json",
//                     success: function (data) {
//                         console.log(data.m);
//                         if (data.s == 0) {
//                             $("#btnIniciarLector").prop('disabled', false);
//                             $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
//                             showSimpleNoty(data.m, "center", "warning", 0);
//                         }
//                         else {
//                             if (data.m == "Ingresa un dedo" || data.m == "Ingresa mismo dedo") {
//                                 $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                                 ControlAccesos.startEnrolment();
//                             }
//                             else if (data.m == "Huella capturada") {
//                                 $('#theLoader').hide();
//                                 $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                                 $("#fmdInput").val(data.d);
//                                 $("#btnIniciarEnrollment, #btnGuardarHuella").prop('disabled', false);
//                                 //$("#btnCancelarLector").prop('disabled', true);
//                             }
//                             else if (data.m == "Huella ya existe") {
//                                 $('#theLoader').hide();
//                                 $("#statusLector").val($("#statusLector").val() + data.m + "\n").scrollTop($('#statusLector')[0].scrollHeight);
//                                 $("#btnIniciarEnrollment").prop('disabled', false);
//                                 //$("#btnCancelarLector").prop('disabled', true);
//                             }
//                             else {
//                                 $('#theLoader').hide();
//                                 $("#btnIniciarLector").prop('disabled', false);
//                                 $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
//                                 showSimpleNoty("Error en comunicación con el lector", "center", "warning", 0);
//                             }
//                         }
//                     },
//                     error: function () {
//                         $('#theLoader').hide();
//                         console.log("Error de comunicación con el lector");
//                         $("#statusLector").val($("#statusLector").val() + "Error de comunicación con el lector\n").scrollTop($('#statusLector')[0].scrollHeight);
//                         showSimpleNoty("Error de comunicación con el lector", "center", "error", 0);
//                         $("#btnIniciarLector").prop('disabled', false);
//                         $("#btnIniciarEnrollment").prop('disabled', true); //, #btnCancelarLector
//                     },
//                     beforeSend: function(){
//                         $.unblockUI();
//                         $('#theLoader').show();
//                     }
//                 }); // Fin petición AJAX
//             }
//             else {
//                 cancelFlag = false;
//             }
//         }
//         else {
//             errorCnt = 0;
//             $.xhrPool.abortAll();
//         }
//     }
// };
//
// $(document).on("click", "#btnDelHuellaPersona", function () {
//     var idp = $(".modal-header").attr("id-tipo");
//     var huella = $(this).attr('nombre-tipo');
//     var accion = "ControlAccesos.deleteFingerPrint(" + idp + ", '" + huella + "')";
//     showOptionNoty("¿Seguro que quieres eliminar esta huella?", "center", "warning", "", accion);
// });
//
// $(document).on("click", "#btnNuevaHuella", function () {
//     $("#descripcionHuella, #statusLector, #btnIniciarLector, #fmdInput").prop('disabled', false);
//     $(this).hide();
// });
//
// $(document).on("click", "#btnIniciarLector", function () {
//     $("#statusLector").val('');
//     ControlAccesos.getHuellasWS();
// });
//
// $(document).on("click", "#btnIniciarEnrollment", function () {
//     $(this).prop('disabled', true);
//     //$("#btnCancelarLector").prop('disabled', false);
//     ControlAccesos.startEnrolment();
// });
//
// /*$(document).on("click", "#btnCancelarLector", function () {
//     $(this).prop('disabled', true);
//     $('#theLoader').hide();
//     $("#btnIniciarEnrollment").prop('disabled', false);
//     cancelFlag = true;
//     $.ajax({
//         url: "http://localhost",
//         data: {ws: "cancelEnrollment"},
//         type: "GET",
//         dataType: "json",
//         success: function (data) {
//             showSimpleNoty("Registro cancelado", "center", "success", 3000);
//         },
//         error: function () {
//             showSimpleNoty("Registro cancelado", "center", "warning", 0);
//         }
//     }); // Fin petición AJAX
//     $.xhrPool.abortAll();
// });
// */
//
// $(document).on("click", "#btnGuardarHuella", function () {
//     var descripcion = $("#descripcionHuella").val();
//     var fmd = $("#fmdInput").val();
//     var idp = $("div.modal-header").attr("id-tipo");
//
//     if (fmd == '') {
//         showSimpleNoty("No existe una huella para guardar", "center", "warning", 0);
//     }
//     else {
//         if (descripcion == '') {
//             $('#desHuella').attr('class', 'form-group has-error col-md-9');
//             showSimpleNoty('No has ingresado la descripción de la huella', 'center', 'warning', 0);
//         }
//         else {
//             $('#desHuella').attr('class', 'form-group has-success col-md-9');
//             ControlAccesos.saveFingerPrint(idp, descripcion, fmd);
//         }
//     }
// });
//
//
//
