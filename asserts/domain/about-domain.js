$(function () {
  'use strict';
  const authUri = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx9775e49a795e2523&redirect_uri=http://cloud.esdgd.com/webapp/src/login.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';

  $(document).on("pageInit", "#page-about", function (e, id, page) {
    $(page).on("click", ".bar-tab a", function (e) {

    });
    $(page).on('click', '.unbind-contain', function (e) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('authorization_code');
      sessionStorage.removeItem('meter_tree');
      sessionStorage.removeItem('current_health');
      window.location.href = authUri;
    });
  });

  $.init();
});