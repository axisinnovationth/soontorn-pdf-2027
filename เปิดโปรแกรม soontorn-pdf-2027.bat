@echo off
rem ===== SOONTORN-PDF-2027 launcher (AXIS INNOVATION CO.,LTD.) =====
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$u=([Uri](Join-Path '%~dp0' 'index.html')).AbsoluteUri; try { Start-Process msedge -ArgumentList ('--app='+$u),'--start-maximized' -ErrorAction Stop } catch { try { Start-Process chrome -ArgumentList ('--app='+$u) -ErrorAction Stop } catch { Start-Process $u } }"
