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
    },
    dayImage: {
      "晴": "d0.gif",
      "多云": "d1.gif" ,
      "阴": "d2.gif" ,
      "小雨": "d7.gif" ,
      "中雨": "d8.gif" ,
      "阵雨": "d9.gif" ,
      "雷阵雨": "d5.gif" 
    },
    nightImage: {
      "晴": "n00.gif",
      "多云": "n01.gif",
      "阴": "n02.gif",
      "小雨": "n07.gif",
      "中雨": "n08.gif",
      "阵雨": "n09.gif",
      "雷阵雨": "n05.gif"
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
    if (this.data.areaInfo && this.data.areaInfo.cityId ){
      this.loadWeather(this.data.areaInfo.cityId);
      return;
    }
    this.selectLocation();
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
  selectLocation:function(){
    var myThis = this;
    wx.chooseLocation({
      success: function (data) {
        myThis.data.areaInfo.cityName = data.name;
        myThis.loadCityId(data.address, myThis.loadWeather);
      },
      fail: function (exInfo) {
        console.log(exInfo);
        wx.showToast({
          title: '您拒绝了访问地理位置',
          duration: 2000
        });
        wx.hideLoading();
      },
      complete: function (data) {
        console.log('地理选择Complete:');
        console.log(data);
      }
    });
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
    wx.showLoading({
      title: "正在确认定位",
      mask: true
    });
    var myThis=this;
    var provinceIndex = address.indexOf('省');
    var isZizhi=false;
    if(provinceIndex<0){
      provinceIndex = address.indexOf('自治区');
      isZizhi=true;
    }
    var cityIndex = address.indexOf('市');
    var areaIndex = address.indexOf('区', cityIndex+1);
    var province="",city="",areaName="";
    if(provinceIndex>0){
      province=address.substring(0,provinceIndex);
    }
    if (cityIndex > 0) {
      if(isZizhi)
        city = address.substring(provinceIndex + 3, cityIndex);
      else
        city = address.substring(provinceIndex + 1,cityIndex);
    }
    if (areaIndex > 0) {
      areaName = address.substring(cityIndex + 1, areaIndex);
    }
    if(!province||!city){
      wx.hideLoading();
      wx.showToast({
        title: "请选择带省、市信息的位置信息",
        icon:"none"
      });
      this.data.areaInfo.areaName ="请定位";
      this.data.areaInfo.address = "未确认位置";
      myThis.setData({ areaInfo: this.data.areaInfo});
      return;
    }
    var areaCode ="101";
    var provinceFunc=function(areaCodeAry){
       for(var i in areaCodeAry){
          var areaCodeInfo = areaCodeAry[i];
         var code = areaCodeInfo.code;
         var name = areaCodeInfo.name;
         if (name === province || province.indexOf(name) >= 0){
            myThis.loadAreaCode(cityFunc,code,2);
            return;
          }
       }
      wx.hideLoading();
      wx.showToast({
        title: "您的位置信息不支持查询",
        icon: "none"
      });
    }
    var cityFunc = function (areaCodeAry) {
      for (var i in areaCodeAry) {
        var areaCodeInfo = areaCodeAry[i];
        var code = areaCodeInfo.code;
        var name = areaCodeInfo.name;
        if (name === city || city.indexOf(name)>=0) {
          areaCode += code;
          myThis.loadAreaCode(areaFunc,code,3);
          return;
        }
      }
      wx.hideLoading();
      wx.showToast({
        title: "您的位置信息不支持查询",
        icon: "none"
      });
    }
    var areaFunc = function (areaCodeAry) {
      var isSet=false;//是否找到匹配的区域代号并设置了
      for (var i in areaCodeAry) {
        var areaCodeInfo = areaCodeAry[i];
        var code = areaCodeInfo.code;
        var name = areaCodeInfo.name;
        if (name === areaName) {
          myThis.data.areaInfo.areaName = name + "区";
          areaCode = "101" + code;
          isSet=true;
          wx.hideLoading();
          backFunc(areaCode);//回调返回城市代号ID
          break;
        }
      }
      if(isSet===false){//没有匹配区域按01
        if(city=="珠海")
          myThis.data.areaInfo.areaName = areaCodeAry[0].name + "区";
        else
          myThis.data.areaInfo.areaName = areaCodeAry[0].name + "市";
        wx.hideLoading();
        backFunc(areaCode + "01");
      }
    }
    this.loadAreaCode(provinceFunc,"",1);
  },
  loadWeather:function(cityId){
    wx.showLoading({
      title: "加载天气信息",
      mask: true
    });
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
          var weatherInfo = response.data.resultData;
          var dayConst ="/image/day/";
          var nightConst = "/image/night/";
          var word = weatherInfo.cityYesterday.dayCondition.skyType;
          weatherInfo.cityYesterday.dayCondition.wImg = dayConst + myThis.data.dayImage[word];
          word = weatherInfo.cityYesterday.nightCondition.skyType;
          weatherInfo.cityYesterday.nightCondition.wImg = nightConst + myThis.data.nightImage[word];
          weatherInfo.forecast.forEach(function(item,index){
            word = item.dayCondition.skyType;
            item.dayCondition.wImg = dayConst + myThis.data.dayImage[word];
            word = item.nightCondition.skyType;
            item.nightCondition.wImg = nightConst + myThis.data.nightImage[word];
          });
          myThis.setData({ weather: weatherInfo});//设置显示天气信息
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
      },
      complete:function(){
        wx.hideLoading();
      }
    })
  }
})