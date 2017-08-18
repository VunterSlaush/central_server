/**
 * Created by cesar on 16/12/15.
 */
var Dispositivos = {
    Requester: Requester,

    publicidadImpacto: function (idDev) {
        json = {ws: 'getPubImp', data:idDev};
        return Requester.getService(json);
    },

    publicidadCarrusel: function (idDev){
        json={ws: 'getPubCarr', data:idDev};
        return Requester.getService(json);
    },

    addDispositivo: function (maquina, clave, descripcion, idEsp) {
        json = {
            ws: 'aDispositivo',
            maquina:maquina,
            clave: clave,
            descripcion: descripcion,
            idEsp: idEsp
        };
        return Requester.getService(json);
    },

    activarDispositivo: function (idDisp) {
        json = {
            ws: 'acDispositivo',
            idDev: idDisp
        };
        return Requester.getService(json);
    },    

    deleteDispositivo: function (id) {
        json = {
            ws: 'eDispositivo',
            idDisp : id
        };
        return Requester.getService(json);
    },

    modifyDispositivo: function(maquina, clave, descripcion, idEsp, id_maquina, grupos){
      json={
          ws:'mDispositivo',
          id_maquina:id_maquina,
          maquina:maquina,
          clave:clave,
          descripcion:descripcion,
          idEsp:idEsp,
          grupos: grupos
      };
        return Requester.getService(json);
    },

    setImpacto: function(select, noSelect, id_maquina){
        json={
            ws:'setImpacto',
            select:select,
            noSelect:noSelect,
            id_maquina:id_maquina
        };
        return Requester.getService(json);
    },

    setCarrusel: function(select, noSelect, id_maquina){
        json={
            ws:'setCarrusel',
            select:select,
            noSelect:noSelect,
            id_maquina: id_maquina
        };
        return Requester.getService(json);
    },

    resetLicencia: function(idDev){
        json={
            ws:'rDispositivo',
            idDisp:idDev,
        };
        return Requester.getService(json);
    },
}
