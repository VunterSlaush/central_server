var Roles = {
    Requester: Requester,

    addRole: function (name) {
        var json = {ws: 'aRol', nuevoRol: name};
        return Requester.getService(json);
    },

    modifyRole: function (id, name) {
        var json = {ws: 'mRol', idr: id, nombre: name};
        return Requester.getService(json);
    },

    consultRole: function () {
        var json = {ws: 'roles'};
        return Requester.getService(json);
    },


    deleteRole: function (id,delGrupo) {
        var json = {ws: 'eRol', idr: id, delGrupo: delGrupo};
        return Requester.getService(json);
    },

    deleteRolWarning: function(id){
        showOptionNoty("¿Eliminar tambien del grupo del rol?", "center", "warning",''+
            'Roles.deleteRole('+id+',false).done(function (data) {'+
                'if(data.s == 1){'+
                    'document.getElementById("btnRoles").click();'+
                    'showSimpleNoty(data.m, "center", "success", "5000");'+
                '}else{'+
                    'showSimpleNoty(data.m, "center", "error", "0");'+
                '}'+
            '});',''+
            'Roles.deleteRole('+id+',true).done(function (data) {'+
                'if(data.s == 1){'+
                    'document.getElementById("btnRoles").click();'+
                    'showSimpleNoty(data.m, "center", "success", "5000");'+
                '}else{'+
                    'showSimpleNoty(data.m, "center", "error", "0");'+
                '}'+
            '});'

            ,"");   
    }
}