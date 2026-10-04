$root = "E:\realestate_booking"
$schemaPath = Join-Path $root "backend\prisma\schema.prisma"
$sourceDoc = Join-Path $root "bachelor_of_technology_capstone_project.docx"
$outputDoc = Join-Path $root "bachelor_of_technology_capstone_project_appendix_b_schema_revised.docx"
$backupDoc = Join-Path $root "bachelor_of_technology_capstone_project_backup_before_appendix_b_schema.docx"
$workDir = Join-Path $root ".codex_review\appendix_b_schema"
$diagramPath = Join-Path $root "appendix_b_database_schema_diagram.png"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

function New-Font($size, $style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font("Arial", $size, $style)
}

function New-Pen($color, $width = 1) {
  return New-Object System.Drawing.Pen($color, $width)
}

function Escape-XmlText($text) {
  return $text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
}

function New-WordParagraph($text, $italic = $false) {
  $escaped = Escape-XmlText $text
  $rPr = ""
  if ($italic) { $rPr = "<w:rPr><w:i/></w:rPr>" }
  return "<w:p><w:r>$rPr<w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function Parse-PrismaSchema($path) {
  $lines = Get-Content -LiteralPath $path
  $enumBlocks = @()
  $modelBlocks = @()
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -match '^enum\s+(\w+)\s*\{') {
      $name = $matches[1]
      $bodyLines = New-Object System.Collections.Generic.List[string]
      $i++
      while ($i -lt $lines.Count -and $lines[$i].Trim() -ne "}") {
        $bodyLines.Add($lines[$i])
        $i++
      }
      $enumBlocks += [PSCustomObject]@{ Name = $name; Body = ($bodyLines -join "`n") }
    } elseif ($line -match '^model\s+(\w+)\s*\{') {
      $name = $matches[1]
      $bodyLines = New-Object System.Collections.Generic.List[string]
      $i++
      while ($i -lt $lines.Count -and $lines[$i].Trim() -ne "}") {
        $bodyLines.Add($lines[$i])
        $i++
      }
      $modelBlocks += [PSCustomObject]@{ Name = $name; Body = ($bodyLines -join "`n") }
    }
  }

  $enumNames = @($enumBlocks | ForEach-Object { $_.Name })
  $modelNames = @($modelBlocks | ForEach-Object { $_.Name })
  $models = @()
  $relations = @()

  foreach ($block in $modelBlocks) {
    $name = $block.Name
    $body = $block.Body
    $tableMatch = [regex]::Match($body, '@@map\("([^"]+)"\)')
    $tableName = if ($tableMatch.Success) { $tableMatch.Groups[1].Value } else { $name }
    $fields = New-Object System.Collections.Generic.List[string]

    foreach ($line in ($body -split "`r?`n")) {
      $clean = ($line -replace "//.*$", "").Trim()
      if (!$clean -or $clean.StartsWith("@@")) { continue }
      $parts = $clean -split "\s+"
      if ($parts.Count -lt 2) { continue }
      $fieldName = $parts[0]
      $fieldType = $parts[1]
      $targetType = $fieldType.TrimEnd("?").TrimEnd("[]")
      $isRelationField = $modelNames -contains $targetType
      $isListRelation = $fieldType.EndsWith("[]")

      if ($clean -match '@relation\(fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]') {
        $fk = $matches[1].Trim()
        $relations += [PSCustomObject]@{
          From = $name
          To = $targetType
          Field = $fk
        }
      }

      if ($isRelationField -or $isListRelation) { continue }

      $suffix = ""
      if ($clean -match "@id") { $suffix += " PK" }
      if ($clean -match "@unique") { $suffix += " UQ" }
      if ($fieldName -ne "id" -and $fieldName -match "Id$|By$|ownerId|tenantId|bookingId|propertyId|userId|buyerId|organizerId|authorId|reviewedBy|assignedTo|raisedBy|against") { $suffix += " FK" }
      $fields.Add("${fieldName}: $fieldType$suffix")
    }

    $models += [PSCustomObject]@{
      Name = $name
      TableName = $tableName
      Fields = @($fields)
      X = 0
      Y = 0
      W = 0
      H = 0
    }
  }

  return [PSCustomObject]@{
    Models = $models
    Enums = $enumNames
    Relations = $relations
  }
}

function Draw-RoundedRect($g, $rect, $radius, $fill, $stroke, $strokeWidth = 2) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
  $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
  $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush($fill)), $path)
  $g.DrawPath((New-Pen $stroke $strokeWidth), $path)
  $path.Dispose()
}

function Draw-Text($g, $text, $font, $brush, $rect, $align = "Near") {
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = if ($align -eq "Center") { [System.Drawing.StringAlignment]::Center } else { [System.Drawing.StringAlignment]::Near }
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near
  $fmt.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $g.DrawString($text, $font, $brush, $rect, $fmt)
  $fmt.Dispose()
}

