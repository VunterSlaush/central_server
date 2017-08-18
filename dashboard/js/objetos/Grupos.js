var Grupos = {
    Requester: Requester,

    addGrupo: function (name) {
        json = {ws: 'aGrupo', nuevoGrupo: name};
        return Requester.getService(json);
    },

    modifyGrupo: function (id, name) {
        json = {idg: id, nombre: name, ws: 'mGrupo'}
        return Requester.getService(json);
    },

    consultGrupos: function () {
        json = {ws: 'grupos'};
        return Requester.getService(json);
    },

    consultGrupo: function (idg) {
        json = {ws: 'grupos',idg: idg};
        return Requester.getService(json);
    },    

    consultMiembros: function (id) {
        json = {ws: 'miembros', idg: id};
        return Requester.getService(json);
    },

    consultMisGrupos: function (idp) {
        json = {ws: 'misGrupos',idp: idp};
        return Requester.getService(json);
    },  

    getGruposDispositivo: function (idd) {
        json = {ws: 'GruposDispositivo',idd: idd};
        return Requester.getService(json);
    },        

    deletePerson: function (id, person) {
        json = {ws: 'ePdGrupo', idg: id, idp: person};
        return Requester.getService(json);
    },

    checkDeletePerson: function (id, person) {
        json = {ws: 'checkDeletePerson', idg: id, idp: person};
        return Requester.getService(json);
    },    

    addPerson: function (id, person) {
        json = {ws: 'aPaGrupo', idg: id, idp: person};
        return Requester.getService(json);
    },

    addPersons: function (id, personas) {
        json = {ws: 'aPsaGrupo', idg: id, idps: personas};
        return Requester.getService(json);
    },    

    deleteGrupo: function (id) {
        json = {ws: 'eGrupo', idg: id};
        return Requester.getService(json);
    }

}
