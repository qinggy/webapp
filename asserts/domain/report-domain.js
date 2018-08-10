$(function () {
  'use strict';

  let currentPageNum = 1,
    totalPage = 1,
    keyword;
  let reportEnum = {
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
  let getReportType = function (type) {
    return reportEnum[type];
  };
  let urlParm = 'pageNum=' + currentPageNum + '&keyword=' + keyword;
  let loadReportListData = () => {
    esdpec.framework.core.getJsonResult("report/getlist?" + urlParm, function (response) {
      let data = {
        reportList: []
      };
      let reportHtml = $('#report-no-content-template').html();
      if (response.IsSuccess && response.Content && response.Content.datas.length > 0) {
        data.reportList = response.Content;
        $jQuery.each(data.reportList, function (index, item) {
          item.ReportType = getReportType(item.ReportType);
        });
        reportHtml = template('report-list-template', data);
        $('#report-list-container').removeClass('report-no-margin').html(reportHtml);
        esdpec.framework.core.swipeDelete('.report-list .report-li', '#delete-action', function (deleteItem) {
          console.log(deleteItem);
        });
        $(page).on('click', 'li.report-li a', function (e) {
          let reportDom = $jQuery(e.currentTarget);
          let pageTitle = reportDom.attr('data-title');
          let pdfUrl = reportDom.attr('data-url');
          if (!!pdfUrl && _.endsWith(pdfUrl, '.pdf'))
            window.location.href = esdpec.framework.core.Config.BaseWebSiteUrl + "src/report/viewer.html?file=" + pdfUrl + "&name=" + encodeURIComponent(pageTitle);
          else
            $.alert("没有获取到报表文件，无法预览");
        });
      } else {
        $('#report-list-container').addClass('report-no-margin').html(reportHtml);
        $('#report-list-container').parent().addClass('inner-padding');
      }
    });
  };
  let pullToLoadReportList = page => {
    let $content = $(page).find(".content").on('refresh', function (e) {
      currentPageNum = parseFloat(currentPageNum) + 1;
      if (currentPageNum <= parseInt(totalPage))
        loadReportListData(currentPageNum, '');
      setTimeout(() => $.pullToRefreshDone($content), 2000);
    });
  };
  $(document).on("pageInit", '#page-report', function (e, id, page) {
    currentPageNum = 1;
    loadReportListData();
    pullToLoadReportList(page);
  });

  $.init();
});