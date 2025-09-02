import * as core from '@actions/core';
import { UserProgressTracker } from './user-progress-tracker.js';
import { generateProgressSVG } from './user-tracker-cli.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function run(): Promise<void> {
  try {
    const username = core.getInput('username');
    const days = parseInt(core.getInput('days') || '7');
    const maxCommits = parseInt(core.getInput('max-commits') || '10');
    const autoSetup = (core.getInput('auto-setup').toLowerCase() !== 'false') || true;
    
    if (!username) {
      throw new Error('Username is required');
    }

    core.info(`🎯 Tracking progress for @${username}`);
    core.info(`📅 Time range: ${days} days`);
    core.info(`📊 Max commits: ${maxCommits}`);

    // Initialize workspace path
    const repoPath = process.env.GITHUB_WORKSPACE || process.cwd();
    
    // Initialize tracker with the current workspace
    const tracker = new UserProgressTracker(repoPath);
    
    const result = await tracker.trackUserProgress({
      username,
      days,
      maxCommits,
      autoSetup
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

    // Generate SVG files (both dark and light themes)
    try {
      const darkSvgContent = generateProgressSVG(result, 'dark');
      const lightSvgContent = generateProgressSVG(result, 'light');
      
      // Ensure output directory exists
      const outputDir = join(repoPath, 'output');
      await mkdir(outputDir, { recursive: true });
      
      const darkOutputPath = join(outputDir, `${username}-rank-progress-dark.svg`);
      const lightOutputPath = join(outputDir, `${username}-rank-progress-light.svg`);
      
      await writeFile(darkOutputPath, darkSvgContent, 'utf-8');
      await writeFile(lightOutputPath, lightSvgContent, 'utf-8');
      
      core.setOutput('svg-dark-path', darkOutputPath);
      core.setOutput('svg-light-path', lightOutputPath);
      core.info(`📊 Dark theme SVG report generated: ${darkOutputPath}`);
      core.info(`📊 Light theme SVG report generated: ${lightOutputPath}`);
    } catch (error) {
      core.warning(`Could not generate SVG files: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

run();
