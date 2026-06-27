<#
.SYNOPSIS
    Prints the repository directory name.

.DESCRIPTION
    Resolves the top-level directory of the current Git repository
    and prints only its directory name. Works from any nested
    directory within the repo. Exits with a non-zero status when
    not inside a Git repository.
#>

# Check if we are inside a Git repository
$insideWorkTree = $null
$insideWorkTree = git rev-parse --is-inside-work-tree 2>&1
if ($LASTEXITCODE -ne 0 -or "$insideWorkTree" -ne 'true') {
    Write-Error 'Not a Git repository.'
    exit 1
}

$ErrorActionPreference = 'Stop'

# Resolve the repository root and print only the directory name
$repoRoot = git rev-parse --show-toplevel
Write-Host (Split-Path -Leaf (Resolve-Path $repoRoot).Path)
