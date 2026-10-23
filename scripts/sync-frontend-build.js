const { cp, mkdir, rm } = require('node:fs/promises')
const path = require('node:path')

const repositoryRoot = path.resolve(__dirname, '..')
const frontendBuild = path.join(repositoryRoot, 'frontend', 'dist')
const backendPublic = path.join(repositoryRoot, 'backend', 'public')

async function main() {
  await mkdir(backendPublic, { recursive: true })
  await rm(path.join(backendPublic, 'assets'), { recursive: true, force: true })
  await cp(frontendBuild, backendPublic, { recursive: true, force: true })
  console.log('Copied frontend build to backend/public for Render deployment.')
}

main().catch((error) => {
  console.error('Failed to sync frontend build:', error)
  process.exitCode = 1
})
