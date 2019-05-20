// pages/weather/weather.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    areaInfo:{
      cityId: "",//当前选择的城市ID,
      areaName: "定位中",
      cityName: "定位中..."
    },
    weather:{
      city:"",
      wendu:25,
      fengxiang:"--风",
      fengli:"--级",
      shidu:"--%",
      updateTime:"--:--",
      sunrise:"--:--",
      sunset:"--:--",
      cityYesterday:null,
      forecast: [],
      zhiShus:[]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    try {
      var areaInfoStr = wx.getStorageSync('areaInfo');
      if(areaInfoStr){
        var saveAreaInfo = JSON.parse(areaInfoStr);
        this.setData({ areaInfo: saveAreaInfo});
      }
    } catch (e) { }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var myThis=this;
    if (this.data.areaInfo && this.data.areaInfo.cityId ){
      this.loadWeather(this.data.areaInfo.cityId);
      return;
    }
    wx.chooseLocation({
      success: function (data) {
        myThis.data.areaInfo.cityName=data.name;
        myThis.loadCityId(data.address, myThis.loadWeather);
      },
      fail: function (exInfo) {
        console.log(exInfo);
        wx.showToast({
          title: '您拒绝了访问地理位置',
          duration: 2000
        });
      },
      complete: function (data) {
        console.log('地理选择Complete:');
        console.log(data);
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 加载区域代号，回掉函数必须
   */
  loadAreaCode: function (backFunc,tCode,level){
    var getUrl = "https://min.yshdevelop.club/api/weather/GetAreaCode?level=1";
    if(Boolean(tCode)&&level>1&&level<4){
      getUrl = "https://min.yshdevelop.club/api/weather/GetAreaCode?level="+level+"&areaCode="+tCode;
    }
    wx.request({
      url: getUrl,
      method:"GET",
      dataType:"json",
      success:function(response){
        if (response.data){
          if (response.data.code===1){
            backFunc(response.data.resultData);
          }else{
            wx.showToast({
              title: '加载区域代号出错：' + response.data.msg,
              icon: 'none'
            });
          }
        }else{
          wx.showToast({
            title: '加载区域代号为空',
            icon:'none'
          });
        }
      },
      fail:function(data){
        wx.showToast({
          title: '加载区域代号失败:'+data.errMsg,
          icon:'none'
        })
      }
    })
  },
  /**
   * 加载并计算出地址对应的城市ID
   */
  loadCityId:function(address,backFunc){
    var myThis=this;
    var provinceIndex = address.indexOf('省');
    var cityIndex = address.indexOf('市');
    var areaIndex = address.indexOf('区');
    var province="",city="",areaName="";
    if(provinceIndex>0){
      province=address.substring(0,provinceIndex);
    }
    if (cityIndex > 0) {
      city = address.substring(provinceIndex+1,cityIndex);
    }
    if (areaIndex > 0) {
      areaName = address.substring(cityIndex+1, areaIndex);
    }
    if(!province||!city){
      wx.showToast({
        title: "请选择带省、市信息的位置信息",
        icon:"none"
      });
      myThis.areaName="请定位";
      return;
    }
    this.data.areaInfo.areaName = areaName ? areaName+"区" : city+"市";
    var areaCode ="101";
    var provinceFunc=function(areaCodeAry){
       for(var i in areaCodeAry){
          var areaCodeInfo = areaCodeAry[i];
         var code = areaCodeInfo.code;
         var name = areaCodeInfo.name;
          if(name===province){
            myThis.loadAreaCode(cityFunc,code,2);
            break;
          }
       }
    }
    var cityFunc = function (areaCodeAry) {
      for (var i in areaCodeAry) {
        var areaCodeInfo = areaCodeAry[i];
        var code = areaCodeInfo.code;
        var name = areaCodeInfo.name;
        if (name === city) {
          areaCode += code;
          myThis.loadAreaCode(areaFunc,code,3);
          break;
        }
      }
    }
    var areaFunc = function (areaCodeAry) {
      var isSet=false;//是否找到匹配的区域代号并设置了
      for (var i in areaCodeAry) {
        var areaCodeInfo = areaCodeAry[i];
        var code = areaCodeInfo.code;
        var name = areaCodeInfo.name;
        if (name === areaName) {
          areaCode += code;
          isSet=true;
          backFunc(areaCode);//回调返回城市代号ID
          break;
        }
      }
      if(isSet===false){//没有匹配区域按01
        backFunc(areaCode + "01");
      }
    }
    this.loadAreaCode(provinceFunc,"",1);
  },
  loadWeather:function(cityId){
    var myThis=this;
    this.data.areaInfo.cityId = cityId;
    this.setData({ areaInfo: this.data.areaInfo});
    var saveAreaInfo = JSON.stringify(this.data.areaInfo);
    wx.setStorage({
      key: 'areaInfo',
      data: saveAreaInfo,
    });//异步保存当前cityId
    wx.request({
      url: 'https://min.yshdevelop.club/api/weather/GetCityWeather?cityId='+cityId,
      method:'GET',
      dataType:'json',
      success:function(response){
        if(response.data&&response.data.code===1){
          myThis.setData({weather:response.data.resultData});//设置显示天气信息
        }else{
          wx.showToast({
            title: "加载天气信息失败",
            icon:"none"
          });
        }
        console.log(response);
      },
      fail:function(exInfo){
        wx.showToast({
          title: "加载天气信息出错："+exInfo.errMsg,
          icon: "none"
        });
      }
    })
  }
})