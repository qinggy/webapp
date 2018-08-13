$(function () {
  'use strict';
  const authUri = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx9775e49a795e2523&redirect_uri=http://cloud.esdgd.com/webapp/src/login.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
  let globalUserInfo = null;

  $(document).on("pageInit", "#page-about", function (e, id, page) {
    esdpec.framework.core.getJsonResult('account/getuserinfo', function (response) {
      if (response.IsSuccess) {
        globalUserInfo = response.Content;
        $('#nick_name').text(globalUserInfo.nick_name);
        $('#account_code').text(globalUserInfo.account);
        $('#company_logo').css('background-image', `url(${globalUserInfo.img})`);
        $('#nick_code').text(globalUserInfo.nick_name);
        $('#nick_pic').attr('src', globalUserInfo.img);
      }
    });

    $(page).on('click', '.unbind-contain', function (e) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('authorization_code');
      sessionStorage.removeItem('meter_tree');
      sessionStorage.removeItem('current_health');
      sessionStorage.removeItem('first_login');
      sessionStorage.removeItem('current_select_meters');
      window.location.href = authUri;
    });
  });

  $.init();
});