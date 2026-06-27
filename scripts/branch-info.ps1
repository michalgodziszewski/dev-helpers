<#
.SYNOPSIS
    Displays concise information about the current Git branch.

.DESCRIPTION
    Shows the current branch name, configured upstream branch,
    short HEAD commit SHA, and ahead/behind counts relative to upstream.
    Exits with a non-zero status when not inside a Git repository.
#>

# Check if we are inside a Git repository
$insideWorkTree = $null
$insideWorkTree = git rev-parse --is-inside-work-tree 2>&1
if ($LASTEXITCODE -ne 0 -or "$insideWorkTree" -ne 'true') {
    Write-Error 'Not a Git repository.'
    exit 1
}

$ErrorActionPreference = 'Stop'

# Current branch or detached HEAD
$branch = $null
try { $branch = git symbolic-ref --short HEAD 2>&1 } catch {}
if (-not $branch -or $LASTEXITCODE -ne 0) {
    $shortSha = git rev-parse --short HEAD
    Write-Host "Branch:   (detached at $shortSha)"
} else {
    Write-Host "Branch:   $branch"
}

# Short HEAD commit SHA
$headSha = git rev-parse --short HEAD
Write-Host "Commit:   $headSha"

# Upstream tracking branch
$upstream = $null
try { $upstream = git rev-parse --abbrev-ref '@{upstream}' 2>&1 } catch {}
if (-not $upstream -or $LASTEXITCODE -ne 0) {
    Write-Host 'Upstream: (no upstream configured)'
} else {
    Write-Host "Upstream: $upstream"

    # Ahead / behind counts
    $leftRight = $null
    try { $leftRight = git rev-list --left-right --count "$branch...$upstream" 2>&1 } catch {}
    if ($LASTEXITCODE -eq 0 -and "$leftRight" -match '^\s*(\d+)\s+(\d+)\s*$') {
        $ahead  = [int]$Matches[1]
        $behind = [int]$Matches[2]

        if ($ahead -eq 0 -and $behind -eq 0) {
            Write-Host 'Status:   Up to date'
        } else {
            $parts = @()
            if ($ahead  -gt 0) { $parts += "$ahead ahead" }
            if ($behind -gt 0) { $parts += "$behind behind" }
            Write-Host "Status:   $($parts -join ', ')"
        }
    }
}
