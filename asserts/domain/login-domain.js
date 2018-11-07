$(function () {
  'use strict';
  const authUri = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx9775e49a795e2523&redirect_uri=http://cloud.esdgd.com/webapp/src/login.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
  let authorizationCode = '';
  let isEmail = function (email) {
    var regex = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
    return regex.test(email);
  };
  let getQueryString = pName => {
    let url = location.search;
    let theRequest = [];
    if (url.indexOf("?") !== -1) {
      let str = url.substr(1);
      let strs = str.split("&");
      for (let i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
      }
    }
    return theRequest[pName];
  };
  let hasLogined = () => {
    let currentUri = window.location.href;
    if (_.includes(currentUri, 'code')) {
      authorizationCode = getQueryString('code');
      return true;
    }
    return false;
  }

  let isPageError = () => {
    let uri = window.location.href;
    if(_.includes(uri, '_ps'))
      return true;
    return false;
  };

  $(document).on("pageInit", "#login-page", function (e, id, page) {
    $(page).on("click", "#login-btn", function (e) {
      //should write the login logic at here
      var account = $jQuery('#account').val();
      var password = $jQuery('#password').val();
      if (account === '') {
        $.toast('请输入账号');
        return;
      } else if (!isEmail(account)) {
        $.toast('账号格式错误，请输入例如xxx@mail.com');
        return;
      }
      if (password === '') {
        $.toast('密码不能为空');
        return;
      }
      esdpec.framework.core.doPostOperation("Account/Login", {
        Account: account,
        Password: password,
        Code: authorizationCode
      }, function (response) {
        if (response.IsSuccess && response.Code === '00') {
          localStorage.setItem("current_user", response.Content.userId);
          localStorage.setItem("user_token", response.Content.token);
          localStorage.setItem('authorization_code', authorizationCode);
          sessionStorage.setItem('first_login', '1');
          window.location.href = esdpec.framework.core.BaseWeb + 'src/focus/index.html';
        } else {
          $.toast(response.Msg);
        }
      }, function (error) {
        $.toast(error.Msg);
      });
    });
    if(!isPageError()){
      let token = localStorage.getItem('user_token');
      if (token) {
        sessionStorage.setItem('first_login', '1');
        window.location.href = esdpec.framework.core.BaseWeb + 'src/focus/index.html';
      } else if (!hasLogined()) {
        window.location.href = authUri;
      }
    }    
  });

  $.init();
});