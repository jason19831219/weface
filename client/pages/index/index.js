//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
var addView = require('../../utils/addView.js')
Page({
  data: {
    userInfo: {},
    takeSession: false,
    temImagePath: '',
    requestResult: '',
    logged: false,
    faceCardList: [],
    pageNumber: 0,
    pageInfo:{}
  },


  onShow: function () {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    this.loadFaceCardList();

  },
  recommond: function () {
    var that = this;
    if (!that.data.faceCardList[0]){
      util.showError('只有建立过脸卡后，才能使用推荐功能哦');
      wx.showModal({
        content: '只有建立过脸卡后，才能使用推荐功能哦！',
        showCancel: false,
        confirmText: '好的',
        success: function (res) {
        }
      })
      return;
    };
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/findRandomOne',
      method: 'GET',
      data: {
        gender: that.data.faceCardList[0].gender,
        faceShape: that.data.faceCardList[0].face_shape,
        yaw: that.data.faceCardList[0].yaw + 3,
        yawMinus: that.data.faceCardList[0].yaw - 3
      },
      success(result) {
        addView(result.data.faceCard, 'RECOMMEND');
        wx.navigateTo({
          url: '/pages/faceCardShare/faceCardShare?faceCardId=' + result.data.faceCard + '&recommendFlag=true',
        })
      },
      fail(err) {
        console.error('登录失败，可能是网络错误或者服务器发生异常')
      }
    });
  },

  retry: function () {
    var that = this;
    if (!that.data.faceCardList[0]) {
      util.showError('请先建立脸卡');
      return;
    };

    var app = getApp();
    app.globalData.tempPhotoPath = 'https://www.facecardpro.com' + that.data.faceCardList[0].facePhoto;

    wx.navigateTo({
      url: '/pages/faceCardCreate/faceCardCreate?imgUrl=' + that.data.faceCardList[0].facePhoto + '&faceCardId=' + that.data.faceCardList[0]._id + '&retryFlag=true',
    })
  },

  onLoad: function () {
  },


  bindGetUserInfo: function (e) {
    if(this.data.pageInfo.totalItems>=50){
      util.showError('已超过建卡上限！');
      return;
    }
    if (this.data.logged) {
      this.doUpload();
      return
    }
    const session = qcloud.getSession()
    if (session) {
      qcloud.loginWithCode({
        success: res => {
          this.setData({
            userInfo: res,
            logged: true
          })
          this.doUpload();
        },
        fail: err => {
          console.error(err)
          util.showModel('登录错误', err.message)
        }
      })
    } else {
      util.showBusy('正在登录')
      qcloud.login({
        success: res => {
          this.setData({
            userInfo: res,
            logged: true
          })
          this.loadFaceCardList();
          util.showSuccess('登录成功')
          this.doUpload();
        },
        fail: err => {
          console.error(err)
          util.showError('授权失败')
        }
      })
    }
  },

  fciTouchS: function (e) {
    var that = this;
    if (e.touches.length == 1) {
      var query = wx.createSelectorQuery();
      query.select('.list > .item > .btn').boundingClientRect()
      query.exec(function (res) {
        that.setData({
          delBtnWidth: res[0].width-3
        });
      })
      this.setData({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      });
    }
  },
  fciTouchM: function (e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var list = that.data.faceCardList;
    if (e.touches.length == 1) {
      var moveX = e.touches[0].clientX;
      var moveY = e.touches[0].clientY;
      var disX = this.data.startX - moveX;
      var disY = this.data.startY - moveY;
      var style = "";
      if (disX == 0 || disX < 0) {
        if (style != '0px') {
        }
      } else if (disX > 30 && disY < disX) {
        style = "-" + disX + "px";
        if (disX >= this.data.delBtnWidth) {
          style = "-" + this.data.delBtnWidth + "px";
        }
      }
      list[index].style = style;
      this.setData({
        faceCardList: list
      });

    }
  },
  fciTouchE: function (e) {
    console.log("touchE" + e);
    var that = this
    if (e.changedTouches.length == 1) {
      //手指移动结束后触摸点位置的X坐标
    }
  },

  // 上传图片接口
  doUpload: function () {
    var that = this
    var header = qcloud.buildAuthHeader();

    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        util.showBusy('正在上传')
        var filePath = res.tempFilePaths[0]
        
        var app = getApp();
        app.globalData.tempPhotoPath = res.tempFilePaths[0]
        // 上传图片
        const uploadTask = wx.uploadFile({
          url: config.service.uploadUrl,
          header: header,
          filePath: filePath,
          name: 'file',
          formData: {
            'type': 'images'
          },
          success: function (res) {
            util.showSuccess('上传图片成功')
            res = JSON.parse(res.data)
            that.setData({
              imgUrl: res.info.imgUrl
            })
            wx.navigateTo({
              url: '/pages/faceCardCreate/faceCardCreate?imgUrl=' + res.info.imgUrl,
            })
          },

          fail: function (e) {
            console.log(e)
          }
        })

      },
      fail: function (e) {
        console.error(e)
      }
    })
  },

  onShareAppMessage: (res) => {
    return {
      title: '脸卡',
      path: '/pages/index/index',
      imageUrl: "/pages/index/cam.png",
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  },

  // onLoad: function () {
    
  // },

  getMore: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/getAll',
      method: 'GET',
      data: {
        pageNumber: ++that.data.pageInfo.pageNumber
      },
      success(result) {
        var list = that.data.faceCardList;
        result.data.list.forEach(function (res) {
          list.push(res)
        })
      
        that.setData({
          faceCardList: list,
          pageInfo: result.data.pageInfo
        });
      },
      fail(err) {
        util.showError('请先建立脸卡')
      }
    })
  },

  loadFaceCardList: function () {
    var that = this;
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/getAll',
      method: 'GET',
      success(result) {
        console.log(result)
        that.setData({
          faceCardList: result.data.list,
          pageInfo: result.data.pageInfo
        });
      },
      fail(err) {
        util.showError('请先建立脸卡')
      }
    })
  }, 
  itemTap: function (e) {
    console.log(this.data.faceCardList[e.currentTarget.dataset.index]._id)
    var id = this.data.faceCardList[e.currentTarget.dataset.index]._id
    wx.navigateTo({
      url: '/pages/faceCard/faceCard?faceCardId=' + id,
    })
  },
  deleteItem: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/updateRemoveTag',
      method: 'GET',
      data: {
        faceCardId: id
      },
      success(result) {
        util.showSuccess('删除成功')
        that.loadFaceCardList();
      },
      fail(err) {
        util.showError('删除失败')
      }
    })
  },
  onReachBottom: function () {
    if (this.data.pageInfo.pageNumber * 10 > this.data.pageInfo.totalItems) {
      return;
    } else {
      console.log('onReachBottom')
      this.getMore();
    }
  }
})