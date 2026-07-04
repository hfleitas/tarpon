param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceId,

  [string]$KqlDatabaseDisplayName = "TruistSignalsHost",
  [string]$KqlScriptPath = (Join-Path $PSScriptRoot "..\kql\truistsignals.kql")
)

$ErrorActionPreference = "Stop"

function Get-KqlDatabase {
  param(
    [string]$WsId,
    [string]$DisplayName
  )

  $response = az rest --method get `
    --resource https://api.fabric.microsoft.com `
    --url "https://api.fabric.microsoft.com/v1/workspaces/$WsId/kqlDatabases" `
    -o json | ConvertFrom-Json

  $db = $response.value | Where-Object { $_.displayName -eq $DisplayName } | Select-Object -First 1
  if (-not $db) {
    $available = @($response.value | ForEach-Object { $_.displayName }) -join ", "
    throw "KQL database '$DisplayName' was not found in workspace '$WsId'. Available: $available"
  }

  return $db
}

function Get-SetupCommandsFromKqlScript {
  param(
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    throw "KQL script file not found: $Path"
  }

  $lines = Get-Content -Path $Path
  $commands = New-Object System.Collections.Generic.List[string]
  $builder = New-Object System.Text.StringBuilder
  $inSetupSection = $false

  foreach ($line in $lines) {
    if ($line -match '^//\s*1\)\s*Real-time tables') {
      $inSetupSection = $true
      continue
    }

    if ($inSetupSection -and $line -match '^//\s*3\)\s*Query') {
      break
    }

    if (-not $inSetupSection) {
      continue
    }

    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("//")) {
      continue
    }

    if ($line -match '^\.' -and $builder.Length -gt 0) {
      $commands.Add($builder.ToString().Trim())
      $builder.Clear() | Out-Null
    }

    $builder.AppendLine($line) | Out-Null
  }

  if ($builder.Length -gt 0) {
    $commands.Add($builder.ToString().Trim())
  }

  if ($commands.Count -eq 0) {
    throw "No setup commands were parsed from KQL script: $Path"
  }

  return $commands
}

function Invoke-KqlMgmt {
  param(
    [string]$ClusterUri,
    [string]$DatabaseName,
    [string]$Command
  )

  $tempBody = Join-Path $env:TEMP ("kql-mgmt-" + [guid]::NewGuid().ToString() + ".json")
  try {
    (@{
        db  = $DatabaseName
        csl = $Command
      } | ConvertTo-Json -Compress) | Set-Content -Path $tempBody -Encoding utf8NoBOM

    az rest --method post `
      --resource https://kusto.kusto.windows.net `
      --url "$ClusterUri/v1/rest/mgmt" `
      --headers "Content-Type=application/json" `
      --body "@$tempBody" `
      -o none | Out-Null
  }
  finally {
    Remove-Item -Path $tempBody -ErrorAction SilentlyContinue
  }
}

function Get-KqlTables {
  param(
    [string]$ClusterUri,
    [string]$DatabaseName
  )

  $tempBody = Join-Path $env:TEMP ("kql-query-" + [guid]::NewGuid().ToString() + ".json")
  try {
    (@{
        db  = $DatabaseName
        csl = ".show tables"
      } | ConvertTo-Json -Compress) | Set-Content -Path $tempBody -Encoding utf8NoBOM

    $response = az rest --method post `
      --resource https://kusto.kusto.windows.net `
      --url "$ClusterUri/v1/rest/query" `
      --headers "Content-Type=application/json" `
      --body "@$tempBody" `
      -o json | ConvertFrom-Json

    return @($response.Tables[0].Rows | ForEach-Object { $_[0] })
  }
  finally {
    Remove-Item -Path $tempBody -ErrorAction SilentlyContinue
  }
}

$kqlDb = Get-KqlDatabase -WsId $WorkspaceId -DisplayName $KqlDatabaseDisplayName
$clusterUri = $kqlDb.properties.queryServiceUri
$databaseName = $kqlDb.properties.databaseName

Write-Output "Applying KQL setup script '$KqlScriptPath' to database '$databaseName'..."
$commands = Get-SetupCommandsFromKqlScript -Path $KqlScriptPath
foreach ($command in $commands) {
  Invoke-KqlMgmt -ClusterUri $clusterUri -DatabaseName $databaseName -Command $command
}

$tables = Get-KqlTables -ClusterUri $clusterUri -DatabaseName $databaseName
Write-Output "Eventhouse/KQL setup completed. Tables found: $($tables -join ', ')"
