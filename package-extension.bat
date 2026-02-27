@echo off
echo 正在打包 Chrome 扩展...
cd extension
powershell -ExecutionPolicy Bypass -File package.ps1
cd ..
echo.
echo 打包完成！ZIP 文件已生成在项目根目录。
pause
