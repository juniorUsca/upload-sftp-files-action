# Upload Sftp Files Action

This action uploads a list of files separated by comma to a SFTP server

## Inputs

### `host`

**Required** The host of the remote server.

### `port`

The port of the remote server. Default is `22`.

### `username`

**Required** The username of the remote server.

### `password`

**Required** The password of the remote server.

### `file-names`

**Required** The file names to upload to the remote server, separated by commas.
Example: `registry.json,package.json`

### `remote-dir-path`

**Required** The remote directory path to upload files to.

### `local-dir-path`

The local directory path to upload files from. Default is `.`.

### `delete-files-after-upload`

If set to `true`, the files will be deleted from the local server after upload. Default is `false`.


## Outputs

None

## Example usage

```yaml
uses: juniorUsca/upload-sftp-files-action@v2
with:
  host: 'example.com'
  port: '22'
  username: 'user'
  password: 'password'
  file-names: 'registry.json,package.json'
  remote-dir-path: '/path/to/remote/dir'
  local-dir-path: '/path/to/local/dir'
  delete-files-after-upload: 'true'
```