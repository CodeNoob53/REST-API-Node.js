import { execSync } from 'child_process'

export async function setup() {
  execSync('npx prisma db push', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  })
}
