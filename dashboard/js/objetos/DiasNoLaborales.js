var DnLaborales = {
    Requester: Requester,

    consultDias: function () {
        json = {ws: 'consultDias'};
        return Requester.getService(json);
    },
    getLevels: function () {
        json = {ws: 'getLevels'};
        return Requester.getService(json);
    },
    deleteDay: function(date) {
        json = {ws: 'deleteDay', fecha: date};
        return Requester.getService(json);        
    },
    modifyDay: function(date, niv) {
        json = {ws: 'modifyDay', fecha:date, niveles:niv};
        return Requester.getService(json);        
    },  
    addDay: function(date, niv) {
        json = {ws: 'addDay', fecha:date, niveles:niv};
        return Requester.getService(json);        
    }  
}
