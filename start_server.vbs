Set WshShell = CreateObject("WScript.Shell")
' 启动隐藏的 .bat，由 .bat 负责切目录并运行 node（0=完全隐藏窗口，False=不等待）
WshShell.Run "D:\github\prompt_assistant_V2\start_server.bat", 0, False
