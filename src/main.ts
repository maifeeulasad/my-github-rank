import * as core from '@actions/core';
import { UserProgressTracker } from './user-progress-tracker.js';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { constants } from 'fs';

const execAsync = promisify(exec);

// Function to setup GitHub ranking data if it doesn't exist
async function setupDataIfNeeded(repoPath: string): Promise<void> {
  const dataPath = join(repoPath, 'src', 'top-github-users');
  const markdownPath = join(dataPath, 'markdown');
  
  try {
    // Check if the markdown directory exists
    await access(markdownPath, constants.F_OK);
    core.info('✅ GitHub ranking data already exists');
    return;
  } catch (error) {
    core.info('📥 GitHub ranking data not found, setting up...');
  }

  try {
    // Ensure src directory exists
    const srcPath = join(repoPath, 'src');
    await mkdir(srcPath, { recursive: true });
    
    // Clone the top-github-users repository
    const cloneCommand = `git clone https://github.com/gayanvoice/top-github-users.git "${dataPath}"`;
    core.info(`🔄 Running: ${cloneCommand}`);
    
    const { stdout, stderr } = await execAsync(cloneCommand, { 
      cwd: repoPath,
      timeout: 120000 // 2 minutes timeout for large repository
    });
    
    if (stdout) core.info(`Clone output: ${stdout}`);
    if (stderr && !stderr.includes('Cloning into')) {
      core.warning(`Clone stderr: ${stderr}`);
    }
    
    // Verify the setup was successful
    await access(markdownPath, constants.F_OK);
    core.info('✅ GitHub ranking data setup completed successfully');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`Failed to setup GitHub ranking data: ${errorMessage}`);
    
    // Provide helpful guidance
    core.info('💡 You can also manually run "npm run setup-data" in your repository');
    core.info('💡 Or set the "auto-setup" input to "false" and handle data setup in your workflow');
    
    throw new Error(`Failed to setup GitHub ranking data: ${errorMessage}`);
  }
}

