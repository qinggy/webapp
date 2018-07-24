$(function () {
  'use strict';
  let lastclicktime = null;
  let currentUnit = null;
  let globalsTime = '',
    globaleTime = '';
  let currentClickMeters = [];
  let globalFocusList = [],
    meterTree = [],
    currentPage = 1,
    totalPage = 1,
    globalQueryType,
    globalDataType,
    globalDateType;
  let focusEnum = {
    // 'commnunicate': 'icon-commnunicate',
    // 'electronicMeter': 'icon-electronic-meter',
    // 'electronicPk': 'icon-electronic-pk',
    // 'energyEfficient': 'icon-energy-efficient',
    // 'gasMeter': 'icon-gas-meter',
    // 'gasPk': 'icon-gas-pk',
    // 'overRun': 'icon-over-run',
    // 'waterMeter': 'icon-water-meter',
    // 'waterPk': 'icon-water-pk',
    // 'other': 'icon-focus-other'    
    0: 'icon-focus-other',
    1: 'icon-electronic-meter',
    2: 'icon-electronic-pk',
    3: 'icon-commnunicate',
    4: 'icon-over-run',
    5: 'icon-energy-efficient',
    6: 'icon-gas-meter',
    7: 'icon-focus-other'
  };
  let energyEnum = {
    WAT001: '水',
    ELE001: '电',
    GAS001: '气',
    COA001: '煤',
    COL001: '冷量',
    OTH: '其他',
    PEO: '人数',
    ARE: '面积',
    Production: '产能',
    GDP: '产值',
    TheoreticalCollection: '理论采集量',
    ActualCollection: '实际采集量'
  };
  let queryType = {
    convenient: 0,
    custom: 1
  };
  let paraType = {
    aggregateValue: 0,
    instantaneousValue: 1
  };
  let dateType = {
    hour: 1,
    day: 2,
    week: 3,
    month: 4,
    year: 5,
    more: 6
  };
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
  let getCustomXAxisData = function (sTime, eTime, type) {
    switch (type) {
      case '2':
        let dayxAxis = [];
        let startTime = new Date(sTime.substring(0, 10));
        let endTime = new Date(eTime.substring(0, 10));
        for (let i = startTime; i <= endTime; i = i.addDays(1)) {
          dayxAxis.push(i.format('yyyy-MM-dd'));
        }
        return dayxAxis;
      case '4':
        let monthxAxis = [];
        let monthStartTime = new moment(sTime.substring(0, 7));
        let monthEndTime = new moment(eTime.substring(0, 7));
        for (let i = monthStartTime; i <= monthEndTime; i = i.add(1, 'months')) {
          monthxAxis.push(i.format('YYYY-MM'));
        }
        return monthxAxis;
      case '5':
        let yearxAxis = [];
        let ssTime = sTime.substring(0, 4);
        let eeTime = eTime.substring(0, 4);
        for (let i = parseInt(ssTime); i <= parseInt(eeTime); i++) {
          yearxAxis.push(i);
        }
        return yearxAxis;
    }
  };
  let getLegendTitle = function (type, searchType, comparsion) {
    if (!comparsion) {
      switch (type) {
        case '1':
          break;
        case '2':
          return searchType === queryType.convenient ? ['昨日', '今日'] : ['日数据'];
        case '3':
          return ['上周', '本周'];
        case '4':
          return searchType === queryType.convenient ? ['上月', '本月'] : ['月数据'];
        case '5':
          return searchType === queryType.convenient ? ['去年', '今年'] : ['年数据'];
        case '6':
          break;
      }
    }
    return '';
  };
  let ifComparsion = () => currentClickMeters.length > 1;
  let getDateType = () => {
    let activeDoms = $('#datatab a.active');
    if (activeDoms.length <= 0)
      $('#showDay').addClass('active');
    return $('#datatab a.active').attr('data-type');
  };
  let getActiveMeterId = () => {
    let headers = $('#headerContainer span.current-active');
    let currentNode = _.head(headers);
    return $(currentNode).attr('data-id');
  };
  let getActiveParameters = () => {
    let allParaDoms = $('#parameter-container a.checked');
    let firstPara = _.head(allParaDoms);
    let activeParams = {
      parameterList: [],
      type: -1,
    };
    _.forEach(allParaDoms, para => {
      activeParams.parameterList.push({
        id: $(para).attr('data-id'),
        type: $(para).attr('data-type')
      });
    });
    activeParams.type = allParaDoms.length > 0 ? $(firstPara).attr('data-type') : -1;
    return activeParams;
  };
  let getFocusType = function (type) {
    return focusEnum[type];
  };
  let getWeek = () => {
    let weekOfday = parseInt(moment().format('E'));
    let last_monday = moment().subtract(weekOfday - 1, 'days').format('YYYY-MM-DD 00:00:01');
    let last_sunday = moment().add(7 - weekOfday, 'days').format('YYYY-MM-DD 23:59:59');
    return {
      monday: last_monday,
      sunday: last_sunday
    };
  };
  let getMonth = (date) => {
    let vStartDate = new moment().add('month', date).format("YYYY-MM") + '-01 00:00:01';
    let vEndM = moment(vStartDate).add('month', 1).add('days', -1);
    let vEndDate = moment(vEndM).format("YYYY-MM-DD 23:59:59");
    return {
      firstDay: vStartDate,
      lastDay: vEndDate
    }
  };
  let getYear = (date) => {
    let vStartDate = new moment().add('year', date).format('YYYY') + "-01-01 00:00:01";
    let vEndM = moment(vStartDate).add('year', 1).add('year', -1);
    let vEndDate = moment(vEndM).format("YYYY") + "-12-31 23:59:59";
    return {
      firstDay: vStartDate,
      lastDay: vEndDate
    }
  };
  let getNumOfWeek = (date) => {
    let weekOfDay = new moment(date).format('E');
    switch (weekOfDay) {
      case '1':
        return '星期一';
      case '2':
        return '星期二';
      case '3':
        return '星期三';
      case '4':
        return '星期四';
      case '5':
        return '星期五';
      case '6':
        return '星期六';
      case '7':
        return '星期天';
    }
  };
  let getDaysOfMonth = function (year, month) {
    month = parseInt(month, 10);
    var d = new Date(year, month, 0);
    return d.getDate();
  };
  let renderFocusList = function (data) {
    let sortedData = {};
    let homeList = _.filter(data.focusList, a => a.is_index);
    let others = _.filter(data.focusList, a => !a.is_index);
    sortedData.focusList = _.concat(homeList, _.sortBy(others, a => a.Index));
    globalFocusList = sortedData;
    let focusHtml = template('focus-list-template', sortedData);
    $('#focus-list-container').html(focusHtml);
    esdpec.framework.core.swipeDelete('.focus-list .focus-item', '.delete-action', function (deleteItem) {
      console.log(deleteItem);
      esdpec.framework.core.doDeleteOperation('subscribe/unsubscribe?id=' + deleteItem, {}, function (response) {
        if (response.IsSuccess) {
          _.remove(globalFocusList.focusList, a => a.id === deleteItem);
          $('#' + deleteItem).remove();
        }
      });
    });
    $('.focus-list li.focus-item').on('click', function (e) {
      let focusId = $(e.currentTarget).attr('id');
      console.log(focusId);

      currentClickMeters = [];

    });
    $('.set-home').on('click', function (e) {
      let currentDom = $(e.currentTarget);
      let focusId = currentDom.attr('data-id');
      if (_.isEqual(focusId, '')) {
        $.toast('请刷新列表后，再重试');
        return;
      }
      let currentHome = _.find(globalFocusList.focusList, a => a.is_index);
      if (currentHome) {
        $.confirm('当前账号已设置主页，重复设置会覆盖原有的设置，是否继续？',
          () => {
            esdpec.framework.core.doPutOperation('subscribe/setindex?id=' + focusId, {}, function (response) {
              if (response.IsSuccess && response.Content) {
                _.forEach(globalFocusList.focusList, a => {
                  if (a.id === focusId) {
                    a.is_index = true;
                    a.isHomePage = 'home-page-color';
                  } else {
                    a.is_index = false;
                    a.isHomePage = '';
                  }
                })
                renderFocusList(globalFocusList);
              }
            });
          }, () => {}
        );
      } else {
        esdpec.framework.core.doPutOperation('subscribe/setindex?id=' + focusId, {}, function (response) {
          if (response.IsSuccess && response.Content) {
            _.forEach(globalFocusList.focusList, a => {
              if (a.id === focusId) {
                a.is_index = true;
                a.isHomePage = 'home-page-color';
              } else {
                a.is_index = false;
                a.isHomePage = '';
              }
            })
            renderFocusList(globalFocusList);
          }
        });
      }
      e.stopPropagation();
    });
    $('.set-index').on('click', function (e) {
      let currentDom = $(e.currentTarget);
      let focusId = currentDom.attr('data-id');
      if (_.isEqual(focusId, '')) {
        $.toast('请刷新列表后，再重试');
        return;
      }
      let para = {
        id: focusId,
        index: _.find(globalFocusList.focusList, a => a.id === focusId).index
      };
      if (_.isEqual(parseInt(para.index), 0)) {
        $.toast('当前位置已在最前，不可再往前');
        return;
      }
      para.new_index = parseInt(para.index) - 1;
      esdpec.framework.core.doPutOperation('subscribe/sort', para, function (response) {
        if (response.IsSuccess && response.Content) {
          _.forEach(globalFocusList.focusList, a => {
            if (a.id === focusId) a.index = para.new_index;
          });
          renderFocusList(globalFocusList);
        }
      });
      e.stopPropagation();
    });
  };
  let operateMeterTreeAjaxResult = function (response) {
    if (response.IsSuccess && response.Content.length > 0) {
      let meterList = response.Content;
      meterTree = meterList;
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
  };
  let loadFocusListData = function (pageNum, keyword, successCallback) {
    currentPage = pageNum;
    esdpec.framework.core.getJsonResult("subscribe/getlist?pageNum=" + pageNum + "&keyword=" + keyword, function (response) {
      let data = {
        focusList: []
      };
      if (response.IsSuccess && response.Content.datas.length > 0) {
        data.focusList = response.Content.datas;
        $jQuery.each(data.focusList, function (index, item) {
          item.focusType = getFocusType(item.stype);
          if (item.is_index) item.isHomePage = 'home-page-color';
        });
      }
      totalPage = response.Content.total_page;
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
      let meterNodes = meterTree;
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
        end: 100 //data.dataZoom.end
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

    myChart.setOption(option, true);
  };
  let formatNumber = function (n) {
    return n < 10 ? "0" + n : n;
  };
  let backNavigate = function () {
    let pathVal = $jQuery('#parentId').val();
    pathVal = pathVal.substring(2);
    let pathStack = pathVal.split('||');
    if (pathStack.length > 1) {
      let parent = pathStack[pathStack.length - 2];
      let pathVal = [];
      for (let i = 0; i <= pathStack.length - 2; i++) {
        pathVal[i] = pathStack[i];
      }
      let path = _.join(pathVal, '||');
      $jQuery('#parentId').val('||' + path);
      renderMeterTree(meterTree, parent, 'back');
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
      }],
      onClose: function (e) {
        let chooseValue = _.head(e.value);
        switch (chooseValue) {
          case '日':
            $("#startDatePicker").datePicker({
              value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
            }, 'd');
            $("#endDatePicker").datePicker({
              value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
            }, 'd');
            break;
          case '月':
            $("#startDatePicker").datePicker({
              value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1)],
            }, 'm');
            $("#endDatePicker").datePicker({
              value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1)],
            }, 'm');
            break;
          case '年':
            $("#startDatePicker").datePicker({
              value: [new Date().getFullYear()],
            }, 'y');
            $("#endDatePicker").datePicker({
              value: [new Date().getFullYear()],
            }, 'y');
            break;
        }
      }
    });
    $("#startDatePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'd');
    $("#endDatePicker").datePicker({
      value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
    }, 'd');
  };
  let pullToLoadFocusList = function (page) {
    let $content = $(page).find(".content").on('refresh', function (e) {
      let pageNum = parseFloat(currentPage) + 1;
      if (pageNum <= parseInt(totalPage))
        loadFocusListData(pageNum, '');
      setTimeout(() => $.pullToRefreshDone($content), 2000);
    });
  };
  let getSeriesPara = (response, searchType, legendTitle) =>
    !ifComparsion() ? searchType === queryType.convenient ? [{
      data: response.last_data_list === null ? [] : response.last_data_list,
      name: _.head(legendTitle)
    }, {
      data: response.now_data_list === null ? [] : response.now_data_list,
      name: _.last(legendTitle)
    }] : [{
      data: response.now_data_list,
      name: _.last(legendTitle)
    }] : [];
  let getChartSeries = function (SeriesData, xAxis, rule, dateType, searchType) {
    let seriesOption = [];
    _.forEach(SeriesData, s => {
      let formatData = [];
      if (searchType === queryType.convenient) {
        formatData = _.map(s.data, a => {
          return {
            val: a.val,
            date: parseInt(dateType) === 3 ? getNumOfWeek(a.date) : a.date.substring(a.date.length - 2)
          };
        });
      } else {
        formatData = _.map(s.data, a => {
          let date = '';
          switch (parseInt(dateType)) {
            case 2:
              date = a.date.substring(0, 10);
              break;
            case 4:
              date = a.date.substring(0, 7);
              break;
            case 5:
              date = a.date.substring(0, 4);
              break;
          }
          return {
            val: a.val,
            date: date
          };
        });
      }
      let option = {};
      option.name = s.name;
      option.type = 'line';
      option.data = _.map(xAxis, a => {
        var valueItem = _.find(formatData, b => b.date === _.toString(a));
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
              formatter: '下线报警(' + rule.LowerLimit + ')',
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
                formatter: '下线预警(' + waveValue + ')',
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
              formatter: '上线报警(' + rule.UpperLimit + ')',
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
                formatter: '上线预警(' + waveValue + ')',
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
    if (data.avg_val < 1000) data.avg_font_size = '1.25rem';
    else if (data.avg_val > 1000 && data.avg_val < 10000) data.avg_font_size = '1rem';
    else if (data.avg_val > 10000 && data.avg_val < 100000) data.avg_font_size = '0.9rem';
    else if (data.avg_val > 100000 && data.avg_val < 1000000) data.avg_font_size = '0.8rem';
    else if (data.avg_val > 1000000 && data.avg_val < 10000000) data.avg_font_size = '0.7rem';
    else data.avg_font_size = '0.65rem';
    if (data.sum_val < 1000) data.sum_font_size = '1.25rem';
    else if (data.sum_val > 1000 && data.sum_val < 10000) data.sum_font_size = '1rem';
    else if (data.sum_val > 10000 && data.sum_val < 100000) data.sum_font_size = '0.9rem';
    else if (data.sum_val > 100000 && data.sum_val < 1000000) data.sum_font_size = '0.8rem';
    else if (data.sum_val > 1000000 && data.sum_val < 10000000) data.sum_font_size = '0.7rem';
    else data.sum_font_size = '0.65rem';
    let aggregateHtml = template('data-template', data);
    $('#summary-total-data').html(aggregateHtml);
    let avgHtml = template('avg-data-template', data);
    $('#avg-total-data').html(avgHtml);
  };
  let renderAlartData = function (alertVal) {
    let firstNode = _.head(currentClickMeters);
    firstNode.alert_count = alertVal;
    let data = {
      meterList: [firstNode]
    }
    let alertHtml = template('alert-data-template', data);
    $('#alert-data-container').html(alertHtml);
  };
  let renderGaugeData = function () {
    let currentMeterId = getActiveMeterId();
    let currentMeter = _.find(currentClickMeters, a => a.id === currentMeterId);
    if (!!currentMeter) {
      let parameters = currentMeter.parameters;
      let orderData = _.orderBy(parameters, ['type'], ['asc'])
      let data = {
        parameterList: orderData
      };
      let gaugeDataHtml = template('gaugeData-template', data);
      $('#gaugeDataContainer').html(gaugeDataHtml);

      $('#gaugeDataContainer li.item-content').on('click', function (e) {
        let currentDom = e.currentTarget;
        let mfId = $(currentDom).attr('data-id');
        let fixedParaDom = $('#showParamMore_' + mfId);
        let fixedHtml = fixedParaDom.html();
        if (_.isEqual(fixedHtml, '')) {
          esdpec.framework.core.getJsonResult('dataanalysis/getparainfo?mfid=' + mfId, function (response) {
            if (response.IsSuccess) {
              let data = {
                factor: response.Content.factor,
                interval: response.Content.interval,
                storage_time: response.Content.storage_time,
                type: response.Content.type,
                mfId: mfId
              };
              let fixedParaHtml = template('fixed-parameter-template', data);
              fixedParaDom.html(fixedParaHtml);
              $('#seachbtn_' + mfId).on('click', function (e) {
                let timeout = $('#seachBox_' + mfId).val();
                if (_.isEqual(timeout, '')) {
                  $.toast('请输入超限时间，默认为5单位秒');
                  return;
                }
                esdpec.framework.core.getJsonResult('dataanalysis/getdatafromdevice?mfid=' + mfId + '&timeout=' + timeout, function (response) {
                  if (response.IsSuccess && response.Content != null) {
                    let lastData = {
                      lastDataList: response.Content.last_datas
                    };
                    _.forEach(lastData.lastDataList, a => a.Mt = _.replace(a.Mt.substring(0, a.Mt.length - 6), 'T', ' '));
                    let lastDataHtml = template('last-data-template', lastData);
                    $('#last-data-container_' + mfId).html(lastDataHtml);
                  }
                });
              });
              fixedParaDom.attr('data-toggle', 'open');
              let lastData = {
                lastDataList: response.Content.last_datas
              };
              _.forEach(lastData.lastDataList, a => a.Mt = _.replace(a.Mt.substring(0, a.Mt.length - 6), 'T', ' '));
              let lastDataHtml = template('last-data-template', lastData);
              $('#last-data-container_' + mfId).html(lastDataHtml);
            }
            return;
          });
        }
        if (fixedParaDom.attr('data-toggle') === 'open') {
          $jQuery('#showParamMore_' + mfId).attr('data-toggle', 'close').slideUp(300);
        } else {
          $jQuery('#showParamMore_' + mfId).attr('data-toggle', 'open').slideDown(300);
        }
      });
    }
  };
  let getFocusMeterData = function (node, searchType, paraType, dateType, sTime, eTime, mfIds) {
    if (!ifComparsion()) {
      let firstPara = _.head(mfIds);
      let param = _.find(node.parameters, a => a.id === firstPara);
      currentUnit = param.unit;
      let urlParam = generateUrlPara(node.id, searchType, paraType, dateType, sTime, eTime, mfIds);
      esdpec.framework.core.getJsonResultSilent("dataanalysis/getdata?" + urlParam, function (response) {
        if (response.IsSuccess) {
          let data = {};
          let legendTitle = getLegendTitle(_.toString(dateType), searchType);
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
          data.xAxisData = searchType === queryType.convenient ?
            getXAxisData(_.toString(dateType)) : getCustomXAxisData(sTime, eTime, _.toString(dateType));
          // data.dataZoom = {
          //   end: parseInt(dateType) === 3 ? 100 : 80
          // };
          data.series = getChartSeries(getSeriesPara(response.Content, searchType, legendTitle),
            data.xAxisData, response.Content.rule, dateType, searchType);
          renderAggregateData({
            sum_per: _.isFinite(response.Content.sum_per) ? response.Content.sum_per.toFixed(2) : '--',
            sum_val: _.isFinite(response.Content.sum_val) ? response.Content.sum_val.toFixed(2) : '--',
            avg_per: _.isFinite(response.Content.avg_per) ? response.Content.avg_per.toFixed(2) : '--',
            avg_val: _.isFinite(response.Content.avg_val) ? response.Content.avg_val.toFixed(2) : '--',
            unit: param.unit,
            summargyClass: response.Content.sum_per > 0,
            avgClass: response.Content.avg_per > 0,
          });
          generateChart(document.getElementById('echarts'), data);
          renderAlartData(response.Content.alarm_sum);
          renderGaugeData({});
        }
      });
    } else getComparsionData();
  };
  let getMeterFocusData = function () {
    if (currentClickMeters.length <= 0) return;
    let activeNodeId = getActiveMeterId();
    let activeNode = _.find(currentClickMeters, a => a.id === activeNodeId);
    var dateType = getDateType();
    //new Promise
    esdpec.framework.core.getJsonResult("dataanalysis/getparasbymeterid?meterId=" + activeNodeId, function (response) {
      if (response.IsSuccess) {
        activeNode.parameters = response.Content;
        let parameterType = paraType.aggregateValue;
        let defaultChoosePara = _.find(activeNode.parameters, a => a.type === 0);
        if (!defaultChoosePara) {
          defaultChoosePara = _.head(activeNode.parameters);
          parameterType = defaultChoosePara.type;
        }
        //render parameter container
        _.map(activeNode.parameters, a => {
          if (a.id === defaultChoosePara.id) a.checked = "checked";
        });
        $('#current-unit').text(defaultChoosePara.unit);
        let parameterHtml = template('parameter-template', {
          parameterList: activeNode.parameters
        });
        $('#parameter-container').html(parameterHtml);
        globalsTime = new Date().format('yyyy-MM-dd 00:00:01');
        globaleTime = new Date().format('yyyy-MM-dd 23:59:59');
        globalQueryType = queryType.convenient;
        globalDataType = parameterType;
        globalDateType = dateType;
        getFocusMeterData(activeNode, queryType.convenient, parameterType, dateType,
          globalsTime, globaleTime, [defaultChoosePara.id]);
      }
    });
  };
  $(document).on('click', '.tree-menu', function (e) {
    $.allowPanelOpen = true;
    $.openPanel('#tree-panel');
  });
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
          let residueMeters = _.filter(meterTree, a => a.parent !== parentId);
          let newMeters = _.concat(residueMeters, children);
          meterTree = newMeters;
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
  $('#searchmorebtn').on("click", function (e) {
    let dataType = $('#dataTypePicker').val();
    let sTime = $('#startDatePicker').val();
    let eTime = $('#endDatePicker').val();
    if (moment(eTime) < moment(sTime)) {
      $.toast('结束时间不能早于开始时间');
      return;
    }
    let params = getActiveParameters();
    if (params.type === -1) {
      $.toast('请选择查询参数');
      return;
    }
    let type = dateType.day;
    switch (dataType) {
      case '日':
        sTime = sTime + ' 00:00:01';
        eTime = eTime + ' 23:59:59';
        type = dateType.day;
        break;
      case '月':
        let days = getDaysOfMonth(eTime.split('-')[0], eTime.split('-')[1])
        sTime = sTime + '-01 00:00:01';
        eTime = eTime + '-' + days + ' 23:59:59';
        type = dateType.month;
        break;
      case '年':
        sTime = sTime + '-01-01 00:00:01';
        eTime = eTime + '-12-31 23:59:59';
        type = dateType.year;
        break;
    }
    globalsTime = sTime;
    globaleTime = eTime;
    globalQueryType = queryType.custom;
    globalDataType = params.type;
    globalDateType = type;
    let mfIds = _.map(params.parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, queryType.custom, params.type, type,
      sTime, eTime, mfIds);
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
    let params = getActiveParameters();
    if (params.type === -1) {
      $.toast('请选择查询参数');
      return;
    }
    globalsTime = new Date().format('yyyy-MM-dd 00:00:01');
    globaleTime = new Date().format('yyyy-MM-dd 23:59:59');
    globalQueryType = queryType.convenient;
    globalDataType = params.type;
    globalDateType = dateType.day;
    let mfIds = _.map(params.parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, queryType.convenient, params.type, dateType.day,
      globalsTime, globaleTime, mfIds);
  });
  $('#showWeek').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showWeek').addClass('active');
    ifShowSearch(false);
    let params = getActiveParameters();
    if (params.type === -1) {
      $.toast('请选择查询参数');
      return;
    }
    let week = getWeek();
    globalsTime = week.monday;
    globaleTime = week.sunday;
    globalQueryType = queryType.convenient;
    globalDataType = params.type;
    globalDateType = dateType.week;
    let mfIds = _.map(params.parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, queryType.convenient, params.type, dateType.week,
      week.monday, week.sunday, mfIds);
  });
  $('#showMonth').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showMonth').addClass('active');
    ifShowSearch(false);
    let params = getActiveParameters();
    if (params.type === -1) {
      $.toast('请选择查询参数');
      return;
    }
    let today = new Date().format('yyyy-MM-dd');
    globalsTime = today.firstDay;
    globaleTime = today.lastDay;
    globalQueryType = queryType.convenient;
    globalDataType = params.type;
    globalDateType = dateType.month;
    let month = getMonth(today);
    let mfIds = _.map(params.parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, queryType.convenient, params.type, dateType.month,
      month.firstDay, month.lastDay, mfIds);
  });
  $('#showYear').on("click", function (e) {
    if (!operateBefore()) return;
    toggleActive();
    $jQuery('#showYear').addClass('active');
    ifShowSearch(false);
    let params = getActiveParameters();
    if (params.type === -1) {
      $.toast('请选择查询参数');
      return;
    }
    let today = new Date().format('yyyy-MM-dd');
    let year = getYear(today);
    globalsTime = year.firstDay;
    globaleTime = year.lastDay;
    globalQueryType = queryType.convenient;
    globalDataType = params.type;
    globalDateType = dateType.year;
    let mfIds = _.map(params.parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, queryType.convenient, params.type, dateType.year,
      year.firstDay, year.lastDay, mfIds);
  });
  $(document).on('click', '#parameter-container > a', function (e) {
    let existType = getActiveParameters().type;
    let currentDom = $(e.currentTarget);
    let chooseType = currentDom.attr('data-type');
    if (!_.isEqual(existType, chooseType)) {
      $.toast('不同类型的参数不能对比');
      return;
    }
    currentDom.toggleClass('checked');
    let mfIds = _.map(getActiveParameters().parameterList, a => a.id);
    let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    getFocusMeterData(activeNode, globalQueryType, globalDataType, globalDateType,
      globalsTime, globaleTime, mfIds);
  });
  $(document).on('click', '#subscribe', function (e) {
    let meter = _.head(currentClickMeters);
    let defaultTitle = energyEnum[meter.EnergyCode] + '-' + meter.text;
    let parentNode = _.find(meterTree, a => a.id === meter.parent);
    var modal = $.modal({
      title: '设置关注对象名称',
      afterText: '<div >' +
        '<div class="">' +
        '<input type="text" value="' + defaultTitle + '" id="focusTitle" style="padding: 0.25rem;border-radius: 0.2rem;border: transparent;outline: transparent;">' +
        '</div>' +
        '</div>',
      buttons: [{
          text: '取消'
        },
        {
          text: '确定',
          bold: true,
          onClick: function () {
            let title = $('#focusTitle').val();
            if (_.isEqual(title, '')) {
              $.toast('请设置关注标题');
              return;
            }
            let para = {
              title: title,
              sId: _.map(getActiveParameters().parameterList, a => a.id).join(','),
              areaId: meter.parent,
              area_name: parentNode ? parentNode.text : '',
              slist: _.map(currentClickMeters, a => a.id).join(','),
              unit: currentUnit,
              energy_code: meter.EnergyCode,
              description: (parentNode ? parentNode.text : '') + '-' + meter.text,
              stype: currentClickMeters.length > 1 ? 0 : 1,
              date_type: globalDateType,
              query_type: globalQueryType,
              data_type: globalDataType,
              stime: globalsTime,
              etime: globaleTime
            }
            esdpec.framework.core.doPostOperation('dataanalysis/subscribe', para, function (response) {
              if (response.IsSuccess) {
                $.toast('关注成功');
              }
            });
          }
        },
      ]
    });
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