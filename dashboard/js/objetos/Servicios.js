var Servicios = {
    Requester: Requester,

    addServicioForm: function (container) {
        Requester.getData(container);
        return Requester.getServiceForm('aServicio');
    },

    addServicio: function (codigo, nombre, depa, nivel, tipo) {
        json = {ws: 'aServicio', titulo: nombre, idtipo: tipo, departamento: depa, codigo: codigo, nivel: nivel}
        return Requester.getService(json);
    },

    modifyServicioForm: function (container, id) {
        Requester.getData(container);
        Requester.addData('ids', id);
        return Requester.getServiceForm('mServicio');
    },

    modifyServicio: function (id, codigo, nombre, depa, nivel, tipo) {
        json = {
            ws: 'mServicio',
            ids: id,
            titulo: nombre,
            idtipo: tipo,
            departamento: depa,
            codigo: codigo,
            nivel: nivel
        }
        return Requester.getService(json);
    },

    consultServicio: function (idr, filtro) {
        json = {ws: 'lServicio'}
        return Requester.getService(json);
    },

    deleteServicio: function (id) {
        json = {ws: 'eServicio', ids: id};
        return Requester.getService(json);
    }

}
