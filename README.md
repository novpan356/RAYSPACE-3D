# RAYSPACE Studio · 3D 运镜工作室

把参考视频、相机关键帧和三维预演放在同一个中文网页里。默认工程基于本仓库的 15.2 秒街头参考片制作，路径为视觉近似，不是原片相机追踪数据。

![RAYSPACE Studio 界面](docs/studio.png)

## 使用

### 单文件版

在 `downloads` 中下载 `RAYSPACE-Studio-Offline.zip`，解压后用新版桌面 Chrome 或 Edge 打开 `RAYSPACE-Studio.html`。HTML 已打包渲染引擎、界面、默认参考视频和缩略图，无需 Node.js 或在线 CDN。浏览器需要支持 WebGL。

若浏览器策略禁止本地 HTML，可使用已发布的 GitHub Pages 网页；开发者也可启动下方的本地服务。单文件版已通过本地 HTTP 的完整交互验证；本环境的托管浏览器禁止 `file://` 导航，因此未在该浏览器中验证双击打开。

### 在线版

仓库启用 GitHub Pages 并选择 `gh-pages` 分支、`/ (root)` 后，访问：
https://novpan356.github.io/RAYSPACE-3D/

启用页面：https://github.com/novpan356/RAYSPACE-3D/settings/pages

是否部署完成需要检查 GitHub 的实际页面状态；推送 `gh-pages` 不等于站点已启用。

## 主要操作

1. **先看效果**：点播放；在「导演视图」「镜头画面」「参考对照」之间切换。
2. **编辑相机**：选中时间轴下方的菱形关键帧，修改右侧相机 XYZ、瞄准点、焦距。Z 表示高度。
3. **直接设置机位**：在导演视图拖动、缩放到喜欢的角度，点「用当前导演视角设定机位」。也可以拖动橙色路径圆点调整水平位置。
4. **编辑时间**：拖动菱形改变关键帧时间；在时间轴选择其他时间后点「添加关键帧」。改变总时长会按比例缩放全部关键帧、人物动作和参考视频进度。
5. **自定义内容**：导入本地参考视频，切换城市、影棚、室内场景；导入小于 100 MB 的单文件 GLB 替换人物。GLB 需嵌入贴图，不支持 Draco 压缩和外部资源引用。模型骨骼动画未播放，人物移动只改变模型整体位置。
6. **参考分析**：抽取八张缩略图、定位采样画面变化较大的区间。像素差也受人物动作、剪辑和光照影响，不会自动恢复三维场景或解算精确相机轨迹。点击缩略图可跳转。
7. **导出**：JSON 工程、PNG 镜头画面、WebM 预演视频、TXT 分镜提示词。WebM 是实时录制，目标 24 FPS，实际流畅度取决于设备性能；录制时保持页面前台。无需上传到云环境再下载。

工程参数自动保存在当前浏览器。JSON 不包含用户导入的视频和 GLB，换设备或重新打开后需重新导入这些素材。内置原片已随单文件版打包。

## Higgsfield 3D Jutsu

保留用户指定页面入口和当前分镜提示词复制功能。**没有已验证的官方接口集成，也未实现登录、上传、自动操作或付费生成。** JSON 是 RAYSPACE 工程格式，不能声称可直接导入 Higgsfield。

打开外部服务需要联网。除此之外，用户导入的视频、模型和工程只在浏览器处理；网页不会把这些素材上传到仓库或服务器。

## 开发

Node.js 24；依赖锁定在 `package-lock.json`。

```sh
npm ci
npm run dev
```

构建与验证：

```sh
npm test
npm run build
npm run build:offline
```

端到端验证（测试机需安装 Python Playwright 和 `/usr/bin/chromium`，先启动开发服务）：

```sh
python tests/browser_test.py
```

`STUDIO_URL` 可指定构建后的网页地址。浏览器检查覆盖真实 WebGL 渲染、坐标编辑、撤销重做、时间轴拖动、GLB 加载、JSON 往返、错误输入、本机自动保存、视频抽帧、参考对照、实际 WebM 与 PNG 下载、移动端抽屉以及 JavaScript 错误。

已有的 `downloads/RAYSPACE-Camera-Previs.zip` 与 `RAYSPACE-Camera-Comparison.mp4` 为最初的固定预演素材，继续保留。
