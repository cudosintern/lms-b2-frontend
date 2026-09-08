$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
$destination = 'D:\lms_interns_batch6\lms-b2-backend\edu.erp\Coding\backend\app\api\v1\lms_module\topic_management'
foreach ($name in @('topic_routes','topic_schema','topic_calendar')) {
    $current = Join-Path $destination ($name + '.py')
    $allowed = @((Join-Path $source ($name + '.py')), (Join-Path $source ($name + '.original.py')), (Join-Path $source ($name + '.applied.py')))
    if (Test-Path -LiteralPath $current) {
        $currentHash = (Get-FileHash -LiteralPath $current).Hash
        $matches = $false
        foreach ($baseline in $allowed) {
            if ((Test-Path -LiteralPath $baseline) -and (Get-FileHash -LiteralPath $baseline).Hash -eq $currentHash) { $matches = $true }
        }
        if (-not $matches) { throw "Backend changed during migration: $current. Review before applying." }
    }
}
foreach ($name in @('topic_calendar.py','topic_schema.py','topic_routes.py')) {
    Copy-Item -LiteralPath (Join-Path $source $name) -Destination (Join-Path $destination $name)
}
foreach ($name in @('topic_calendar.py','topic_schema.py','topic_routes.py')) {
    if ((Get-FileHash -LiteralPath (Join-Path $source $name)).Hash -ne (Get-FileHash -LiteralPath (Join-Path $destination $name)).Hash) { throw "Copy verification failed: $name" }
}
Write-Output 'Applied and verified the three backend files.'
