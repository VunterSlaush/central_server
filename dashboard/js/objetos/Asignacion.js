var Asignacion = {
    Requester: Requester,

    addAsignacionForm: function (container) {
        Requester.getData(container);
        return Requester.getServiceForm('cAsignacion');
    },

    addAsignacion: function (grupo, espacio, servicio, persona, fi, ff, crn, periodo, admin) {
        json = {
            ws: 'cAsignacion',
            idGrupo: grupo,
            idEspacio: espacio,
            idServicio: servicio,
            idPersona: persona,
            fechaInicio: fi,
            fechaFin: ff,
            crn: crn,
            periodo: periodo,
            responsible: admin
        };
        return Requester.getService(json);
    },

    modifyAsignacionForm: function (container, id) {
        Requester.getData(container);
        Requester.addData('ida', id);
        return Requester.getServiceForm('mAsignacion');
    },

    modifyAsignacion: function (asignacion, grupo, espacio, servicio, persona, fi, ff, crn, periodo) {
        json = {
            ws: 'mAsignacion',
            ida: asignacion,
            idGrupo: grupo,
            idEspacio: espacio,
            idServicio: servicio,
            idPersona: persona,
            fechaInicio: fi,
            fechaFin: ff,
            crn: crn,
            periodo: periodo
        };
        return Requester.getService(json);
    },

    consultAsignacion: function () {
        json = {ws: 'lAsignacion'};
        return Requester.getService(json);
    },


    deleteAsignacion: function (id) {
        json = {ws: 'eAsignacion', ida: id};
        return Requester.getService(json);
    }

}
