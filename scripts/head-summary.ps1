<#
.SYNOPSIS
    Displays a concise summary of the current HEAD commit.

.DESCRIPTION
    Prints the short SHA, author name, commit date, and subject for
    the commit at HEAD. Exits with a non-zero status when not inside
    a Git repository.
#>

# Check if we are inside a Git repository
$insideWorkTree = $null
$insideWorkTree = git rev-parse --is-inside-work-tree 2>&1
if ($LASTEXITCODE -ne 0 -or "$insideWorkTree" -ne 'true') {
    Write-Error 'Not a Git repository.'
    exit 1
}

$ErrorActionPreference = 'Stop'

# Detect unborn HEAD (initialized repo with no commits)
$ErrorActionPreference = 'SilentlyContinue'
git rev-parse HEAD 2>&1 | Out-Null
$ErrorActionPreference = 'Stop'
if ($LASTEXITCODE -ne 0) {
    Write-Host 'No commits found.'
    exit 0
}

# Retrieve and display HEAD commit summary
$logOutput = git log --pretty=format:'%h  %an  %ad  %s' --date=short -n 1
Write-Host $logOutput
