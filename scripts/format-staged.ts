import { execSync } from 'child_process';

try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    console.log('No staged files to format');
    process.exit(0);
  }

  execSync(`prettier --write ${stagedFiles.join(' ')}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
