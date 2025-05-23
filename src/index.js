const path = require('node:path')
const fs = require('node:fs')
const core = require('@actions/core')

const { Client } = require('ssh2')

const remoteDirPath = core.getInput('remote-dir-path')
const localDirPath = core.getInput('local-dir-path')
const host = core.getInput('host')
const port = +core.getInput('port')
const username = core.getInput('username')
const password = core.getInput('password')
const fileNames = core.getInput('file-names')
const deleteFilesAfterUpload = core.getInput('delete-files-after-upload') === 'true'


const filesToUpload = fileNames
  .split(',')
  .map(filename => filename.trim())
  .filter(filename => filename !== '')
  .map(filename => ({
    filename,
    localPath: path.join(localDirPath, filename),
    remotePath: path.posix.join(remoteDirPath, filename),
  }))

/** @type {import('ssh2').ConnectConfig} */
const credentials = {
  host,
  port,
  username,
  password,
}

console.log(`It will be attempted to upload the files with the following files: ${fileNames}`)

if (filesToUpload.length === 0) {
  console.log('No files provided to upload')
  console.log('Please provide at least one file name to upload')
  core.setFailed('No files provided to upload')
  throw new Error('No files provided to upload')
}

console.log('Verifying if the files exist locally')
filesToUpload.forEach(item => {
  if (!fs.existsSync(item.localPath)) {
    console.log(`File does not exist: ${item.localPath}`)
    core.setFailed(`File does not exist: ${item.localPath}`)
    throw new Error(`File does not exist: ${item.localPath}`)
  }
  console.log(`File exists: ${item.localPath}`)
})
console.log('All files exist locally')
console.log('Starting SFTP connection')

/**
 * @param {import('ssh2').Client} conn
 * @param {import('ssh2').SFTPWrapper} sftp
 * @param {number} position
 */
const executeAction = (conn, sftp, position) => {
  const item = filesToUpload.at(position)
  if (!item) {
    conn.end()

    if (deleteFilesAfterUpload) {
      console.log('All files uploaded, deleting local files')
      filesToUpload.forEach(item => {
        console.log(`Deleting local file: ${item.localPath}`)
        try {
          fs.unlinkSync(item.localPath)
        } catch (err) {
          console.log(`Error deleting local file: ${item.localPath}`)
        }
      })
    }
    return
  }

  console.log(`Uploading ${item.remotePath} from ${item.localPath}`)

  // normal upload
  sftp.fastPut(item.localPath, item.remotePath, errFastPut => {
    if (errFastPut) {
      console.log(`Error uploading file: ${item.localPath} to ${item.remotePath}`)
      conn.end()
      core.setFailed(errFastPut.message)
      throw errFastPut
    }
    console.log(`Uploaded to ${item.remotePath} ✅`)

    executeAction(conn, sftp, position + 1)
  })
}

const conn = new Client()
conn.on('ready', () => {
  console.log('SFTP Client :: ready')
  conn.sftp((err, sftp) => {
    if (err){
      core.setFailed(err.message)
      throw err
    }
    executeAction(conn, sftp, 0)
  })
})
conn.on('error', err => {
  console.error(`Error caught, ${err}`)
  core.setFailed(err.message)
  throw err
})
conn.connect(credentials)
