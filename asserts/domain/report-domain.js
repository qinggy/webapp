$(function () {
  'use strict';

  var reportEnum = {
    'bz': 'icon-bz',
    'fgp': 'icon-fgp',
    'hb': 'icon-hb',
    'lhs': 'icon-lhs',
    'nbb': 'icon-year-month',
    'rcb': 'icon-rcb',
    'rkb': 'icon-rksjhw',
    'sjd': 'icon-sjdcb',
    'tb': 'icon-tb',
    'ybb': 'icon-month-day'
  };

  var getReportType = function (type) {
    return reportEnum[type];
  };

  $(document).on("pageInit", '#page-report', function (e, id, page) {
    esdpec.framework.core.getJsonResult("reportmodule/list1", function (response) {
      var data = {
        reportList: []
      };
      var reportHtml = $jQuery('#report-no-content-template').html();
      if (response.IsSuccess && response.Content.length > 0) {
        data.reportList = response.Content;
        $jQuery.each(data.reportList, function (index, item) {
          item.ReportType = getReportType(item.ReportType);
        });
        reportHtml = template('report-list-template', data);
        $jQuery('#report-list-container').removeClass('report-no-margin').html(reportHtml);
        $(page).on('click', 'li.report-li a', function (e) {
          var reportDom = $jQuery(e.currentTarget);
          var pageTitle = reportDom.attr('data-title');
          var pdfUrl = reportDom.attr('data-url');
          if (!!pdfUrl && _.endsWith(pdfUrl, '.pdf'))
            window.location.href = esdpec.framework.core.Config.BaseWebSiteUrl + "src/report/viewer.html?file=" + pdfUrl + "&name=" + encodeURIComponent(pageTitle);
          else
            $.alert("没有获取到报表文件，无法预览");
        });
      } else {
        $jQuery('#report-list-container').addClass('report-no-margin').html(reportHtml);
      }
    });
  });

  $.init();
});