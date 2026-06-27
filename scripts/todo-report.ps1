<#
.SYNOPSIS
    Finds TODO and FIXME comments in repository text files.

.DESCRIPTION
    Searches recursively from the Git repository root for TODO and FIXME
    markers (case-insensitive) in text files. Prints the relative file path,
    line number, marker type, and matching text for each occurrence, followed
    by a total count. Skips binary files and common build/output directories.
    Does not modify any files or Git state.
#>

# Check if we are inside a Git repository
$insideWorkTree = $null
$insideWorkTree = git rev-parse --is-inside-work-tree 2>&1
if ($LASTEXITCODE -ne 0 -or "$insideWorkTree" -ne 'true') {
    Write-Error 'Not a Git repository.'
    exit 1
}

$ErrorActionPreference = 'Stop'

# Repository root (resolve to absolute path)
$repoRoot = (git rev-parse --show-toplevel).Replace('/', '\')

# Directories to ignore
$ignoreDirs = @('.git', 'node_modules', 'build', 'dist', 'coverage', '.next')

# Gather all files, skipping ignored directories
$files = Get-ChildItem -Path $repoRoot -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($repoRoot.Length + 1)
    $topDir = $relativePath.Split('\')[0]
    $topDir -notin $ignoreDirs
}

$matchCount = 0
$pattern = [regex]::new('\b(TODO|FIXME)\b', 'IgnoreCase')

foreach ($file in $files) {
    # Skip binary files by checking for null bytes in the first 8KB
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $checkLength = [Math]::Min($bytes.Length, 8192)
    $isBinary = $false
    for ($i = 0; $i -lt $checkLength; $i++) {
        if ($bytes[$i] -eq 0) {
            $isBinary = $true
            break
        }
    }
    if ($isBinary) { continue }

    $relativePath = $file.FullName.Substring($repoRoot.Length + 1)

    try {
        $lines = [System.IO.File]::ReadAllLines($file.FullName)
    } catch {
        continue
    }

    for ($lineNum = 0; $lineNum -lt $lines.Length; $lineNum++) {
        $line = $lines[$lineNum]
        $matches = $pattern.Matches($line)
        foreach ($m in $matches) {
            $marker = $m.Value.ToUpper()
            $text = $line.Trim()
            Write-Host "${relativePath}:$($lineNum + 1)  [$marker]  $text"
            $matchCount++
        }
    }
}

if ($matchCount -eq 0) {
    Write-Host 'No TODO or FIXME markers found.'
} else {
    Write-Host ''
    Write-Host "Total: $matchCount marker(s) found."
}
