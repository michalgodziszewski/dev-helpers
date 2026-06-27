<#
.SYNOPSIS
    Prints the absolute repository root path.

.DESCRIPTION
    Resolves and prints the top-level directory of the current Git
    repository. Works from any nested directory within the repo.
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

# Resolve and print the absolute repository root
$repoRoot = git rev-parse --show-toplevel
Write-Host (Resolve-Path $repoRoot).Path
