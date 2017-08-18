function initRaven() {
  $.ajax({
      async: false,
      url: "raven_config.php",
      type: "POST",
      dataType: "json",
      success: function (data) {
        Raven.setRelease(data.release);
        // if (data.session){
        //   Raven.setUserContext({
        //     username: data.session
        //   });
        // }
        Raven.config(data.cdn,{
          autoBreadcrumbs: {
            'xhr': false
          }
        }).install();
      },
      error: function () {
        console.log("error al iniciar raven!");
      }
    });
}
