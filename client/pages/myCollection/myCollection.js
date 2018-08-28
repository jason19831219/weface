var api = require('../../utils/api.js')
var util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceCardList: [],
    pageInfo:{
      pageNumber:1,
      pageSize:10,
      searchkey:"",
      totalItems:10
    },
    pageNumber:0
  },

  /**
   * 生命周期函数--监听页面加载
   */

  // onLoad: function () {
  //   this.loadCollectionList();
  // },
  onShow: function (options) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    this.loadCollectionList();
  },

  getMore: function () {
    var that = this;
    
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/getAll',
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


  loadCollectionList: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/getAll',
      method: 'GET',
      success(result) {
        that.setData({
          faceCardList: result.data.list,
          pageInfo: result.data.pageInfo
        });
      },
      fail(err) {
        util.showError('保存失败')
      }
    })
  },


  fciTouchS: function (e) {
    var that = this;
    if (e.touches.length == 1) {
      var query = wx.createSelectorQuery();
      query.select('.list > .item > .btn').boundingClientRect()
      query.exec(function (res) {
        that.setData({
          delBtnWidth: res[0].width
        });
      })
      this.setData({
        startX: e.touches[0].clientX
      });
    }
  },
  fciTouchM: function (e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var list = that.data.faceCardList;
    if (e.touches.length == 1) {
      var moveX = e.touches[0].clientX;
      var disX = this.data.startX - moveX;
      var style = "";
      if (disX == 0 || disX < 0) {
        if (style != '0px') {
        }
      } else if (disX > 30) {
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

  deleteItem: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/deleteOne',
      method: 'GET',
      data: {
        ids: id
      },
      success(result) {
        util.showSuccess('删除成功')
        that.loadCollectionList();
      },
      fail(err) {
        util.showError('删除失败')
      }
    })
  },


  itemTap: function (e) {
    if (this.data.faceCardList[e.currentTarget.dataset.index].faceCard.isRemove===1){
      util.showError('卡片已失效')
    }else{
      var id = this.data.faceCardList[e.currentTarget.dataset.index].faceCard._id
      wx.navigateTo({
        url: '/pages/faceCardShare/faceCardShare?faceCardId=' + id,
      })
    }
    
  },

  onReachBottom: function () {
    
    if (this.data.pageInfo.pageNumber * 10 > this.data.pageInfo.totalItems) {
      return;
    }else{
      console.log('onReachBottom')
      this.getMore();
    }
    
  }
})