//manejo de camara
var camaraControl = {
  video_rec: "",
  imgPath: "",
  localTrack: "",
  localStream: "",
  rotate: 0,
  videoSelect: "",
  index: 0,
  qvgaConstraint: { width: {exact:320}, height: {exact:240}},
  vgaConstraint: { width: {exact:640}, height: {exact:480}},
  hdConstraint: { width: {exact:1280}, height: {exact:720}},
  fullHdConstraint: { width: {exact:1920}, height: {exact:1080}},
  actualConstraint: {},
  devicesSet: false,
  handleError: function (error) {
    console.log('navigator.getUserMedia error: ', error);
    $('#actualRes').html('Resolución: No soportada');
  },
  gotStream: function (stream) {
    camaraControl.video_rec.srcObject = stream;
    camaraControl.localStream = stream;
    camaraControl.localTrack = stream.getTracks()[0];
    camaraControl.video_rec.onloadedmetadata = function(e) {
      camaraControl.video_rec.play();
      $('#takeSnap').removeAttr("disabled");
      console.log("video start!");
      $('#actualRes').html('Resolución: '+camaraControl.video_rec.videoWidth + ' x ' + camaraControl.video_rec.videoHeight);
    };

    console.log('gotStream:');
    console.log(camaraControl.localStream);
    console.log(camaraControl.localTrack);

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
  },
  startStream: function (constraintsRes) {
    console.log('startStream:');
    console.log(camaraControl.localStream);
    console.log(camaraControl.localTrack);
    if (camaraControl.localStream) {
      camaraControl.localStream.getTracks().forEach(function(track) {
        track.stop();
      });
    }

    var videoSource = $(camaraControl.videoSelect).val();
    var constraints = {
      audio:false,
      video: {
        width: constraintsRes.width,
        height: constraintsRes.height,
        deviceId: videoSource ? {exact: videoSource} : undefined
      }
    };
    console.log(constraints);

    // if (devicesSet){
    //   navigator.mediaDevices.getUserMedia(constraints).
    //   then(gotStream).catch(handleError);
    // }else{
      navigator.mediaDevices.getUserMedia(constraints).
      then(camaraControl.gotStream).then(camaraControl.gotDevices).catch(camaraControl.handleError);
    //   devicesSet = true;
    // }
  },
  gotDevices: function (deviceInfos) {
    console.log("gotDevices()");
    $('#devices').find('option').remove();
    var values = $(camaraControl.videoSelect).val();

    for (var i = 0; i !== deviceInfos.length; ++i) {
      var deviceInfo = deviceInfos[i];
      var option = document.createElement('option');
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'videoinput') {
        option.text = deviceInfo.label || 'camera ' + (camaraControl.videoSelect.length + 1);
        camaraControl.videoSelect.appendChild(option);
      }
    }

    if (Array.prototype.slice.call(camaraControl.videoSelect.childNodes).some(function(n) {
      return n.value === values;
    })) {
      camaraControl.videoSelect.value = values;
    }
  },
  setListeners: function (opt) {
    if (opt){
      $('#devices').off('change');
      $('#devices').on('change',function() {
        camaraControl.startStream(camaraControl.actualConstraint);
      });

      $('#qvga').off('click');
      $('#qvga').click(function(e) {
        e.preventDefault();
        camaraControl.startStream(camaraControl.qvgaConstraint);
        camaraControl.actualConstraint = camaraControl.qvgaConstraint;

      });

      $('#vga').off('click');
      $('#vga').click(function(e) {
        e.preventDefault();
        camaraControl.startStream(camaraControl.vgaConstraint);
        camaraControl.actualConstraint = camaraControl.vgaConstraint;
      });

      $('#hd').off('click');
      $('#hd').click(function(e) {
        e.preventDefault();
        camaraControl.startStream(camaraControl.hdConstraint);
        camaraControl.actualConstraint = camaraControl.hdConstraint;
      });

      $('#fullHd').off('click');
      $('#fullHd').click(function(e) {
        e.preventDefault();
        camaraControl.startStream(camaraControl.fullHdConstraint);
        camaraControl.actualConstraint = camaraControl.fullHdConstraint;
      });

      $('#cameraModal').off('hide.bs.modal');
      $('#cameraModal').on('hide.bs.modal',function functionName() {
        if (camaraControl.localStream){
          if (camaraControl.localStream.active){
            camaraControl.localTrack.stop();
            console.log("stopeed!");
          }
        }
        $('#uploadAnim').hide();
        $('#takeSnap').show();
        $('#uploadMsg').hide();
        $('#video').show();
        $('#canvas').hide();

        camaraControl.setListeners(false);
        // ControlSocios.construirModal(accionTipo,accionIdp, accionNombre);
      });

      $('#videoOutput').off('click');
      $('#videoOutput').click(function() {
        camaraControl.rotate = camaraControl.rotate + 90;
        if (camaraControl.rotate >= 360){
          camaraControl.rotate = 0;
        }
        $('#video').css('transform','rotate('+camaraControl.rotate+'deg)');
      });

      $('#takeSnap').off('click');
      $('#takeSnap').click(function() {
        $('#takeSnap').attr("disabled", true);

        var canvas = $('#canvas')[0];

        canvas.width =  $('#video').height();
        canvas.height =  $('#video').height();

        var context = canvas.getContext('2d');

        //ocultar video y mostrar el snap recien tomado

        $('#video').hide();
        $('#canvas').show();

        context.clearRect(0,0,canvas.width,canvas.height);
        context.translate(canvas.width/2,canvas.height/2);

        context.rotate(camaraControl.rotate*Math.PI/180);

        context.drawImage(camaraControl.video_rec, -$('#video').height()/2, -$('#video').height()/2, $('#video').height(), $('#video').height());

        var data = new FormData();
        // var id_producto = productList[parseInt($('#productDescription').attr('data-index'))]["id"];

        // $('#takeSnap').hide();
        // $('#uploadAnim').show();

        // duplicar canvas oara enviar en tamño nativo de video
        var canvasToSend = document.createElement('canvas');
        canvasToSend.width =  $('#video')[0].videoHeight;
        canvasToSend.height =  $('#video')[0].videoHeight;
        var context2 = canvasToSend.getContext('2d');

        context2.clearRect(0,0,canvasToSend.width,canvasToSend.height);
        context2.translate(canvasToSend.width/2,canvasToSend.height/2);

        context2.rotate(camaraControl.rotate*Math.PI/180);

        context2.drawImage(camaraControl.video_rec, -$('#video')[0].videoHeight/2, -$('#video')[0].videoHeight/2, $('#video')[0].videoHeight, $('#video')[0].videoHeight);

        // data.append('input_file',canvasToSend.toDataURL('image/jpeg', 1.0)); //imagen en base64
        // data.append('id_producto',id_producto); //id de producto

        // var splitted = splitImageInto(canvasToSend.toDataURL('image/jpeg', 1.0),200000);
        //
        // sendImageSplitted(0,splitted.length,splitted,accionIdp);

        $('#userImage').attr('src',' ');
        $('#userImage').attr('src',canvasToSend.toDataURL('image/jpeg', 1.0));

        setTimeout(function() {
          $("#cameraModal").modal('hide');
          $('#takeSnap').show();
          $('#uploadMsg').hide();
          $('#video').show();
          $('#canvas').hide();
        },1000);
      });
    }else{
      $('#devices').off('change');
      $('#qvga').off('click');
      $('#vga').off('click');
      $('#hd').off('click');
      $('#fullHd').off('click');
      $('#cameraModal').off('hide.bs.modal');
      $('#videoOutput').off('click');
      $('#takeSnap').off('click');
    }
  }

}
