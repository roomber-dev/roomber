// languages done here
const styles = {
  palette: {
    window: "#1B1B1B",
    windowBorder: "#FFFFFF",
    tabIcon: "#FFF",
    menuIcons: "#FFF",
    textDark: "#FFFFFF",
    textLight: "#000000",
    link:  "#1B1B1B",
    action:  "#1B1B1B",
    inactiveTabIcon: "#FFFFFF",
    error: "#F44235",
    inProgress: "#FFFFFF",
    complete: "#20B832",
    sourceBg: "#353535"
  },
  frame: {
    background: "rgba(0,0,0,0.4)"
  }
};

pfpWidget = cloudinary.createUploadWidget({
  cloudName: 'roomber', 
  uploadPreset: 's2kamlsu', 
  folder: 'assets', 
  cropping: true,
  croppingAspectRatio: 1.0,
  showSkipCropButton: false,
  sources: ["local", "url", "camera"],
  styles: styles,
}, function(err, result) {
  if (!err && result.event == "success") {
    const v = result.info.path.split("/")[0];
    const src = result.info.url.replace(v, "c_crop,g_custom");
    $.post(serverUrl + "/changeProfile", {
      ...session,
      toChange: "avatar",
      avatar: src
    }, function(data) {
      if(data.error) {
        popup(langdata["popup.title.error"], data.error, undefined, false, "red");
        return;
      }
      $("#setup-pfp img").attr("src", src);
      $("#login img").attr("src", src);
      cache[session.user].avatar = src;
      profile.avatar = src;
      if($(".settings").html()) {
        updateSettings();
      }
    });
  }
});

function onAttachment(e) {oa = e;}
attachmentWidget = cloudinary.createUploadWidget({
  cloudName: 'roomber', 
  uploadPreset: 's2kamlsu', 
  folder: 'attachments', 
  cropping: true,
  sources: ["local", "url", "camera"],
  styles: styles,
}, function(err, result) {
  if (!err && result.event == "success") {
    const v = result.info.path.split("/")[0];
    const src = result.info.url.replace(v, "c_crop,g_custom");
    if(oa) oa(src);
  }
});

widgets = {};
function onUpload(e) {ow = e;}
function uploadWidget(name, extra = {}) {
  widgets[name] = cloudinary.createUploadWidget({
    cloudName: 'roomber', 
    uploadPreset: 's2kamlsu', 
    folder: name, 
    cropping: true,
    sources: ["local", "url", "camera"],
    styles: styles,
    ...extra
  }, function(err, result) {
    if (!err && result.event == "success") {
      const v = result.info.path.split("/")[0];
      const src = result.info.url.replace(v, "c_crop,g_custom");
      if(ow) ow(src);
    }
  });  
}
function openUpload(name) {
  widgets[name].open();
}

uploadWidget("serverPictures", {
  croppingAspectRatio: 1.0
});
