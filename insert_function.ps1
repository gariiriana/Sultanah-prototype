# PowerShell script to insert delete function
$mainFile = "src\app\pages\tour-leader\sections\ItinerarySectionNew.tsx"
$tempFile = "delete_handler_temp.txt"

$mainContent = Get-Content $mainFile
$funcContent = Get-Content $tempFile

$before = $mainContent[0..388]
$after = $mainContent[389..($mainContent.Length-1)]

$newContent = $before + $funcContent + $after
$newContent | Set-Content $mainFile -Encoding UTF8

Write-Host "Function inserted successfully!"
