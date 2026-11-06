# 寰镜 MarketLens 诊断日志监视器：每 30s 采样一次日志，维护聚合状态。
# 输出（均在 $watchDir 下，属运行时产物，不入库）：
#   status.json — 最近一次采样快照（计数 + 最新事件）
#   timeline.log — 每次采样一行紧凑时间线，巡检读它判断“稳定/有新失败”
#   STOP — 出现此文件即退出（收尾卫生用）
param(
	[int]$IntervalSec = 30,
	[int]$MaxMinutes = 360,
	[string]$LogDir = "$HOME\.dsh\market-lens"
)
$watchDir = Join-Path $LogDir 'watch'
New-Item -ItemType Directory -Force -Path $watchDir | Out-Null
$deadline = (Get-Date).AddMinutes($MaxMinutes)
$prevLines = -1
while ((Get-Date) -lt $deadline -and -not (Test-Path (Join-Path $watchDir 'STOP'))) {
	$logPath = Join-Path $LogDir ("marketlens-diag-{0}.jsonl" -f (Get-Date -Format 'yyyy-MM-dd'))
	$rows = @()
	if (Test-Path $LogPath) {
		$rows = @(Get-Content $LogPath | ForEach-Object {
			try { $_ | ConvertFrom-Json } catch { $null }
		} | Where-Object { $_ })
	}
	$bad = @($rows | Where-Object { $_.ev -match '\.fail$|\.crash$|^route\.(reject|status)$' -and $_.ev -ne 'selftest' })
	$ok = @($rows | Where-Object { $_.ev -match '^panel\.(meta|quotes|kline|fin|news)\.ok$' })
	$delta = $rows.Count - $prevLines
	if ($prevLines -lt 0) { $delta = 0 }
	$snapshot = [ordered]@{
		at         = (Get-Date).ToUniversalTime().ToString('o')
		log        = $LogPath
		lines      = $rows.Count
		newLines   = $delta
		okCount    = $ok.Count
		badCount   = $bad.Count
		lastEvents = @($rows | Select-Object -Last 6 | ForEach-Object { $_.ev })
		lastBad    = @($bad | Select-Object -Last 3 | ForEach-Object { "$($_.t) $($_.ev) $($_.message)" })
	}
	$json = $snapshot | ConvertTo-Json -Compress
	Set-Content -Path (Join-Path $watchDir 'status.json') -Value $json -Encoding UTF8
	$stamp = (Get-Date).ToString('HH:mm:ss')
	Add-Content -Path (Join-Path $watchDir 'timeline.log') -Value "$stamp lines=$($rows.Count) +$delta ok=$($ok.Count) bad=$($bad.Count)" -Encoding UTF8
	$prevLines = $rows.Count
	Start-Sleep -Seconds $IntervalSec
}
