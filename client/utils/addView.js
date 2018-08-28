var api = require('./api.js')

addView = function(faceCardId, type) {
  console.log('addView')
  api.get({
    url: 'https://www.facecardpro.com/wep/view/addOne',
    method: 'POST',
    data: {
      view: {
        faceCardId: faceCardId,
        type: type
      }
    },
    success(result) {
      console.log(result);
    },
    fail(err) {
      util.showError('保存失败')
    }
  });
}

module.exports = addView;