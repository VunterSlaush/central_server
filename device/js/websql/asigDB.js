var asigDB = {
  makeQuery: function(db,query,data) {
    db.transaction(function(tx) {
      tx.executeSql(query,data,function() {
        console.log(query + " Successfull");
      },
      function(tx,err) {
        console.log(query + " Unsuccessfull, Error: " + err);
      });
    });
  },
  createTable : function(db) {
      query = "CREATE TABLE IF NOT EXIST asignaciones (id unique,titulo,hi,hf,tema)";
      makeQuery(db,query,[]);
  }
}
