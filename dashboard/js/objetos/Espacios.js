var Espacios = {
    Requester: Requester,

    addEspacioForm: function (container) {
        Requester.getData(container);
        return Requester.getServiceForm('aEspacio');
    },

    addEspacio: function (nombre, capacidad, tipo) {
        json = {ws: 'aEspacio', nombre: nombre, capacidad: capacidad, tipo: tipo};
        return Requester.getService(json);
    },

    modifyEspacioForm: function (container, id) {
        Requester.getData(container);
        Requester.addData('ide', id);
        return Requester.getServiceForm('mEspacio');
    },

    modifyEspacio: function (ide, nombre, capacidad, tipo) {
        json = {ws: 'mEspacio', ide: ide, nombre: nombre, capacidad: capacidad, tipo: tipo};
        return Requester.getService(json);
    },

    consultEspacio: function () {
        json = {ws: 'lEspacio'};
        return Requester.getService(json);
    },

    consultTipoEspacio: function () {
        json = {ws: 'tEspacio'};
        return Requester.getService(json);
    },

    deleteEspacio: function (id) {
        json = {ws: 'eEspacio', ide: id};
        return Requester.getService(json);
    }

}
