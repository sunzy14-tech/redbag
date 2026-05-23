const app = getApp();
const { request } = require('../../utils/request');

function extractCode(scanResult) {
  if (!scanResult) return '';
  const queryIndex = scanResult.indexOf('?');
  if (queryIndex < 0) return scanResult;
  const query = scanResult.slice(queryIndex + 1).split('#')[0];
  const pairs = query.split('&');
  for (const pair of pairs) {
    const parts = pair.split('=');
    if (parts[0] === 'code') return decodeURIComponent(parts.slice(1).join('='));
  }
  return scanResult;
}

Page({
  data: {
    viewState: 'home',
    manualCode: '',
    claiming: false,
    prize: {
      amount: '0.00',
      productName: '',
      outTradeNo: ''
    }
  },

  onLoad() {
    this.ensureLogin();
  },

  ensureLogin() {
    wx.login({
      success: (res) => {
        app.globalData.openid = wx.getStorageSync('openid') || `dev-openid-${res.code || Date.now()}`;
        wx.setStorageSync('openid', app.globalData.openid);
      }
    });
  },

  onManualInput(event) {
    this.setData({ manualCode: event.detail.value });
  },

  scanCode() {
    this.setData({ viewState: 'scanning' });
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => this.redeemCode(extractCode(res.result)),
      fail: () => {
        this.setData({ viewState: 'home' });
        wx.showToast({ title: '扫码已取消', icon: 'none' });
      }
    });
  },

  redeemManual() {
    const code = this.data.manualCode.trim();
    if (!code) {
      wx.showToast({ title: '请输入测试码', icon: 'none' });
      return;
    }
    this.redeemCode(extractCode(code));
  },

  async redeemCode(code) {
    if (!code) {
      this.setData({ viewState: 'home' });
      wx.showToast({ title: '二维码无效', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '开奖中' });
    try {
      const data = await request({
        url: '/api/scan/redeem',
        method: 'POST',
        data: {
          code,
          openid: app.globalData.openid,
          nickname: ''
        }
      });
      this.setData({
        viewState: 'winner',
        prize: {
          amount: Number(data.amount).toFixed(2),
          productName: data.productName || '品牌红包',
          outTradeNo: data.outTradeNo
        }
      });
    } catch (error) {
      this.setData({ viewState: 'home' });
      wx.showToast({ title: error.message || '领取失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async claimRedbag() {
    if (this.data.claiming) return;
    this.setData({ claiming: true });
    try {
      await request({
        url: '/api/scan/claim',
        method: 'POST',
        data: {
          outTradeNo: this.data.prize.outTradeNo,
          openid: app.globalData.openid
        }
      });
      this.setData({ viewState: 'paid' });
    } catch (error) {
      wx.showToast({ title: error.message || '发放失败', icon: 'none' });
    } finally {
      this.setData({ claiming: false });
    }
  },

  backHome() {
    this.setData({
      viewState: 'home',
      manualCode: '',
      claiming: false
    });
  }
});
