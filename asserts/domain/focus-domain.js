$(function () {
  'use strict';
  var lastclicktime = null;

  var focusEnum = {
    'commnunicate': 'icon-commnunicate',
    'electronicMeter': 'icon-electronic-meter',
    'electronicPk': 'icon-electronic-pk',
    'energyEfficient': 'icon-energy-efficient',
    'gasMeter': 'icon-gas-meter',
    'gasPk': 'icon-gas-pk',
    'overRun': 'icon-over-run',
    'waterMeter': 'icon-water-meter',
    'waterPk': 'icon-water-pk',
    'other': 'icon-focus-other'
  };

  var getFocusType = function (type) {
    return focusEnum[type];
  };

  var renderFocusList = function (data) {
    var sortedData = {};
    var homeList = _.filter(data.focusList, a => a.IfHomePage);
    var others = _.filter(data.focusList, a => !a.IfHomePage);
    sortedData.focusList = _.concat(homeList, _.sortBy(others, a => a.Index));
    localStorage.setItem('focus_list', JSON.stringify(sortedData));
    var focusHtml = template('focus-list-template', sortedData);
    $jQuery('#focus-list-container').html(focusHtml);
    esdpec.framework.core.swipeDelete('.focus-list .focus-item', '#delete-action', function (deleteItem) {
      console.log(deleteItem);
    });
    $jQuery('.focus-list .focus-item').on('click', function (e) {
      var focusId = $jQuery(e.currentTarget).attr('clickId');
      console.log(focusId);


    });
  };

  var operateMeterTreeAjaxResult = function (response) {
    if (response.IsSuccess && response.Content.length > 0) {
      var meterList = response.Content;
      localStorage.setItem('meter_tree', JSON.stringify(meterList));
      renderMeterTree(meterList, '#', 'forward');
    }
  };

  var loadMeterTree = function (type) {
    switch (type) {
      case 0:
        esdpec.framework.core.getJsonResultSilent("common/gettree", function (response) {
          operateMeterTreeAjaxResult(response);
        });
        break;
      case 1:
        esdpec.framework.core.getJsonResult("common/gettree", function (response) {
          operateMeterTreeAjaxResult(response);
        });
        break;
    }
  }

  var loadFocusListData = function (pageNum, keyword, successCallback) {
    localStorage.setItem('current_focus_page', pageNum);
    esdpec.framework.core.getJsonResult("subscribe/getlist?pageNum=" + pageNum + "&keyword=" + keyword, function (response) {
      var data = {
        focusList: []
      };
      if (response.IsSuccess && response.Content.datas.length > 0) {
        data.focusList = response.Content.datas;
        $jQuery.each(data.focusList, function (index, item) {
          item.FocusType = getFocusType(item.FocusType);
          if (item.IfHomePage) item.IsHomePage = 'home-page-color';
        });
      }
      localStorage.setItem('focus_total_page', response.Content.total_page);
      if (!!successCallback) successCallback;
      renderFocusList(data);
    });
  };

  var renderMeterTree = function (list, parent, type) {
    if (type === 'forward') {
      var path = $jQuery('#parentId').val();
      $jQuery('#parentId').val(path + '||' + parent);
    }
    var children = _.filter(list, a => a.parent === parent);
    _.map(children, a => a.baseInstrument = (a.modeltype === 'meter' || a.modeltype === 'vmeter') ? 'isBasic-instrument' : '');
    var data = {
      meterList: children
    };
    var meterHtml = template('meter-list-template', data);
    $jQuery('#meterListContainer').html(meterHtml);
    $jQuery('.meter-list .meter-item').on('click', function (e) {
      var meterId = $jQuery(e.currentTarget).attr('data-id');
      var allMeterList = localStorage.getItem('meter_tree');
      var meterNodes = JSON.parse(allMeterList);
      var children = _.filter(meterNodes, a => a.parent === meterId);
      if (children.length > 0)
        renderMeterTree(children, meterId, 'forward');
      else {
        var node = _.find(meterNodes, a => a.id === meterId);
        if (node.modeltype === 'vmeter' || node.modeltype === 'meter') {
          $.router.load("#focus-detail-page", true);
          $('#close-panel').click();
        }
      }
    });
    $jQuery('#backParent').on('click', function (e) {
      backNavigate();
    });
  };

  var toggleActive = function () {
    var tabs = $jQuery('.focus-detail-header_tab a');
    $jQuery(tabs).each(function (index, item) {
      $jQuery(item).removeClass('active');
    });
  };

  var ifShowSearch = function (flag) {
    var container = $jQuery('#search-container');
    if (flag) {
      if ($jQuery('#showMoreBtn').attr('data-toggle') === 'open') {
        $jQuery('#search-container').slideDown(300);
        $jQuery('#showMoreBtn').addClass('active');
      } else {
        $jQuery('#search-container').slideUp(300);
        $jQuery('#showMoreBtn').removeClass('active');
        $jQuery('#showMoreBtn').attr('data-toggle', 'close');
      }
    } else if ($jQuery('#showMoreBtn').attr('data-toggle') === 'open') {
      $jQuery('#search-container').slideUp(300);
      $jQuery('#showMoreBtn').removeClass('active');
      $jQuery('#showMoreBtn').attr('data-toggle', 'close');
    }
  };

  var generateChart = function (chartDom) {
    var myChart = echarts.init(chartDom, e_macarons);
    var option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['最高', '最低']
      },
      toolbox: {
        show: true,
        feature: {
          magicType: {
            show: true,
            type: ['line', 'bar']
          }
        }
      },
      calculable: true,
      dataZoom: {
        show: true,
        realtime: true,
        start: 20,
        end: 80
      },
      xAxis: [{
        type: 'category',
        data: function () {
          var list = [];
          for (var i = 1; i <= 30; i++) {
            list.push('2013-03-' + i);
          }
          return list;
        }(),
        axisTick: {
          alignWithLabel: true
        }
      }],
      yAxis: [{
        type: 'value',
        position: 'right'
      }],
      series: [{
          name: '最高',
          type: 'line',
          data: function () {
            var list = [];
            for (var i = 1; i <= 30; i++) {
              list.push(Math.round(Math.random() * 30));
            }
            return list;
          }(),
          markLine: {
            itemStyle: {
              normal: {
                borderWidth: 1,
                lineStyle: {
                  type: 'dash',
                  color: '#c23531',
                  width: 2,
                },
                label: {
                  formatter: '预警值-12.6',
                  textStyle: {
                    fontSize: 12,
                  },
                  position: 'middle'
                }
              },
            },
            data: [{
              name: 'Y 轴值为 100 的水平线',
              yAxis: 12.6
            }]
          },
        },
        {
          name: '最低',
          type: 'line',
          data: function () {
            var list = [];
            for (var i = 1; i <= 30; i++) {
              list.push(Math.round(Math.random() * 10));
            }
            return list;
          }()
        }
      ]
    };

    myChart.setOption(option);
  };

  var formatNumber = function (n) {
    return n < 10 ? "0" + n : n;
  };

  var showParamDetail = function () {
    $.alert(11);
  }

  var backNavigate = function () {
    var pathVal = $jQuery('#parentId').val();
    pathVal = pathVal.substring(2);
    var pathStack = pathVal.split('||');
    if (pathStack.length > 1) {
      var meterList = localStorage.getItem('meter_tree');
      var parent = pathStack[pathStack.length - 2];
      var pathVal = [];
      for (var i = 0; i <= pathStack.length - 2; i++) {
        pathVal[i] = pathStack[i];
      }
      var path = _.join(pathVal, '||');
      $jQuery('#parentId').val('||' + path);
      renderMeterTree(JSON.parse(meterList), parent, 'back');
    }
  }

  var operateBefore = function () {
    if (lastclicktime === null)
      lastclicktime = new Date();
    else {
      var currentTime = new Date();
      if (parseInt(currentTime - lastclicktime) <= 300) {
        //console.log('Frequent operation, no response!');
        return false;
      } else {
        lastclicktime = currentTime;
      }
    }
    return true;
  }

  var bindTabClick = function (page) {
    $("#dataTypePicker").picker({
      toolbarTemplate: '<header class="bar bar-nav">\
    <button class="button button-link pull-right close-picker">\
    确定\
    </button>\
    <h1 class="title">请选择数据类型</h1>\
    </header>',
      cols: [{
        textAlign: 'center',
        values: ['日', '月', '年'],
        cssClass: 'picker-items-col-normal'
      }]
    });
    $("#startDatePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'd');
    $("#endDatePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'm');
    $('#showMoreBtn').on("click", function (e) {
      if (!operateBefore()) return;
      var toggle = $jQuery('#showMoreBtn').attr('data-toggle');
      if (toggle === 'open') {
        $jQuery('#showMoreBtn').attr('data-toggle', 'close');
      } else {
        $jQuery('#showMoreBtn').attr('data-toggle', 'open');
      }
      toggleActive();
      ifShowSearch(true);
    });
    $('#showMenu').on("click", function (e) {
      if (!operateBefore()) return;
      toggleActive();
      $jQuery('#showMenu').addClass('active');
      ifShowSearch(false);
    });
    $('#showDay').on("click", function (e) {
      if (!operateBefore()) return;
      toggleActive();
      $jQuery('#showDay').addClass('active');
      ifShowSearch(false);
    });
    $('#showWeek').on("click", function (e) {
      if (!operateBefore()) return;
      toggleActive();
      $jQuery('#showWeek').addClass('active');
      ifShowSearch(false);
    });
    $('#showMonth').on("click", function (e) {
      if (!operateBefore()) return;
      toggleActive();
      $jQuery('#showMonth').addClass('active');
      ifShowSearch(false);
    });
    $('#showYear').on("click", function (e) {
      if (!operateBefore()) return;
      toggleActive();
      $jQuery('#showYear').addClass('active');
      ifShowSearch(false);
    });
  };

  var pullToLoadFocusList = function (page) {
    var $content = $(page).find(".content").on('refresh', function (e) {
      var currentPage = localStorage.getItem('current_focus_page');
      var totalPage = localStorage.getItem('focus_total_page');
      var pageNum = parseFloat(currentPage) + 1;
      if (pageNum <= parseInt(totalPage))
        loadFocusListData(pageNum, '');
      setTimeout(() => $.pullToRefreshDone($content), 2000);
    });
  };

  $(document).on('click', '.tree-menu', function (e) {
    $.allowPanelOpen = true;
    $.openPanel('#tree-panel');
  })

  $(document).on('click', '#refreshCurrentNodeData', function () {
    var path = $jQuery('#parentId').val();
    var pathStack = path.split('||');
    var parentId = pathStack[pathStack.length - 1];
    if (parentId === '#')
      loadMeterTree(1);
    else
      esdpec.framework.core.getJsonResult('common/getchildtree?nodeId=' + parentId, function (response) {
        if (response.IsSuccess && response.Content.length > 0) {
          var children = response.Content;
          var meterJson = localStorage.getItem('meter_tree');
          var meterList = JSON.parse(meterJson);
          var residueMeters = _.filter(meterList, a => a.parent !== parentId);
          var newMeters = _.concat(residueMeters, children);
          localStorage.setItem('meter_tree', JSON.stringify(newMeters));
          renderMeterTree(newMeters, parentId, 'forward');
        }
      });
  });

  $(document).on('click', '#search-btn', function (e) {
    var keyword = $jQuery('#search').val();
    loadFocusListData(1, keyword);
  });

  $(document).on('click', '#sethome', function (e) {
    console.log('sethome');
  });

  $(document).on('click', '#setindex', function (e) {
    console.log('setindex');
  });

  $(document).on("pageInit", "#page-focus", function (e, id, page) {
    loadFocusListData(1, '');
    loadMeterTree(0);
    pullToLoadFocusList(page);
  });

  $(document).on("pageInit", "#focus-detail-page", function (e, id, page) {
    $('#close-panel').click();
    bindTabClick(page);
    generateChart(document.getElementById('echarts'));
  });

  $.init();
});