//TODO: implentar en back.. Actualizado para socios y empleados
var Personas = {
    Requester: Requester,

    addPersonaForm: function (container) {
        Requester.getData(container);
        return Requester.getServiceForm('aPersona');
    },

    addPersona: function (nombre,ap, am, dir, tipoMemb, tel, cel,correo, rfc,fecha_nac, tipo_sangre, genero,nMembresia,nip,estatus,rol,user,pass) {
        json = {
            ws: 'aPersona',
            nombre: nombre,
            apaterno: ap,
            amaterno: am,
            direccion: dir,
            tipoMem: tipoMemb,
            telefono: tel,
            celular: cel,
            correo: correo,
            rfc: rfc,
            fecha: fecha_nac,
            tipoSangre: tipo_sangre,
            genero: genero,
            nMembresia: nMembresia,
            nip: nip,
            status: estatus,
            idr: rol,
            user: user,
            pass: pass
        };
        return Requester.getService(json);
    },

    modifyPersonaForm: function (container, id) {
        Requester.getData(container);
        Requester.addData('idp', id);
        return Requester.getServiceForm('mPersona');
    },

    modifyPersona: function (idp, nombre,ap, am, dir,tipoMemb, tel, cel,correo, rfc,fecha_nac, tipo_sangre, genero,nMembresia,nip,estatus,rol,user,pass) {
        json = {
            ws: 'mPersona',
            idp: idp,
            nombre: nombre,
            apaterno: ap,
            amaterno: am,
            direccion: dir,
            tipoMem: tipoMemb,
            telefono: tel,
            celular: cel,
            correo: correo,
            rfc: rfc,
            fecha: fecha_nac,
            tipoSangre: tipo_sangre,
            genero: genero,
            nMembresia: nMembresia,
            nip: nip,
            status: estatus,
            idr: rol,
            username: user,
            password: pass
        };
        return Requester.getService(json);
    },

    consultPersona: function (filtro) {
        json = {ws: 'lPersona', filtro: filtro};
        return Requester.getService(json);
    },

    consultPersonaId: function (persona) {
        json = {ws: 'lPersonaId', idp: persona};
        return Requester.getService(json);
    },

    consultPersonaV: function (persona,tipo) {
        json = {ws: 'lPersonaV', idp: persona,tipo: tipo};
        return Requester.getService(json);
    },

    consultPersonaRol: function (idr, filtro) {
        json = {ws: 'lPersona', idr: idr, filtro: filtro};
        return Requester.getService(json);
    },

    deletePersona: function (id) {
        json = {ws: 'ePersona', idp: id};
        return Requester.getService(json);
    },

    vincularPersona: function (idp, idv, parentesco) {
        json = {ws: 'vPersona', idp: idp, idv: idv, parentesco: parentesco};
        return Requester.getService(json);
    },

    desvincularPersona: function (idp, idv) {
        json = {ws: 'svPersona', idp: idp, idv: idv};
        return Requester.getService(json);
    },

    consultPersonasPagos: function () {
        json = {ws: 'listaPagoPersonas'};
        return Requester.getService(json);
    },

    procesarPagos: function (idps, estatus) {
        json = {
          ws: 'procesarPagos',
          idP: JSON.stringify(idps),
          estatus: estatus
        };
        return Requester.getService(json);
    }

}
