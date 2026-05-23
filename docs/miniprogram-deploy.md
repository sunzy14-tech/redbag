# 小程序上传发布

## 当前配置

- 小程序目录：`miniprogram`
- 后端接口域名：`https://pphb.newfuturecloud.com`
- 当前 `project.config.json` 仍使用占位 AppID：`touristappid`

## 发布前必须配置

1. 在微信公众平台添加合法域名：
   - 开发管理 -> 开发设置 -> 服务器域名
   - request 合法域名添加：`https://pphb.newfuturecloud.com`
2. 将 `miniprogram/project.config.json` 里的 `appid` 改成真实小程序 AppID。
3. 用微信开发者工具打开 `miniprogram` 目录。
4. 真机预览扫码流程，确认可以访问线上 API。
5. 点击微信开发者工具右上角“上传”，填写版本号和备注。
6. 到微信公众平台提交审核，审核通过后发布。

## CLI 上传方式

如果已安装微信开发者工具并开启“服务端口”，可使用：

```bash
cli upload --project miniprogram --version 1.0.0 --desc "品牌红包扫码领奖"
```

Windows 常见 CLI 路径：

```text
C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat
C:\Program Files\Tencent\微信web开发者工具\cli.bat
```

CLI 上传同样需要真实 AppID 和开发者权限。
