#!/usr/bin/env node

import { UserProgressTracker } from './user-progress-tracker.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoPath = join(__dirname, '..');

export function generateProgressSVG(result: any): string {
  const width = 800;
  const height = 600;
  const margin = 60;
  const chartWidth = width - 2 * margin;
  const chartHeight = height - 2 * margin;

  // Helper function to get rank change symbol and color
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
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" rx="12"/>
  
  <!-- Header -->
  <text x="${width/2}" y="40" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="bold" font-family="Arial, sans-serif">
    GitHub Rank Progress Report
  </text>
  
  <!-- User Info -->
  <text x="${width/2}" y="70" text-anchor="middle" fill="#cbd5e1" font-size="16" font-family="Arial, sans-serif">
    @${result.username} • ${result.country.replace(/_/g, ' ').toUpperCase()} • ${result.daysAnalyzed} days analyzed
  </text>
  
  <!-- Progress Cards -->
  <!-- Followers Card -->
  <g transform="translate(${margin}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="#1e293b" stroke="#334155" stroke-width="1" rx="8" filter="url(#shadow)"/>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold" font-family="Arial, sans-serif">👥 FOLLOWERS</text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${followersInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${followersInfo.symbol}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${followersInfo.text}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">
      ${result.followersProgress.startRank ? `#${result.followersProgress.startRank} → #${result.followersProgress.endRank}` : 'No data'}
    </text>
  </g>
  
  <!-- Public Contributions Card -->
  <g transform="translate(${margin + chartWidth/3 + 10}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="#1e293b" stroke="#334155" stroke-width="1" rx="8" filter="url(#shadow)"/>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold" font-family="Arial, sans-serif">🔓 PUBLIC</text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${publicInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${publicInfo.symbol}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${publicInfo.text}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">
      ${result.publicContributionsProgress.startRank ? `#${result.publicContributionsProgress.startRank} → #${result.publicContributionsProgress.endRank}` : 'No data'}
    </text>
  </g>
  
  <!-- Total Contributions Card -->
  <g transform="translate(${margin + 2 * (chartWidth/3 + 10)}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="#1e293b" stroke="#334155" stroke-width="1" rx="8" filter="url(#shadow)"/>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="bold" font-family="Arial, sans-serif">📊 TOTAL</text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${totalInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${totalInfo.symbol}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${totalInfo.text}
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">
      ${result.totalContributionsProgress.startRank ? `#${result.totalContributionsProgress.startRank} → #${result.totalContributionsProgress.endRank}` : 'No data'}
    </text>
  </g>
  
  <!-- Timeline Chart (if we have snapshots) -->
  ${result.snapshots.length > 1 ? generateTimelineChart(result.snapshots, margin, 250, chartWidth, 200) : ''}
  
  <!-- Footer -->
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#64748b" font-size="12" font-family="Arial, sans-serif">
    Generated by GitHub User Rank Tracker • ${new Date().toLocaleDateString()}
  </text>
</svg>`.trim();
}

function generateTimelineChart(snapshots: any[], x: number, y: number, width: number, height: number): string {
  if (snapshots.length < 2) return '';
  
  const validSnapshots = snapshots.filter(s => s.followersRank || s.publicContributionsRank || s.totalContributionsRank);
  if (validSnapshots.length < 2) return '';
  
  // Sort by date
  validSnapshots.sort((a, b) => new Date(a.commitDate).getTime() - new Date(b.commitDate).getTime());
  
  const chartX = x + 40;
  const chartY = y + 40;
  const chartWidth = width - 80;
  const chartHeight = height - 80;
  
  // Calculate scales
  const minDate = new Date(validSnapshots[0].commitDate).getTime();
  const maxDate = new Date(validSnapshots[validSnapshots.length - 1].commitDate).getTime();
  const dateRange = maxDate - minDate || 1;
  
  // Get rank ranges for scaling
  const allRanks = validSnapshots.flatMap(s => [s.followersRank, s.publicContributionsRank, s.totalContributionsRank].filter(Boolean));
  const minRank = Math.min(...allRanks);
  const maxRank = Math.max(...allRanks);
  const rankRange = maxRank - minRank || 1;
  
  // Generate path data for each metric
  const generatePath = (metric: string) => {
    const points = validSnapshots
      .filter(s => s[metric])
      .map(s => {
        const relativeTime = (new Date(s.commitDate).getTime() - minDate) / dateRange;
        const relativeRank = (maxRank - s[metric]) / rankRange; // Invert because lower rank is better
        return `${chartX + relativeTime * chartWidth},${chartY + relativeRank * chartHeight}`;
      });
    
    if (points.length < 2) return '';
    return `M ${points.join(' L ')}`;
  };
  
  const followersPath = generatePath('followersRank');
  const publicPath = generatePath('publicContributionsRank');
  const totalPath = generatePath('totalContributionsRank');
  
  return `
  <!-- Timeline Chart -->
  <g transform="translate(0, ${y})">
    <!-- Chart Background -->
    <rect x="${x}" y="0" width="${width}" height="${height}" fill="#0f172a" stroke="#334155" stroke-width="1" rx="8" filter="url(#shadow)"/>
    
    <!-- Chart Title -->
    <text x="${x + width/2}" y="25" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="bold" font-family="Arial, sans-serif">
      📈 Ranking Progression
    </text>
    
    <!-- Chart Lines -->
    ${followersPath ? `<path d="${followersPath}" stroke="#22c55e" stroke-width="2" fill="none"/>` : ''}
    ${publicPath ? `<path d="${publicPath}" stroke="#3b82f6" stroke-width="2" fill="none"/>` : ''}
    ${totalPath ? `<path d="${totalPath}" stroke="#f59e0b" stroke-width="2" fill="none"/>` : ''}
    
    <!-- Legend -->
    <g transform="translate(${x + 20}, ${height - 40})">
      <circle cx="0" cy="0" r="4" fill="#22c55e"/>
      <text x="10" y="4" fill="#94a3b8" font-size="10" font-family="Arial, sans-serif">Followers</text>
      
      <circle cx="80" cy="0" r="4" fill="#3b82f6"/>
      <text x="90" y="4" fill="#94a3b8" font-size="10" font-family="Arial, sans-serif">Public</text>
      
      <circle cx="140" cy="0" r="4" fill="#f59e0b"/>
      <text x="150" y="4" fill="#94a3b8" font-size="10" font-family="Arial, sans-serif">Total</text>
    </g>
  </g>`;
}

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

    // Generate SVG file
    console.log('🎨 Generating SVG report...');
    try {
      const svgContent = generateProgressSVG(result);
      const outputDir = join(repoPath, 'output');
      const svgPath = join(outputDir, `${username}-rank-progress.svg`);
      
      // Create output directory if it doesn't exist
      try {
        await mkdir(outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      await writeFile(svgPath, svgContent, 'utf-8');
      console.log(`📊 SVG report saved to: ${svgPath}`);
    } catch (error) {
      console.warn('⚠️  Could not generate SVG file:', error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
