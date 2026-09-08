param(
    [string]$BaseUrl = "http://localhost:8000/api/v1",
    [Parameter(Mandatory = $true)][int]$AcademicBatchId,
    [Parameter(Mandatory = $true)][int]$SemesterId,
    [Parameter(Mandatory = $true)][int]$CourseId,
    [Parameter(Mandatory = $true)][int]$SectionId,
    [int]$TopicId = 0,
    [int]$CreatedBy = 1,
    [datetime]$PlanDate = (Get-Date).Date.AddDays(1)
)

$route = "$BaseUrl/schedule-class/schedule-class"
$dateText = $PlanDate.ToString("yyyy-MM-dd")
$payload = @{
    academic_batch_id = $AcademicBatchId
    semester_id       = $SemesterId
    crs_id            = $CourseId
    section_id        = $SectionId
    topic_id           = if ($TopicId -gt 0) { $TopicId } else { $null }
    plan_date          = $dateText
    start_time         = "09:00:00"
    end_time           = "10:00:00"
    portion_ref        = "API calendar smoke-test portion"
    portion_per_hour   = "1.0"
    video_link         = $null
    status             = 1
    created_by         = $CreatedBy
} | ConvertTo-Json

Write-Host "Checking for an existing class..."
$duplicate = Invoke-RestMethod -Method Post -Uri "$route/check-duplicate" -ContentType "application/json" -Body $payload
$duplicate | ConvertTo-Json -Depth 8

if ($duplicate.data.is_duplicate) {
    throw "A class already exists for the supplied date and time. Change PlanDate before retrying."
}

Write-Host "Creating class..."
$created = Invoke-RestMethod -Method Post -Uri "$route/create" -ContentType "application/json" -Body $payload
$created | ConvertTo-Json -Depth 8

$classId = $created.data.lls_id
if (-not $classId) {
    throw "The backend did not return data.lls_id. Inspect the create response above."
}

$query = "academic_batch_id=$AcademicBatchId&semester_id=$SemesterId&crs_id=$CourseId&section_id=$SectionId"
Write-Host "Verifying calendar list..."
Invoke-RestMethod -Method Get -Uri "$route/list?$query" | ConvertTo-Json -Depth 8

Write-Host "Verifying class details for lls_id=$classId..."
Invoke-RestMethod -Method Get -Uri "$route/$classId" | ConvertTo-Json -Depth 8

Write-Host "Smoke test completed. The inserted class was not deleted."
