param(
    [string[]]$Paths = @('test-results', 'reports', 'custom-report', 'allure-results')
)

$secretNames = @(
    'APP_EMAIL',
    'APP_PASSWORD',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'FAKESTORE_USERNAME',
    'PASSWORD',
    'DB_USER',
    'DB_PASSWORD'
)
$secretValues = @(
    $secretNames |
        ForEach-Object { [Environment]::GetEnvironmentVariable($_) } |
        Where-Object { $_ -and $_.Length -ge 4 } |
        Select-Object -Unique
)
$textExtensions = @('.md', '.txt', '.xml', '.json', '.html', '.log', '.csv')
$sanitizedFiles = 0

foreach ($directory in $Paths) {
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
        continue
    }

    foreach ($file in Get-ChildItem -LiteralPath $directory -Recurse -File) {
        if ($file.Extension.ToLowerInvariant() -notin $textExtensions) {
            continue
        }

        $content = [IO.File]::ReadAllText($file.FullName)
        $sanitized = $content

        foreach ($secret in $secretValues) {
            $sanitized = $sanitized.Replace($secret, '[REDACTED]')
        }

        if ($file.Extension -ieq '.md') {
            $sanitized = [regex]::Replace(
                $sanitized,
                '(?is)\r?\n#+\s*DOM snapshot\b.*$',
                "`n[DOM snapshot omitted to protect application data.]"
            )
        }

        if ($sanitized -cne $content) {
            [IO.File]::WriteAllText(
                $file.FullName,
                $sanitized,
                [System.Text.UTF8Encoding]::new($false)
            )
            $sanitizedFiles++
        }
    }
}

Write-Output "Sanitized $sanitizedFiles text diagnostic/report file(s); DOM snapshots are omitted."
