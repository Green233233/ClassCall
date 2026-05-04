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