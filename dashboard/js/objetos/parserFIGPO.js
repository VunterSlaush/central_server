/**
 * Created by tianshi on 23/01/15.
 */
var toSendFIGPO = [];
var niveles =[];
var getPHP=[];
var nombre="";
var parserFIGPO = {
    startParse: function () {
        toSendFIGPO=[];
        getPHP=[];
        niveles=[];
        $(".modal-header").html(
            '<button type="button" class="close" data-dismiss="modal">×</button><h3 align="center"> Carga de FIGPO </h3>'
        );
        $(".modal-body").html(
            '<div id="mE1" class="form-group">' +
            '<label class="control-label" for="exampleInputFile" style="width:100%; text-align: center">Archivo para cargar (*)</label>' +
            '<input type="file" id="fileFIGPO" class="control-label" accept="text/csv,.csv" style="margin: 0 auto">' +
            '</div> '
            //'<hr><textarea id="resultFIGPO" readonly wrap="off" style="resize: none; overflow:auto; width: 561px; height: 221px"> </textarea>' +
        );
        $(".modal-footer").html(
            '<div align="center">' +
            //'<button type="button" id="btnProf" onClick=reply_click(this.id) class="btn btn-primary" data-dismiss="modal">Profesores</button><button type="button" id="btnAdmin" onClick=reply_click(this.id) class="btn btn-primary">Administrativos</button></div>'
            '<a class="btn btn-default" data-dismiss="modal" >Cancelar</a> ' +
            '<a id="btnSaveFIGPO" class="btn btn-primary" onClick=reply_click(this.id)> Cargar </a>'+
            '</div>'
        );
        $('#myModal').attr("class", "modal fade normal").modal('show');
    },
    cargarFIGPO: function () {
        $('#fileFIGPO').parse({
            config: {
                header: true,
                complete: function (results, file) {
                    var errorHeader = "";
                    var noHeaderMatch =  false;
                    var acceptedHeader = ["Periodo", "Nivel", "Dpt.", "Materia", "Titulo", "Fec. Inicio", "Fec. Final", "Crn", "NSS", "Nombre", "Metodo", "Sección", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
                    acceptedHeader.forEach(function (headerValor) {
                        if ($.inArray(headerValor, results['meta']['fields']) == -1){
                            noHeaderMatch = true;
                            errorHeader += headerValor+", ";
                        }
                    });
                    /* TODOS LOS HORARIOS PARA LA CARGA DE PROFESORES DEBEN DE TENER LAS SIGUIENTES CARACTERISTICAS
                       * La hora de inicio debe de ser menor a la hora de fin.
                       * Las horas deben ser capturadas en formato de 24 horas (HH:ii).
                       * No debe de existir un empalme de horarios para una misma persona.
                       * La columna de horario debe de contener tambien el salon.
                       * Solo se realizara la agrupacion de asignaciones siempre y cuando
                           sea misma materia, grupo y persona, ademas de que la direrencia entre los
                           horarios no debe de ser mayor a 30 min.
                     */
                    if (noHeaderMatch == false) {
                        results['data'].forEach(function (valor) {
                                if (valor['Metodo'] != "PRESENCIAL");
                                else {
                                     var seccion=String(valor['Sección']);
                                     var grp = seccion.charAt(0) + "" + seccion.charAt(1);
                                     var cmp = seccion.charAt(4);
                                    //Filtro para quitar los registros que en su SECCION.GRUPO sea igual a 97
                                    if (grp == "97");
                                    //Filtro para quitar los registros que en su SECCION.COMPONENTE sea igual a "K" o "F"
                                    else if (cmp == "K" || cmp == "F");
                                    else {
                                        var correo = "";
                                        if (valor.hasOwnProperty("CORREO")){
                                            correo = valor["CORREO"];
                                        }else{
                                            correo = "";
                                        }
                                        var temp = {
                                            "periodo": valor['Periodo'],//not null
                                            "nivel": valor['Nivel'], //not null && isalpha
                                            "departamento": valor['Dpt.'],//not null && isdigit
                                            "materia": valor['Materia'],//not null
                                            "titulo": valor['Titulo'],//not null
                                            "fechaInicio": valor['Fec. Inicio'],//not null
                                            "fechaFin": valor['Fec. Final'],//not null
                                            "crn": valor['Crn'],//not null && isdigit
                                            "grupo": valor['Sección'].charAt(0)+""+valor['Sección'].charAt(1),//not null && isdigit
                                            "componente": valor['Sección'].charAt(4),//not null && isalpha
                                            "nss": valor['NSS'],//not null && is digit
                                            "nombrePersona": valor['Nombre'],//not null
                                            "seccion" : valor['Sección'],
                                            "lunes": valor['Lunes'],
                                            "martes": valor['Martes'],
                                            "miercoles": valor['Miercoles'],
                                            "jueves": valor['Jueves'],
                                            "viernes": valor['Viernes'],
                                            "sabado": valor['Sabado'],
                                            "domingo": valor['Domingo'],
                                            "correo": correo,
                                            "Tipo_error": ""
                                        };
                                        //Validación de la estructura de FIGPO
                                        //validateStruct(temp);
                                        niveles.push(temp['nivel']);
                                        //console.log()
                                        toSendFIGPO.push(temp);
                                    }
                                }
                        });
                        niveles=niveles.filter(function (e, i, niveles) {
                            return niveles.lastIndexOf(e) === i;
                        });
                        modalNiveles(niveles);
                         //Construir tabla con registros del archivo csv
                        //costruirTabla();
                    } else {
                        showSimpleNoty("El archivo no cumple con los estandares para carga de Profesores, verificar los siguientes Headers en el archivo FIGPO: "+errorHeader, "center", "warning", 0);
                      $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Administraci&oacute;n de Asignaciones');
    	             $("#contenido").html(' ');
                     sitio.construirTabla("asignaciones");                       
                    }
                }
            },
            before: function (file, inputElem) {
                $('#btnSaveFIGPO').attr("disabled", true);
                console.log(file.type);
            },
            error: function (err, file, inputElem, reason) {
                $('#btnSaveFIGPO').attr("disabled", false);
                showSimpleNoty("Error al leer el archivo. Error: " + JSON.stringify(reason), "center", "error", 0);
                console.log(reason);
            },
            complete: function () {
                console.log("All files done!");
            }
        });
    },

    cargarAdmin: function () {
        $('#fileFIGPO').parse({
            config: {
                header: true,
                complete: function (results, file) {
                    var errorHeader="";
                    var noHeaderMatch = false;
                    var acceptedHeader = ["Clave", "Nombre", "Apellido Paterno", "Apellido Materno", "Area", "Espacio", "Fecha Inicio", "Fecha Fin", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo", "Turno"];
                    acceptedHeader.forEach(function (headerValor) {
                        if ($.inArray(headerValor, results['meta']['fields']) == -1){
                            noHeaderMatch = true;
                            errorHeader += headerValor+", ";
                        }
                    });
                    if (noHeaderMatch == false) {
                        var toSendFIGPO = []; //results.data;
                        var errorsFIGPO = []; //errors.data;
                        var rows=0;
                        console.log(results['data'].length-1);
                        results['data'].forEach(function (valor) {                  
                            if(rows < results['data'].length-1) {
                                var temp = {
                                    /* TODOS LOS HORARIOS PARA LA CARGA DE ADMINISTRATIVOS DEBEN DE TENER LAS SIGUIENTES CARACTERISTICAS
                                      * La hora de inicio debe de ser menor a la hora de fin.
                                      * Las horas deben ser capturadas en formato de 24 horas (HH:ii).
                                      * No debe de existir un empalme de horarios para una misma persona.
                                      * La fecha de inicio debe de ser menor a la fecha de termino.
                                     */
                                    "nss": valor['Clave'],//not null && isdigit
                                    "nombre": valor['Nombre'],//not null
                                    "apellidoP": valor['Apellido Paterno'],//not null
                                    "apellidoM": valor['Apellido Materno'],
                                    "detalle": valor['Area'],//not null
                                    "espacio": valor['Espacio'],//not null
                                    "fechaInicio": valor['Fecha Inicio'],//not null && format mm/dd/YY
                                    "fechaFin": valor['Fecha Fin'],//not null && format mm/dd/YY
                                    "lunes": valor['Lunes'],
                                    "martes": valor['Martes'],
                                    "miercoles": valor['Miercoles'],
                                    "jueves": valor['Jueves'],
                                    "viernes": valor['Viernes'],
                                    "sabado": valor['Sabado'],
                                    "domingo": valor['Domingo'],
                                    "periodo": valor['Turno'],//not null
                                    "tipo_error":""
                                };
                                var errors=0;
                                for (var key in temp) {
                                    if (temp[key]=="" && key!="lunes" && key!="martes" && key!="miercoles" && key!="jueves" && key!="viernes" && key!="sabado" && key!="domingo" && key!="apellidoM" && key!="tipo_error") {
                                       temp['tipo_error'] += "La columna "+ key +" no puede contener valores nulos, "; 
                                       errors += 1;
                                       continue;
                                     } else {
                                         if (key=="nss"){
                                            if (isNaN(temp[key])) {
                                               temp['tipo_error'] += "La columna "+ key + " solo debe contener datos numericos, ";
                                               errors += 1;
                                            }
                                         }
                                         if (key=="periodo") {
                                            if (temp[key]!="VESP" && temp[key]!="MAT") {
                                               temp['tipo_error'] += "La columna "+ key + " solo debe ser horario MAT y VESP, ";
                                               errors += 1;
                                            }
                                         }
                                     }
                                }
                                if (errors == 0) {
                                   toSendFIGPO.push(temp);
                                   rows++;
                                } else {
                                   errorsFIGPO.push(temp);
                                   rows++;
                                }
                            }
                        });
                        console.log("This file done:", file, results);
                        $.ajax({
                            url: "../web_services/csvHandlerWs.php",
                            data: {ws: "cargaAdmin", responsible: id_admin, data: JSON.stringify(toSendFIGPO), errors: JSON.stringify(errorsFIGPO)},
                            type: "POST",
                            dataType: "json",
                            success: function (data) {
                                if(data.s == 1) {
                                    //$("#resultFIGPO").val(JSON.stringify(data.d));
                                    $('#btnSaveFIGPO').attr("disabled", false);
                                    showSimpleNoty(data.m, "center", "success", 5000);
                                    for (var i=0; i<data.d.length; i++){
                                        $("#resultFIGPO").val($("#resultFIGPO").val()+JSON.stringify(data.d[i])+"\n");
                                    }
                                    $("#errors").text(data.d.length+" Errores encontrados");
                                    showSimpleNoty(data.m, "center", "warning", 0);
                                }
                            },
                            error: function (jqXHR, msgStatus, errorThrown) {
                                $('#btnSaveFIGPO').attr("disabled", false);
                                showSimpleNoty("Error al cargar Administrativos", "center", "error", 0);
                            }
                        }); // Fin petición AJAX
                    }
                    else {
                        $('#btnSaveFIGPO').attr("disabled", false);
                        showSimpleNoty("El archivo no cumple con los estandares para carga de Administrativos, verificar los siguientes Headers en el archivo FIGPO: "+errorHeader, "center", "warning", 0);
                    }
                }
            },
            before: function (file, inputElem) {
                $('#btnSaveFIGPO').attr("disabled", true);
                if (file.type != "text/csv") {
                    return {
                        action: "abort",
                        reason: "El archivo seleccionado no tiene extension .CSV"
                    }
                }
            },
            error: function (err, file, inputElem, reason) {
                $('#btnSaveFIGPO').attr("disabled", false);
                showSimpleNoty("Error al leer el archivo. Error: " + err, "center", "warning", 0);
            },
            complete: function () {
                console.log("All files done!");
            }
        });
    }

};

function reply_click(idButton) {
         if ($('#fileFIGPO').val().length) {
            nombre = $('#fileFIGPO').val().replace(/C:\\fakepath\\/i, '').split('.');
            if (nombre[1] != "csv") {
               showSimpleNoty("El archivo seleccionado no tiene extension CSV", "center", "warning", 2000);
            } else {
                if (idButton=="btnSaveFIGPO") {
                    $("#myModal").modal('hide');
                   $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Carga FIGPO Docentes');
    	           $("#contenido").html(' ');
                   showOptionNoty("¿Seguro que quieres cargar este archivo para Profesores?", "center", "warning", "", "parserFIGPO.cargarFIGPO()");
                }
                /*if (idButton=="btnAdmin") {
                   $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Carga FIGPO Administrativos');
    	           $("#contenido").html(' ');
                }*/
            }
         } else {
           showSimpleNoty("No has seleccionado un archivo", "center", "warning", 2000);
        }  
}

function deleteReg(id){
         var index=document.getElementById(id).getAttribute("index");
         toSendFIGPO.splice(index,1);
         showOptionNoty("¿Realmente desea eliminar este registro?", "center", "warning", "", "costruirTabla()");       
}

function deleteGroup(id){
    var index=document.getElementById(id).getAttribute("index");
    getPHP.splice(index,1);
    showOptionNoty("¿Realmente desea eliminar este registro?", "center", "warning", "", "tablaGroup(getPHP)");
}

function modalMod(id){
         var periodo=document.getElementById(id).getAttribute("periodo");
         var nivel= document.getElementById(id).getAttribute("nivel");
         var dpt= document.getElementById(id).getAttribute("depto");
         var materia= document.getElementById(id).getAttribute("materia");
         var titulo= document.getElementById(id).getAttribute("titulo");
         var fi=document.getElementById(id).getAttribute("fi");
         var ff=document.getElementById(id).getAttribute("ff");
         var crn= document.getElementById(id).getAttribute("crn");
         var nss= document.getElementById(id).getAttribute("nss");
         var persona= document.getElementById(id).getAttribute("persona");
         var sec= document.getElementById(id).getAttribute("seccion");
         var mail= document.getElementById(id).getAttribute("mail");
         var l= document.getElementById(id).getAttribute("lunes");
         var m= document.getElementById(id).getAttribute("martes");
         var mi= document.getElementById(id).getAttribute("miercoles");
         var j= document.getElementById(id).getAttribute("jueves");
         var v= document.getElementById(id).getAttribute("viernes");
         var s= document.getElementById(id).getAttribute("sabado");
         var d= document.getElementById(id).getAttribute("domingo");
         var indez= document.getElementById(id).getAttribute("index");

         $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3> Modificación registro FIGPO </h3>');
         $(".modal-body").html('<form class="form-inline" role="form">'+
         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m1"> ' + 
         '<label class="control-label" for="periodo">Periodo: </label>  ' +
         '<input class="form-control" id="periodo">'+
         '</div> '+
         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m2"> ' +
         '<label class="control-label" for="nivel">Nivel: </label>  ' +
         '<input class="form-control" id="nivel" width="20">'+
         '</div>'+
         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m3"> ' +
         '<label class="control-label" for="depto">Departamento: </label>  ' +
         '<input class="form-control" id="depto" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m4"> ' +
         '<label class="control-label" for="crn">CRN: </label>  ' +
         '<input class="form-control" id="crn" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m5"> ' +
         '<label class="control-label" for="materia">Materia: </label>  ' +
         '<input class="form-control" id="materia" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m6"> ' +
         '<label class="control-label" for="fi">Fecha de Inicio: </label>  ' +
         '<div class="input-group" id="datetimepicker1">  '+
         '<input class="form-control" id="fi">'+
         '<span class="input-group-addon">'+
         '<span class="glyphicon glyphicon-calendar"></span>'+
         '</span>'+
         '</div>'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m7"> ' +
         '<label class="control-label" for="ff">Fecha de fin: </label>  ' +
         '<div class="input-group" id="datetimepicker1">  '+
         '<input class="form-control" id="ff">'+
         '<span class="input-group-addon">'+
         '<span class="glyphicon glyphicon-calendar"></span>'+
         '</span>'+
         '</div>'+
         '</div>'+
         
         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m9"> ' +
         '<label class="control-label" for="tituloM">Titulo: </label>  ' +
         '<input class="form-control" id="tituloM" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m10"> ' +
         '<label class="control-label" for="seccion">Sección: </label>  ' +
         '<input class="form-control" id="seccion" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m11"> ' +
         '<label class="control-label" for="nss">NSS: </label>  ' +
         '<input class="form-control" id="nss" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m12">' +
         '<label class="control-label" for="Npersona">Docente: </label>  ' +
         '<input class="form-control" id="Npersona" width="20">'+
         '</div>'+

         '<div class="form-group" style= "margin-right: 20px; margin-bottom: 20px" id="m13"> ' +
         '<label class="control-label" for="mail">Correo: </label>  ' +
         '<input class="form-control" id="mail" width="20">'+
         '</div>'+
             '<input id="ind" value='+indez+' >'+

             '<div>'+
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
                '<div id="mE2" class="form-inline"> <input id="hfL" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfL">Fin</label> </div>' +
                 '<div id="mE3" class="form-inline"> <input id="sL" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sL">Salón</label> </div> </td> ' +

                '<td> <div id="mE4" class="form-inline"> <input id="hiM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiM">Inicio</label> </div> ' +
                '<div id="mE5" class="form-inline"> <input id="hfM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfM">Fin</label> </div>' +
                '<div id="mE6" class="form-inline"> <input id="sM" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sM">Salón</label> </div> </td> ' +

                '<td> <div id="mE7" class="form-inline"> <input id="hiMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiMi">Inicio</label> </div> ' +
                '<div id="mE8" class="form-inline"> <input id="hfMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfMi">Fin</label> </div>' +
                '<div id="mE9" class="form-inline"> <input id="sMi" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sMi">Salón</label> </div> </td> ' +

                '<td> <div id="mE10" class="form-inline"> <input id="hiJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiJ">Inicio</label> </div> ' +
                '<div id="mE11" class="form-inline"> <input id="hfJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfJ">Fin</label> </div>' +
                '<div id="mE12" class="form-inline"> <input id="sJ" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sJ">Salón</label> </div> </td> ' +

                '<td> <div id="mE13" class="form-inline"> <input id="hiV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiV">Inicio</label> </div> ' +
                '<div id="mE14" class="form-inline"> <input id="hfV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfV">Fin</label> </div>' +
                '<div id="mE15" class="form-inline"> <input id="sV" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sV">Salón</label> </div> </td> ' +

                '<td> <div id="mE16" class="form-inline"> <input id="hiS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiS">Inicio</label> </div> ' +
                '<div id="mE17" class="form-inline"> <input id="hfS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfS">Fin</label> </div>' +
                '<div id="mE18" class="form-inline"> <input id="sS" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sS">Salón</label> </div> </td> ' +

                '<td> <div id="mE19" class="form-inline"> <input id="hiD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiD">Inicio</label> </div> ' +
                '<div id="mE20" class="form-inline"> <input id="hfD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hf">Fin</label> </div>' +
                '<div id="mE21" class="form-inline"> <input id="sD" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sD">Salón</label> </div> </td> ' +
                '</tr> ' +
                '</table>' +
         '</div>'+
         '</div></form>');
         $("#periodo").val(periodo);
         $("#nivel").val(nivel);
         $("#depto").val(dpt);
         $("#crn").val(crn);
         $("#materia").val(materia);
         $("#fi").val(fi);
         $("#ff").val(ff);
         $("#tituloM").val(titulo);
         $("#seccion").val(sec);
         $("#nss").val(nss);
         $("#Npersona").val(persona);
         $("#mail").val(mail);
         $("#ind").hide();
         $('.timepicker').timepicker({
               showMeridian: false,
               minuteStep: 10,
               disableMousewheel: false
         }).on('keydown', function(e) {
              e = e || window.event;
              if (e.keyCode == 9) {
                $(this).timepicker('hideWidget');
                console.log("tab pressed");
              }
         }).prop('disabled', true);
         $(":checkbox").change(function () {
            if ($("#checkLunes").prop("checked")){
               $("#hiL").prop("disabled", false);
               $("#hfL").prop("disabled", false);
               $("#sL").prop("disabled", false);
            } else {
               $('#hiL').prop('disabled', true);
               $('#hfL').prop('disabled', true);
               $("#sL").prop("disabled", true);
            }
            if ($("#checkMartes").prop("checked")){
               $("#hiM").prop("disabled", false);
               $("#hfM").prop("disabled", false);
               $("#sM").prop("disabled", false);
            } else {
               $('#hiM').prop('disabled', true);
               $('#hfM').prop('disabled', true);
               $("#sM").prop("disabled", true);
            }
            if ($("#checkMiercoles").prop("checked")){
               $("#hiMi").prop("disabled", false);
               $("#hfMi").prop("disabled", false);
               $("#sMi").prop("disabled", false);
            } else {
               $('#hiMi').prop('disabled', true);
               $('#hfMi').prop('disabled', true);
               $("#sMi").prop("disabled", true);
            }
            if ($("#checkJueves").prop("checked")){
               $("#hiJ").prop("disabled", false);
               $("#hfJ").prop("disabled", false);
               $("#sJ").prop("disabled", false);
            } else {
               $('#hiJ').prop('disabled', true);
               $('#hfJ').prop('disabled', true);
               $("#sJ").prop("disabled", true);
            }
            if ($("#checkViernes").prop("checked")){
               $("#hiV").prop("disabled", false);
               $("#hfV").prop("disabled", false);
               $("#sV").prop("disabled", false);
            } else {
               $('#hiV').prop('disabled', true);
               $('#hfV').prop('disabled', true);
               $("#sV").prop("disabled", true);
            }
            if ($("#checkSabado").prop("checked")){
               $("#hiS").prop("disabled", false);
               $("#hfS").prop("disabled", false);
               $("#sS").prop("disabled", false);
            } else {
               $('#hiS').prop('disabled', true);
               $('#hfS').prop('disabled', true);
               $("#sS").prop("disabled", true);
            }
            if ($("#checkDomingo").prop("checked")){
               $("#hiD").prop("disabled", false);
               $("#hfD").prop("disabled", false);
               $("#sD").prop("disabled", false);
            } else {
               $('#hiD').prop('disabled', true);
               $('#hfD').prop('disabled', true);
               $("#sD").prop("disabled", true);
            }
         });

         if (l != "") {
            $("#checkLunes").prop("checked",true);
            var hL=l.split(" ");
            var hiL=hL[0];
            var hfL=hL[1];
            var sL=hL[2];
            $("#hiL").timepicker("setTime", hiL).prop("disabled", false);
            $("#hfL").timepicker("setTime", hfL).prop("disabled", false);
            $("#sL").val(sL).prop("disabled", false);
         }
         if (m != "") {
            $("#checkMartes").prop("checked","true");
            var hM=m.split(" ");
            var hiM=hM[0];
            var hfM=hM[1];
            var sM=hM[2];
            $("#hiM").timepicker("setTime", hiM).prop("disabled", false);
            $("#hfM").timepicker("setTime", hfM).prop("disabled", false);
            $("#sM").val(sM).prop("disabled", false);
         }
         if (mi != "") {
            $("#checkMiercoles").prop("checked","true");
            var hMi=mi.split(" ");
            var hiMi=hMi[0];
            var hfMi=hMi[1];
            var sMi=hMi[2];
            $("#hiMi").timepicker("setTime", hiMi).prop("disabled", false);
            $("#hfMi").timepicker("setTime", hfMi).prop("disabled", false);
            $("#sMi").val(sMi).prop("disabled", false);
         }
         if (j != "") {
            $("#checkJueves").prop("checked","true");
            var hJ=j.split(" ");
            var hiJ=hJ[0];
            var hfJ=hJ[1];
            var sJ=hJ[2];
            $("#hiJ").timepicker("setTime", hiJ).prop("disabled", false);
            $("#hfJ").timepicker("setTime", hfJ).prop("disabled", false);
            $("#sJ").val(sJ).prop("disabled", false);
         } 
         if (v != "") {
            $("#checkViernes").prop("checked","true");
            var hV=v.split(" ");
            var hiV=hV[0];
            var hfV=hV[1];
            var sV=hV[2];
            $("#hiV").timepicker("setTime", hiV).prop("disabled", false);
            $("#hfV").timepicker("setTime", hfV).prop("disabled", false);
            $("#sV").val(sV).prop("disabled", false);
         }
         if (s != "") {
            $("#checkSabado").prop("checked","true");
            var hS=s.split(" ");
            var hiS=hS[0];
            var hfS=hS[1];
            var sS=hS[2];
            $("#hiS").timepicker("setTime", hiS).prop("disabled", false);
            $("#hfS").timepicker("setTime", hfS).prop("disabled", false);
            $("#sS").val(sS).prop("disabled", false);
         }
         if (d != "") {
            $("#checkDomingo").prop("checked","true");
            var hD=d.split(" ");
            var hiD=hD[0];
            var hfD=hD[1];
            var sD=hD[2];
            $("#hiD").timepicker("setTime", hiD).prop("disabled", false);
            $("#hfD").timepicker("setTime", hfD).prop("disabled", false);
            $("#sD").val(sD).prop("disabled", false);
         }
         $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ' +
         '<a href="#" class="btn btn-primary" id="btnSaveFIGPO" onClick="saveReg()"> Guardar </a>');
         $('#myModal').attr("class", "modal fade modal-wide").modal('show');
}

function saveReg(){
    var empty=0;
    var date_error=false;
    var time_error=0;
    var Lunes="";
    var Martes="";
    var Miercoles="";
    var Jueves="";
    var Viernes="";
    var Sabado="";
    var Domingo="";
    if ($("#periodo").val()==""){
        $("#m1").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#nivel").val()=="") {
        $("#m2").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#depto").val()=="") {
        $("#m3").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#crn").val()=="") {
        $("#m4").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#materia").val()=="") {
        $("#m5").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#fi").val()=="") {
        $("#m6").attr('class', 'form-group has-error');
        empty++;
    } else {
        if (validarFechas($("#fi").val())=="Formato de Fecha incorrecta"){
            date_error=true;
            $("#m6").attr('class', 'form-group has-error');
        } else{
            var fi=new Date($("#fi").val());
        }
    }
    if ($("#ff").val()=="") {
        $("#m7").attr('class', 'form-group has-error');
        empty++;
    } else {
        if (validarFechas($("#ff").val())=="Formato de Fecha incorrecta"){
            date_error=true;
            $("#m7").attr('class', 'form-group has-error');
        } else{
            var ff=new Date($("#ff").val());
        }
    }
    if ($("#tituloM").val()=="") {
        $("#m9").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#seccion").val()=="") {
        $("#m10").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#nss").val()=="") {
        $("#m11").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#Npersona").val()=="") {
        $("#m12").attr('class', 'form-group has-error');
        empty++;
    }
    if ($("#checkLunes").is(':checked')){
        if($('#hiL').val()=="" || $('#hfL').val()=="" || $("#sL").val()==""){
            $("#mE1").attr('class', 'form-group has-error');
            $("#mE2").attr('class', 'form-group has-error');
            $("#mE3").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Lunes= $('#hiL').val()+" "+$('#hfL').val()+" "+$('#sL').val();
            if(valTime(Lunes)=="");
            else {
                time_error++;
                $("#mE1").attr('class', 'form-group has-error');
                $("#mE2").attr('class', 'form-group has-error');
                //showSimpleNoty('Lunes: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkMartes").is(":checked")){
        if($('#hiM').val()=="" || $('#hfM').val()=="" || $("#sM").val()==""){
            $("#mE4").attr('class', 'form-group has-error');
            $("#mE5").attr('class', 'form-group has-error');
            $("#mE6").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Martes= $('#hiM').val()+" "+$('#hfM').val()+" "+$('#sM').val();
            if(valTime(Martes)=="");
            else {
                time_error++;
                $("#mE4").attr('class', 'form-group has-error');
                $("#mE5").attr('class', 'form-group has-error');
                //showSimpleNoty('Martes: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkMiercoles").is(":checked")){
        if($('#hiMi').val()=="" || $('#hfMi').val()=="" || $("#sMi").val()==""){
            $("#mE7").attr('class', 'form-group has-error');
            $("#mE8").attr('class', 'form-group has-error');
            $("#mE9").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Miercoles= $('#hiMi').val()+" "+$('#hfMi').val()+" "+$('#sMi').val();
            if(valTime(Miercoles)=="");
            else {
                time_error++;
                $("#mE7").attr('class', 'form-group has-error');
                $("#mE8").attr('class', 'form-group has-error');
                //showSimpleNoty('Miercoles: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkJueves").is(":checked")){
        if($('#hiJ').val()=="" || $('#hfJ').val()=="" || $("#sJ").val()==""){
            $("#mE10").attr('class', 'form-group has-error');
            $("#mE11").attr('class', 'form-group has-error');
            $("#mE12").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Jueves= $('#hiJ').val()+" "+$('#hfJ').val()+" "+$('#sJ').val();
            if(valTime(Jueves)=="");
            else {
                time_error++;
                $("#mE10").attr('class', 'form-group has-error');
                $("#mE11").attr('class', 'form-group has-error');
                //showSimpleNoty('Jueves: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkViernes").is(":checked")){
        if($('#hiV').val()=="" || $('#hfV').val()=="" || $("#sV").val()==""){
            $("#mE13").attr('class', 'form-group has-error');
            $("#mE14").attr('class', 'form-group has-error');
            $("#mE15").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Viernes= $('#hiV').val()+" "+$('#hfV').val()+" "+$('#sV').val();
            if(valTime(Viernes)=="");
            else {
                time_error++;
                $("#mE13").attr('class', 'form-group has-error');
                $("#mE14").attr('class', 'form-group has-error');
                //showSimpleNoty('Viernes: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkSabado").is(":checked")){
        if($('#hiS').val()=="" || $('#hfS').val()=="" || $("#sS").val()==""){
            $("#mE16").attr('class', 'form-group has-error');
            $("#mE17").attr('class', 'form-group has-error');
            $("#mE18").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Sabado = $('#hiS').val()+" "+$('#hfS').val()+" "+$('#sS').val();
            if(valTime(Sabado)=="");
            else {
                time_error++;
                $("#mE16").attr('class', 'form-group has-error');
                $("#mE17").attr('class', 'form-group has-error');
                //showSimpleNoty('Sabado: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if ($("#checkDomingo").is(":checked")){
        if($('#hiD').val()=="" || $('#hfD').val()=="" || $("#sD").val()==""){
            $("#mE19").attr('class', 'form-group has-error');
            $("#mE20").attr('class', 'form-group has-error');
            $("#mE21").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Domingo= $('#hiD').val()+" "+$('#hfD').val()+" "+$('#sD').val();
            if(valTime(Domingo)=="");
            else {
                time_error++;
                $("#mE19").attr('class', 'form-group has-error');
                $("#mE20").attr('class', 'form-group has-error');
                //showSimpleNoty('Domingo: La hora de inicio es mayor o igual a la hora de fin', 'center', 'warning', 0);
            }
        }
    }
    if (empty!=0) {
        showSimpleNoty('Existen campos vacíos', 'center', 'warning', 0);
    } else {
        if (time_error!=0){
            showSimpleNoty('Error en la captura de horario', 'center', 'warning', 0);
        } else{
            if (date_error){
                showSimpleNoty('Formato de Fecha Incorrecto', 'center', 'warning', 0);
            } else {
                if(fi>=ff){
                    $("#m6").attr('class', 'form-group has-error');
                    $("#m7").attr('class', 'form-group has-error');
                    showSimpleNoty('La fecha de Inicio es mayor o igual a la fecha de Fin','center', 'warning', 0);
                }else {
                    var x = $("#ind").val();
                    toSendFIGPO[x]["periodo"] = $("#periodo").val();
                    toSendFIGPO[x]["nivel"] = $("#nivel").val();
                    toSendFIGPO[x]["departamento"] = $("#depto").val();
                    toSendFIGPO[x]["crn"] = $("#crn").val();
                    toSendFIGPO[x]["materia"] = $("#materia").val();
                    toSendFIGPO[x]["fechaInicio"] = $("#fi").val();
                    toSendFIGPO[x]["fechaFin"] = $("#ff").val();
                    toSendFIGPO[x]["titulo"] = $("#tituloM").val();
                    toSendFIGPO[x]["seccion"] = $("#seccion").val();
                    toSendFIGPO[x]["grupo"] = $("#seccion").val().charAt(0) + "" + $("#seccion").val().charAt(1);
                    toSendFIGPO[x]["componente"] = $("#seccion").val().charAt(4)
                    toSendFIGPO[x]["nss"] = $("#nss").val();
                    toSendFIGPO[x]["nombrePersona"] = $("#Npersona").val();
                    toSendFIGPO[x]["correo"] = $("#mail").val();
                    toSendFIGPO[x]["lunes"] = Lunes;
                    toSendFIGPO[x]["martes"] = Martes;
                    toSendFIGPO[x]["miercoles"] = Miercoles;
                    toSendFIGPO[x]["jueves"] = Jueves;
                    toSendFIGPO[x]["viernes"] = Viernes;
                    toSendFIGPO[x]["sabado"] = Sabado;
                    toSendFIGPO[x]["domingo"] = Domingo;
                    toSendFIGPO.forEach(function (value) {
                        validateStruct(value);
                    });
                    showSimpleNoty("Registro modificado con éxito", "center", "success", 5000);
                    costruirTabla();
                    $('#myModal').modal('hide');
                }
            }
        }
    }
}

function saveGroup(){
    var Lunes="";
    var Martes="";
    var Miercoles="";
    var Jueves="";
    var Viernes="";
    var Sabado="";
    var Domingo="";
    var time_error=0;
    if ($("#checkLunes").is(':checked')){
        if($('#hiL').val()=="" || $('#hfL').val()==""){
            $("#mE1").attr('class', 'form-group has-error');
            $("#mE2").attr('class', 'form-group has-error');
            $("#mE3").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Lunes= $('#hiL').val()+" "+$('#hfL').val()+" "+$('#sL').val();
            if(valTime(Lunes)=="");
            else {
                time_error++;
                $("#mE1").attr('class', 'form-group has-error');
                $("#mE2").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkMartes").is(":checked")){
        if($('#hiM').val()=="" || $('#hfM').val()==""){
            $("#mE4").attr('class', 'form-group has-error');
            $("#mE5").attr('class', 'form-group has-error');
            $("#mE6").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Martes= $('#hiM').val()+" "+$('#hfM').val()+" "+$('#sM').val();
            if(valTime(Martes)=="");
            else {
                time_error++;
                $("#mE4").attr('class', 'form-group has-error');
                $("#mE5").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkMiercoles").is(":checked")){
        if($('#hiMi').val()=="" || $('#hfMi').val()=="" || $("#sMi").val()==""){
            $("#mE7").attr('class', 'form-group has-error');
            $("#mE8").attr('class', 'form-group has-error');
            $("#mE9").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Miercoles= $('#hiMi').val()+" "+$('#hfMi').val()+" "+$('#sMi').val();
            if(valTime(Miercoles)=="");
            else {
                time_error++;
                $("#mE7").attr('class', 'form-group has-error');
                $("#mE8").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkJueves").is(":checked")){
        if($('#hiJ').val()=="" || $('#hfJ').val()=="" || $("#sJ").val()==""){
            $("#mE10").attr('class', 'form-group has-error');
            $("#mE11").attr('class', 'form-group has-error');
            $("#mE12").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Jueves= $('#hiJ').val()+" "+$('#hfJ').val()+" "+$('#sJ').val();
            if(valTime(Jueves)=="");
            else {
                time_error++;
                $("#mE10").attr('class', 'form-group has-error');
                $("#mE11").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkViernes").is(":checked")){
        if($('#hiV').val()=="" || $('#hfV').val()=="" || $("#sV").val()==""){
            $("#mE13").attr('class', 'form-group has-error');
            $("#mE14").attr('class', 'form-group has-error');
            $("#mE15").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Viernes= $('#hiV').val()+" "+$('#hfV').val()+" "+$('#sV').val();
            if(valTime(Viernes)=="");
            else {
                time_error++;
                $("#mE13").attr('class', 'form-group has-error');
                $("#mE14").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkSabado").is(":checked")){
        if($('#hiS').val()=="" || $('#hfS').val()=="" || $("#sS").val()==""){
            $("#mE16").attr('class', 'form-group has-error');
            $("#mE17").attr('class', 'form-group has-error');
            $("#mE18").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Sabado = $('#hiS').val()+" "+$('#hfS').val()+" "+$('#sS').val();
            if(valTime(Sabado)=="");
            else {
                time_error++;
                $("#mE16").attr('class', 'form-group has-error');
                $("#mE17").attr('class', 'form-group has-error');
            }
        }
    }
    if ($("#checkDomingo").is(":checked")){
        if($('#hiD').val()=="" || $('#hfD').val()=="" || $("#sD").val()==""){
            $("#mE19").attr('class', 'form-group has-error');
            $("#mE20").attr('class', 'form-group has-error');
            $("#mE21").attr('class', 'form-group has-error');
            time_error++;
        } else {
            Domingo= $('#hiD').val()+" "+$('#hfD').val()+" "+$('#sD').val();
            if(valTime(Domingo)=="");
            else {
                time_error++;
                $("#mE19").attr('class', 'form-group has-error');
                $("#mE20").attr('class', 'form-group has-error');
            }
        }
    }
    if (time_error!=0) {
        showSimpleNoty('Error en la captura de horario', 'center', 'warning', 0);
    } else {
        var x = $("#ind").val();
        getPHP[x]["lunes"]["hi"] = $('#hiL').val();
        getPHP[x]["lunes"]["hf"] = $('#hfL').val();
        getPHP[x]["lunes"]["salon"] = $('#sL').val();

        getPHP[x]["martes"]["hi"] = $('#hiM').val();
        getPHP[x]["martes"]["hf"] = $('#hfM').val();
        getPHP[x]["martes"]["salon"] = $('#sM').val();

        getPHP[x]["miercoles"]["hi"] = $('#hiMi').val();
        getPHP[x]["miercoles"]["hf"] = $('#hfMi').val();
        getPHP[x]["miercoles"]["salon"] = $('#sMi').val();

        getPHP[x]["jueves"]["hi"] = $('#hiJ').val();
        getPHP[x]["jueves"]["hf"] = $('#hfJ').val();
        getPHP[x]["jueves"]["salon"] = $('#sJ').val();

        getPHP[x]["viernes"]["hi"] = $('#hiV').val();
        getPHP[x]["viernes"]["hf"] = $('#hfV').val();
        getPHP[x]["viernes"]["salon"] = $('#sV').val();

        getPHP[x]["sabado"]["hi"] = $('#hiS').val();
        getPHP[x]["sabado"]["hf"] = $('#hfS').val();
        getPHP[x]["sabado"]["salon"] = $('#sS').val();

        getPHP[x]["domingo"]["hi"] = $('#hiD').val();
        getPHP[x]["domingo"]["hf"] = $('#hfD').val();
        getPHP[x]["domingo"]["salon"] = $('#sD').val();
        getPHP.forEach(function (value) {
            value["Tipo_error"]="";
        });
        $.ajax({
            url: "../web_services/csvHandlerWs.php",
            data: {ws: "Agrupacion", responsible: id_admin, data: JSON.stringify(getPHP), tipo: JSON.stringify(1)},
            type: "POST",
            dataType: "json",
            success: function (data) {
                tablaGroup(data.d)
                showSimpleNoty("Registro modificado con éxito", "center", "success", 5000);
                $('#myModal').modal('hide');
            },
            error: function (jqXHR, msgStatus, errorThrown) {
                showSimpleNoty("Error al cargar FIGPO", "center", "error", 0);
            }
        }); // Fin petición AJAX

    }
}

function costruirTabla(){
         $("#contenido").html(' ');
         $("#btnAgregar").attr('tipo', 'asignacion').hide();
         $("#btnFigpo").hide();
         var lblName= document.createElement('label');
         lblName.setAttribute("class", "control-label");
         var nameFile = document.createTextNode("Nombre del Archivo: ");
         var noRegistros = document.createTextNode("Total de registros: ");
         var registros_error = document.createTextNode("Registros con error: ");
         var textName= document.createTextNode(nombre);
         lblName.appendChild(textName);
         var btnCancelar=document.createElement('button');
         btnCancelar.setAttribute("class","btn btn-default");
         btnCancelar.setAttribute("id","btnCancelar");
         btnCancelar.appendChild(document.createTextNode("Cancelar"));
                        
         var btnSiguiente=document.createElement('button');
         btnSiguiente.setAttribute("class","btn btn-primary");
         btnSiguiente.setAttribute("id", "btnSig");
         btnSiguiente.appendChild(document.createTextNode("Siguiente"));

         var divButton = document.createElement('div');
         divButton.setAttribute("align", "center");
         divButton.appendChild(btnCancelar);
         divButton.appendChild(document.createTextNode("       "));
         divButton.appendChild(btnSiguiente); 

         var tabla = document.createElement('table');
         tabla.setAttribute('id', 'tabla-figpo');
         tabla.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
         var tHead = document.createElement('thead');
         var tr = document.createElement('tr');
         var th0 = document.createElement('th');
         th0.innerHTML = "Periodo";
         tr.appendChild(th0);
         var th1_1 = document.createElement('th');
         th1_1.innerHTML = "Nivel";
         tr.appendChild(th1_1);
         var th1 = document.createElement('th');
         th1.innerHTML = "Dpt.";
         tr.appendChild(th1);
         var th2 = document.createElement('th');
         th2.innerHTML = "Materia";
         tr.appendChild(th2);
         var th3 = document.createElement('th');
         th3.innerHTML = "Titulo";
         tr.appendChild(th3);
         var th4 = document.createElement('th');
         th4.innerHTML = "Fec. Inicio";
         tr.appendChild(th4);
         var th5 = document.createElement('th');
         th5.innerHTML = "Fec. Fin";
         tr.appendChild(th5);
         var th6 = document.createElement('th');
         th6.innerHTML = "CRN";
         tr.appendChild(th6);
         var th7 = document.createElement('th');
         th7.innerHTML = "NSS";
         tr.appendChild(th7);
         var th8 = document.createElement('th');
         th8.innerHTML = "Persona";
         tr.appendChild(th8);
         var th9 = document.createElement('th');
         th9.innerHTML = "Sección";
         tr.appendChild(th9);
         var th10 = document.createElement('th');
         th10.innerHTML = "Status";
         tr.appendChild(th10);
         var th11 = document.createElement('th');
         th11.innerHTML = "Acciones";
         tr.appendChild(th11);
         tHead.appendChild(tr);
         //aqui se construye cada uno de los elementos
         var tBody = document.createElement('tbody');
         var td = [];
         var td0 = [];
         var td1 = [];
         var td2 = [];
         var td3 = [];
         var td4 = [];
         var td5 = [];
         var td6 = [];
         var td7 = [];
         var td8 = [];
         var td9 = [];
         var td10 = [];
         var td11 = [];
         var td12 = [];
         var tr2 = [];
         var er=0;
         for (var i = 0; i < toSendFIGPO.length; i++) {
             var rep=false;
             for (var j=0; j<toSendFIGPO.length; j++) {
                 if (i==j ||  toSendFIGPO[i]['Tipo_error'].search("CRN repetido")!= -1);
                     else {
                         if (toSendFIGPO[i]['crn'] == toSendFIGPO[j]['crn']) {
                             rep=true;
                             toSendFIGPO[j]['Tipo_error']+="CRN repetido, ";
                         }
                     }
             }
             if (rep) {
                 toSendFIGPO[i]['Tipo_error']+="CRN repetido, ";
             }
             if (toSendFIGPO[i]["Tipo_error"]==""){
                 toSendFIGPO[i]["Tipo_error"]+="OK";
             }
             if (toSendFIGPO[i]["Tipo_error"] != "OK") {
                 er ++;
             }
             tr2[i] = document.createElement('tr');

             td0[i] = document.createElement('td');
             td0[i].innerHTML = toSendFIGPO[i]["periodo"];
             tr2[i].appendChild(td0[i]);

             td1[i] = document.createElement('td');
             td1[i].innerHTML = toSendFIGPO[i]["nivel"];
             tr2[i].appendChild(td1[i]);

             td2[i] = document.createElement('td');
             td2[i].innerHTML = toSendFIGPO[i]["departamento"];
             tr2[i].appendChild(td2[i]);

             td3[i] = document.createElement('td');
             td3[i].innerHTML = toSendFIGPO[i]["materia"];
             tr2[i].appendChild(td3[i]);

             td4[i] = document.createElement('td');
             td4[i].innerHTML = toSendFIGPO[i]["titulo"];
             tr2[i].appendChild(td4[i]);

             td5[i] = document.createElement('td');
             td5[i].innerHTML = toSendFIGPO[i]["fechaInicio"];
             tr2[i].appendChild(td5[i]);

             td6[i] = document.createElement('td');
             td6[i].innerHTML = toSendFIGPO[i]["fechaFin"];
             tr2[i].appendChild(td6[i]);

             td7[i] = document.createElement('td');
             td7[i].innerHTML = toSendFIGPO[i]["crn"];
             tr2[i].appendChild(td7[i]);

             td8[i] = document.createElement('td');
             td8[i].innerHTML = toSendFIGPO[i]["nss"];
             tr2[i].appendChild(td8[i]);

             td9[i] = document.createElement('td');
             td9[i].innerHTML = toSendFIGPO[i]["nombrePersona"];
             tr2[i].appendChild(td9[i]);

             td10[i] = document.createElement('td');
             td10[i].innerHTML = toSendFIGPO[i]["seccion"];
             tr2[i].appendChild(td10[i]);

             td11[i] = document.createElement('td');
             td11[i].innerHTML = toSendFIGPO[i]["Tipo_error"];
             tr2[i].appendChild(td11[i]);

             td12[i] = document.createElement('td');
             td12[i].setAttribute('class', 'center');
             td12[i].innerHTML = '<a class="btn btn-info btn-setting btn-sm" id=btnModFIGPO'+i+' href="#" index="'+i+'" periodo="'+toSendFIGPO[i]["periodo"]+'" nivel="'+toSendFIGPO[i]["nivel"]+'" depto="'+toSendFIGPO[i]["departamento"]+'" materia="'+toSendFIGPO[i]["materia"]+'" titulo="'+toSendFIGPO[i]["titulo"]+'" fi="'+toSendFIGPO[i]["fechaInicio"]+'" ff="'+toSendFIGPO[i]["fechaFin"]+'" crn="'+toSendFIGPO[i]["crn"]+'" nss="'+toSendFIGPO[i]["nss"]+'" persona="'+toSendFIGPO[i]["nombrePersona"]+'" seccion="'+toSendFIGPO[i]["seccion"]+'" lunes="'+toSendFIGPO[i]["lunes"]+'" martes="'+toSendFIGPO[i]["martes"]+'" miercoles="'+toSendFIGPO[i]["miercoles"]+'" jueves="'+toSendFIGPO[i]["jueves"]+'" viernes="'+toSendFIGPO[i]["viernes"]+'" sabado="'+toSendFIGPO[i]["sabado"]+'" domingo="'+toSendFIGPO[i]["domingo"]+'" mail="'+toSendFIGPO[i]["correo"]+'" onClick="modalMod(this.id)"> <i class="glyphicon glyphicon-edit icon-white"></i>	Editar	</a> ' +
                            '<a class="btn btn-danger btn-sm" id=btnEliminar'+i+' href="#" index="'+i+'" onClick=deleteReg(this.id)><i class="glyphicon glyphicon-trash icon-white"></i>	Borrar	</a>'
             tr2[i].appendChild(td12[i]);

             tBody.appendChild(tr2[i]);
         }
         tabla.appendChild(tHead);
         tabla.appendChild(tBody);
         document.getElementById('contenido').appendChild(nameFile);
         document.getElementById('contenido').appendChild(lblName);
         document.getElementById('contenido').appendChild(document.createElement ('br'));
         document.getElementById('contenido').appendChild(noRegistros);
         document.getElementById('contenido').appendChild(document.createTextNode(toSendFIGPO.length));
         document.getElementById('contenido').appendChild(document.createElement ('br'));
         document.getElementById('contenido').appendChild(registros_error);
         document.getElementById('contenido').appendChild(document.createTextNode(er));
         document.getElementById('contenido').appendChild(tabla);
    $('#tabla-figpo').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": "Registros por página: _MENU_ ",
            "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
            "sZeroRecords": "No se encontró ningún registro",
            "sInfoEmpty": "No existen registros",
            "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
            "sSearch": "Búsqueda: ",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            }
        }
    });
         document.getElementById('contenido').appendChild(divButton);
         document.getElementById('btnCancelar').onclick= function(){
                $("#btnAgregar").hide();
                $("#btnFigpo").hide();
                $("#titulo").html('<i class="glyphicon glyphicon-info-sign"></i> Index ');
                $("#contenido").html('<div style="text-align: center"><img src="img/logofinal.png" width="847px" height="622px"></div>');
         }
         document.getElementById('btnSig').onclick=function(){
                  if (er==0){
                     $.ajax({
                            url: "../web_services/csvHandlerWs.php",
                            data: {ws: "cargaAsignaciones", responsible: id_admin, data: JSON.stringify(toSendFIGPO)},
                            type: "POST",
                            dataType: "json",
                            success: function (data) {
                                tablaGroup(data.d)
                                console.log(data.d);
                                //if(data.s == 1)
                            },
                            error: function (jqXHR, msgStatus, errorThrown) {
                                showSimpleNoty("Error al cargar FIGPO", "center", "error", 0);
                            }
                        }); // Fin petición AJAX
                  } else {
                     showSimpleNoty("El archivo FIGPO aun contiene errores", "center", "warning", 3000);
                  }
         }
}

function tablaGroup(getAsig){
    getPHP=getAsig;
    var gpos = document.createTextNode("Grupos: ");
    var noRegistros = document.createTextNode("Total de Asignaciones: ");
    var gposError = document.createTextNode("Registros con error: ");
    $("#btnAgregar").attr('tipo', 'asignacion').hide();
    $("#btnFigpo").hide();
    $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Agrupación de asignaciones');
    $("#contenido").html(' ');

    var btnCargaDB=document.createElement('button');
    btnCargaDB.setAttribute("class","btn btn-primary");
    btnCargaDB.setAttribute("id", "btnCDB");
    btnCargaDB.appendChild(document.createTextNode("Cargar Asignaciones"));

    var divButton = document.createElement('div');
    divButton.setAttribute("align", "center");
    divButton.appendChild(document.createTextNode("       "));
    divButton.appendChild(btnCargaDB);

    var tablaGroup = document.createElement('table');
    tablaGroup.setAttribute('id', 'tabla-groupAsignaciones');
    tablaGroup.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
    var tHead = document.createElement('thead');
    var tr = document.createElement('tr');

    var th1 = document.createElement('th');
    th1.innerHTML = "Materia";
    tr.appendChild(th1);
    var th2 = document.createElement('th');
    th2.innerHTML = "Titulo";
    tr.appendChild(th2);
    var th3 = document.createElement('th');
    th3.innerHTML = "Fec. Inicio";
    tr.appendChild(th3);
    var th4 = document.createElement('th');
    th4.innerHTML = "Fec. Fin";
    tr.appendChild(th4);
    var th5 = document.createElement('th');
    th5.innerHTML = "CRN";
    tr.appendChild(th5);
    var th6 = document.createElement('th');
    th6.innerHTML = "Docente";
    tr.appendChild(th6);
    var th7 = document.createElement('th');
    th7.innerHTML = "Status";
    tr.appendChild(th7);
    var th8 = document.createElement('th');
    th8.innerHTML = "Acciones";
    tr.appendChild(th8);
    tHead.appendChild(tr);

    //aqui se construye cada uno de los elementos
    var tBody = document.createElement('tbody');
    var td = [];
    var td01 = [];
    var td02 = [];
    var td03 = [];
    var td04 = [];
    var td05 = [];
    var td06 = [];
    var td07 = [];
    var td08 = [];
    var tr02 = [];
    var er=0;
    for (var i = 0; i < getPHP.length; i++) {
        if (getPHP[i]["Tipo_error"]==""){
            getPHP[i]["Tipo_error"]="OK";
        } else {
            er++;
        }

        tr02[i] = document.createElement('tr');

        td01[i] = document.createElement('td');
        td01[i].innerHTML = getPHP[i]["materia"];
        tr02[i].appendChild(td01[i]);

        td02[i] = document.createElement('td');
        td02[i].innerHTML = getPHP[i]["titulo"];
        tr02[i].appendChild(td02[i]);

        td03[i] = document.createElement('td');
        td03[i].innerHTML = getPHP[i]["fechaInicio"];
        tr02[i].appendChild(td03[i]);

        td04[i] = document.createElement('td');
        td04[i].innerHTML = getPHP[i]["fechaFin"];
        tr02[i].appendChild(td04[i]);

        td05[i] = document.createElement('td');
        td05[i].innerHTML = getPHP[i]["crn"];
        tr02[i].appendChild(td05[i]);

        td06[i] = document.createElement('td');
        td06[i].innerHTML = getPHP[i]["nombrePersona"]+" "+getPHP[i]["nss"];
        tr02[i].appendChild(td06[i]);

        td07[i] = document.createElement('td');
        td07[i].innerHTML = getPHP[i]["Tipo_error"];
        tr02[i].appendChild(td07[i]);

        td08[i] = document.createElement('td');
        td08[i].setAttribute('class', 'center');
        td08[i].innerHTML = '<a class="btn btn-info btn-setting btn-sm" id=btnGroup'+i+' href="#" index="'+i+'" onClick="modalHorario(this.id)" hiL="'+getPHP[i]["lunes"]["hi"]+'" hiL="'+getPHP[i]["lunes"]["hi"]+'" hfL="'+getPHP[i]["lunes"]["hf"]+'" sL="'+getPHP[i]["lunes"]["salon"]+'"hiM="'+getPHP[i]["martes"]["hi"]+'" hfM="'+getPHP[i]["martes"]["hf"]+'" sM="'+getPHP[i]["martes"]["salon"]+'" hiMi="'+getPHP[i]["miercoles"]["hi"]+'" hfMi="'+getPHP[i]["miercoles"]["hf"]+'" sMi="'+getPHP[i]["miercoles"]["salon"]+'" hiJ="'+getPHP[i]["jueves"]["hi"]+'" hfJ="'+getPHP[i]["jueves"]["hf"]+'" sJ="'+getPHP[i]["jueves"]["salon"]+'" hiV="'+getPHP[i]["viernes"]["hi"]+'" hfV="'+getPHP[i]["viernes"]["hf"]+'" sV="'+getPHP[i]["viernes"]["salon"]+'" hiS="'+getPHP[i]["sabado"]["hi"]+'" hfS="'+getPHP[i]["sabado"]["hf"]+'" sS="'+getPHP[i]["sabado"]["salon"]+'" hiD="'+getPHP[i]["domingo"]["hi"]+'" hfD="'+getPHP[i]["domingo"]["hf"]+'" sD="'+getPHP[i]["domingo"]["salon"]+'"> <i class="glyphicon glyphicon-edit icon-white"></i>	Editar	</a> ' +
            '<a class="btn btn-danger btn-sm" id=btnDelete'+i+' href="#" index="'+i+'" onClick="deleteGroup(this.id)" ><i class="glyphicon glyphicon-trash icon-white"></i>	Borrar	</a>'
        tr02[i].appendChild(td08[i]);
        tBody.appendChild(tr02[i]);
    }
    tablaGroup.appendChild(tHead);
    tablaGroup.appendChild(tBody);
    document.getElementById('contenido').appendChild(gpos);
    document.getElementById('contenido').appendChild(document.createTextNode(getPHP.length));
    document.getElementById('contenido').appendChild(document.createElement ('br'));
    document.getElementById('contenido').appendChild(noRegistros);
    document.getElementById('contenido').appendChild(document.createTextNode(toSendFIGPO.length));
    document.getElementById('contenido').appendChild(document.createElement ('br'));
    document.getElementById('contenido').appendChild(gposError);
    document.getElementById('contenido').appendChild(document.createTextNode(er));
    document.getElementById('contenido').appendChild(tablaGroup);
    $('#tabla-groupAsignaciones').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": "Registros por página: _MENU_ ",
            "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
            "sZeroRecords": "No se encontró ningún registro",
            "sInfoEmpty": "No existen registros",
            "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
            "sSearch": "Búsqueda: ",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            }
        }
    });
    document.getElementById('contenido').appendChild(divButton);
    document.getElementById('btnCDB').onclick=function(){
        if (er==0){
            getPHP.forEach(function (value) {
                value["Tipo_error"]="";
            });
            $.ajax({
                url: "../web_services/csvHandlerWs.php",
                data: {ws: "DBdocentes", responsible: id_admin, data: JSON.stringify(getPHP)},
                type: "POST",
                dataType: "json",
                success: function (data) {
                    tablaAsig(data);
                    showSimpleNoty("Carga Correcta de Asignaciones", "center", "success", 0);
                },
                error: function (jqXHR, msgStatus, errorThrown) {
                    //$('#btnSaveFIGPO').attr("disabled", false);
                    showSimpleNoty("Error al cargar FIGPO", "center", "error", 0);
                }
            }); // Fin petición AJAX
        } else {
            showSimpleNoty("Aun hay errores en la agrupación de asignaciones", "center", "warning", 3000);
        }
    }
}

function tablaAsig(asig){
    var ok = document.createTextNode("Asignaciones registradas correctamente: ");
    var warning = document.createTextNode("Asignaciones ya registradas: ");
    var error = document.createTextNode("Asignaciones sin registrar: ");
    $("#btnAgregar").attr('tipo', 'asignacion').hide();
    $("#btnFigpo").hide();
    $("#titulo").html('<i class="glyphicon glyphicon-list-alt"></i> Agrupación de asignaciones');
    $("#contenido").html(' ');


    var tablaAsig = document.createElement('table');
    tablaAsig.setAttribute('id', 'tabla-Asignaciones');
    tablaAsig.setAttribute('class', 'table table-striped table-bordered bootstrap-datatable datatable responsive');
    var tHead = document.createElement('thead');
    var tr = document.createElement('tr');

    var th1 = document.createElement('th');
    th1.innerHTML = "CRN";
    tr.appendChild(th1);
    var th2 = document.createElement('th');
    th2.innerHTML = "Periodo";
    tr.appendChild(th2);
    var th3 = document.createElement('th');
    th3.innerHTML = "Materia";
    tr.appendChild(th3);
    var th4 = document.createElement('th');
    th4.innerHTML = "Persona";
    tr.appendChild(th4);
    var th5 = document.createElement('th');
    th5.innerHTML = "Fecha Inicio";
    tr.appendChild(th5);
    var th6 = document.createElement('th');
    th6.innerHTML = "Fecha Fin";
    tr.appendChild(th6);
    var th7 = document.createElement('th');
    th7.innerHTML = "Status";
    tr.appendChild(th7);
    tHead.appendChild(tr);

    //aqui se construye cada uno de los elementos
    var tBody = document.createElement('tbody');
    var td = [];
    var td01 = [];
    var td02 = [];
    var td03 = [];
    var td04 = [];
    var td05 = [];
    var td06 = [];
    var td07 = [];
    var tr02 = [];
    var er=0;
    var upload=0;
    var unregistred=0;
    var exis=0;
    for (var i = 0; i < asig.d.length; i++) {
        tr02[i] = document.createElement('tr');

        td01[i] = document.createElement('td');
        td01[i].innerHTML = asig.d[i]["crn"]
        tr02[i].appendChild(td01[i]);

        td02[i] = document.createElement('td');
        td02[i].innerHTML = asig.d[i]["periodo"];
        tr02[i].appendChild(td02[i]);

        td03[i] = document.createElement('td');
        td03[i].innerHTML = asig.d[i]["titulo"];
        tr02[i].appendChild(td03[i]);

        td04[i] = document.createElement('td');
        td04[i].innerHTML = asig.d[i]["nombrePersona"]+" ("+asig.d[i]["nss"]+")";
        tr02[i].appendChild(td04[i]);

        td05[i] = document.createElement('td');
        td05[i].innerHTML = asig.d[i]["fechaInicio"];
        tr02[i].appendChild(td05[i]);

        td06[i] = document.createElement('td');
        td06[i].innerHTML = asig.d[i]["fechaFin"];
        tr02[i].appendChild(td06[i]);

        td07[i] = document.createElement('td');
        console.log(asig);
        if(asig.t[i]["flag"]==true){
            console.log(asig.t[i]["asignacion"]);
            td07[i].innerHTML = "Ya existe asignación.";
            exis++;
        }else if (asig.t[i]["update"]==true){
	       td07[i].innerHTML = "Se actualizó esta asignación.</br>"+asig.t[i]["changes"];
           console.log(asig.t[i]["changes"]);
	    }else {
            if(asig.t[i]["noInsert"]!=0){
                td07[i].innerHTML = "Error al registrar asignación.";
                unregistred++;
            } else{
                td07[i].innerHTML = "Asignacion registrada con exito.";
                upload++;
            }
        }
        tr02[i].appendChild(td07[i]);
        tBody.appendChild(tr02[i]);
    }
    tablaAsig.appendChild(tHead);
    tablaAsig.appendChild(tBody);
    document.getElementById('contenido').appendChild(ok);
    document.getElementById('contenido').appendChild(document.createTextNode(upload));
    document.getElementById('contenido').appendChild(document.createElement ('br'));
    document.getElementById('contenido').appendChild(warning);
    document.getElementById('contenido').appendChild(document.createTextNode(exis));
    document.getElementById('contenido').appendChild(document.createElement ('br'));
    document.getElementById('contenido').appendChild(error);
    document.getElementById('contenido').appendChild(document.createTextNode(unregistred));
    document.getElementById('contenido').appendChild(tablaAsig);
    $('#tabla-Asignaciones').dataTable({
        "sDom": "<'row'<'col-md-6 text-left'l>r>t<'row'<'col-md-12'i><'col-md-12 center-block'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": "Registros por página: _MENU_ ",
            "sInfo": "Mostrando _START_ al _END_ de _TOTAL_ registros",
            "sZeroRecords": "No se encontró ningún registro",
            "sInfoEmpty": "No existen registros",
            "sInfoFiltered": "(Filtrado de _MAX_ total de registros)",
            "sSearch": "Búsqueda: ",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            }
        }
    });
}

function validarFechas(strDate){
         if (strDate.split("/").length !=3){
            return ("Formato de Fecha incorrecta");
         }else{
            var d = new Date(strDate);
            if (d=="Invalid Date"){
               return "Formato de Fecha incorrecta";
            } else {
               var date = d.toLocaleDateString("en-US");
               return date;
            }
         }
}

function valTime(strTime){
    var pattern= /^([0-9]|[0-1][0-9]|[2][0-3])[\:]([0-9]|[0-5][0-9])$/g;
    var tmpStr="";
    if (strTime.split(" ").length == 1){
        tmpStr+= "Falta fecha de fin y salon, ";
        if (!strTime.split(" ")[0].match(pattern))
            tmpStr += "Formato de hora de inicio invalido";
    }
    if (strTime.split(" ").length == 2){
        tmpStr += "Falta salon, ";
        if (!strTime.split(" ")[0].match(pattern)){
            tmpStr += "Formato de hora de inicio invalido, ";
        }
        if (!strTime.split(" ")[1].match(pattern)){
            tmpStr += "Formato de hora de fin invalido, ";
        }
    }
    if (strTime.split(" ").length == 3){
        if (!strTime.split(" ")[0].match(pattern)){
            tmpStr += "Formato de hora de inicio invalido, ";
        } else{
            var hi = new Date("12/12/1992 " + strTime.split(" ")[0]);
            if (!strTime.split(" ")[1].match(pattern)){
                tmpStr += "Formato de hora de fin invalido, ";
            } else {
                var hf = new Date("12/12/1992 " + strTime.split(" ")[1]);
                if (hi >= hf) {
                    tmpStr += "La hora de entrada es mayor o igual a la hora de salida, ";
                }
            }
        }
    }
    if (strTime.split(" ").length > 3){
        tmpStr+="Error en captura de horario, ";
    }
        return tmpStr;
}

function validateStruct(tmp){
    var errors=0;
    var ef=false;
    tmp['Tipo_error']="";
    for (var key in tmp) {
        if (key!="correo" && key!="Tipo_error") {
            if (key=="lunes" || key=="martes" || key=="miercoles" || key=="jueves" || key=="viernes" || key=="sabado" || key=="domingo"){
                if(tmp[key]=="");
                else {
                    if(valTime(tmp[key])==""){
                        tmp["Tipo_error"]+="";
                    } else {
                        tmp["Tipo_error"] += "" + key + ": (" + valTime(tmp[key])+")";
                    }
                }
            } else {
                if(tmp[key]==""){
                    tmp['Tipo_error'] += "La columna "+ key +" no puede contener valores nulos, ";
                    continue;
                } else {
                    if (key=="crn" || key=="nss" || key=="grupo" || key=="departamento"){
                        if (isNaN(tmp[key])) {
                            tmp['Tipo_error'] += "La columna "+ key + " debe de contener datos numericos, ";
                            errors += 1;
                        }
                    }
                    if (key=="componente") {
                        if (!isNaN(tmp[key])) {
                            tmp['Tipo_error'] += "La columna "+ key + " debe de ser una letra, ";
                            errors += 1;
                        }
                    }
                    if (key=="fechaInicio") {
                        if (validarFechas(tmp[key])=="Formato de Fecha incorrecta"){
                            ef=true;
                            tmp['Tipo_error'] += "Formato de Fecha de inicio incorrecta, ";
                        } else{
                            var fi= new Date (tmp[key]);
                        }
                    }
                    if (key=="fechaFin") {
                        if (validarFechas(tmp[key])=="Formato de Fecha incorrecta"){
                            ef=true;
                            tmp['Tipo_error'] += "Formato de Fecha de fin incorrecta, ";
                        } else {
                            var ff= new Date (tmp[key]);
                        }
                    }
                }
            }
        }
    }
    if(!ef){
        if(fi>=ff){
            tmp['Tipo_error']+= "La fecha de Inicio es mayor o igual a la fecha de Fin, "
        }
    }
}

function modalHorario(id){
    var hiL= document.getElementById(id).getAttribute("hil");
    var hfL= document.getElementById(id).getAttribute("hfl");
    var sL= document.getElementById(id).getAttribute("sl");
    var hiM= document.getElementById(id).getAttribute("him");
    var hfM= document.getElementById(id).getAttribute("hfm");
    var sM= document.getElementById(id).getAttribute("sm");
    var hiMi= document.getElementById(id).getAttribute("himi");
    var hfMi= document.getElementById(id).getAttribute("hfmi");
    var sMi= document.getElementById(id).getAttribute("smi");
    var hiJ= document.getElementById(id).getAttribute("hij");
    var hfJ= document.getElementById(id).getAttribute("hfj");
    var sJ= document.getElementById(id).getAttribute("sJ");
    var hiV= document.getElementById(id).getAttribute("hiv");
    var hfV= document.getElementById(id).getAttribute("hfv");
    var sV= document.getElementById(id).getAttribute("sv");
    var hiS= document.getElementById(id).getAttribute("his");
    var hfS= document.getElementById(id).getAttribute("hfs");
    var sS= document.getElementById(id).getAttribute("ss");
    var hiD= document.getElementById(id).getAttribute("hid");
    var hfD= document.getElementById(id).getAttribute("hfd");
    var sD= document.getElementById(id).getAttribute("sd");
    var indez= document.getElementById(id).getAttribute("index");

    $(".modal-header").html('<button type="button" class="close" data-dismiss="modal">×</button><h3> Modificación de horario </h3>');
    $(".modal-body").html('<form class="form-inline" role="form">'+

        '<input id="ind" value='+indez+' >'+

        '<div>'+
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
        '<div id="mE2" class="form-inline"> <input id="hfL" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfL">Fin</label> </div>' +
        '<div id="mE3" class="form-inline"> <input id="sL" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sL">Salón</label> </div> </td> ' +

        '<td> <div id="mE4" class="form-inline"> <input id="hiM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiM">Inicio</label> </div> ' +
        '<div id="mE5" class="form-inline"> <input id="hfM" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfM">Fin</label> </div>' +
        '<div id="mE6" class="form-inline"> <input id="sM" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sM">Salón</label> </div> </td> ' +

        '<td> <div id="mE7" class="form-inline"> <input id="hiMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiMi">Inicio</label> </div> ' +
        '<div id="mE8" class="form-inline"> <input id="hfMi" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfMi">Fin</label> </div>' +
        '<div id="mE9" class="form-inline"> <input id="sMi" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sMi">Salón</label> </div> </td> ' +

        '<td> <div id="mE10" class="form-inline"> <input id="hiJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiJ">Inicio</label> </div> ' +
        '<div id="mE11" class="form-inline"> <input id="hfJ" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfJ">Fin</label> </div>' +
        '<div id="mE12" class="form-inline"> <input id="sJ" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sJ">Salón</label> </div> </td> ' +

        '<td> <div id="mE13" class="form-inline"> <input id="hiV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiV">Inicio</label> </div> ' +
        '<div id="mE14" class="form-inline"> <input id="hfV" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfV">Fin</label> </div>' +
        '<div id="mE15" class="form-inline"> <input id="sV" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sV">Salón</label> </div> </td> ' +

        '<td> <div id="mE16" class="form-inline"> <input id="hiS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiS">Inicio</label> </div> ' +
        '<div id="mE17" class="form-inline"> <input id="hfS" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hfS">Fin</label> </div>' +
        '<div id="mE18" class="form-inline"> <input id="sS" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sS">Salón</label> </div> </td> ' +

        '<td> <div id="mE19" class="form-inline"> <input id="hiD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hiD">Inicio</label> </div> ' +
        '<div id="mE20" class="form-inline"> <input id="hfD" style="width: 65px;" type="text" class="timepicker form-control" placeholder="hh:mm" data-default-time="false"> <label class="control-label" for="hf">Fin</label> </div>' +
        '<div id="mE21" class="form-inline"> <input id="sD" style="width: 65px;" type="text" class="form-control" disabled> <label class="control-label" for="sD">Salón</label> </div> </td> ' +
        '</tr> ' +
        '</table>' +
        '</div>'+
        '</div></form>');
    $("#ind").hide();
    $('.timepicker').timepicker({
        showMeridian: false,
        minuteStep: 10,
        disableMousewheel: false
    }).on('keydown', function(e) {
        e = e || window.event;
        if (e.keyCode == 9) {
            $(this).timepicker('hideWidget');
            console.log("tab pressed");
        }
    }).prop('disabled', true);
    $(":checkbox").change(function () {
        if ($("#checkLunes").prop("checked")){
            $("#hiL").prop("disabled", false);
            $("#hfL").prop("disabled", false);
            $("#sL").prop("disabled", false);
        } else {
            $('#hiL').prop('disabled', true);
            $('#hfL').prop('disabled', true);
            $("#sL").prop("disabled", true);
        }
        if ($("#checkMartes").prop("checked")){
            $("#hiM").prop("disabled", false);
            $("#hfM").prop("disabled", false);
            $("#sM").prop("disabled", false);
        } else {
            $('#hiM').prop('disabled', true);
            $('#hfM').prop('disabled', true);
            $("#sM").prop("disabled", true);
        }
        if ($("#checkMiercoles").prop("checked")){
            $("#hiMi").prop("disabled", false);
            $("#hfMi").prop("disabled", false);
            $("#sMi").prop("disabled", false);
        } else {
            $('#hiMi').prop('disabled', true);
            $('#hfMi').prop('disabled', true);
            $("#sMi").prop("disabled", true);
        }
        if ($("#checkJueves").prop("checked")){
            $("#hiJ").prop("disabled", false);
            $("#hfJ").prop("disabled", false);
            $("#sJ").prop("disabled", false);
        } else {
            $('#hiJ').prop('disabled', true);
            $('#hfJ').prop('disabled', true);
            $("#sJ").prop("disabled", true);
        }
        if ($("#checkViernes").prop("checked")){
            $("#hiV").prop("disabled", false);
            $("#hfV").prop("disabled", false);
            $("#sV").prop("disabled", false);
        } else {
            $('#hiV').prop('disabled', true);
            $('#hfV').prop('disabled', true);
            $("#sV").prop("disabled", true);
        }
        if ($("#checkSabado").prop("checked")){
            $("#hiS").prop("disabled", false);
            $("#hfS").prop("disabled", false);
            $("#sS").prop("disabled", false);
        } else {
            $('#hiS').prop('disabled', true);
            $('#hfS').prop('disabled', true);
            $("#sS").prop("disabled", true);
        }
        if ($("#checkDomingo").prop("checked")){
            $("#hiD").prop("disabled", false);
            $("#hfD").prop("disabled", false);
            $("#sD").prop("disabled", false);
        } else {
            $('#hiD').prop('disabled', true);
            $('#hfD').prop('disabled', true);
            $("#sD").prop("disabled", true);
        }
    });

    if (hiL != "") {
        $("#checkLunes").prop("checked",true);
        $("#hiL").timepicker("setTime", hiL).prop("disabled", false);
        $("#hfL").timepicker("setTime", hfL).prop("disabled", false);
        $("#sL").val(sL).prop("disabled", false);
    }
    if (hiM != "") {
        $("#checkMartes").prop("checked","true");
        $("#hiM").timepicker("setTime", hiM).prop("disabled", false);
        $("#hfM").timepicker("setTime", hfM).prop("disabled", false);
        $("#sM").val(sM).prop("disabled", false);

    }
    if (hiMi != "") {
        $("#checkMiercoles").prop("checked","true");
        $("#hiMi").timepicker("setTime", hiMi).prop("disabled", false);
        $("#hfMi").timepicker("setTime", hfMi).prop("disabled", false);
        $("#sMi").val(sMi).prop("disabled", false);

    }
    if (hiJ != "") {
        $("#checkJueves").prop("checked","true");
        $("#hiJ").timepicker("setTime", hiJ).prop("disabled", false);
        $("#hfJ").timepicker("setTime", hfJ).prop("disabled", false);
        $("#sJ").val(sJ).prop("disabled", false);

    }
    if (hiV != "") {
        $("#checkViernes").prop("checked","true");
        $("#hiV").timepicker("setTime", hiV).prop("disabled", false);
        $("#hfV").timepicker("setTime", hfV).prop("disabled", false);
        $("#sV").val(sV).prop("disabled", false);

    }
    if (hiS != "") {
        $("#checkSabado").prop("checked","true");
        $("#hiS").timepicker("setTime", hiS).prop("disabled", false);
        $("#hfS").timepicker("setTime", hfS).prop("disabled", false);
        $("#sS").val(sS).prop("disabled", false);

    }
    if (hiD != "") {
        $("#checkDomingo").prop("checked","true");
        $("#hiD").timepicker("setTime", hiD).prop("disabled", false);
        $("#hfD").timepicker("setTime", hfD).prop("disabled", false);
        $("#sD").val(sD).prop("disabled", false);

    }
    $(".modal-footer").html('<a href="#" class="btn btn-default" data-dismiss="modal">Cancelar</a> ' +
        '<a href="#" class="btn btn-primary" id="btnSaveFIGPO" onClick="saveGroup()"> Guardar </a>');
    $('#myModal').attr("class", "modal fade modal-wide").modal('show');

}

function modalNiveles(level){
    var code="";
    var div="";
    for (var i=0;i<level.length;i++){
        var count=0;
        for (var j=0;j<toSendFIGPO.length;j++){
            if(toSendFIGPO[j]['nivel']==level[i]){
                count++;
            }
        }
        code += "<div class='radio' align='center'><label class='control-label'><input type='radio' name='optNivel' id="+level[i]+"> "+level[i]+"................................................."+count+" Registros</label></div>";
    }
    $(".modal-header").html(
        '<button type="button" class="close" data-dismiss="modal">×</button>' +
        '<h3 align="center"> Niveles encontrados </h3>'
    );
    $(".modal-body").html(
        '<div id="mE1" class="form-group">'+
        '<div style="text-align: center; height: auto">Seleccione el nivel que desea cargar:' +
        '</div>'+
        code+
        '</div>'

    );
    $(".modal-footer").html(
        //'<div align="center">' +
        '<button type="button" id="btnNext"  class="btn btn-primary" >Siguiente</button>'
        //'<a class="btn btn-default" data-dismiss="modal" >Cancelar</a> ' +
        //'<a  href="#" id="btnNext" class="btn btn-primary" onClick="showModulos()">Siguiente</a>'
        //'</div>'
    );
    $('#myModal').attr("class", "modal fade normal").modal('show');
    $(document).on("click", "#btnNext", function () {
        var temp=[];
        var select_nivel=document.getElementsByTagName('input');
        var niv=""
        for (var i=0;i<select_nivel.length;i++){
            if(select_nivel[i].checked==true){
                niv=select_nivel[i].id;
            }
            console.log(select_nivel);
        }
        if (niv==""){
            showSimpleNoty("No has seleccionado ningun nivel", "center", "error", 2000);
        } else {
            for ( var i=0;i<toSendFIGPO.length;i++){
                if (toSendFIGPO[i]['nivel']==niv){
                    //validateStruct(toSendFIGPO[i]);
                    temp.push(toSendFIGPO[i]);
                }
            }
            toSendFIGPO=temp;
            modalModu();
        }

    });
}

function modules(modulo){
    console.log("modulo");
    var INPUT=$('#conv_hr').val();
    var obj_conversion = validate_input_conv_hr(INPUT);
    if (!obj_conversion["status"]){
        // TODO mostrar mensaje de error, sin cerrar modal para que el usuario lo vuelva a intentar
        showSimpleNoty('Error en el formato de entrada', "center", 'error', 2000);
        return 0;
    }
    else{
        var INPUT_horarios = Object.keys(obj_conversion);
        var diasSemana=["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
        // itera todas las rows del CSV
        for (var i=0;i<toSendFIGPO.length;i++){
             diasSemana.forEach(function(value){
             if(toSendFIGPO[i][value]=="");
             else{
                  var CSV_horarios = toSendFIGPO[i][value].split(" ");
                  var CSV_horario  = CSV_horarios[0]+" "+CSV_horarios[1];
                  var CSV_salon    = CSV_horarios[2];
                  
                  var index_replace = INPUT_horarios.indexOf(CSV_horario);
                  if (index_replace > -1){
//                      console.log(toSendFIGPO[i]["crn"]+"     " +CSV_horario+"  --->  "+obj_conversion[CSV_horario]);
                      toSendFIGPO[i][value]= obj_conversion[CSV_horario]+" "+CSV_salon;
                  }
             }
             });
             validateStruct(toSendFIGPO[i]);
         }
    }

    console.log(toSendFIGPO);
    costruirTabla();
}

function validate_input_conv_hr(par_horarios){
    var obj_conv = new Array();
    var horarios = par_horarios.split("\n");
    re=/^([0-1][0-9]|2[0-3]):([0-5][0-9]) ([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
//    console.log(horarios);
    for (var index=0; index<horarios.length; index++){
        var linea = horarios[index].split(",");
        obj_conv[linea[0]] = linea[1];
        if(!re.test(linea[0]) || !re.test(linea[1])){
            obj_conv["status"] = false;
            break;
        }
        obj_conv["status"] = true;
    }

    return obj_conv ;
}

function modalModu(){
    $(".modal-header").html(
        '<button type="button" class="close" data-dismiss="modal">×</button>' +
        '<h3 align="center"> Procesar modulos </h3>'
    );
    $(".modal-body").html(
        '<div id="mE1" class="form-group" style="overflow-y: scroll">'+
        '<div id="mE1" class="form-group"> <label class="control-label" for="conv">Conversion Horario</label><textarea class="form-control first" id="conv_hr" placeholder="Ingresa Horario separado por espacio y coma"></textarea></div'+
        '<div align="center"><button type="button" id="btnAjuste" class="btn btn-success" data-dismiss="modal" onclick="modules(this.id)">Ajuste de Horas</button></div><br>'+
        '</div>'
    );
    $(".modal-footer").html(
        '<div align="center">'+
        '<a align="center"  href="#" id="btnProc" class="btn btn-primary" data-dismiss="modal">Procesar</a>'+
        '</div>'
        //'<a align="center"  href="#" id="btnProc" class="btn btn-primary ">Procesar</a>'
    );
    $(document).on("click", "#btnProc", function () {
        for(var i=0;i<toSendFIGPO.length;i++){
            validateStruct(toSendFIGPO[i]);
        }
        costruirTabla();
        
    });

}
