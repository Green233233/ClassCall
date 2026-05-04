# ClassCall 点星 课堂随机点名工具

这是一个基于Electron的课堂随机点名系统。

## 功能

- 导入txt格式的学生名单
- 显示学生总数
- 随机点名，带有轮换动效
- 显示剩余和已点名学生
- 继续点名功能

## 安装和运行

1. 安装Node.js (从 https://nodejs.org 下载并安装)

2. 安装依赖：
   ```
   npm install
   ```

3. 运行应用：
   ```
   npm start
   ```

4. 打包成exe：
   ```
   npm run build
   ```

### 可选：使用原生启动器来避免 SFX/便携 exe 提取延迟（推荐分发时采用）

如果你分发的是单文件 `portable` 可执行体，Windows 在双击时会先做自解压/提取，这会造成在短时间内无窗口可见（白屏）。为确保用户双击时能立刻看到界面，我提供了一个轻量的原生启动器样例：

- 路径： `launcher/main.go`
- 功能：通过 Win32 快速弹出一个 "正在启动，请稍候..." 的信息框（自动超时），并并行启动主程序 exe，从而避免用户白屏等待时的迷惑。

构建并使用方法（需要 Go）：
```powershell
cd launcher
go build -o launcher.exe main.go
# 将生成的 launcher.exe 与主应用 exe 放在同一目录（例如 dist 目录下），
# 并让用户双击 launcher.exe 启动应用（launcher 会立刻显示提示并启动主 exe）。
```

注意：如果你希望用户直接双击单个 exe 并获得即时视觉反馈，最佳做法是使用安装程序（例如 NSIS）在首次安装后直接运行已安装的 exe，避免每次启动都发生提取延迟。我也可以帮你把构建配置改为 `nsis` 并生成安装程序。

版本信息：

- 当前代码版本已更新为 **Alpha v0.1.1**。

如需反馈或报告问题，请在本仓库创建 Issue：

https://github.com/Green233233/ClassCall/issues

声明：本发行版由 AI 自动构建并生成发布说明。如需人工签名或审查，请联系维护者。

## 使用方法

1. 点击"导入学生名单"按钮，选择一个txt文件，每行一个学生名字。
2. 点击"开始点名"，程序会随机抽取一个学生并显示。
3. 点名完成后，点击"继续点名"继续抽取剩余学生。

## 文件结构

- `index.html`: 主界面
- `styles.css`: 样式文件
- `app.js`: 前端逻辑
- `main.js`: Electron主进程
- `package.json`: 项目配置