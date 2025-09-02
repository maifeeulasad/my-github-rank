#!/usr/bin/env node

import { UserProgressTracker } from './user-progress-tracker.js';
import { generateProgressSVG } from './user-tracker-cli.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoPath = join(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 GitHub User Progress Tracker 

Usage:
  npm run track <username> [days] [maxCommits]

Arguments:
  username     GitHub username to track (required)
  days         Number of days to look back (default: 7)
  maxCommits   Maximum number of commits to analyze (default: 10)

Examples:
  npm run track maifeeulasad
  npm run track maifeeulasad 14
  npm run track maifeeulasad 30 20

The tool will:
  1. Find the user's country from the ranking data
  2. Analyze git commits over the specified time period
  3. Track ranking changes in:
     - Followers
     - Public contributions  
     - Total contributions
  4. Show rank gain/loss and actual value changes
  5. Generate an SVG report file in the output/ directory
`);
    process.exit(0);
  }

  const username = args[0];
  const days = parseInt(args[1]) || 7;
  const maxCommits = parseInt(args[2]) || 10;

  if (!username) {
    console.error('❌ Username is required');
    process.exit(1);
  }

  console.log(`🎯 Target: @${username}`);
  console.log(`📅 Time range: ${days} days`);
  console.log(`📊 Max commits: ${maxCommits}`);
  console.log('');

  try {
    const tracker = new UserProgressTracker(repoPath);
    const result = await tracker.trackUserProgress({
      username,
      days,
      maxCommits
    });

    console.log('');
    console.log('='.repeat(60));
    console.log(`📊 PROGRESS REPORT FOR @${result.username.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`🌍 Country: ${result.country.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`📅 Period: ${result.daysAnalyzed} days (${result.commitsAnalyzed} commits analyzed)`);
    console.log('');

    // Followers Progress
    console.log('👥 FOLLOWERS RANKING:');
    if (result.followersProgress.startRank && result.followersProgress.endRank) {
      const rankChange = result.followersProgress.rankChange;
      const symbol = rankChange > 0 ? '⬆️' : rankChange < 0 ? '⬇️' : '➡️';
      const changeText = rankChange > 0 ? `improved by ${rankChange}` :
        rankChange < 0 ? `declined by ${Math.abs(rankChange)}` : 'no change';

      console.log(`   Rank: #${result.followersProgress.startRank} → #${result.followersProgress.endRank} ${symbol} (${changeText})`);
      console.log(`   Count: ${result.followersProgress.countChange >= 0 ? '+' : ''}${result.followersProgress.countChange} followers`);
    } else {
      console.log('   ⚠️  No followers ranking data found');
    }
    console.log('');

    // Public Contributions Progress
    console.log('🔓 PUBLIC CONTRIBUTIONS RANKING:');
    if (result.publicContributionsProgress.startRank && result.publicContributionsProgress.endRank) {
      const rankChange = result.publicContributionsProgress.rankChange;
      const symbol = rankChange > 0 ? '⬆️' : rankChange < 0 ? '⬇️' : '➡️';
      const changeText = rankChange > 0 ? `improved by ${rankChange}` :
        rankChange < 0 ? `declined by ${Math.abs(rankChange)}` : 'no change';

      console.log(`   Rank: #${result.publicContributionsProgress.startRank} → #${result.publicContributionsProgress.endRank} ${symbol} (${changeText})`);
      console.log(`   Count: ${result.publicContributionsProgress.countChange >= 0 ? '+' : ''}${result.publicContributionsProgress.countChange} contributions`);
    } else {
      console.log('   ⚠️  No public contributions ranking data found');
    }
    console.log('');

    // Total Contributions Progress
    console.log('📊 TOTAL CONTRIBUTIONS RANKING:');
    if (result.totalContributionsProgress.startRank && result.totalContributionsProgress.endRank) {
      const rankChange = result.totalContributionsProgress.rankChange;
      const symbol = rankChange > 0 ? '⬆️' : rankChange < 0 ? '⬇️' : '➡️';
      const changeText = rankChange > 0 ? `improved by ${rankChange}` :
        rankChange < 0 ? `declined by ${Math.abs(rankChange)}` : 'no change';

      console.log(`   Rank: #${result.totalContributionsProgress.startRank} → #${result.totalContributionsProgress.endRank} ${symbol} (${changeText})`);
      console.log(`   Count: ${result.totalContributionsProgress.countChange >= 0 ? '+' : ''}${result.totalContributionsProgress.countChange} contributions`);
    } else {
      console.log('   ⚠️  No total contributions ranking data found');
    }
    console.log('');

    // Detailed snapshots
    if (result.snapshots.length > 0) {
      console.log('📈 HISTORICAL SNAPSHOTS:');
      console.log('   Date                | Followers | Public | Total   | Commit');
      console.log('   --------------------|-----------|--------|---------|----------');

      result.snapshots.slice(0, 5).forEach(snapshot => {
        const date = snapshot.commitDate.toISOString().split('T')[0];
        const followers = snapshot.followersRank ? `#${snapshot.followersRank.toString().padStart(3)}` : ' - ';
        const publicContrib = snapshot.publicContributionsRank ? `#${snapshot.publicContributionsRank.toString().padStart(3)}` : ' - ';
        const totalContrib = snapshot.totalContributionsRank ? `#${snapshot.totalContributionsRank.toString().padStart(3)}` : ' - ';
        const commit = snapshot.commitHash.substring(0, 8);

        console.log(`   ${date}     | ${followers}     | ${publicContrib}  | ${totalContrib}   | ${commit}`);
      });

      if (result.snapshots.length > 5) {
        console.log(`   ... and ${result.snapshots.length - 5} more snapshots`);
      }
    }

    console.log('');
    console.log('✅ Analysis complete!');

    // Generate SVG files (both dark and light themes)
    console.log('🎨 Generating SVG reports...');
    try {
      const darkSvgContent = generateProgressSVG(result, 'dark');
      const lightSvgContent = generateProgressSVG(result, 'light');
      const outputDir = join(repoPath, 'output');
      const darkSvgPath = join(outputDir, `${username}-rank-progress-dark.svg`);
      const lightSvgPath = join(outputDir, `${username}-rank-progress-light.svg`);
      
      // Create output directory if it doesn't exist
      try {
        await mkdir(outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      await writeFile(darkSvgPath, darkSvgContent, 'utf-8');
      await writeFile(lightSvgPath, lightSvgContent, 'utf-8');
      console.log(`📊 Dark theme SVG report saved to: ${darkSvgPath}`);
      console.log(`📊 Light theme SVG report saved to: ${lightSvgPath}`);
    } catch (error) {
      console.warn('⚠️  Could not generate SVG file:', error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the CLI
main().catch(console.error);
