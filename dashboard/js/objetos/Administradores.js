var Administradores = {
    Requester: Requester,

    Acceso: function(){
        json = {ws: "aAcceso"};
        return Requester.getService(json);
    },

    session: function(){
        json = {ws: "sessionChk"};
        return Requester.getService(json);
    },    

    Add: function (nss,titulo,nombre,ap,am,email,celular,telefono,detalle, rol, id1, id2, id3, admin,usuario,contra,accesos) {
        json = {
            ws: 'aAdmin',
            titulo: titulo,
            nombre: nombre,
            apaterno: ap,
            amaterno: am,
            email: email,
            movil: celular,
            fijo: telefono,
            detalle: detalle,
            nss: nss,
            idr: rol,
            id1: id1,
            id2: id2,
            id3: id3,
            administrador: admin,
            usuario: usuario,
            pss: contra,
            accesos: accesos            
        };
        return Requester.getService(json);
    },

    Delete: function (idp,ida,mode) {
        json = {
            ws: 'dAdmin',
            idp: idp,
            ida: ida,
            mode: mode
        };
        return Requester.getService(json);
    },

    Modify: function (idp,nss,titulo,nombre,ap,am,email,celular,telefono,detalle, rol, id1, id2, id3, admin,usuario,contra,accesos) {
        json = {
            ws: 'mAdmin',
            idp: idp,
            titulo: titulo,
            nombre: nombre,
            apaterno: ap,
            amaterno: am,
            email: email,
            movil: celular,
            fijo: telefono,
            detalle: detalle,
            nss: nss,
            idr: rol,
            id1: id1,
            id2: id2,
            id3: id3,
            administrador: admin,
            usuario: usuario,
            pss: contra,
            accesos: accesos            
        };
        return Requester.getService(json);
    },

    ConsultAccess: function (id,menu,accion) {
        json = {
            ws: 'ConsultAccess',
            id: id,
            menu: menu,
            accion: accion
        };
        return Requester.getService(json);
    },

    ConsultAdmin: function (id) {
        json = {
            ws: 'GetAdmins',
            id: id
        };
        return Requester.getService(json);
    },    

    GetAdmins: function () {
        json = {
            ws: 'GetAdmins'
        };
        return Requester.getService(json);
    },

    deletePersonAdmin: function(ida,idp){
        showOptionNoty("¿Eliminar tambien del registro de personas?", "center", "warning",''+
            'Administradores.Delete(" " ,  '+ida+'  ,"only").done(function (data) {'+
                'if(data.s == 1){'+
                    'document.getElementById("btnAdmins").click();'+
                    'showSimpleNoty(data.m, "center", "success", "5000");'+
                '}else{'+
                'showSimpleNoty(data.m, "center", "error", "0");'+
                '}'+
            '});',''+
            'Administradores.Delete('+idp+' ,  '+ida+'  ,"all").done(function (data) {'+
                'if(data.s == 1){'+
                    'document.getElementById("btnAdmins").click();'+
                    'showSimpleNoty(data.m, "center", "success", "5000");'+
                '}else{'+
                'showSimpleNoty(data.m, "center", "error", "0");'+
                '}'+
            '});'

            ,"");   
    }
}