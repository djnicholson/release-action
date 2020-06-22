# Add a file to a GitHub Release

This action adds a file to a GitHub Release in the current repo.

## Inputs

### `token`

**Required** A GitHub authentication token

### `release-name`

The name to use if a new Release needs to be created (defaults to "Rolling build")

### `tag-name`

The name to use to tag the Release (defaults to "v0.0-rolling")

### `asset-name`

**Required** A descriptive name for the asset being added to the Release

### `file`

**Required** The full path to the file to be added as an asset to the Release.


## Example usage

```
uses: djnicholson/release-action@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  asset-name: 'my-app.dmg'
  file: out/dist/my-app.dmg
```

```
uses: djnicholson/release-action@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  release-name: 'Latest rolling build'
  tag-name: 'v1.3-alpha'
  asset-name: 'my-app.dmg'
  file: out/dist/my-app.dmg
```