@echo off
:: 设置字符集为 UTF-8，防止中文乱码
chcp 65001 >nul
title 智能降低AI系统 - 一键启动器

echo ===================================================
echo        智能降低AI系统 - 一键启动助手
echo ===================================================
echo.

:: 1. 检查 Node.js 环境是否安装
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ [错误] 未检测到 Node.js 环境！
    echo 请先前往 Node.js 官网下载并运行安装包: https://nodejs.org/
    echo 安装完成后，请重启电脑，然后再次双击运行此脚本。
    echo.
    pause
    exit
)

:: 2. 自动检查并安装项目依赖
if not exist node_modules (
    echo 📦 [提示] 检测到首次运行，正在为您自动安装项目依赖，请稍等...
    echo (可能需要 1-2 分钟，请保持网络连接)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ⚠️ [警告] 默认源安装失败，正在尝试使用国内腾讯/淘宝镜像加速安装...
        call npm install --registry=https://registry.npmmirror.com
    )
)

:: 3. 自动在默认浏览器中打开系统页面
echo.
echo 🚀 [提示] 正在启动本地服务器，并自动为您打开浏览器页面...
echo 如果浏览器没有自动打开，请手动在浏览器访问：http://localhost:5173/
echo.
start http://localhost:5173/

:: 4. 启动 Vite 本地服务
call npm run dev

pause
