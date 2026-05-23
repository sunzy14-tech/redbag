const { API_BASE_URL } = require('./config');

function request({ url, method = 'GET', data = {}, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.success) {
          resolve(res.data.data);
        } else {
          const message = res.data && res.data.message ? res.data.message : '请求失败';
          reject(new Error(message));
        }
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

module.exports = { request };

