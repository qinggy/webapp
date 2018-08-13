$(function () {
  'use strict';
  let lastclicktime = null;
  let currentUnit = null;
  let globalsTime = '',
    globaleTime = '';
  let currentClickMeters = [];
  let globalFocusList = [],
    currentPage = 1,
    totalPage = 1,
    globalQueryType,
    globalDataType,
    globalDateType,
    globalUnit,
    isComparsionStatus = false,
    globalFocusId = -1,
    globalLineDataSource = null,
    globalPieDataSource = null,
    globalCurrentPage = null;
  let chart = null;
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
  let generatePieForAggregateData = (xAxisData, seriesData) => {
    let option = {
      tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        data: xAxisData
      },
      toolbox: {
        show: true,
        x: 10,
        y: 31,
        orient: 'vertical',
        feature: {
          myTool: {
            show: true,
            title: '换为柱状图',
            icon: 'image://../../asserts/img/gz/bar.png',
            onclick: function () {
              if (chart) chart.clear();
              if (!globalLineDataSource) return;
              generateChart(document.getElementById('echarts'), globalLineDataSource, true);
            }
          }
        }
      },
      series: [{
        name: '能耗对比',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        label: {
          normal: {
            position: 'inner'
          }
        },
        data: seriesData,
        itemStyle: {
          normal: {
            label: {
              show: true,
              formatter: "{c} ({d}%)"
            }
          },
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    return option;
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
  let ifComparsion = () => {
    if (currentClickMeters.length <= 1) return false;
    let mlist = [];
    _.forEach(currentClickMeters, m => {
      let checked = _.find(m.parameters, a => a.checked === 'checked');
      if (checked) mlist.push(m.id);
    });
    return mlist.length > 1;
  };
  let getDateType = () => {
    let activeDoms = $('#datatab a.active');
    if (activeDoms.length <= 0)
      $('#showDay').addClass('active');
    return $('#datatab a.active').attr('data-type');
  };
  let getActiveMeterId = () => {
    if (currentClickMeters.length === 1) return currentClickMeters[0].id;
    let currentNode = _.find(currentClickMeters, a => a.checked);
    return currentNode ? currentNode.id : -1;
  };
  let getMeterActiveParameters = () => {
    let meterParams = {
      meterList: [],
      type: -1,
    };
    let checkedType = -1;
    _.forEach(currentClickMeters, a => {
      let meter = {
        meterId: a.id,
        parameterList: []
      };
      let checkedParams = _.filter(a.parameters, a => a.checked === 'checked');
      checkedType = checkedParams.length > 0 ? _.head(checkedParams).type : -1;
      _.forEach(checkedParams, a => meter.parameterList.push({
        id: a.id,
        type: a.type
      }));
      meterParams.meterList.push(meter);
    });
    meterParams.type = checkedType;
    return meterParams;
  };
  let getActiveParameters = () => {
    let activeParams = {
      parameterList: [],
      type: -1
    };
    let paraType = -1;
    _.forEach(getMeterActiveParameters().meterList, meter => {
      _.forEach(meter.parameterList, p => {
        paraType = p.type;
        activeParams.parameterList.push({
          id: p.id,
          type: p.type
        });
      });
    });
    activeParams.type = paraType;
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
    sortedData.focusList = _.concat(homeList, _.sortBy(others, a => a.index));
    globalFocusList = sortedData;
    let focusHtml = template('focus-list-template', sortedData);
    $('#focus-list-container').html(focusHtml);
    esdpec.framework.core.swipeDelete('.focus-list .focus-item', '.delete-action', function (deleteItem) {
      esdpec.framework.core.doDeleteOperation('subscribe/unsubscribe?id=' + deleteItem, {}, function (response) {
        if (response.IsSuccess) {
          _.remove(globalFocusList.focusList, a => a.id === deleteItem);
          $('#' + deleteItem).remove();
        }
      });
    });
    $('.focus-list li.focus-item').on('click', function (e) {
      let focusId = $(e.currentTarget).attr('id');
      globalFocusId = focusId;
      sessionStorage.setItem('current_focus_id', globalFocusId);
      let clickFocus = _.find(globalFocusList.focusList, a => a.id === focusId);
      currentClickMeters = [];
      sessionStorage.setItem('current_select_meters', '[]');
      switch (clickFocus.stype) {
        case 1:
        case 2:
          let mIds = clickFocus.slist.split(',');
          let mfIdJson = JSON.parse(clickFocus.sId);
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          currentClickMeters = _.filter(meterTree, a => _.includes(mIds, a.id));
          _.forEach(currentClickMeters, m => {
            m.checked = false;
            let mfids = _.find(mfIdJson, a => a.m === m.id);
            m.checkedMfIds = mfids.plist;
            if (_.isEqual(m.id, clickFocus.activeId)) m.checked = true;
          });
          sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters)); // 修复bug引入
          break;
        case 3:
        case 4:
          sessionStorage.setItem('current_health', JSON.stringify(clickFocus));
          sessionStorage.setItem('if-goback', '1');
          window.location.href = '../health/index.html#page-health-detail';
          break;
        case 5:
        case 6:
          break;
      }
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
      let currentNodeIndex = _.findIndex(globalFocusList.focusList, a => a.id === focusId);
      if (currentNodeIndex === 0) {
        $.toast('已在置顶位置，不可再往前');
        return;
      }
      let currentNode = _.find(globalFocusList.focusList, a => a.id === focusId);
      let preNode = globalFocusList.focusList[currentNodeIndex - 1];
      if (preNode.is_index) {
        $.toast('已在置顶位置，不可再往前');
        return;
      }
      let para = {
        id: focusId,
        index: currentNode.index
      };
      if (currentNode.index <= 0) {
        $.toast('已在置顶位置，不可再往前');
        return;
      }
      para.new_index = parseInt(para.index) - 1;
      esdpec.framework.core.doPutOperation('subscribe/sort', para, function (response) {
        if (response.IsSuccess && response.Content) {
          _.forEach(globalFocusList.focusList, a => {
            if (a.id === preNode.id) a.index = para.index;
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
      sessionStorage.setItem('meter_tree', JSON.stringify(meterList));
      renderMeterTree(meterList, '#', 'forward');
    }
  };
  let loadMeterTree = function (type) {
    let meterJson = sessionStorage.getItem('meter_tree');
    if (!meterJson || !JSON.parse(sessionStorage.getItem('meter_tree'))) {
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
    } else {
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
      renderMeterTree(meterTree, '#', 'forward');
    }
  };
  let leadToHomePage = function (focusList) {
    let homePage = _.find(focusList, a => a.is_index);
    if (homePage) {
      globalDataType = homePage.data_type;
      globalDateType = homePage.date_type;
      globalsTime = homePage.stime;
      globaleTime = homePage.etime;
      globalQueryType = homePage.query_type;
      currentClickMeters = [];
      let meterJson = sessionStorage.getItem('meter_tree');
      let meterTree = null;
      if (!meterJson || !JSON.parse(sessionStorage.getItem('meter_tree'))) {
        esdpec.framework.core.getJsonResultSilent("common/gettree", function (response) {
          if (response.IsSuccess) {
            sessionStorage.setItem('meter_tree', JSON.stringify(response.Content));
            meterTree = response.Content;
            currentClickMeters.push(_.find(meterTree, a => a.id === homePage.activeId));
            sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
            $.router.load("#focus-detail-page", true);
          }
        });
      } else {
        meterTree = JSON.parse(meterJson);
        currentClickMeters.push(_.find(meterTree, a => a.id === homePage.activeId));
        sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
        $.router.load("#focus-detail-page", true);
      }
    }
  };
  let loadFocusListData = function (pageNum, keyword) {
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
        let isFirstLogin = sessionStorage.getItem("first_login");
        if (isFirstLogin === '1') {
          sessionStorage.setItem("first_login", '0');
          leadToHomePage(data.focusList);
        }
      }
      totalPage = response.Content.total_page;
      renderFocusList(data);
    });
  };
  let renderMeterTree = function (list, parent, type) {
    if (type === 'forward') {
      let path = $('#parentId').val();
      $('#parentId').val(path + '||' + parent);
    }
    let children = _.filter(list, a => a.parent === parent);
    _.map(children, a => {
      a.baseInstrument = (a.modeltype === 'meter' || a.modeltype === 'vmeter') ? 'isBasic-instrument' : '';
      a.showChecked = (isComparsionStatus && (a.modeltype === 'meter' || a.modeltype === 'vmeter')) ? 'showCheckBox' : '';
      a.hasChecked = _.find(currentClickMeters, m => m.id === a.id) ? 'comparsionchecked' : '';
    });
    let data = {
      meterList: children
    };
    let meterHtml = template('meter-list-template', data);
    $('#meterListContainer').html(meterHtml);
    $('.meter-list .meter-item').on('click', function (e) {
      let clickNode = $(e.currentTarget);
      let meterId = clickNode.attr('data-id');
      let meterTree = sessionStorage.getItem('meter_tree');
      let energyCode = clickNode.attr('data-energy-code');
      let meterNodes = JSON.parse(meterTree);
      let children = _.filter(meterNodes, a => a.parent === meterId);
      if (children.length > 0)
        renderMeterTree(children, meterId, 'forward');
      else {
        let node = _.find(meterNodes, a => a.id === meterId);
        if (node.modeltype === 'vmeter' || node.modeltype === 'meter') {
          if (isComparsionStatus) {
            if (currentClickMeters.length >= 6) {
              $.toast('目前最多只能接受6个仪表同时对比');
              return;
            }
            if (_.find(currentClickMeters, a => a.EnergyCode === energyCode)) {
              clickNode.toggleClass('comparsionchecked');
              if (clickNode.hasClass('comparsionchecked')) {
                currentClickMeters.push(node);
                setTimeout(_ => {
                  loadComparisonData(node);
                }, 100);
              } else {
                _.remove(currentClickMeters, a => a.id === meterId);
              }
              sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
            } else {
              $.toast('不同类型仪表不能对比');
              return;
            }
          } else {
            currentClickMeters = [];
            node.checked = true;
            currentClickMeters.push(node);
            sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
            if (globalCurrentPage === 'focus-detail-page') getMeterFocusData();
            else $.router.load("#focus-detail-page", true);
            setTimeout(() => $.closePanel(), 300);
          }
        }
      }
    });
    $jQuery('#backParent').on('click', function (e) {
      e.stopPropagation();
      if (!operateBefore()) return;
      backNavigate();
    });
  };
  let loadComparisonData = function (node) {
    let existNode = _.head(currentClickMeters);
    let chooseP = _.find(existNode.parameters, a => a.checked === 'checked');
    let freshMan = _.find(currentClickMeters, a => a.id === node.id);
    esdpec.framework.core.getJsonResultSilent('dataanalysis/getparasbymeterid?meterId=' + node.id, function (response) {
      if (response.IsSuccess) {
        freshMan.parameters = response.Content;
        _.forEach(freshMan.parameters, a => {
          if (_.toLower(a.unit) === _.toLower(chooseP.unit)) {
            a.checked = 'checked';
            return false;
          }
        });
        let mfIds = _.map(getActiveParameters().parameterList, a => a.id);
        if (mfIds.length < currentClickMeters.length) {
          $.toast('无法确定对比参数，请手动选择');
          return;
        }
        getComparsionData(freshMan, globalQueryType, globalDataType, globalDateType, globalsTime, globaleTime, mfIds);
      }
    });
  };
  $('#tree-panel').on('close', function (e) {
    isComparsionStatus = false;
    renderFocusMeter();
    if (currentClickMeters.length === 1)
      getMeterFocusData();
    else {}
  });
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
  let generateChart = function (chartDom, data, showPie = false) {
    chart = echarts.init(chartDom, e_macarons);
    let option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: data.legend,
      toolbox: {
        show: true,
        x: 10,
        y: 31,
        orient: 'vertical',
        feature: {
          magicType: {
            show: true,
            icon: {
              line: "image://../../asserts/img/gz/line.png",
              bar: "image://../../asserts/img/gz/bar.png",
            },
            type: ['line', 'bar']
          },
          myTool: {
            show: showPie,
            title: '换为饼图',
            icon: 'image://../../asserts/img/gz/pie.png',
            onclick: function () {
              if (chart) chart.clear();
              if (!globalPieDataSource) return;
              let option = generatePieForAggregateData(globalPieDataSource.x, globalPieDataSource.y);
              chart = echarts.init(document.getElementById('echarts'), e_macarons);
              chart.setOption(option, true);
            }
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
      yAxis: [{
        type: 'value',
        position: 'right',
        axisLabel: {
          formatter: '{value} '
        }
      }],
      series: data.series
    };
    chart.setOption(option, true);
  };
  let formatNumber = function (n) {
    return n < 10 ? "0" + n : n;
  };
  let backNavigate = function () {
    let pathVal = $('#parentId').val();
    pathVal = pathVal.substring(2);
    let pathStack = pathVal.split('||');
    if (pathStack.length > 1) {
      let parent = pathStack[pathStack.length - 2];
      let pathVal = [];
      for (let i = 0; i <= pathStack.length - 2; i++) {
        pathVal[i] = pathStack[i];
      }
      let path = _.join(pathVal, '||');
      $('#parentId').val('||' + path);
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
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
  let getInstantanousSeriesPara = (response, legendTitle) => {
    let seriesParas = [];
    if (ifComparsion()) {
      _.forEach(response, a => {
        let mp = _.find(legendTitle, l => l.id === a.mfid);
        seriesParas.push({
          data: a.data_list,
          name: mp.mName + '-' + mp.name
        });
      });
      return seriesParas;
    }
    _.forEach(response, a => {
      seriesParas.push({
        data: a.now_data_list,
        name: _.find(legendTitle, l => l.id === a.mfid).name
      });
    });
    return seriesParas;
  };
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
  let getInstantanousSeries = (SeriesData, xAxis, dateType, searchType) => {
    let seriesOption = [];
    _.forEach(SeriesData, s => {
      let formatData = _.map(s.data, a => {
        return {
          val: a.val,
          date: a.date
        };
      });
      let option = {};
      option.name = s.name;
      option.type = 'line';
      option.data = _.map(xAxis, a => {
        var valueItem = _.find(formatData, b => b.date === _.toString(a));
        return !!valueItem ? valueItem.val : 0;
      });
      seriesOption.push(option);
    });
    return seriesOption;
  };
  let generateUrlPara = function (mId, qtype, ptype, dtype, stime, etime, mfIds) {
    let urlPara = 'meterId=' + mId + '&queryType=' + qtype + '&paraType=' + ptype + '&dateType=' + dtype + '&sTime=' + stime + '&eTime=' + etime + '&mfids=';
    if (!!mfIds) {
      let mfids = '';
      $jQuery.each(mfIds, function (index, mfId) {
        mfids += mfId + ',';
      });
      mfids = mfids.substring(0, mfids.length - 1);
      urlPara += mfids;
    }
    return urlPara;
  };
  let renderFocusMeter = function () {
    if (globalFocusId !== -1) {
      $('#subscribe').text('取消关注');
    } else {
      $('#subscribe').text('关注');
    }
    let checkedNode = _.find(currentClickMeters, a => a.checked);
    if (!checkedNode) {
      checkedNode = _.head(currentClickMeters);
      if (checkedNode)
        checkedNode.checked = true;
    }
    _.forEach(currentClickMeters, a => a.checked ? a.activeClass = 'current-active' : '');
    sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
    let meterHeaderData = {
      focusMeterList: currentClickMeters
    };
    let meterNameTemplate = template('meter-header-template', meterHeaderData);
    $('#headerContainer').html(meterNameTemplate);
    $('#headerContainer span').on('click', function (e) {
      let meterId = $(e.currentTarget).attr('data-id');
      _.forEach(currentClickMeters, a => {
        if (a.id === meterId)
          a.checked = true;
        else a.checked = false;
      });
      sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
      $('#headerContainer span').removeClass('current-active');
      $('#meter_' + meterId).addClass('current-active');
      let activeNode = _.find(currentClickMeters, a => a.checked);
      esdpec.framework.core.getJsonResult("dataanalysis/getparasbymeterid?meterId=" + meterId, function (response) {
        if (response.IsSuccess) {
          _.map(response.Content, p => {
            let existP = _.find(activeNode.parameters, a => a.id === p.id);
            _.assign(p, existP);
          })
          activeNode.parameters = response.Content;
          let parameterHtml = template('parameter-template', {
            parameterList: activeNode.parameters
          });
          $('#parameter-container').html(parameterHtml);
        }
      });
    });
    $('#add_comparsion').on('click', function (e) {
      e.stopPropagation();
      let flag = true;
      _.forEach(currentClickMeters, m => {
        let checkedParas = _.filter(m.parameters, a => a.checked === 'checked');
        if (checkedParas.length > 1) {
          flag = false;
          return flag;
        }
      });
      if (!flag) {
        $.toast('不能多参数对比');
        return;
      }
      $.allowPanelOpen = true;
      $.openPanel('#tree-panel');
      isComparsionStatus = true;
      /*highlight has been choosen*/
      $('.meter-list li.meter-item').each(function (i, dom) {
        let type = $(dom).attr('data-type');
        let id = $(dom).attr('data-id');
        if (!_.isEqual(type, 'meter') && !_.isEqual(type, 'vmeter'))
          $(dom).removeClass('showCheckBox');
        else $(dom).addClass('showCheckBox');
        let meter = _.find(currentClickMeters, a => a.id === id);
        if (meter) {
          $(dom).addClass('comparsionchecked');
        } else $(dom).removeClass('comparsionchecked');
      });
    });
    $('#remove_comparsion').on('click', function (e) {
      let activeNode = _.find(currentClickMeters, a => a.checked);
      if (!activeNode) {
        $.toast('请选择要删除的仪表');
        return;
      }
      _.remove(currentClickMeters, a => a.checked);
      sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
      $('#parameter-container').empty();
      renderFocusMeter();
      if (currentClickMeters.length === 1)
        getMeterFocusData();
    });
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
  let renderAlartData = function (alertObjList) {
    _.forEach(alertObjList, a => {
      if (a.id) a.vtype = 'm';
      else a.vtype = 'p';
    });
    let data = {
      meterList: alertObjList
    }
    let alertHtml = template('alert-data-template', data);
    $('#alert-data-container').html(alertHtml);
  };
  $(document).on('click', '.alert-data-item .item-more', function (e) {
    let node = $(e.currentTarget);
    let meterId = node.attr('data-id');
    let vtype = node.attr('data-type');
    let activeMeter = _.head(currentClickMeters);
    let healthObj = {
      activeId: vtype === 'm' ? meterId : activeMeter.id,
      data_type: globalDateType,
      date_type: 0,
      etime: globaleTime,
      id: '',
      query_type: 1,
      stime: globalsTime
    };
    sessionStorage.setItem('current_health', JSON.stringify(healthObj));
    sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
    sessionStorage.setItem('if-goback', '1');
    window.location.href = '../health/index.html#page-health-detail';
  });
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
  let generateSummaryTable = (type, dataList) => {
    let rowNames = [{
      id: 'sum_val',
      name: '日总量'
    }, {
      id: 'sum_per',
      name: '昨日同期'
    }, {
      id: 'avg_per',
      name: '同期平均'
    }, {
      id: 'avg_val',
      name: '平均'
    }, {
      id: 'max_val',
      name: '最大'
    }, {
      id: 'min_val',
      name: '最小'
    }, {
      id: 'upper_limit',
      name: '报警上限'
    }, {
      id: 'lower_limit',
      name: '报警下限'
    }, {
      id: 'upper_wave',
      name: '上限波动'
    }, {
      id: 'lower_wave',
      name: '下线波动'
    }];
    let tableHtml = "<table class='multiple-container'><thead class='multiple-header'><th><i class='icon-electric'></i></th><th class='fixedColumn'></th>";
    let colNames = _.filter(dataList, a => a.name);
    _.forEach(colNames, col => {
      tableHtml += '<th>' + col.name + '</th>';
    });
    tableHtml += "</thead>";
    if (type === 1) {
      rowNames = _.slice(rowNames, 3);
    }
    tableHtml += '<tbody class="multiple-body" id="summary-data-container">';
    _.forEach(rowNames, row => {
      tableHtml += "<tr class='multiple-body-item'><td>" + row.name + "</td><td class='fixedColumn'></td>";
      _.forEach(dataList, col => {
        if (row.id === 'sum_per' || row.id === 'avg_per') {
          if (col[row.id] > 0) {
            tableHtml += "<td style='color: red'><i class='icon-focus-up' style='height: 0.5rem;width: 0.5rem;margin-right: 0.2rem;'></i>" + col[row.id] + "%</td>";
          } else {
            tableHtml += "<td style='color: green'><i class='icon-focus-down' style='height: 0.5rem;width: 0.5rem;margin-right: 0.2rem;'></i>" + col[row.id] + "%</td>";
          }
        } else {
          tableHtml += "<td>" + col[row.id] + "</td>";
        }
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody></table>";
    return tableHtml;
  };
  let getComparsionData = function (node, searchType, paraType, dateType, sTime, eTime, mfIds) {
    $('#single').addClass('hidden');
    $('#multiple').removeClass('hidden');
    if (mfIds.length > 0) {
      let urlParam = generateUrlPara(node.id, searchType, paraType, dateType, sTime, eTime, mfIds);
      esdpec.framework.core.getJsonResultSilent("dataanalysis/getcomparedata?" + urlParam, function (response) {
        if (response.IsSuccess) {
          let summaryDataList = [];
          let sumValList = [];
          let parameters = [];
          _.forEach(currentClickMeters, m => {
            let ps = _.filter(m.parameters, a => a.checked === 'checked');
            _.forEach(ps, b => {
              let mp = _.assign(b, {
                mName: m.text
              });
              parameters.push(mp);
            })
          });
          _.forEach(response.Content, a => {
            let para = _.find(parameters, p => p.id === a.mfid);
            let summaryData = {
              name: para ? para.mName : '--',
              avg_val: a.avg_val ? a.avg_val.toFixed(2) : '--',
              max_val: a.max_val ? a.max_val.toFixed(2) : '--',
              min_val: a.min_val ? a.min_val.toFixed(2) : '--',
              upper_limit: a.rule ? a.rule.UpperLimit ? a.rule.UpperLimit.toFixed(2) : '--' : '--',
              lower_limit: a.rule ? a.rule.LowerLimit ? a.rule.LowerLimit.toFixed(2) : '--' : '--',
              lower_wave: a.rule ? a.rule.LowerWave ? a.rule.LowerWave.toFixed(2) : '--' : '--',
              upper_wave: a.rule ? a.rule.UpperWave ? a.rule.UpperWave.toFixed(2) : '--' : '--',
              type: globalDataType //para.type
            };
            if (para.type === 0) {
              summaryData.sum_val = a.sum_val ? a.sum_val.toFixed(2) : '--';
              summaryData.sum_per = a.sum_per ? (a.sum_per * 100).toFixed(2) : '--';
              summaryData.avg_per = a.avg_per ? (a.avg_per * 100).toFixed(2) : '--';
            }
            let sumVal = {
              name: para.mName,
              value: a.sum_val ? a.sum_val.toFixed(2) : 0
            };
            summaryDataList.push(summaryData);
            sumValList.push(sumVal);
          });
          $('#summary-data-container').html(generateSummaryTable(globalDataType, summaryDataList));
          let legendTitle = _.filter(parameters, a => {
            return {
              id: a.id,
              name: a.mName + '-' + a.name
            };
          });
          let data = getComparsionChartData(dateType, searchType, response.Content, legendTitle);
          globalLineDataSource = data;
          globalPieDataSource = {
            x: _.filter(summaryDataList, a => a.name),
            y: sumValList
          };
          generateChart(document.getElementById('echarts'), data, true);
        }
      });
    } else {
      if (chart) chart.clear();
      let data = {
        summaryDataList: []
      }
      let summaryDataHtml = template('summary-data-template', data);
      $('#summary-data-container').html(summaryDataHtml);
    }
  };
  let getChartData = (dateType, searchType, sTime, eTime, content, rule) => {
    let data = {};
    let legendTitle = getLegendTitle(_.toString(dateType), searchType);
    data.legend = {
      data: legendTitle
    };
    data.xAxisData = searchType === queryType.convenient ?
      getXAxisData(_.toString(dateType)) : getCustomXAxisData(sTime, eTime, _.toString(dateType));
    data.series = getChartSeries(getSeriesPara(content, searchType, legendTitle),
      data.xAxisData, rule, dateType, searchType);
    return data;
  };
  let getInstantanousChartData = (dateType, searchType, sTime, eTime, content, legendTitle) => {
    let data = {};
    data.legend = {
      data: _.map(legendTitle, a => a.name)
    };
    let xData = [];
    _.forEach(content, paras => {
      _.forEach(paras.now_data_list, a => {
        a.date = a.date.substring(0, a.date.length - 3);
        xData.push(a.date);
      });
    });
    xData = _.uniq(xData);
    data.xAxisData = xData;
    data.series = getInstantanousSeries(getInstantanousSeriesPara(content, legendTitle), data.xAxisData, dateType, searchType);
    return data;
  };
  let getComparsionChartData = (dateType, searchType, dataList, legendTitle) => {
    let data = {};
    data.legend = {
      data: _.map(legendTitle, a => a.mName + '-' + a.name)
    };
    let xData = [];
    _.forEach(dataList, paras => {
      _.forEach(paras.data_list, a => {
        a.date = a.date;
        xData.push(a.date);
      });
    });
    xData = _.uniq(xData);
    data.xAxisData = xData;
    data.series = getInstantanousSeries(getInstantanousSeriesPara(dataList, legendTitle), data.xAxisData, dateType, searchType);
    return data;
  };
  let getFocusMeterData = function (node, searchType, paraType, dateType, sTime, eTime, mfIds) {
    if (!ifComparsion()) {
      $('#single').removeClass('hidden');
      $('#multiple').addClass('hidden');
      if (mfIds.length > 0) {
        let urlParam = generateUrlPara(node.id, searchType, paraType, dateType, sTime, eTime, mfIds);
        esdpec.framework.core.getJsonResultSilent("dataanalysis/getdata?" + urlParam, function (response) {
          if (response.IsSuccess) {
            //console.log(response.Content);
            if (_.isEqual(paraType, 0)) {
              $('#summary-container').removeClass('hidden');
              $('#rule-container').addClass('hidden');
              let data = getChartData(dateType, searchType, sTime, eTime, response.Content, response.Content.rule);
              renderAggregateData({
                sum_per: _.isFinite(response.Content.sum_per) ? response.Content.sum_per.toFixed(2) : '--',
                sum_val: _.isFinite(response.Content.sum_val) ? response.Content.sum_val.toFixed(2) : '--',
                avg_per: _.isFinite(response.Content.avg_per) ? response.Content.avg_per.toFixed(2) : '--',
                avg_val: _.isFinite(response.Content.avg_val) ? response.Content.avg_val.toFixed(2) : '--',
                unit: globalUnit,
                summargyClass: response.Content.sum_per > 0,
                avgClass: response.Content.avg_per > 0,
              });
              generateChart(document.getElementById('echarts'), data);
              let alertObjList = [];
              let meter = _.head(currentClickMeters);
              meter.alert_count = response.Content.alarm_sum;
              renderAlartData([meter]);
              renderGaugeData();
            } else {
              $('#summary-container').addClass('hidden');
              $('#rule-container').removeClass('hidden');
              let rule = {
                ruleList: []
              };
              let alertList = [];
              let parameters = [];
              let paraTitles = [];
              _.forEach(currentClickMeters, a => parameters = _.concat(parameters, a.parameters));
              _.forEach(response.Content.data_list, a => {
                let paraName = _.find(parameters, p => p.id === a.mfid).name;
                paraTitles.push({
                  id: a.mfid,
                  name: paraName
                });
                if (a.rule !== null) {
                  rule.ruleList.push({
                    name: paraName,
                    avg: _.isFinite(a.avg_val) ? a.avg_val.toFixed(2) : '--',
                    upperlimit: a.rule.UpperLimit === null ? '--' : a.rule.UpperLimit,
                    upperwave: a.rule.UpperWave === null ? '--' : a.rule.UpperWave,
                    lowerlimit: a.rule.LowerLimit === null ? '--' : a.rule.LowerLimit,
                    lowerwave: a.rule.LowerWave === null ? '--' : a.rule.LowerWave
                  });
                }
                alertList.push({
                  text: paraName,
                  alert_count: a.alarm_sum
                });
              });
              let ruleHtml = template('rule-container-tbody-template', rule);
              $('#rule-table-tbody').html(ruleHtml);
              let data = getInstantanousChartData(dateType, searchType, sTime, eTime, response.Content.data_list, paraTitles);
              generateChart(document.getElementById('echarts'), data);
              renderAlartData(alertList);
              renderGaugeData();
            }
          }
        });
      } else {
        if (chart) chart.clear();
        renderAlartData([]);
        renderAggregateData({
          sum_per: '--',
          sum_val: '--',
          avg_per: '--',
          avg_val: '--',
          unit: '',
          summargyClass: false,
          avgClass: false,
        });
        $('#rule-table-tbody').html('');
        renderGaugeData();
      }
    } else getComparsionData(node, searchType, paraType, dateType, sTime, eTime, mfIds);
  };
  let getMeterFocusData = function () {
    if (currentClickMeters.length <= 0) return;
    let activeNodeId = getActiveMeterId();
    let activeNode = _.find(currentClickMeters, a => a.id === activeNodeId);
    var dateType = getDateType();
    /*new Promise*/
    esdpec.framework.core.getJsonResult("dataanalysis/getparasbymeterid?meterId=" + activeNodeId, function (response) {
      if (response.IsSuccess) {
        activeNode.parameters = response.Content;
        let parameterType = paraType.aggregateValue;
        let unit = '';
        if (!activeNode.checkedMfIds || activeNode.checkedMfIds.length <= 0) {
          let defaultChoosePara = _.find(activeNode.parameters, a => a.type === 0);
          if (!defaultChoosePara) {
            defaultChoosePara = _.head(activeNode.parameters);
            unit = defaultChoosePara.unit
            parameterType = defaultChoosePara.type;
          }
          activeNode.checkedMfIds = [defaultChoosePara.id];
        }
        /*render parameter container*/
        _.map(activeNode.parameters, a => {
          if (_.includes(activeNode.checkedMfIds, a.id)) {
            a.checked = "checked";
            unit = a.unit;
            parameterType = a.type;
          };
        });
        $('#current-unit').text(unit);
        let parameterHtml = template('parameter-template', {
          parameterList: activeNode.parameters
        });
        $('#parameter-container').html(parameterHtml);
        globalsTime = new Date().format('yyyy-MM-dd 00:00:01');
        globaleTime = new Date().format('yyyy-MM-dd 23:59:59');
        globalQueryType = queryType.convenient;
        globalDataType = parameterType;
        globalDateType = dateType;
        globalUnit = unit;
        getFocusMeterData(activeNode, queryType.convenient, parameterType, dateType,
          globalsTime, globaleTime, activeNode.checkedMfIds);
      }
    });
  };
  $(document).on('click', '.tree-menu', function (e) {
    e.stopPropagation();
    $.allowPanelOpen = true;
    $.openPanel('#tree-panel');
    $('.meter-list li.meter-item').each(function (i, dom) {
      $(dom).removeClass('showCheckBox');
    });
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
          let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
          let residueMeters = _.filter(meterTree, a => a.parent !== parentId);
          let newMeters = _.concat(residueMeters, children);
          meterTree = newMeters;
          sessionStorage.setItem('meter_tree', JSON.stringify(meterTree));
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
  });
  $(document).on('click', '#search-btn', function (e) {
    let keyword = $jQuery('#search').val();
    loadFocusListData(1, keyword);
  });
  $('#searchmorebtn').on("click", function (e) {
    globalQueryType = queryType.custom;
    let sTime = $('#startDatePicker').val();
    let eTime = $('#endDatePicker').val();
    if (globalDataType === paraType.aggregateValue) {
      let dataType = $('#dataTypePicker').val();
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
      globalDataType = params.type;
      globalDateType = type;
      let mfIds = _.map(params.parameterList, a => a.id);
      let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
      getFocusMeterData(activeNode, queryType.custom, params.type, type,
        sTime, eTime, mfIds);
    } else {
      let time = $('#datePicker').val();
      globalsTime = time + ' 00:00:01';
      globaleTime = time + ' 23:59:59';
      globalQueryType = queryType.custom;
      globalDataType = paraType.instantaneousValue;
      globalDateType = dateType.day;
      let params = getActiveParameters();
      let mfIds = _.map(params.parameterList, a => a.id);
      let activeNode = _.find(currentClickMeters, a => a.id === getActiveMeterId());
      getFocusMeterData(activeNode, queryType.custom, paraType.instantaneousValue, dateType.day,
        globalsTime, globaleTime, mfIds);
    }
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
    if (globalDataType === paraType.instantaneousValue) return;
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
    if (globalDataType === paraType.instantaneousValue) return;
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
    if (globalDataType === paraType.instantaneousValue) return;
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
    let currentDom = $(e.currentTarget);
    let chooseType = currentDom.attr('data-type');
    let mfId = currentDom.attr('data-id');
    let unit = currentDom.attr('data-unit');
    let text = currentDom.text();
    let existType = getActiveParameters().type;
    let activeMeter = _.find(currentClickMeters, a => a.id === getActiveMeterId());
    if (currentClickMeters.length === 1) {
      if (!_.isEqual(existType, -1) && !_.isEqual(existType, parseInt(chooseType))) {
        $.toast('不同类型的参数不能对比');
        return;
      }
      if (!_.isEqual(globalUnit, '') && !_.isEqual(unit, globalUnit)) {
        $.toast('不同类型的参数不能对比');
        return;
      }
      globalUnit = unit;
      currentDom.toggleClass('checked');
      globalDataType = parseInt(chooseType);
      if (currentDom.hasClass('checked')) {
        let para = _.find(activeMeter.parameters, a => a.id === mfId);
        para.checked = 'checked';
      } else {
        let para = _.find(activeMeter.parameters, a => a.id === mfId);
        para.checked = '';
        let selectedUnit = '';
        _.forEach(currentClickMeters, m => {
          _.forEach(m.parameters, s => {
            if (_.isEqual(s.checked, 'checked')) {
              selectedUnit = s.unit;
              return false;
            }
          });
        });
        globalUnit = selectedUnit;
      }
      $('#current-unit').text(globalUnit);
      if (globalDataType === paraType.instantaneousValue) {
        $('#showWeek').css('color', '#ddd !important');
        $('#showMonth').css('color', '#ddd !important');
        $('#showYear').css('color', '#ddd !important');
        if (globalDateType !== dateType.day && globalDateType !== dateType.more) {
          globalDateType = dateType.day;
          globalsTime = new Date().format('yyyy-MM-dd 00:00:01');;
          globaleTime = new Date().format('yyyy-MM-dd 23:59:59');;
          $('.focus-detail-header_tab a.active').removeClass('active');
          $('#showDay').addClass('active');
        }
        $('#aggregateValue-container').addClass('hidden');
        $('#instantanousValue-container').removeClass('hidden');
        $('#datePicker').datePicker({
          value: [new Date().getFullYear(), formatNumber(new Date().getMonth() + 1), formatNumber(new Date().getDate())],
        }, 'd');
      } else {
        document.getElementById('showWeek').style = '';
        document.getElementById('showMonth').style = '';
        document.getElementById('showYear').style = '';
        $('#aggregateValue-container').removeClass('hidden');
        $('#instantanousValue-container').addClass('hidden');
      }
    } else {
      let flag = true;
      _.forEach(currentClickMeters, m => {
        _.map(m.parameters, a => a.checked = '');
        let willChecked = _.filter(m.parameters, a => _.toLower(a.unit) === _.toLower(unit));
        if (willChecked.length > 1) {
          let special = _.filter(willChecked, a => _.includes(a.name, text));
          if (special.length !== 1) {
            $.toast('存在多个相同参数，请手动选择');
            flag = false;
            return flag;
          } else {
            special[0].checked = 'checked';
          }
        } else {
          willChecked[0].checked = 'checked';
        }
      });
      sessionStorage.setItem('current_select_meters', JSON.stringify(currentClickMeters));
      globalDataType = parseInt(chooseType);
      $('#parameter-container > a').removeClass('checked');
      currentDom.toggleClass('checked');
      if (!flag) return;
    }
    let mfIds = _.map(getActiveParameters().parameterList, a => a.id);
    getFocusMeterData(activeMeter, globalQueryType, globalDataType, globalDateType,
      globalsTime, globaleTime, mfIds);
  });
  $(document).on('click', '#subscribe', function (e) {
    if (globalFocusId === -1) {
      let meter = _.head(currentClickMeters);
      let defaultTitle = '日量-' + energyEnum[meter.EnergyCode] + '-' + meter.text;
      let meterTree = JSON.parse(sessionStorage.getItem('meter_tree'));
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
              let sIds = [];
              _.forEach(getMeterActiveParameters().meterList, meter => {
                let m = {
                  m: meter.meterId,
                  plist: []
                };
                _.forEach(meter.parameterList, p => {
                  m.plist.push(p.id);
                });
                sIds.push(m);
              });
              let para = {
                title: title,
                sId: JSON.stringify(sIds),
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
                etime: globaleTime,
                activeId: getActiveMeterId()
              }
              esdpec.framework.core.doPostOperation('subscribe/subscribe', para, function (response) {
                if (response.IsSuccess) {
                  $.toast('关注成功');
                  $('#subscribe').text('取消关注');
                  globalFocusId = response.Content;
                  sessionStorage.setItem('current_focus_id', globalFocusId);
                }
              });
            }
          },
        ]
      });
    } else {
      esdpec.framework.core.doDeleteOperation('subscribe/unsubscribe?id=' + globalFocusId, {}, function (response) {
        if (response.IsSuccess) {
          _.remove(globalFocusList.focusList, a => a.id === globalFocusId);
          globalFocusId = -1;
          $('#subscribe').text('关注');
          sessionStorage.setItem('current_focus_id', globalFocusId);
        }
      });
    }
  });
  $(document).on("pageInit", "#page-focus", function (e, id, page) {
    globalFocusId = -1;
    sessionStorage.setItem('current_focus_id', globalFocusId);
    globalCurrentPage = 'page-focus';
    loadFocusListData(1, '');
    loadMeterTree(0);
    pullToLoadFocusList(page);
  });
  $(document).on("pageInit", "#focus-detail-page", function (e, id, page) {
    isComparsionStatus = false;
    globalCurrentPage = 'focus-detail-page';
    if (currentClickMeters.length === 0) {
      let selectMetersJson = sessionStorage.getItem('current_select_meters');
      currentClickMeters = JSON.parse(selectMetersJson);
      sessionStorage.setItem('current_select_meters', '[]');
      globalFocusId = sessionStorage.getItem('current_focus_id');
      sessionStorage.setItem('current_focus_id', -1);
    }
    bindTabClick(page);
    renderFocusMeter();
    getMeterFocusData();
  });

  $.init();
});