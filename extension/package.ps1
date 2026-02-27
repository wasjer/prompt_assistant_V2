# Chrome 扩展打包脚本
# 将 extension 目录打包为 ZIP 文件，排除不必要的文件

$extensionDir = $PSScriptRoot
$outputFile = Join-Path (Split-Path $extensionDir -Parent) "ai-prompt-manager-v2.0.0.zip"

Write-Host "正在打包 Chrome 扩展..." -ForegroundColor Green
Write-Host "源目录: $extensionDir" -ForegroundColor Yellow
Write-Host "输出文件: $outputFile" -ForegroundColor Yellow

# 如果已存在同名文件，先删除
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
    Write-Host "已删除旧文件: $outputFile" -ForegroundColor Yellow
}

# 创建临时目录用于打包
$tempDir = Join-Path $env:TEMP "extension-pack-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # 复制 manifest.json
    Copy-Item -Path (Join-Path $extensionDir "manifest.json") -Destination $tempDir -Force
    
    # 复制 background.js
    Copy-Item -Path (Join-Path $extensionDir "background.js") -Destination $tempDir -Force
    
    # 复制 content.js
    Copy-Item -Path (Join-Path $extensionDir "content.js") -Destination $tempDir -Force
    
    # 复制 lib 文件夹（如果存在）
    $libPath = Join-Path $extensionDir "lib"
    if (Test-Path $libPath) {
        Copy-Item -Path $libPath -Destination $tempDir -Recurse -Force
    }
    
    # 复制 icons 文件夹（如果存在）
    $iconsPath = Join-Path $extensionDir "icons"
    if (Test-Path $iconsPath) {
        Copy-Item -Path $iconsPath -Destination $tempDir -Recurse -Force
    }
    
    # 显示要打包的文件列表
    Write-Host ""
    Write-Host "包含的文件:" -ForegroundColor Cyan
    Get-ChildItem -Path $tempDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Replace($tempDir, "").TrimStart('\')
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  $relativePath ($sizeKB KB)" -ForegroundColor Gray
    }
    
    # 计算总大小
    $totalSize = (Get-ChildItem -Path $tempDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host ""
    Write-Host "总大小: $totalSizeMB MB" -ForegroundColor Yellow
    
    # 创建 ZIP 文件
    Compress-Archive -Path "$tempDir\*" -DestinationPath $outputFile -Force
    
    Write-Host ""
    Write-Host "打包完成!" -ForegroundColor Green
    Write-Host "ZIP 文件位置: $outputFile" -ForegroundColor Cyan
    
    # 显示 ZIP 文件大小
    $zipSize = (Get-Item $outputFile).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    Write-Host "ZIP 文件大小: $zipSizeMB MB" -ForegroundColor Cyan
}
finally {
    # 清理临时目录
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
