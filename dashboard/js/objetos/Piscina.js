
var Piscina = {
    Requester: Requester,
    add: function (temperatura) {
      json = {
          ws: 'aPiscina',
          temperatura: temperatura
      };
      return Requester.getService(json);

    },

    getAll: function ()
    {
      json = {
          ws: 'piscinas',
      };
      return Requester.getService(json);
    },

    delete: function (id) {
        json = {
            ws: 'ePiscina',
            id: id
        };
        return Requester.getService(json);
    },

}
