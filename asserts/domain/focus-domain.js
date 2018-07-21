$(function () {
  'use strict';
  let lastclicktime = null;
  let currentClickMeters = [];

  let focusEnum = {
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

  let getFocusType = function (type) {
    return focusEnum[type];
  };

  let renderFocusList = function (data) {
    let sortedData = {};
    let homeList = _.filter(data.focusList, a => a.IfHomePage);
    let others = _.filter(data.focusList, a => !a.IfHomePage);
    sortedData.focusList = _.concat(homeList, _.sortBy(others, a => a.Index));
    localStorage.setItem('focus_list', JSON.stringify(sortedData));
    let focusHtml = template('focus-list-template', sortedData);
    $jQuery('#focus-list-container').html(focusHtml);
    esdpec.framework.core.swipeDelete('.focus-list .focus-item', '#delete-action', function (deleteItem) {
      console.log(deleteItem);
    });
    $jQuery('.focus-list .focus-item').on('click', function (e) {
      let focusId = $jQuery(e.currentTarget).attr('clickId');
      console.log(focusId);


    });
  };

  let operateMeterTreeAjaxResult = function (response) {
    if (response.IsSuccess && response.Content.length > 0) {
      let meterList = response.Content;
      localStorage.setItem('meter_tree', JSON.stringify(meterList));
      renderMeterTree(meterList, '#', 'forward');
    }
  };

  let loadMeterTree = function (type) {
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

  let loadFocusListData = function (pageNum, keyword, successCallback) {
    localStorage.setItem('current_focus_page', pageNum);
    esdpec.framework.core.getJsonResult("subscribe/getlist?pageNum=" + pageNum + "&keyword=" + keyword, function (response) {
      let data = {
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

  let renderMeterTree = function (list, parent, type) {
    if (type === 'forward') {
      let path = $jQuery('#parentId').val();
      $jQuery('#parentId').val(path + '||' + parent);
    }
    let children = _.filter(list, a => a.parent === parent);
    _.map(children, a => a.baseInstrument = (a.modeltype === 'meter' || a.modeltype === 'vmeter') ? 'isBasic-instrument' : '');
    let data = {
      meterList: children
    };
    let meterHtml = template('meter-list-template', data);
    $jQuery('#meterListContainer').html(meterHtml);
    $jQuery('.meter-list .meter-item').on('click', function (e) {
      let meterId = $jQuery(e.currentTarget).attr('data-id');
      let allMeterList = localStorage.getItem('meter_tree');
      let meterNodes = JSON.parse(allMeterList);
      let children = _.filter(meterNodes, a => a.parent === meterId);
      if (children.length > 0)
        renderMeterTree(children, meterId, 'forward');
      else {
        let node = _.find(meterNodes, a => a.id === meterId);
        if (node.modeltype === 'vmeter' || node.modeltype === 'meter') {
          currentClickMeters = [];
          currentClickMeters.push(node);
          $.router.load("#focus-detail-page", true);
          $('#close-panel').click();
        }
      }
    });
    $jQuery('#backParent').on('click', function (e) {
      backNavigate();
    });
  };

  let toggleActive = function () {
    let tabs = $jQuery('.focus-detail-header_tab a');
    $jQuery(tabs).each(function (index, item) {
      $jQuery(item).removeClass('active');
    });
  };

  let ifShowSearch = function (flag) {
    let container = $jQuery('#search-container');
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

  let generateChart = function (chartDom, data) {
    let myChart = echarts.init(chartDom, e_macarons);
    let option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: data.legend,
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
        start: 0,
        end: 60
      },
      xAxis: [{
        type: 'category',
        data: data.xAxisData,
        axisTick: {
          alignWithLabel: true
        }
      }],
      yAxis: data.yAxisData,
      series: data.series
    };

    myChart.setOption(option);
  };

  let formatNumber = function (n) {
    return n < 10 ? "0" + n : n;
  };

  let showParamDetail = function () {
    $.alert(11);
  }

  let backNavigate = function () {
    let pathVal = $jQuery('#parentId').val();
    pathVal = pathVal.substring(2);
    let pathStack = pathVal.split('||');
    if (pathStack.length > 1) {
      let meterList = localStorage.getItem('meter_tree');
      let parent = pathStack[pathStack.length - 2];
      let pathVal = [];
      for (let i = 0; i <= pathStack.length - 2; i++) {
        pathVal[i] = pathStack[i];
      }
      let path = _.join(pathVal, '||');
      $jQuery('#parentId').val('||' + path);
      renderMeterTree(JSON.parse(meterList), parent, 'back');
    }
  }

  let operateBefore = function () {
    if (lastclicktime === null)
      lastclicktime = new Date();
    else {
      let currentTime = new Date();
      if (parseInt(currentTime - lastclicktime) <= 300) {
        console.log('Frequent operation, no response!');
        return false;
      } else {
        lastclicktime = currentTime;
      }
    }
    return true;
  }

  let bindTabClick = function (page) {
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
  };

  let pullToLoadFocusList = function (page) {
    let $content = $(page).find(".content").on('refresh', function (e) {
      let currentPage = localStorage.getItem('current_focus_page');
      let totalPage = localStorage.getItem('focus_total_page');
      let pageNum = parseFloat(currentPage) + 1;
      if (pageNum <= parseInt(totalPage))
        loadFocusListData(pageNum, '');
      setTimeout(() => $.pullToRefreshDone($content), 2000);
    });
  };

  let getSearchType = function () {
    let activeDoms = $('#datatab a.active');
    if (activeDoms.length <= 0)
      $('#showDay').addClass('active');
    return $('#datatab a.active').attr('data-type');
  }

  let getXAxisData = function (type) {
    switch (type) {
      case '1':
        break;
      case '2':
        return function () {
          let list = [];
          for (let i = 1; i <= 23; i++) {
            if (i <= 9) list.push('0' + i);
            else list.push(i);
          }
          return list;
        }();
      case '3':
        return ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天'];
      case '4':
        return function () {
          let list = [];
          for (let i = 1; i <= 31; i++) {
            if (i <= 9) list.push('0' + i);
            else list.push(i);
          }
          return list;
        }();
      case '5':
        return function () {
          let list = [];
          for (let i = 1; i <= 12; i++) {
            if (i <= 9) list.push('0' + i);
            else list.push(i);
          }
          return list;
        }();
      case '6':
        break;
    }
  };

  let getLegendTitle = function (type, comparsion) {
    if (!comparsion) {
      switch (type) {
        case '1':
          break;
        case '2':
          return ['昨日', '今日'];
        case '3':
          return ['上周', '本周'];
        case '4':
          return ['上月', '本月'];
        case '5':
          return ['去年', '今年'];
        case '6':
          break;
      }
    }
    return '';
  };

  let getChartSeries = function (SeriesData, xAxis, rule) {
    let seriesOption = []
    _.forEach(SeriesData, s => {
      let formatData = _.map(s.data, a => {
        return {
          val: a.val,
          date: a.date.substring(a.date.length - 2)
        };
      });
      let option = {};
      option.name = s.name;
      option.type = 'line';
      option.data = _.map(xAxis, a => {
        var valueItem = _.find(formatData, b => b.date === a);
        return !!valueItem ? valueItem.val : 0;
      });
      option.markLine = {
        itemStyle: {
          normal: {
            borderWidth: 1,
            lineStyle: {
              type: 'dash',
              color: '#c23531',
              width: 2,
            }
          }
        },
        data: []
      };
      if (rule != null) {
        if (rule.LowerLimit != null) {
          option.markLine.data.push({
            name: 'LowerLimit',
            label: {
              formatter: '下线报警-' + rule.LowerLimit,
              textStyle: {
                fontSize: 12,
              },
              position: 'middle'
            },
            yAxis: rule.LowerLimit
          });
          if (rule.LowerWave != null) {
            let waveValue = rule.LowerLimit + rule.LowerWave;
            option.markLine.data.push({
              name: 'LowerWave',
              label: {
                formatter: '下线预警-' + waveValue,
                textStyle: {
                  fontSize: 12,
                },
                position: 'middle'
              },
              yAxis: waveValue
            });
          }
        }
        if (rule.UpperLimit != null) {
          option.markLine.data.push({
            name: 'UpperLimit',
            label: {
              formatter: '上线报警-' + rule.UpperLimit,
              textStyle: {
                fontSize: 12,
              },
              position: 'middle'
            },
            yAxis: rule.UpperLimit
          });
          if (rule.UpperWave != null) {
            let waveValue = rule.UpperLimit - rule.UpperWave;
            option.markLine.data.push({
              name: 'LowerWave',
              label: {
                formatter: '上线预警-' + waveValue,
                textStyle: {
                  fontSize: 12,
                },
                position: 'middle'
              },
              yAxis: waveValue
            });
          }
        }
      }

      // option.markLine = 
      seriesOption.push(option);
    });
    return seriesOption;
  };

  let generateUrlPara = function (mId, qtype, ptype, dtype, stime, etime, mfIds) {
    let urlPara = 'meterId=' + mId + '&queryType=' + qtype + '&paraType=' + ptype + '&dateType=' + dtype + '&sTime=' + stime + '&eTime=' + etime;
    if (!!mfIds) {
      let mfids = '&mfids='
      $jQuery.each(mfIds, function (index, mfId) {
        mfids += mfId + ',';
      });
      mfids = mfids.substring(0, mfids.length - 1);
      urlPara += mfids;
    }
    return urlPara + '&mfids=';
  };

  let renderFocusMeter = function () {
    let lastNode = _.last(currentClickMeters);
    _.map(currentClickMeters, a =>
      lastNode.id === a.id ? a.activeClass = 'current-active' : '');
    let meterHeaderData = {
      focusMeterList: currentClickMeters
    };
    let meterNameTemplate = template('meter-header-template', meterHeaderData);
    $('#headerContainer').html(meterNameTemplate);
  };

  let getComparsionData = function () {

  };

  let renderAggregateData = function (data) {
    let aggregateHtml = template('data-template', data);
    $('#summary-total-data').html(aggregateHtml);
    let avgHtml = template('avg-data-template', data);
    $('#avg-total-data').html(avgHtml);
  };

  let renderAlartData = function () {

    let alertHtml = template('alert-data-template', data);
    $('#alert-data-container').html(alertHtml);
  };

  let renderGaugeData = function () {

  };

  let getFocusMeterData = function (node, queryType, paraType, dateType, sTime, eTime, mfIds, ifComparsion) {
    if (!ifComparsion) {
      let param = _.find(node.parameters, a => a.type === 0);
      let urlParam = generateUrlPara(node.id, queryType, paraType, dateType, sTime, eTime, mfIds);
      esdpec.framework.core.getJsonResultSilent("dataanalysis/getdata?" + urlParam, function (response) {
        if (response.IsSuccess) {
          console.log(response.Content);
          let data = {};
          let legendTitle = getLegendTitle(dateType);
          data.legend = {
            data: legendTitle
          };
          data.yAxisData = [{
            type: 'value',
            position: 'right',
            axisLabel: {
              //formatter: '{value} ' + param.unit
              formatter: '{value} '
            }
          }];
          data.xAxisData = getXAxisData(dateType);
          data.series = getChartSeries([{
            data: response.Content.last_data_list,
            name: _.head(legendTitle)
          }, {
            data: response.Content.now_data_list,
            name: _.last(legendTitle)
          }], getXAxisData(dateType), response.Content.rule);
          renderAggregateData({
            sum_per: response.Content.sum_per.toFixed(2),
            sum_val: response.Content.sum_val.toFixed(2),
            avg_per: response.Content.avg_per.toFixed(2),
            avg_val: response.Content.avg_val.toFixed(2),
            unit: param.unit,
            summargyClass: response.Content.sum_per > 0,
            avgClass: response.Content.avg_per > 0,
          });
          renderAlartData({});
          renderGaugeData({});
          generateChart(document.getElementById('echarts'), data);
        }
      });
    } else getComparsionData();
  };

  let getMeterFocusData = function () {
    if (currentClickMeters.length <= 0) return;
    let firstNode = _.head(currentClickMeters);
    var dateType = getSearchType();
    //new Promise
    esdpec.framework.core.getJsonResult("dataanalysis/getparasbymeterid?meterId=" + firstNode.id, function (response) {
      if (response.IsSuccess) {
        firstNode.parameters = response.Content;
        let defaultChoosePara = _.find(firstNode.parameters, a => a.type === 0);
        //render parameter container
        _.map(firstNode.parameters, a => {
          if (a.id === defaultChoosePara.id) a.checked = "checked";
        });
        $('#current-unit').text(defaultChoosePara.unit);
        let parameterHtml = template('parameter-template', {
          parameterList: firstNode.parameters
        });
        $('#parameter-container').html(parameterHtml);
        getFocusMeterData(firstNode, 0, 0, dateType, new Date().format('yyyy-MM-dd 00:00:01'), new Date().format('yyyy-MM-dd 23:59:59'), [defaultChoosePara.id], currentClickMeters.length > 1);
      }
    });
  };

  $(document).on('click', '.tree-menu', function (e) {
    $.allowPanelOpen = true;
    $.openPanel('#tree-panel');
  })

  $(document).on('click', '#refreshCurrentNodeData', function () {
    let path = $jQuery('#parentId').val();
    let pathStack = path.split('||');
    let parentId = pathStack[pathStack.length - 1];
    if (parentId === '#')
      loadMeterTree(1);
    else
      esdpec.framework.core.getJsonResult('common/getchildtree?nodeId=' + parentId, function (response) {
        if (response.IsSuccess && response.Content.length > 0) {
          let children = response.Content;
          let meterJson = localStorage.getItem('meter_tree');
          let meterList = JSON.parse(meterJson);
          let residueMeters = _.filter(meterList, a => a.parent !== parentId);
          let newMeters = _.concat(residueMeters, children);
          localStorage.setItem('meter_tree', JSON.stringify(newMeters));
          renderMeterTree(newMeters, parentId, 'forward');
        }
      });
  });

  $('#param-switch').on('click', function (e) {
    let toggleStatus = $('#parameter-container').attr('data-toggle');
    if (toggleStatus === 'open') {
      $jQuery('#parameter-container').attr('data-toggle', 'close').slideUp(300);
    } else {
      $jQuery('#parameter-container').attr('data-toggle', 'open').slideDown(300);
    }
  })

  $(document).on('click', '#search-btn', function (e) {
    let keyword = $jQuery('#search').val();
    loadFocusListData(1, keyword);
  });

  $(document).on('click', '#sethome', function (e) {
    console.log('sethome');
  });

  $(document).on('click', '#setindex', function (e) {
    console.log('setindex');
  });

  $('#showMoreBtn').on("click", function (e) {
    if (!operateBefore()) return;
    let toggle = $jQuery('#showMoreBtn').attr('data-toggle');
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
    getFocusMeterData();
  });
  $('#showWeek').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showWeek').addClass('active');
    ifShowSearch(false);
    getFocusMeterData();
  });
  $('#showMonth').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showMonth').addClass('active');
    ifShowSearch(false);
    getFocusMeterData();
  });
  $('#showYear').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showYear').addClass('active');
    ifShowSearch(false);
    getFocusMeterData();
  });

  $(document).on("pageInit", "#page-focus", function (e, id, page) {
    loadFocusListData(1, '');
    loadMeterTree(0);
    pullToLoadFocusList(page);
  });

  $(document).on("pageInit", "#focus-detail-page", function (e, id, page) {
    $('#close-panel').click();
    bindTabClick(page);
    renderFocusMeter();
    getMeterFocusData();
  });

  $.init();
});