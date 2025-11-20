#!/usr/bin/env node
/**
 * Accessibility Check Script
 * Runs basic accessibility checks on the application
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running Accessibility Checks...\n');

interface CheckPattern {
    regex: RegExp;
    description: string;
}

interface FileCheck {
    file: string;
    patterns: CheckPattern[];
}

// Check for common accessibility issues in key files
const checks: FileCheck[] = [
    {
        file: 'src/components/login-form.tsx',
        patterns: [
            { regex: /AccessibleField/, description: 'Accessible field components used' },
            { regex: /ScreenReaderAnnouncement/, description: 'Screen reader announcements for status' },
            { regex: /autoComplete/, description: 'Autocomplete attributes for forms' },
            { regex: /aria-invalid/, description: 'ARIA invalid for error states' },
        ],
    },
    {
        file: 'src/components/outstanding-balance.tsx',
        patterns: [
            { regex: /role=["']alert["']/, description: 'Alert role for important notifications' },
            { regex: /aria-live/, description: 'Live region for dynamic content' },
        ],
    },
    {
        file: 'src/components/community/poll-results.tsx',
        patterns: [
            { regex: /aria-label/, description: 'Descriptive ARIA labels' },
            { regex: /aria-describedby/, description: 'ARIA descriptions for actions' },
        ],
    },
    {
        file: 'src/app/layout.tsx',
        patterns: [
            { regex: /SkipLink/, description: 'Skip links for keyboard navigation' },
            { regex: /id=["']main-content["']/, description: 'Main content landmark' },
        ],
    },
    {
        file: 'src/components/layout/sidebar-layout.tsx',
        patterns: [{ regex: /id=["']main-content["']/, description: 'Main content element has ID' }],
    },
];

let totalIssues = 0;
let totalChecks = 0;

checks.forEach(({ file, patterns }) => {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Checking ${file}...`);

    patterns.forEach(({ regex, description }) => {
        totalChecks++;
        if (regex.test(content)) {
            console.log(`  ✅ ${description}`);
        } else {
            console.log(`  ❌ Missing: ${description}`);
            totalIssues++;
        }
    });

    console.log('');
});

// Summary
console.log('📊 Accessibility Check Summary:');
console.log(`   Total checks: ${totalChecks}`);
console.log(`   Passed: ${totalChecks - totalIssues}`);
console.log(`   Issues: ${totalIssues}`);

if (totalIssues === 0) {
    console.log('🎉 All accessibility checks passed!');
    process.exit(0);
} else {
    console.log('\n💡 Recommendations:');
    console.log('   - Run automated accessibility testing tools like axe-core');
    console.log('   - Test with screen readers (NVDA, JAWS, VoiceOver)');
    console.log('   - Verify keyboard navigation works without a mouse');
    console.log('   - Check color contrast ratios meet WCAG AA standards');
    process.exit(1);
}
