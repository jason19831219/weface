var config = require('../../config')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
var addView = require('../../utils/addView.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceCardId: '',
    faceCard: {},
    editFlag: false,
    faceSharpItems: [
      { name: 'square', value: '正方形', src: 'https://www.facecardpro.com/public/wximg/square.png' },
      { name: 'triangle', value: '三角形', src: 'https://www.facecardpro.com/public/wximg/triangle.png' },
      { name: 'oval', value: '椭圆', src: 'https://www.facecardpro.com/public/wximg/oval.png' },
      { name: 'heart', value: '心形', src: 'https://www.facecardpro.com/public/wximg/heart.png' },
      { name: 'round', value: '圆形', src: 'https://www.facecardpro.com/public/wximg/round.png' }
    ],
    hairLengthItems: [
      { name: 'SHORT', value: '短' },
      { name: 'NORMAL', value: '普通' },
      { name: 'LONG', value: '长' }
    ],
    hairQualityItems: [
      { name: 'SOFT', value: '柔软' },
      { name: 'NORMAL', value: '普通' },
      { name: 'HARD', value: '硬' }
    ],
    hairQuantityItems: [
      { name: 'LITTLE', value: '较少' },
      { name: 'NORMAL', value: '普通' },
      { name: 'LOT', value: '较多' }
    ],
    hairGranularityItems: [
      { name: 'THIN', value: '较细' },
      { name: 'NORMAL', value: '普通' },
      { name: 'THICK', value: '较粗' }
    ],
    hairCrispationItems: [
      { name: 'NONE', value: '无' },
      { name: 'NORMAL', value: '普通' },
      { name: 'LOT', value: '较卷' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      faceCardId: options.faceCardId
      // faceCardId: 'rJ_rhh6m7'
    })
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/getOne',
      method: 'GET',
      data: {
        faceCardId: that.data.faceCardId
      },
      success(result) {
        that.setData({
          faceCard: result.data.faceCard
        });
      },
      fail(err) {
        util.showError('保存失败')
      }
    });
  },

  bindGetUserInfo: function (e) {
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
          util.showModel('登录错误', err.message)
        }
      })
    }
  },

  faceSharpChange: function (e) {
    var str = 'faceCard.face_shape'
    this.setData({
      [str]: e.detail.value
    });
  },

  hairLengthChange: function (e) {
    var str = 'faceCard.hairLength'
    this.setData({
      [str]: e.detail.value
    });
  },

  hairQualityChange: function (e) {
    var str = 'faceCard.hairQuality'
    this.setData({
      [str]: e.detail.value
    });
  },

  hairQuantityChange: function (e) {
    var str = 'faceCard.hairQuantity'
    this.setData({
      [str]: e.detail.value
    });
  },

  hairGranularityChange: function (e) {
    var str = 'faceCard.hairGranularity'
    this.setData({
      [str]: e.detail.value
    });
  },

  hairCrispationChange: function (e) {
    var str = 'faceCard.hairCrispation'
    this.setData({
      [str]: e.detail.value
    });
  },

  itTopChange: function (e) {
    var str = 'faceCard.isTop'
    this.setData({
      [str]: (!this.data.faceCard.isTop)?1:0
    });
  },

  editFaceCard: function () {
    addView(this.data.faceCardId, 'EDIT');
    this.setData({
      editFlag: true
    });
  },

  saveFaceCard: function () {
    util.showBusy('正在保存')
    var that = this;
    qcloud.request({
      url: 'https://www.facecardpro.com/wep/faceCard/updateOne',
      header: qcloud.buildAuthHeader(),
      method: 'POST',
      login: true,
      data: that.data.faceCard,
      success(result) {
        util.showSuccess('保存成功');
        that.setData({
          editFlag: false
        });
      },
      fail(err) {
        util.showError('保存失败')
      }
    });
  },

  imgPreview: function (e) {
    var src = e.currentTarget.dataset.src;
    var imgList = Array();
    var list = e.currentTarget.dataset.list
    list.forEach(function (res) {
      if (res){
        imgList.push('https://www.facecardpro.com' + res)
      }
      console.log(res);
      
    })

    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  uploadImg: function (e) {
    var target = e.currentTarget.dataset.target
    console.log(target)
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
            var str = 'faceCard.' + target
            console.log(str)
            that.setData({
              [str]: res.info.imgUrl
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

  onShareAppMessage: function () {
    addView(this.data.faceCardId, 'SHARE');
    var faceCardId = this.data.faceCardId;
    return {
      title: '快来建立属于您的脸卡',
      path: '/pages/faceCardShare/faceCardShare?faceCardId=' + faceCardId,
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  },
})