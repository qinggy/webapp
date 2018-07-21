$jQuery.namespace('esdpec.framework.core');
//
Array.prototype.indexOf = function (val) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == val) return i;
  }
  return -1;
}

Array.prototype.remove = function (val) {
  var index = this.indexOf(val);
  if (index > -1) {
    this.splice(index, 1);
  }
}

Date.prototype.format = function (format) {
  var o = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(), //day
    "h+": this.getHours(), //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
    "S": this.getMilliseconds() //millisecond
  }
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(format))
      format = format.replace(RegExp.$1,
        RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
  return format;
}

esdpec.framework.core.Config = {
  APIBaseUrl: 'http://172.17.0.21/api/', //'http://localhost:81/',
  BaseWebSiteUrl: 'http://172.17.0.48/',
  ajaxProcessingText: "加载中....",
  ajaxProcessedText: "完成"
}

esdpec.framework.core.completeRequest = function (XMLHttpRequest, textStatus, onCompleteCallBack) {
  var sessionstatus = XMLHttpRequest.getResponseHeader("sessionstatus");
  var unauthorize = XMLHttpRequest.getResponseHeader("authorize");
  if (sessionstatus === "timeout" || unauthorize === "unauthorize") {
    location.href = location.origin + '/src/login.html'
  }
  if (onCompleteCallBack != null) onCompleteCallBack;
};

esdpec.framework.core.getRequestRandom = function (url) {
  if (_.indexOf(url, '?') > -1) {
    return '&_t=' + new Date().getTime();
  } else
    return '?_t=' + new Date().getTime();
};

esdpec.framework.core.getJsonResult = function (url, successCallBack, failureCallBack) {
  $.showPreloader('Please Wait ...');
  setTimeout(function () {
    $.hidePreloader();
  }, 5000);
  $jQuery.ajaxSetup({
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "BasicAuth " + localStorage.getItem('user_token'));
    },
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  });
  $jQuery.getJSON(this.Config.APIBaseUrl + url + esdpec.framework.core.getRequestRandom(url))
    .done(function (data) {
      $.hidePreloader();
      if (data.Code != undefined && data.Code != null && data.Code == 401) {
        location.href = location.origin + '/src/login.html'
      }
      successCallBack(data);
    })
    .fail(function OnError(xhr, textStatus, err) {
      if (err == "Unauthorized") {
        location.href = location.origin + '/src/login.html'
      }
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
};

esdpec.framework.core.getJsonResultSilent = function (url, successCallBack, failureCallBack) {
  $jQuery.ajaxSetup({
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "BasicAuth " + localStorage.getItem('user_token'));
    },
    complete: function (XMLHttpRequest, textStatus) {
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    }
  });
  $jQuery.getJSON(this.Config.APIBaseUrl + url + esdpec.framework.core.getRequestRandom(url))
    .done(function (data) {
      if (data.Code != undefined && data.Code != null && data.Code == 401) {}
      successCallBack(data);
    })
    .fail(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
};

// Web api - Http put operation - record update
esdpec.framework.core.doPutOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'PUT',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(object),
      beforeSend: function (xhr) {
        xhr.setRequestHeader("Authorization", "BasicAuth " + localStorage.getItem('user_token'));
      },
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .success(function (data) {
      successCallBack(data);
    })
    .error(function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    });
}

// Web api - Http post operation - create record
esdpec.framework.core.doPostOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
    url: this.Config.APIBaseUrl + url,
    cache: false,
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify(object),
    statusCode: {
      200: function (data) {
        successCallBack(data);
      }
    },
    beforeSend: function (xhr) {
      $.showPreloader('Please Wait ...');
      setTimeout(function () {
        $.hidePreloader();
      }, 5000);
      xhr.setRequestHeader("Authorization", "BasicAuth " + localStorage.getItem('user_token'));
    },
    complete: function (XMLHttpRequest, textStatus) {
      $.hidePreloader();
      esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
    },
    error: function OnError(xhr, textStatus, err) {
      if (failureCallBack != null) {
        failureCallBack($jQuery.parseJSON(xhr.responseText));
      }
    }
  });
}

// Web api - Http delete operation - delete a record
esdpec.framework.core.doDeleteOperation = function (url, object, successCallBack, failureCallBack) {
  $jQuery.ajax({
      url: this.Config.APIBaseUrl + url,
      cache: false,
      type: 'DELETE',
      data: JSON.stringify(object),
      contentType: 'application/json; charset=utf-8',
      beforeSend: function (xhr) {
        xhr.setRequestHeader("Authorization", "BasicAuth " + localStorage.getItem('user_token'));
      },
      complete: function (XMLHttpRequest, textStatus) {
        esdpec.framework.core.completeRequest(XMLHttpRequest, textStatus);
      }
    })
    .success(function (data) {
      successCallBack(data);
    })
    .fail(function (xhr, textStatus, err) {
      if (failureCallBack != null)
        failureCallBack(xhr, textStatus, err);
    });
}