// SVG generation function (simplified version for actions)
function generateProgressSVG(result: any): string {
  const width = 800;
  const height = 400;

  const getRankInfo = (rankChange: number) => {
    if (rankChange > 0) return { symbol: '↗', color: '#22c55e', text: `+${rankChange}` };
    if (rankChange < 0) return { symbol: '↘', color: '#ef4444', text: `${rankChange}` };
    return { symbol: '→', color: '#6b7280', text: '0' };
  };

  const followersInfo = getRankInfo(result.followersProgress.rankChange);
  const publicInfo = getRankInfo(result.publicContributionsProgress.rankChange);
  const totalInfo = getRankInfo(result.totalContributionsProgress.rankChange);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" rx="12"/>
  
  <text x="${width/2}" y="40" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="bold" font-family="Arial, sans-serif">
    GitHub Rank Progress: @${result.username}
  </text>
  
  <text x="${width/2}" y="70" text-anchor="middle" fill="#cbd5e1" font-size="16" font-family="Arial, sans-serif">
    ${result.country.replace(/_/g, ' ').toUpperCase()} • ${result.daysAnalyzed} days • ${result.commitsAnalyzed} commits
  </text>
  
  <!-- Progress Cards -->
  <g transform="translate(80, 120)">
    <!-- Followers -->
    <rect width="200" height="100" fill="#1e293b" stroke="#334155" rx="8"/>
    <text x="100" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold">👥 FOLLOWERS</text>
    <text x="100" y="55" text-anchor="middle" fill="${followersInfo.color}" font-size="28" font-weight="bold">${followersInfo.symbol}</text>
    <text x="100" y="80" text-anchor="middle" fill="#f8fafc" font-size="16">${followersInfo.text}</text>
  </g>
  
  <g transform="translate(300, 120)">
    <!-- Public -->
    <rect width="200" height="100" fill="#1e293b" stroke="#334155" rx="8"/>
    <text x="100" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold">🔓 PUBLIC</text>
    <text x="100" y="55" text-anchor="middle" fill="${publicInfo.color}" font-size="28" font-weight="bold">${publicInfo.symbol}</text>
    <text x="100" y="80" text-anchor="middle" fill="#f8fafc" font-size="16">${publicInfo.text}</text>
  </g>
  
  <g transform="translate(520, 120)">
    <!-- Total -->
    <rect width="200" height="100" fill="#1e293b" stroke="#334155" rx="8"/>
    <text x="100" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold">📊 TOTAL</text>
    <text x="100" y="55" text-anchor="middle" fill="${totalInfo.color}" font-size="28" font-weight="bold">${totalInfo.symbol}</text>
    <text x="100" y="80" text-anchor="middle" fill="#f8fafc" font-size="16">${totalInfo.text}</text>
  </g>
  
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#64748b" font-size="12">
    Generated by GitHub User Rank Tracker • ${new Date().toLocaleDateString()}
  </text>
</svg>`.trim();
}

async function run(): Promise<void> {
  try {
    const username = core.getInput('username');
    const days = parseInt(core.getInput('days') || '7');
    const maxCommits = parseInt(core.getInput('max-commits') || '10');
    const autoSetup = core.getInput('auto-setup').toLowerCase() !== 'false';
    
    if (!username) {
      throw new Error('Username is required');
    }

    core.info(`🎯 Tracking progress for @${username}`);
    core.info(`📅 Time range: ${days} days`);
    core.info(`📊 Max commits: ${maxCommits}`);

    // Initialize workspace path
    const repoPath = process.env.GITHUB_WORKSPACE || process.cwd();
    
    // Setup GitHub ranking data if needed and auto-setup is enabled
    if (autoSetup) {
      await setupDataIfNeeded(repoPath);
    }
    
    // Initialize tracker with the current workspace
    const tracker = new UserProgressTracker(repoPath);
    
    const result = await tracker.trackUserProgress({
      username,
      days,
      maxCommits
    });

    // Set outputs for other workflow steps to use
    core.setOutput('country', result.country);
    core.setOutput('followers-rank-change', result.followersProgress.rankChange.toString());
    core.setOutput('public-contributions-rank-change', result.publicContributionsProgress.rankChange.toString());
    core.setOutput('total-contributions-rank-change', result.totalContributionsProgress.rankChange.toString());
    core.setOutput('commits-analyzed', result.commitsAnalyzed.toString());
    
    // Create summary
    const summary = [
      `📊 Progress Report for @${result.username}`,
      `🌍 Country: ${result.country.replace(/_/g, ' ')}`,
      `📅 Period: ${result.daysAnalyzed} days (${result.commitsAnalyzed} commits)`,
      '',
      '**Ranking Changes:**',
      `👥 Followers: ${result.followersProgress.rankChange > 0 ? '⬆️' : result.followersProgress.rankChange < 0 ? '⬇️' : '➡️'} ${Math.abs(result.followersProgress.rankChange)} positions`,
      `🔓 Public Contributions: ${result.publicContributionsProgress.rankChange > 0 ? '⬆️' : result.publicContributionsProgress.rankChange < 0 ? '⬇️' : '➡️'} ${Math.abs(result.publicContributionsProgress.rankChange)} positions`,
      `📊 Total Contributions: ${result.totalContributionsProgress.rankChange > 0 ? '⬆️' : result.totalContributionsProgress.rankChange < 0 ? '⬇️' : '➡️'} ${Math.abs(result.totalContributionsProgress.rankChange)} positions`
    ].join('\n');

    core.setOutput('summary', summary);
    core.info('✅ User progress tracking completed successfully!');

    // Generate SVG file
    try {
      const svgContent = generateProgressSVG(result);
      
      // Ensure output directory exists
      const outputDir = join(repoPath, 'output');
      await mkdir(outputDir, { recursive: true });
      
      const outputPath = join(outputDir, `${username}-rank-progress.svg`);
      await writeFile(outputPath, svgContent, 'utf-8');
      core.setOutput('svg-path', outputPath);
      core.info(`📊 SVG report generated: ${outputPath}`);
    } catch (error) {
      core.warning(`Could not generate SVG file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

run();
