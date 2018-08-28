var SESSION_KEY = 'weapp_session_F4C444D4-4BCE-4C74-AF2F-A7D874000D1A';
var util = require('../utils/util.js')

var buildHeader = function(cb) {
  var session = wx.getStorageSync(SESSION_KEY)
  var header = {}
  if (!session) {
    wx.login({
      success(loginResult) {
        header['X-WX-Code'] = loginResult.code;
        wx.request({
          url: 'https://www.facecardpro.com/wep/login',
          header: header,
          method: 'GET',
          success(result) {
            if (result.data.state == 'error' && result.data.message == 'without login') {
              return;
            }
            var res = result.data.data
            if (result.header['set-cookie']) {
              res.cookie = result.header['set-cookie'].split(';')[0]
            } else if (result.header['Set-Cookie']) {
              res.cookie = result.header['Set-Cookie'].split(';')[0]
            } else {
              res.cookie = wx.getStorageSync(SESSION_KEY)
            }
            if (!res || !res.userinfo) {
              return;
            }
            wx.setStorageSync(SESSION_KEY, res);
            cb();
          },
          fail(err) {
            console.error('登录失败，可能是网络错误或者服务器发生异常')
          }
        });
      }
    })
  } else {
    cb();
  }
}



const noop = function noop() {}
const defaultOptions = {
  method: 'POST',
  success: noop,
  data: '',
  fail: noop,
  url: null,
}

var api = {
  get: function(opts) {
    buildHeader(() => {
      opts = Object.assign({}, defaultOptions, opts)
      var header = {};
      var session = wx.getStorageSync(SESSION_KEY);
      if (session) {
        header['cookie'] = session.cookie;
        header['skey'] = session.skey;
      }
      wx.request({
        url: opts.url,
        method: opts.method,
        header: header,
        data: opts.data,
        success: function(result) {
          if (result.data.state == 'error' && result.data.message == 'session out') {
            wx.removeStorageSync(SESSION_KEY);
            buildHeader(() => {
              opts = Object.assign({}, defaultOptions, opts)
              var header = {};
              var session = wx.getStorageSync(SESSION_KEY);
              if (session) {
                header['cookie'] = session.cookie;
                header['skey'] = session.skey;
              }
              console.log(header);
              wx.request({
                url: opts.url,
                method: opts.method,
                header: header,
                data: opts.data,
                success: opts.success,
                fail: opts.fail
              })
            })
          } else {
            opts.success(result);
          }

        },
        fail: opts.fail
      })
    })

  }
}

module.exports = api;