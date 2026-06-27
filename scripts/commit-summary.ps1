<#
.SYNOPSIS
    Displays a concise summary of recent Git commits.

.DESCRIPTION
    Prints the short SHA, author, date, and subject for the most recent
    commits in the current repository. Accepts an optional Count parameter
    to control how many commits are shown (default 5).
    Exits with a non-zero status when not inside a Git repository or when
    Count is less than 1.

.PARAMETER Count
    Maximum number of commits to display. Defaults to 5. Must be at least 1.
#>

param(
    [int]$Count = 5
)

# Validate Count
if ($Count -lt 1) {
    Write-Error 'Count must be at least 1.'
    exit 1
}

# Check if we are inside a Git repository
$insideWorkTree = $null
$insideWorkTree = git rev-parse --is-inside-work-tree 2>&1
if ($LASTEXITCODE -ne 0 -or "$insideWorkTree" -ne 'true') {
    Write-Error 'Not a Git repository.'
    exit 1
}

$ErrorActionPreference = 'Stop'

# Retrieve and display commits
$logOutput = git log --pretty=format:'%h  %an  %ad  %s' --date=short -n $Count
if ([string]::IsNullOrWhiteSpace($logOutput)) {
    Write-Host 'No commits found.'
} else {
    foreach ($line in $logOutput) {
        Write-Host $line
    }
}
