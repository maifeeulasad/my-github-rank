import * as core from '@actions/core';
import { UserProgressTrackerV2 } from './user-progress-tracker.js';

async function run(): Promise<void> {
  try {
    const username = core.getInput('username');
    const days = parseInt(core.getInput('days') || '7');
    const maxCommits = parseInt(core.getInput('max-commits') || '10');
    
    if (!username) {
      throw new Error('Username is required');
    }

    core.info(`🎯 Tracking progress for @${username}`);
    core.info(`📅 Time range: ${days} days`);
    core.info(`📊 Max commits: ${maxCommits}`);

    // Initialize tracker with the current workspace
    const repoPath = process.env.GITHUB_WORKSPACE || process.cwd();
    const tracker = new UserProgressTrackerV2(repoPath);
    
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

run();