function Draw-DatabaseSchemaDiagram($schema, $path) {
  $width = 3600
  $height = 5200
  $bmp = New-Object System.Drawing.Bitmap($width, $height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear([System.Drawing.Color]::White)

  $titleFont = New-Font 54 ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Font 28
  $groupFont = New-Font 24 ([System.Drawing.FontStyle]::Bold)
  $modelFont = New-Font 25 ([System.Drawing.FontStyle]::Bold)
  $tableFont = New-Font 16 ([System.Drawing.FontStyle]::Italic)
  $fieldFont = New-Font 15
  $smallFont = New-Font 14

  $dark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(17, 24, 39))
  $muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(75, 85, 99))
  $lightText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
  $linePen = New-Pen ([System.Drawing.Color]::FromArgb(148, 163, 184)) 2
  $linePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Solid

  Draw-Text $g "Appendix B: Full Database Schema Diagram" $titleFont $dark ([System.Drawing.RectangleF]::new(0, 45, $width, 70)) "Center"
  Draw-Text $g "Kigali Real Estate Booking Platform - Prisma/MySQL schema with all models, key fields, and foreign-key relationships" $subtitleFont $muted ([System.Drawing.RectangleF]::new(0, 118, $width, 45)) "Center"
  Draw-Text $g "$($schema.Models.Count) Prisma models | $($schema.Enums.Count) enums | Generated from backend/prisma/schema.prisma" $subtitleFont $muted ([System.Drawing.RectangleF]::new(0, 162, $width, 45)) "Center"

  $groups = @(
    [PSCustomObject]@{ Name = "Core Identity & Property"; X = 110; Models = @("User","Property","Booking") ; Color = [System.Drawing.Color]::FromArgb(37, 99, 235) },
    [PSCustomObject]@{ Name = "Booking, Payments & Escrow"; X = 980; Models = @("Payment","Transaction","Commission","PromoCode","Insurance","Availability") ; Color = [System.Drawing.Color]::FromArgb(5, 150, 105) },
    [PSCustomObject]@{ Name = "Trust, Review & Communication"; X = 1850; Models = @("Review","Notification","Message","Dispute","FraudAlert","Verification","PropertyDocument","UserReputation") ; Color = [System.Drawing.Color]::FromArgb(217, 119, 6) },
    [PSCustomObject]@{ Name = "Property Features & Operations"; X = 2720; Models = @("Favorite","VirtualTour","SmartDevice","LongTermRental","MaintenanceRequest","PropertyShare","SharePurchase","RewardToken","Agent","BlogPost","CommunityEvent","CorporateAccount","Webhook") ; Color = [System.Drawing.Color]::FromArgb(124, 58, 237) }
  )

  $modelLookup = @{}
  foreach ($m in $schema.Models) { $modelLookup[$m.Name] = $m }

  $boxW = 760
  $startY = 285
  $gap = 28
  foreach ($group in $groups) {
    $y = $startY
    Draw-Text $g $group.Name $groupFont $dark ([System.Drawing.RectangleF]::new($group.X, 225, $boxW, 36)) "Center"
    foreach ($name in $group.Models) {
      if (!$modelLookup.ContainsKey($name)) { continue }
      $m = $modelLookup[$name]
      $fieldCount = $m.Fields.Count
      $h = [Math]::Max(125, 72 + ([Math]::Min($fieldCount, 24) * 22))
      $m.X = $group.X
      $m.Y = $y
      $m.W = $boxW
      $m.H = $h
      $y += $h + $gap
    }
  }

  # Relationship lines are drawn first so table boxes remain readable.
  foreach ($rel in $schema.Relations) {
    if (!$modelLookup.ContainsKey($rel.From) -or !$modelLookup.ContainsKey($rel.To)) { continue }
    $from = $modelLookup[$rel.From]
    $to = $modelLookup[$rel.To]
    $fromPoint = [System.Drawing.PointF]::new($from.X + $from.W / 2, $from.Y + $from.H / 2)
    $toPoint = [System.Drawing.PointF]::new($to.X + $to.W / 2, $to.Y + $to.H / 2)
    if ($from.X -lt $to.X) {
      $fromPoint = [System.Drawing.PointF]::new($from.X + $from.W, $from.Y + $from.H / 2)
      $toPoint = [System.Drawing.PointF]::new($to.X, $to.Y + $to.H / 2)
    } elseif ($from.X -gt $to.X) {
      $fromPoint = [System.Drawing.PointF]::new($from.X, $from.Y + $from.H / 2)
      $toPoint = [System.Drawing.PointF]::new($to.X + $to.W, $to.Y + $to.H / 2)
    }
    $g.DrawLine($linePen, $fromPoint, $toPoint)
  }

  foreach ($group in $groups) {
    foreach ($name in $group.Models) {
      if (!$modelLookup.ContainsKey($name)) { continue }
      $m = $modelLookup[$name]
      $rect = [System.Drawing.Rectangle]::new($m.X, $m.Y, $m.W, $m.H)
      Draw-RoundedRect $g $rect 16 ([System.Drawing.Color]::FromArgb(255, 255, 255)) ([System.Drawing.Color]::FromArgb(203, 213, 225)) 2
      $header = [System.Drawing.Rectangle]::new($m.X, $m.Y, $m.W, 58)
      Draw-RoundedRect $g $header 16 $group.Color $group.Color 1
      $g.FillRectangle((New-Object System.Drawing.SolidBrush($group.Color)), $m.X, $m.Y + 28, $m.W, 30)
      Draw-Text $g $m.Name $modelFont $lightText ([System.Drawing.RectangleF]::new($m.X + 18, $m.Y + 9, $m.W - 36, 32)) "Center"
      Draw-Text $g "table: $($m.TableName)" $tableFont $muted ([System.Drawing.RectangleF]::new($m.X + 18, $m.Y + 64, $m.W - 36, 24)) "Center"

      $fy = $m.Y + 95
      $shown = 0
      foreach ($field in $m.Fields) {
        if ($shown -ge 24) {
          Draw-Text $g "... $($m.Fields.Count - $shown) more fields" $smallFont $muted ([System.Drawing.RectangleF]::new($m.X + 28, $fy, $m.W - 56, 22))
          break
        }
        $brush = if ($field -match " PK") { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 128, 61)) } elseif ($field -match " FK") { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9)) } else { $dark }
        Draw-Text $g $field $fieldFont $brush ([System.Drawing.RectangleF]::new($m.X + 28, $fy, $m.W - 56, 21))
        $fy += 22
        $shown++
      }
    }
  }

  $legendY = 5000
  Draw-RoundedRect $g ([System.Drawing.Rectangle]::new(110, $legendY, 3380, 120)) 18 ([System.Drawing.Color]::FromArgb(248, 250, 252)) ([System.Drawing.Color]::FromArgb(203, 213, 225)) 2
  Draw-Text $g "Legend: PK = primary key, FK = foreign key, UQ = unique field. Light connector lines show Prisma @relation links. Some purely operational tables without explicit Prisma relations, such as promo_codes, commissions, corporate_accounts, and webhooks, are shown as standalone supporting schemas." $subtitleFont $muted ([System.Drawing.RectangleF]::new(150, $legendY + 24, 3300, 80))

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function Update-DocumentXml($documentXmlPath, $modelCount, $enumCount) {
  $xml = Get-Content -LiteralPath $documentXmlPath -Raw
  $oldTitle = "Full Prisma schema - 27 models across 8 enums"
  $newTitle = "Full database schema - $modelCount Prisma models across $enumCount enums"
  $xml = $xml.Replace($oldTitle, $newTitle)

  $removeTexts = @(
    "Description: This database schema diagram summarizes every Prisma model used by the Kigali Real Estate Booking Platform, grouped by functional module and connected through their key foreign-key relationships.",
    "Source: Author's design generated from backend/prisma/schema.prisma, 2026."
  )
  foreach ($text in $removeTexts) {
    $escaped = [regex]::Escape((Escape-XmlText $text))
    $xml = [regex]::Replace($xml, "<w:p\b(?:(?!</w:p>).)*?$escaped(?:(?!</w:p>).)*?</w:p>", "", "Singleline")
  }

  $desc = New-WordParagraph "Description: This database schema diagram summarizes every Prisma model used by the Kigali Real Estate Booking Platform, grouped by functional module and connected through their key foreign-key relationships."
  $source = New-WordParagraph "Source: Author's design generated from backend/prisma/schema.prisma, 2026." $true
  $captionPattern = "(<w:p\b(?:(?!</w:p>).)*?SEQ(?:(?!</w:p>).)*?Figure(?:(?!</w:p>).)*?ARABIC(?:(?!</w:p>).)*?19(?:(?!</w:p>).)*?Full(?:(?!</w:p>).)*?database(?:(?!</w:p>).)*?schema(?:(?!</w:p>).)*?</w:p>)"
  $xml = [regex]::Replace($xml, $captionPattern, "`$1$desc$source", "Singleline")

  Set-Content -LiteralPath $documentXmlPath -Value $xml -Encoding UTF8
}

