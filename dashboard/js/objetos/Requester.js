const WS_ROOT = "../club-dashboard_ws/"; //URL raiz de los servicios
const WS_PRIVADOS_URL = WS_ROOT + "serviciosPrivados.php"; //url del ws serviciosPrivados usado en todo el sisteema
const WS_LECTOR_URL = WS_ROOT + "serviciosLector.php"; //url del ws serviciosLector usado en todo el sisteema

var Requester = {
    sendData: {},

    addData: function (name, data) {
        sendData[name] = data;
    },

    getData: function (container) {
        var json = {};

        try {
            Object.keys(container.elements).forEach(function (key) {
                var val = container.elements[key];
                var field;
                field = val.getAttribute("attr");
                if (field)
                    json[field] = val.value;
            });
        }
        catch (e) {

        }
        sendData = json;
    },
    /*Si se desea enviar directamente los datos del servicio
     * ws =  servicio a llamar
     * d =  son las variable a en viar al servicio, esta variable es en formato json
     *
     *
     * d = {ws:login ,usuario : 'dato', password:'dato'}
     *
     *http://checador.co/Checador/serviciosPrivados.php
     POST: ws=login
     POST: usuario=rodolfo
     POST: password=a57073501e2dc8c158ee6fcfb46dfbe9ecc03a43 (el sha1 de tierra1.)
     */

    getService: function (d) {
        //var response = Array();
        return $.ajax({
          type: 'POST',
          url: WS_PRIVADOS_URL,
          data: d,
          dataType: 'json',
          beforeSend: function() {
            mensajeCarga(true);
          },
          success: function(data) {
            response = data;
            mensajeCarga(false);
          },
          error: function() {
            showSimpleNoty("Error al solicitar información", "center", "error", 0);
            mensajeCarga(false);
          }
        });
    },

    /*Si los datos estan en un formulario, se llama primero a getData y despues a este servicio
     * con el nombre del servicio en ws
     */
    getServiceForm: function (ws) {
        var response;
        sendData['ws'] = ws;
        return getService(sendData);
    }
}
