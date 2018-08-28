var config = require('../../config')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
var addView = require('../../utils/addView.js')
var QQMapWX = require('../../vendor/qqmap-wx-jssdk.min.js')
var qqmapsdk
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: '',
    step: 0,
    speed: 0,
    resultFlag: false,
    retryFlag: false,
    refImgList: [],
    recommendPic: [],
    tempPhotoPath: '',
    collectedFlag: false,
    collectionId: '',
    shareQrFlag: false,
    faceCardId: '',
    qrCanvas: {},
    index: 0,
    faceCard: {},
    faceSharpItems: [
      { name: 'square', value: '正方形', src: 'https://www.facecardpro.com/public/wximg/square.png' },
      { name: 'triangle', value: '三角形', src: 'https://www.facecardpro.com/public/wximg/triangle.png' },
      { name: 'oval', value: '椭圆', src: 'https://www.facecardpro.com/public/wximg/oval.png' },
      { name: 'heart', value: '心形', src: 'https://www.facecardpro.com/public/wximg/heart.png' },
      { name: 'round', value: '圆形', src: 'https://www.facecardpro.com/public/wximg/round.png' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.setData({
      tempPhotoPath: getApp().globalData.tempPhotoPath,
      index: parseInt(Math.random() * 20)
    })
    util.showBusy('正在测算')
    this.setData({
      imgUrl: options.imgUrl
      // imgUrl: '/public/upload/wep/photos/img20180705163127.png'
    })
    var temp = {};
    var width = 0;
    var height = 0;
    var query = wx.createSelectorQuery();
    query.select('#main').boundingClientRect()
    query.exec(function (res) {
      temp['width'] = res[0].width * 0.9
      temp['height'] = res[0].height * 0.9
    })
    var picWidth = 0;
    var picHeight = 0;
    var query = wx.createSelectorQuery();
    query.select('.pic-holder>.image-holder').boundingClientRect()
    query.exec(function (res) {
      temp['picWidth'] = res[0].width,
        temp['picHeight'] = res[0].height
      that.setData({
        qrCanvas: temp
      })
      console.log('qrCanvas' + JSON.stringify(that.data.qrCanvas))
    })




    // options.faceCardId = 'Hyda9H1rm'
    if (options.faceCardId) {
      this.setData({
        faceCardId: options.faceCardId,
        retryFlag: true
      })
      console.log(options.faceCardId)

      wx.setNavigationBarTitle({
        title: '看看推荐'
      })

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
          that.getRecommendPic();
        },
        fail(err) {
          util.showError('保存失败')
        }
      });

    } else {
      wx.setNavigationBarTitle({
        title: '建立脸卡'
      })
      api.get({
        url: 'https://www.facecardpro.com/wep/startAipFace',
        method: 'POST',
        data: {
          path: that.data.imgUrl
        },
        success(result) {
          if (result.data.state == 'error'){
            util.showError('无法识别脸型')
            setTimeout(function(){
              wx.switchTab({
                url: '/pages/index/index'
              })
            },3000)
            
          }else{
            var info = result.data.info[0]
            var faceCardResult = {
              age: info.age,
              yaw: info.angle.yaw,
              pitch: info.angle.pitch,
              roll: info.angle.roll,
              beauty: info.beauty,
              expression: info.expression.type,
              face_probability: info.face_probability,
              face_shape: info.face_shape.type,
              face_token: info.face_token,
              gender: info.gender.type,
              glasses: info.glasses.type,
              landmark: JSON.stringify(info.landmark),
              landmark72: JSON.stringify(info.landmark72),
              location: JSON.stringify(info.location),
              race: info.race.type,
              street: info.street,
              district: info.district
            }

            that.setData({
              faceCard: faceCardResult
            })
            qqmapsdk = new QQMapWX({
              key: 'DU3BZ-YRT6P-JRYDT-VTWGK-LRH2F-5MBFD'
            });
            wx.getLocation({
              type: 'gcj02',
              success: function (res) {
                console.log(res);
                qqmapsdk.reverseGeocoder({
                  location: {
                    latitude: res.latitude,
                    longitude: res.longitude
                  },
                  success: function (addressRes) {
                    var district = 'faceCard.district'
                    var street = 'faceCard.street'
                    var city = 'faceCard.city'
                    that.setData({
                      [district]: addressRes.result.address_component.district,
                      [street]: addressRes.result.address_component.street,
                      [city]: addressRes.result.address_component.city
                    })
                    that.getRecommendPic();
                  }
                })
              },
              fail: function (err) {
                that.getRecommendPic();
                // util.showBusy('获取地址错误')
              }
            })
          }
          
        },
        fail(err) {
          console.error('登录失败，可能是网络错误或者服务器发生异常')
        }
      });
    }

  },

  retry: function () {
    var that = this;
    addView(this.data.faceCardId, 'RETRY');
    var query = wx.createSelectorQuery();
    query.select('.ani-holder').boundingClientRect()
    query.exec(function (res) {
      var step = parseFloat('-' + res[0].height)
      that.setData({
        index: (++that.data.index) % 20
      })
      that.animationData.translateY(that.data.index * step).step({
        duration: 1000
      });
      that.setData({
        animationData: that.animationData.export()
      })
      that.checkCollectioned();
    })

    
  },

  checkCollectioned: function () {
    var that = this;
    console.log(that.data.refImgList[that.data.index].id)
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/getOne',
      method: 'GET',
      data: {
        faceCardId: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : ''
      },
      success(result) {
        if (result.data.message == '已收藏过！') {
          that.setData({
            collectedFlag: true,
            collectionId: result.data.id
          })
        } else {
          that.setData({
            collectedFlag: false
          })
        }
      },
      fail(err) {
        util.showError('获取收藏信息失败')
      }
    });
  },



  getRecommendPic: function () {
    var that = this;
    var list = [];
    var resultList = [];
    var url = that.data.retryFlag ? 'https://www.facecardpro.com/wep/faceCard/getAll' : 'https://www.facecardpro.com/wep/star/getAll'
    api.get({
      url: url,
      method: 'GET',
      data: {
        gender: that.data.faceCard.gender,
        faceShape: that.data.faceCard.face_shape,
        yaw: that.data.faceCard.yaw + 3,
        yawMinus: that.data.faceCard.yaw - 3,
        frontFlag: true
      },
      success(result) {
        util.showSuccess('测算结束')
        result.data.list.forEach(function (res) {
          if(that.data.retryFlag){
            if (res) {
              list.push({
                src: res.facePhoto,
                name: res.author ? res.author.wxUserInfo.nickName : '',
                id: res._id
              })

              if (list.length < 4) {
                resultList.push(res.facePhoto)
              }
            }
          }else {
            if (res) {
            list.push({
              src: res.src,
              name: res.name,
              id: res.id
            })
            if (list.length < 4) {
              resultList.push(res.src)
            }
            }
          }
          
        })
        var i = 0;
        while (list.length < 20) {
          list.push(list[i])
          i++;
        }

        var query = wx.createSelectorQuery();
        query.select('.ani-holder').boundingClientRect()
        query.exec(function (res) {
          var step = parseFloat('-' + res[0].height)
          that.animationData = wx.createAnimation();
          that.animationData.translateY(that.data.index * step).step({
            duration: 1000
          });
          that.setData({
            animationData: that.animationData.export()
          })
        })
        that.setData({
          refImgList: list
        })
        var recommendPic = 'faceCard.recommendPic'
        var star = 'faceCard.star'
        var facePhoto = 'faceCard.facePhoto'
        that.setData({
          [facePhoto]: that.data.imgUrl,
          [star]: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : '',
          [recommendPic]: resultList
        })

        if (!that.data.faceCardId) {
          that.saveFaceCard();
        } else {
          that.backAni();
        }

        that.checkCollectioned();
      },
      fail(err) {
        console.error('登录失败，可能是网络错误或者服务器发生异常')
      }
    });
  },

  backAni: function () {
    var that = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.select('.pic-holder').boundingClientRect()
      query.exec(function (res) {

        var animation = wx.createAnimation({
          duration: 1000,
        })
        var step = parseFloat('-' + res[0].top)
        animation.translateY(step).step();
        that.setData({
          animationPicData: animation.export()
        })
      })

      query.select('.cover').boundingClientRect()
      query.exec(function (res) {
        var animation = wx.createAnimation({
          duration: 1000,
        })
        animation.opacity(0).step();
        that.setData({
          coverAnimation: animation.export()
        })
      })
    }, 1000);

    setTimeout(function () {
      that.setData({
        resultFlag: true
      })
    }, 2000)

  },


  updateFaceCard: function () {
    var that = this;
    var star = 'faceCard.star'
    var id = 'faceCard._id'
    console.log(that.data.refImgList[that.data.index].id)
    that.setData({
      [star]: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : '',
      [id]: that.data.faceCardId
    })

    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/updateOne',
      method: 'POST',
      data: that.data.faceCard,
      success(result) {
        // util.showSuccess('更新成功')
      },
      fail(err) {
        util.showError('保存失败')
      }
    })
  },







  saveFaceCard: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/addOne',
      method: 'POST',
      data: that.data.faceCard,
      success(result) {
        that.setData({
          faceCardId: result.data.data.id
        })

        setTimeout(function () {
          var query = wx.createSelectorQuery();
          query.select('.pic-holder').boundingClientRect()
          query.exec(function (res) {

            var animation = wx.createAnimation({
              duration: 1000,
            })
            var step = parseFloat('-' + res[0].top)
            animation.translateY(step).step();
            that.setData({
              animationPicData: animation.export()
            })
          })

          query.select('.cover').boundingClientRect()
          query.exec(function (res) {
            var animation = wx.createAnimation({
              duration: 1000,
            })
            animation.opacity(0).step();
            that.setData({
              coverAnimation: animation.export()
            })
          })
        }, 1000);

        setTimeout(function () {
          that.setData({
            resultFlag: true
          })
        }, 2000)
      },
      fail(err) {
        util.showError('保存失败')
      }
    })
  },

  onShareAppMessage: function () {
    var faceCardId = this.data.faceCardId;
    this.updateFaceCard()
    if (!faceCardId) {
      console.log('请先保存')
    } else {
      addView(faceCardId, 'SHARE');
      return {
        title: '快来看看您长得像谁？',
        path: '/pages/faceCardCreateShare/faceCardCreateShare?faceCardId=' + faceCardId,
        success: (res) => {
          console.log("转发成功", res);
        },
        fail: (res) => {
          console.log("转发失败", res);
        }
      }
    }
  },

  imgPreview: function (e) {
    var src = e.currentTarget.dataset.src;
    var imgList = Array();
    var list = e.currentTarget.dataset.list
    list.forEach(function (res) {
      console.log(res);
      imgList.push('https://www.facecardpro.com' + res)
    })

    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  share: function () {
    this.updateFaceCard()
  },

  // onShow: function () {
  //   var that = this;
  //   var query = wx.createSelectorQuery();
  //   query.select('#main').boundingClientRect()
  //   query.exec(function (res) {
  //     var str1 = 'qrCanvas.width';
  //     var str2 = 'qrCanvas.height'
  //     that.setData({
  //       [str1]: res[0].width,
  //       [str2]: res[0].height
  //     });
  //   })
  //   var query = wx.createSelectorQuery();
  //   query.select('.pic-holder>.image-holder').boundingClientRect()
  //   query.exec(function (res) {
  //     var str1 = 'qrCanvas.picWidth';
  //     var str2 = 'qrCanvas.picHeight'
  //     that.setData({
  //       [str1]: res[0].width,
  //       [str2]: res[0].height
  //     });
  //   })

  //   console.log('this.data.qrCanvas.heightonShow'+this.data.qrCanvas.height)

  //   console.log('this.data.qrCanvas.height' + this.data.qrCanvas.picHeight)
  // },

  // onReady: function () {
  //   var that = this;
  //   var query = wx.createSelectorQuery();
  //   query.select('#main').boundingClientRect()
  //   query.exec(function (res) {
  //     var str1 = 'qrCanvas.width';
  //     var str2 = 'qrCanvas.height'
  //     that.setData({
  //       [str1]: res[0].width,
  //       [str2]: res[0].height
  //     });
  //   })
  //   var query = wx.createSelectorQuery();
  //   query.select('.pic-holder>.image-holder').boundingClientRect()
  //   query.exec(function (res) {
  //     var str1 = 'qrCanvas.picWidth';
  //     var str2 = 'qrCanvas.picHeight'
  //     that.setData({
  //       [str1]: res[0].width,
  //       [str2]: res[0].height
  //     });
  //   })

  //   console.log('this.data.qrCanvas.heightonReady' + this.data.qrCanvas.height)

  //   console.log('this.data.qrCanvas.height' + this.data.qrCanvas.picHeight)
  // },

  getImageinfo: function (imagePath) {
    return new Promise((resolve, reject) => {
      console.log(imagePath)
      wx.getImageInfo({
        src: imagePath,//服务器返回的带参数的小程序码地址
        success: function (res) {
          resolve(res)
        },
        fail: function (res) {
          reject(res)
        }
      })
    })
  },
  deleteCollection: function () {
    var that = this;
    console.log(that.data.refImgList[that.data.index].id)
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/deleteOne',
      method: 'GET',
      data: {
        ids: that.data.collectionId
      },
      success(result) {
        util.showSuccess('取消成功')
        that.setData({
          collectedFlag: false
        })
      },
      fail(err) {
        util.showError('删除失败')
      }
    })
  },

  photoClick: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/faceCardShare/faceCardShare?faceCardId=' + id + '&navFlag=true',
    })
  },

  photoClickItem: function (e) {
    var that = this
    var id = that.data.refImgList[e.currentTarget.dataset.index].id

    wx.navigateTo({
      url: '/pages/faceCardShare/faceCardShare?faceCardId=' + id + '&navFlag=true',
    })
  },

  doCollection: function () {
    var that = this;
    console.log(that.data.refImgList[that.data.index].id)
    addView(this.data.faceCardId, 'COLLECTION');
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/addOne',
      method: 'POST',
      data: {
        faceCardId: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : ''
      },
      success(result) {
        if (result.data.state == 'success') {
          that.setData({
            collectedFlag: true,
            collectionId: result.data.id
          })
          api.get({
            url: 'https://www.facecardpro.com/wep/faceCard/updateLikeNum',
            method: 'GET',
            data: {
              faceCardId: that.data.faceCardId
            },
            success(result) {
              util.showSuccess('收藏成功')
            },
            fail(err) {
              util.showError('收藏失败')
            }
          });
        } else {
          if (result.data.message == '超过收藏上限'){
            util.showError('已超过收藏上限')
          }else{
            util.showError('已收藏过')
          }
          
        }

      },
      fail(err) {
        util.showError('收藏失败')
      }
    });
  },


  async drawQrcode() {
    var that = this;
    addView(this.data.faceCardId, 'MOMENTS');
    this.setData({
      shareQrFlag: true
    })
    wx.showLoading({
      title: '正在生成图片...',
      mask: true,
    });

    var leftImage = '';
    var leftImageSx = 0;
    var leftImageSy = 0;
    var leftImageSw = 0;
    var leftImageSh = 0;
    await this.getImageinfo('https://www.facecardpro.com' + that.data.faceCard.facePhoto).then(function (res) {
      leftImage = res.path
      if (res.height / res.width > 1.5) {
        console.log('height')
        leftImageSw = res.width;
        leftImageSx = 0;
        leftImageSh = res.width * 1.5;
        leftImageSy = (res.height - leftImageSh) / 2
      } else {
        console.log('width')
        leftImageSh = res.height;
        leftImageSy = 0;
        leftImageSw = (res.height / 3) * 2;
        leftImageSx = (res.width - leftImageSw) / 2
      }
    });


    var rightImage = '';
    await this.getImageinfo('https://www.facecardpro.com' + that.data.refImgList[this.data.index].src).then(function (res) {
      rightImage = res.path
    });

    var qrImage = '';
    await this.getImageinfo('https://www.facecardpro.com/public/wximg/qrcode.jpg').then(function (res) {
      qrImage = res.path
    });


    var height = this.data.qrCanvas.height;
    var width = this.data.qrCanvas.width;
    var picWidth = this.data.qrCanvas.picWidth;
    var picHeight = ((width / 2) / picWidth) * this.data.qrCanvas.picHeight;

    const rightImageName = this.data.refImgList[this.data.index].name

    const canvasCtx = wx.createCanvasContext('myCanvas');
    //绘制背景
    canvasCtx.setFillStyle('white');
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.drawImage(leftImage, leftImageSx, leftImageSy, leftImageSw, leftImageSh, 0, 0, width / 2, picHeight);
    canvasCtx.drawImage(rightImage, width / 2, 0, width / 2, picHeight);
    canvasCtx.setFontSize(16);
    canvasCtx.setFillStyle('#000000');
    canvasCtx.setTextAlign('center');
    canvasCtx.fillText('经过阿发确认，与您最相似的明星', width / 2, picHeight + 40);

    canvasCtx.setFontSize(20);
    canvasCtx.setFillStyle('#000000');
    canvasCtx.setTextAlign('center');
    canvasCtx.fillText('竟然是 ' + rightImageName + '!!!', width / 2, picHeight + 80);
    canvasCtx.drawImage(qrImage, width / 4, picHeight + 100, width / 2, width / 2);
    canvasCtx.draw();
    //绘制之后加一个延时去生成图片，如果直接生成可能没有绘制完成，导出图片会有问题。
    setTimeout(function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: width,
        height: height,
        destWidth: width,
        destHeight: height,
        canvasId: 'myCanvas',
        success: function (res) {
          // that.setData({
          //   shareImage: res.tempFilePath,
          //   showSharePic: true
          // })
          wx.hideLoading();
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              wx.showModal({
                content: '图片已保存到相册,可分享到朋友圈！',
                showCancel: false,
                confirmText: '好的',
                success: function (res) {
                  that.setData({
                    shareQrFlag: false
                  })
                }
              })

              // util.showSuccess('图片已保存到相册,可分享到朋友圈！')
            },
          })

        },
        fail: function (res) {
          console.log(res)
          wx.hideLoading();
        }
      })
    }, 2000);
  },
})