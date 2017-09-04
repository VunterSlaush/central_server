
var Noticias = {
    Requester: Requester,


    add: function (titulo,imagen) {

        var dataToSend = {
          fun:"push_all",
          data:
          {
            title:titulo,
            image:imagen
          }
        };
        return $.ajax({
          type: 'POST',
          url: '../push_service/Main.php',
          data: 'json='+JSON.stringify(dataToSend),
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

    getAll: function ()
    {
      json = {
          ws: 'noticias',
      };
      return Requester.getService(json);
    },

    delete: function (id) {
        json = {
            ws: 'eNoticia',
            id: id
        };
        return Requester.getService(json);
    },

}
