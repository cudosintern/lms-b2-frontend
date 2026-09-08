$ErrorActionPreference = 'Stop'
$stage = $PSScriptRoot
$backend = 'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend\app\api\v1\lms_module\topic_management'
$calendar = 'D:\lms_interns_batch6\lms-b2-frontend\erp.fnt\Coding\ionerp_v1\src\pages\lms\timetableCalendar\TimetableCalendarPage.tsx'
$updates = @(
  @{Name='topic_routes.py'; Destination=(Join-Path $backend 'topic_routes.py')},
  @{Name='topic_schema.py'; Destination=(Join-Path $backend 'topic_schema.py')},
  @{Name='TimetableCalendarPage.tsx.snapshot'; Destination=$calendar}
)
foreach ($item in $updates) {
  $current = (Get-FileHash -LiteralPath $item.Destination).Hash
  $before = (Get-FileHash -LiteralPath (Join-Path $stage ($item.Name.Replace('.snapshot', '') + '.before'))).Hash
  $candidate = (Get-FileHash -LiteralPath (Join-Path $stage $item.Name)).Hash
  if ($current -ne $before -and $current -ne $candidate) { throw "File changed since review: $($item.Destination)" }
}
foreach ($item in $updates) {
  Copy-Item -LiteralPath (Join-Path $stage $item.Name) -Destination $item.Destination
  if ((Get-FileHash -LiteralPath $item.Destination).Hash -ne (Get-FileHash -LiteralPath (Join-Path $stage $item.Name)).Hash) { throw 'Copy verification failed' }
  Write-Output "Applied and verified: $($item.Destination)"
}

