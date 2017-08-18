var db = {
  asig: asigDB,
  createDB:function() {
    var wdb =  openDatabase('checadorDB', '1.0',' checador offline database',-1, function() {
      console.log('database opened');
    });
  },
  initTables:function() {
//    asig.createTable(wdb);
  }
}
