param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$SourceTop = 150,

  [int]$SourceHeight = 350,

  [int]$TargetHeight = 232,

  [int]$GroundMargin = 12,

  [int]$OutlineRadius = 3
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
$rgba = New-Object System.Drawing.Bitmap(
  $source.Width,
  $source.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$graphics = [System.Drawing.Graphics]::FromImage($rgba)
$graphics.DrawImageUnscaled($source, 0, 0)
$graphics.Dispose()
$source.Dispose()

$rect = New-Object System.Drawing.Rectangle(0, 0, $rgba.Width, $rgba.Height)
$data = $rgba.LockBits(
  $rect,
  [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$bytes = New-Object byte[] ($data.Stride * $data.Height)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$occupiedColumns = New-Object bool[] $data.Width

for ($y = 0; $y -lt $data.Height; $y += 1) {
  for ($x = 0; $x -lt $data.Width; $x += 1) {
    $offset = $y * $data.Stride + $x * 4
    $blue = [int]$bytes[$offset]
    $green = [int]$bytes[$offset + 1]
    $red = [int]$bytes[$offset + 2]
    $maximum = [Math]::Max($red, [Math]::Max($green, $blue))
    $minimum = [Math]::Min($red, [Math]::Min($green, $blue))
    if (($maximum - $minimum) -le 10 -and $minimum -ge 200) {
      $bytes[$offset] = 0
      $bytes[$offset + 1] = 0
      $bytes[$offset + 2] = 0
      $bytes[$offset + 3] = 0
    } else {
      # Checkerboard antialiasing leaves neutral gray fringe pixels around the
      # generated cutout. Fold those pixels into the intended ink outline.
      if (($maximum - $minimum) -le 16) {
        $bytes[$offset] = 12
        $bytes[$offset + 1] = 17
        $bytes[$offset + 2] = 20
        $bytes[$offset + 3] = 255
      }
      $occupiedColumns[$x] = $true
    }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$rgba.UnlockBits($data)

$frameCount = 8
$frameSize = 256
$poseRanges = [System.Collections.Generic.List[object]]::new()
$rangeStart = -1
for ($x = 0; $x -le $occupiedColumns.Length; $x += 1) {
  $occupied = $x -lt $occupiedColumns.Length -and $occupiedColumns[$x]
  if ($occupied -and $rangeStart -lt 0) {
    $rangeStart = $x
  } elseif (-not $occupied -and $rangeStart -ge 0) {
    $poseRanges.Add([pscustomobject]@{ Left = $rangeStart; Right = $x - 1 })
    $rangeStart = -1
  }
}
if ($poseRanges.Count -ne $frameCount) {
  throw "Expected $frameCount separated slime poses, found $($poseRanges.Count)."
}
$scale = $TargetHeight / $SourceHeight
$sheet = New-Object System.Drawing.Bitmap(
  ($frameCount * $frameSize),
  $frameSize,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
$sheetGraphics.Clear([System.Drawing.Color]::Transparent)
$sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$sheetGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$sheetGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sheetGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$sheetGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

for ($index = 0; $index -lt $frameCount; $index += 1) {
  $sourcePaddingX = 12
  $sourceLeft = [Math]::Max(0, $poseRanges[$index].Left - $sourcePaddingX)
  $sourceRight = [Math]::Min($rgba.Width, $poseRanges[$index].Right + $sourcePaddingX + 1)
  $sourceWidth = $sourceRight - $sourceLeft
  $targetWidth = [Math]::Round($sourceWidth * $scale)
  $targetHeight = $TargetHeight
  $targetLeft = $index * $frameSize + [Math]::Floor(($frameSize - $targetWidth) / 2)
  $targetTop = $frameSize - $targetHeight - $GroundMargin
  $sourceRect = New-Object System.Drawing.Rectangle(
    $sourceLeft,
    $sourceTop,
    $sourceWidth,
    $sourceHeight
  )
  $targetRect = New-Object System.Drawing.Rectangle($targetLeft, $targetTop, $targetWidth, $targetHeight)
  $sheetGraphics.DrawImage($rgba, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
}

$sheetGraphics.Dispose()
$rgba.Dispose()

if ($OutlineRadius -gt 0) {
  $outlinedSheet = New-Object System.Drawing.Bitmap(
    $sheet.Width,
    $sheet.Height,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $outlineGraphics = [System.Drawing.Graphics]::FromImage($outlinedSheet)
  $outlineGraphics.Clear([System.Drawing.Color]::Transparent)
  $outlineGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $outlineGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $outlineAttributes = New-Object System.Drawing.Imaging.ImageAttributes
  $outlineMatrix = New-Object System.Drawing.Imaging.ColorMatrix
  $outlineMatrix.Matrix00 = 0
  $outlineMatrix.Matrix11 = 0
  $outlineMatrix.Matrix22 = 0
  $outlineMatrix.Matrix33 = 1
  $outlineMatrix.Matrix40 = 20 / 255
  $outlineMatrix.Matrix41 = 17 / 255
  $outlineMatrix.Matrix42 = 12 / 255
  $outlineMatrix.Matrix44 = 1
  $outlineAttributes.SetColorMatrix($outlineMatrix)
  $sourceSheetRect = New-Object System.Drawing.Rectangle(0, 0, $sheet.Width, $sheet.Height)

  for ($offsetY = -$OutlineRadius; $offsetY -le $OutlineRadius; $offsetY += 1) {
    for ($offsetX = -$OutlineRadius; $offsetX -le $OutlineRadius; $offsetX += 1) {
      if ($offsetX * $offsetX + $offsetY * $offsetY -gt $OutlineRadius * $OutlineRadius) {
        continue
      }
      $targetSheetRect = New-Object System.Drawing.Rectangle(
        $offsetX,
        $offsetY,
        $sheet.Width,
        $sheet.Height
      )
      $outlineGraphics.DrawImage(
        $sheet,
        $targetSheetRect,
        0,
        0,
        $sheet.Width,
        $sheet.Height,
        [System.Drawing.GraphicsUnit]::Pixel,
        $outlineAttributes
      )
    }
  }

  $outlineGraphics.DrawImageUnscaled($sheet, 0, 0)
  $outlineAttributes.Dispose()
  $outlineGraphics.Dispose()
  $sheet.Dispose()
  $sheet = $outlinedSheet
}

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) {
  [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}
$sheet.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