if (!(Test-Path $schemaPath)) { throw "Schema not found: $schemaPath" }
if (!(Test-Path $sourceDoc)) { throw "Document not found: $sourceDoc" }
if (!(Test-Path $backupDoc)) { Copy-Item -LiteralPath $sourceDoc -Destination $backupDoc }
if (Test-Path $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

$schema = Parse-PrismaSchema $schemaPath
Draw-DatabaseSchemaDiagram $schema $diagramPath

[System.IO.Compression.ZipFile]::ExtractToDirectory($sourceDoc, $workDir)
$targetImage = Join-Path $workDir "word\media\image19.png"
if (!(Test-Path $targetImage)) { throw "Could not find Appendix B image slot: $targetImage" }
Copy-Item -LiteralPath $diagramPath -Destination $targetImage -Force
Update-DocumentXml (Join-Path $workDir "word\document.xml") $schema.Models.Count $schema.Enums.Count

if (Test-Path $outputDoc) { Remove-Item -LiteralPath $outputDoc -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($workDir, $outputDoc)

Write-Host "Diagram saved to $diagramPath"
Write-Host "Appendix B revised document saved to $outputDoc"
Write-Host "Backup saved to $backupDoc"
Write-Host "Models: $($schema.Models.Count); Enums: $($schema.Enums.Count); Relations: $($schema.Relations.Count)"
