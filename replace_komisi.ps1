# Replace all instances of "komisi" with "profit"
Get-ChildItem -Path "src" -Include *.tsx, *.ts -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    
    # Replace all variations
    $content = $content -replace 'komisi', 'profit'
    $content = $content -replace 'Komisi', 'Profit'
    $content = $content -replace 'KOMISI', 'PROFIT'
    
    # Save back
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "Updated: $($file.FullName)"
}

Write-Host "`nAll files updated successfully!"
