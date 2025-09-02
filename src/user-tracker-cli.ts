// SVG generation functions for my-github-rank
// Used by both CLI and GitHub Actions

export function generateProgressSVG(result: any, theme: 'dark' | 'light' = 'dark'): string {
  const width = 800;
  const height = 600;
  const margin = 60;
  const chartWidth = width - 2 * margin;
  const chartHeight = height - 2 * margin;

  // Check if this is a motivational report (user not found)
  const isMotivational = result.country === 'global' && result.commitsAnalyzed === 0;

  // Theme-specific colors
  const colors = theme === 'dark' ? {
    background: { start: '#1e293b', end: '#0f172a' },
    cardBackground: '#1e293b',
    cardBorder: '#334155',
    chartBackground: '#0f172a',
    chartBorder: '#334155',
    headerText: '#f8fafc',
    subText: '#cbd5e1',
    labelText: '#94a3b8',
    valueText: '#f8fafc',
    footerText: '#64748b'
  } : {
    background: { start: '#f8fafc', end: '#e2e8f0' },
    cardBackground: '#ffffff',
    cardBorder: '#e2e8f0',
    chartBackground: '#ffffff',
    chartBorder: '#e2e8f0',
    headerText: '#0f172a',
    subText: '#475569',
    labelText: '#64748b',
    valueText: '#1e293b',
    footerText: '#94a3b8'
  };

  if (isMotivational) {
    return generateMotivationalSVG(result, theme, colors, width, height);
  }

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
      <stop offset="0%" style="stop-color:${colors.background.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.background.end};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="${theme === 'dark' ? '#000' : '#00000020'}" flood-opacity="${theme === 'dark' ? '0.3' : '0.1'}"/>
    </filter>
    <!-- Trail effect filter -->
    <filter id="trailGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" rx="12"/>
  
  <!-- Header -->
  <text x="${width/2}" y="40" text-anchor="middle" fill="${colors.headerText}" font-size="24" font-weight="bold" font-family="Arial, sans-serif">
    GitHub Progress Report
    <animate attributeName="opacity" values="0;1" dur="0.8s" begin="0s" fill="freeze"/>
    <animateTransform attributeName="transform" type="translate" values="0,-20;0,0" dur="0.8s" begin="0s" fill="freeze"/>
  </text>
  
  <!-- User Info -->
  <text x="${width/2}" y="70" text-anchor="middle" fill="${colors.subText}" font-size="16" font-family="Arial, sans-serif">
    @${result.username} • ${result.country.replace(/_/g, ' ').toUpperCase()} • ${result.daysAnalyzed} days analyzed
    <animate attributeName="opacity" values="0;1" dur="0.6s" begin="0.3s" fill="freeze"/>
  </text>
  
  <!-- Progress Cards -->
  <!-- Followers Card -->
  <g transform="translate(${margin}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="0.2s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0.8;1" dur="0.6s" begin="0.2s" fill="freeze"/>
    </rect>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">FOLLOWERS
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.4s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${followersInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${followersInfo.symbol}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.6s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0;1.2;1" dur="0.8s" begin="0.6s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="${colors.valueText}" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${followersInfo.text}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.8s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      ${result.followersProgress.startRank ? `#${result.followersProgress.startRank} → #${result.followersProgress.endRank}` : 'No data'}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1s" fill="freeze"/>
    </text>
  </g>
  
  <!-- Public Contributions Card -->
  <g transform="translate(${margin + chartWidth/3 + 10}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="0.4s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0.8;1" dur="0.6s" begin="0.4s" fill="freeze"/>
    </rect>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">PUBLIC
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.6s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${publicInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${publicInfo.symbol}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.8s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0;1.2;1" dur="0.8s" begin="0.8s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="${colors.valueText}" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${publicInfo.text}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      ${result.publicContributionsProgress.startRank ? `#${result.publicContributionsProgress.startRank} → #${result.publicContributionsProgress.endRank}` : 'No data'}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.2s" fill="freeze"/>
    </text>
  </g>
  
  <!-- Total Contributions Card -->
  <g transform="translate(${margin + 2 * (chartWidth/3 + 10)}, 100)">
    <rect width="${chartWidth/3 - 20}" height="120" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="0.6s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0.8;1" dur="0.6s" begin="0.6s" fill="freeze"/>
    </rect>
    <text x="${(chartWidth/3 - 20)/2}" y="25" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">TOTAL
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.8s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="50" text-anchor="middle" fill="${totalInfo.color}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">
      ${totalInfo.symbol}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0;1.2;1" dur="0.8s" begin="1s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="75" text-anchor="middle" fill="${colors.valueText}" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
      ${totalInfo.text}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.2s" fill="freeze"/>
    </text>
    
    <text x="${(chartWidth/3 - 20)/2}" y="95" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      ${result.totalContributionsProgress.startRank ? `#${result.totalContributionsProgress.startRank} → #${result.totalContributionsProgress.endRank}` : 'No data'}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.4s" fill="freeze"/>
    </text>
  </g>
  
  <!-- Timeline Charts (if we have snapshots) -->
  ${result.snapshots.length > 1 ? generateThreeCharts(result.snapshots, margin, 250, chartWidth, 200, theme) : ''}
  
  <!-- Footer -->
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="${colors.footerText}" font-size="12" font-family="Arial, sans-serif">
    Generated by my-github-rank • ${new Date().toLocaleDateString()}
    <animate attributeName="opacity" values="0;1" dur="0.5s" begin="5s" fill="freeze"/>
  </text>
</svg>`.trim();
}

function generateCountChart(snapshots: any[], x: number, y: number, width: number, height: number, metric: string, title: string, color: string, chartIndex: number = 0, theme: 'dark' | 'light' = 'dark'): string {
  if (snapshots.length < 2) return '';
  
  const validSnapshots = snapshots.filter(s => s[metric] !== undefined && s[metric] !== null);
  if (validSnapshots.length < 2) return '';
  
  // Theme-specific colors
  const colors = theme === 'dark' ? {
    background: '#0f172a',
    border: '#334155',
    title: '#f8fafc',
    labels: '#94a3b8'
  } : {
    background: '#ffffff',
    border: '#e2e8f0',
    title: '#1e293b',
    labels: '#64748b'
  };
  
  // Sort by date
  validSnapshots.sort((a, b) => new Date(a.commitDate).getTime() - new Date(b.commitDate).getTime());
  
  const chartX = x + 30;
  const chartY = 40;
  const chartWidth = width - 60;
  const chartHeight = height - 80;
  
  // Calculate scales
  const minDate = new Date(validSnapshots[0].commitDate).getTime();
  const maxDate = new Date(validSnapshots[validSnapshots.length - 1].commitDate).getTime();
  const dateRange = maxDate - minDate || 1;
  
  // Get count ranges for scaling
  const allCounts = validSnapshots.map(s => s[metric]).filter(Boolean);
  const minCount = Math.min(...allCounts);
  const maxCount = Math.max(...allCounts);
  const countRange = maxCount - minCount || 1;
  
  // Generate path data
  const points = validSnapshots.map(s => {
    const relativeTime = (new Date(s.commitDate).getTime() - minDate) / dateRange;
    const relativeCount = (s[metric] - minCount) / countRange;
    return `${30 + relativeTime * chartWidth},${40 + (1 - relativeCount) * chartHeight}`;
  });
  
  if (points.length < 2) return '';
  const path = `M ${points.join(' L ')}`;
  const pathLength = points.length * 50; // Approximate path length for animation
  
  // Animation delay based on chart index (stagger animations)
  const animationDelay = 1.8 + chartIndex * 0.5;
  
  return `
  <!-- ${title} Chart -->
  <g transform="translate(${x}, ${y})">
    <!-- Chart Background -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="${colors.background}" stroke="${colors.border}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${animationDelay}s" fill="freeze"/>
    </rect>
    
    <!-- Chart Title -->
    <text x="${width/2}" y="25" text-anchor="middle" fill="${colors.title}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
      ${title}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${animationDelay + 0.2}s" fill="freeze"/>
    </text>
    
    <!-- Y-axis labels -->
    <text x="10" y="45" fill="${colors.labels}" font-size="10" font-family="Arial, sans-serif">${maxCount.toLocaleString()}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${animationDelay + 0.4}s" fill="freeze"/>
    </text>
    <text x="10" y="${height - 15}" fill="${colors.labels}" font-size="10" font-family="Arial, sans-serif">${minCount.toLocaleString()}
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${animationDelay + 0.4}s" fill="freeze"/>
    </text>
    
    <!-- Chart Line with draw animation that follows the circle -->
    <path d="${path}" stroke="${color}" stroke-width="2" fill="none" stroke-dasharray="${pathLength}" stroke-dashoffset="${pathLength}">
      <animate attributeName="stroke-dashoffset" values="${pathLength};0" dur="3s" begin="${animationDelay + 0.8}s" fill="freeze"/>
    </path>
    
    <!-- Glow effect for the line that also follows the circle -->
    <path d="${path}" stroke="${color}" stroke-width="4" fill="none" opacity="0.4" stroke-dasharray="${pathLength}" stroke-dashoffset="${pathLength}">
      <animate attributeName="stroke-dashoffset" values="${pathLength};0" dur="3s" begin="${animationDelay + 0.8}s" fill="freeze"/>
    </path>
    
    <!-- Animated circle that moves along the path and draws the line -->
    <circle r="5" fill="${color}" opacity="0" filter="url(#trailGlow)">
      <animate attributeName="opacity" values="0;1;1;1" dur="3.2s" begin="${animationDelay + 0.6}s" fill="freeze"/>
      <animate attributeName="r" values="5;6;5" dur="1s" begin="${animationDelay + 0.6}s" repeatCount="3"/>
      <animateMotion dur="3s" begin="${animationDelay + 0.6}s" fill="freeze">
        <mpath href="#path_${metric}_${x}"/>
      </animateMotion>
    </circle>
    
    <!-- Small trail dots that fade out -->
    <circle r="2" fill="${color}" opacity="0">
      <animate attributeName="opacity" values="0;0.6;0" dur="0.8s" begin="${animationDelay + 1}s" fill="freeze"/>
      <animateMotion dur="3s" begin="${animationDelay + 0.6}s" fill="freeze">
        <mpath href="#path_${metric}_${x}"/>
      </animateMotion>
    </circle>
    
    <!-- Hidden path for motion animation -->
    <path id="path_${metric}_${x}" d="${path}" fill="none" stroke="none"/>
  </g>`;
}

function generateThreeCharts(snapshots: any[], x: number, y: number, totalWidth: number, height: number, theme: 'dark' | 'light' = 'dark'): string {
  if (snapshots.length < 2) return '';
  
  const chartWidth = (totalWidth - 40) / 3; // 3 charts with spacing
  const spacing = 20;
  
  const followersChart = generateCountChart(
    snapshots, 
    x, 
    y, 
    chartWidth, 
    height, 
    'followersCount', 
    '👥 Followers Count', 
    '#22c55e',
    0, // chart index for animation delay
    theme
  );
  
  const publicChart = generateCountChart(
    snapshots, 
    x + chartWidth + spacing, 
    y, 
    chartWidth, 
    height, 
    'publicContributions', 
    '🔓 Public Contributions', 
    '#3b82f6',
    1, // chart index for animation delay
    theme
  );
  
  const totalChart = generateCountChart(
    snapshots, 
    x + 2 * (chartWidth + spacing), 
    y, 
    chartWidth, 
    height, 
    'totalContributions', 
    '📊 Total Contributions', 
    '#f59e0b',
    2, // chart index for animation delay
    theme
  );
  
  return followersChart + publicChart + totalChart;
}

function generateMotivationalSVG(result: any, theme: 'dark' | 'light', colors: any, width: number, height: number): string {
  // Get motivational quotes (same as in the tracker)
  const motivationalQuotes = [
    "🌟 Every expert was once a beginner. Keep pushing forward!",
    "🚀 Your coding journey is just getting started. The best is yet to come!",
    "💪 Great developers aren't born, they're made through persistence and practice.",
    "🎯 Rome wasn't built in a day, neither are great GitHub profiles. Keep coding!",
    "✨ Every commit is a step forward. Your dedication will pay off!",
    "🔥 The only way to do great work is to love what you do. Keep growing!",
    "🌈 Success is not final, failure is not fatal. Keep coding with courage!",
    "⭐ Your potential is limitless. Keep pushing your boundaries!",
    "🎖️ Champions are made in practice, not just in competition. Keep coding!",
    "🌟 The journey of a thousand commits begins with a single push!"
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.background.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.background.end};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="${theme === 'dark' ? '#000' : '#00000020'}" flood-opacity="${theme === 'dark' ? '0.3' : '0.1'}"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" rx="12"/>
  
  <!-- Header -->
  <text x="${width/2}" y="80" text-anchor="middle" fill="${colors.headerText}" font-size="28" font-weight="bold" font-family="Arial, sans-serif">
    GitHub Journey Report
    <animate attributeName="opacity" values="0;1" dur="1s" begin="0s" fill="freeze"/>
    <animateTransform attributeName="transform" type="translate" values="0,-30;0,0" dur="1s" begin="0s" fill="freeze"/>
  </text>
  
  <!-- User Info -->
  <text x="${width/2}" y="120" text-anchor="middle" fill="${colors.subText}" font-size="18" font-family="Arial, sans-serif">
    @${result.username} • Starting Your Coding Adventure
    <animate attributeName="opacity" values="0;1" dur="0.8s" begin="0.5s" fill="freeze"/>
  </text>
  
  <!-- Motivational Card -->
  <g transform="translate(${width/2 - 300}, 180)">
    <rect width="600" height="200" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="2" rx="15" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.8s" begin="1s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0.9;1" dur="0.8s" begin="1s" fill="freeze"/>
    </rect>
    
    <!-- Large Motivational Icon -->
    <text x="300" y="70" text-anchor="middle" fill="#fbbf24" font-size="48" font-family="Arial, sans-serif" filter="url(#glow)">
      ★
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="1.5s" fill="freeze"/>
      <animateTransform attributeName="transform" type="scale" values="0;1.2;1" dur="1s" begin="1.5s" fill="freeze"/>
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="2.5s" repeatCount="indefinite"/>
    </text>
    
    <!-- Motivational Quote -->
    <text x="300" y="130" text-anchor="middle" fill="${colors.headerText}" font-size="20" font-weight="bold" font-family="Arial, sans-serif">
      <tspan x="300" dy="0">Keep Coding, Keep Growing!</tspan>
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="2s" fill="freeze"/>
    </text>
    
    <text x="300" y="165" text-anchor="middle" fill="${colors.valueText}" font-size="16" font-family="Arial, sans-serif">
      <tspan x="300" dy="0">${randomQuote.replace(/[🌟🚀💪🎯✨🔥🌈⭐🎖️]/g, '').trim()}</tspan>
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="2.5s" fill="freeze"/>
    </text>
  </g>
  
  <!-- Encouragement Cards -->
  <g transform="translate(80, 420)">
    <!-- Start Card -->
    <rect width="200" height="100" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="3s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="-50,0;0,0" dur="0.6s" begin="3s" fill="freeze"/>
    </rect>
    <text x="100" y="30" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">GET STARTED
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.2s" fill="freeze"/>
    </text>
    <text x="100" y="55" text-anchor="middle" fill="${colors.valueText}" font-size="16" font-weight="bold" font-family="Arial, sans-serif">
      Create &amp; Push
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.4s" fill="freeze"/>
    </text>
    <text x="100" y="75" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      Your first commit awaits!
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.6s" fill="freeze"/>
    </text>
  </g>
  
  <g transform="translate(300, 420)">
    <!-- Build Card -->
    <rect width="200" height="100" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="3.3s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="0,50;0,0" dur="0.6s" begin="3.3s" fill="freeze"/>
    </rect>
    <text x="100" y="30" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">BUILD
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.5s" fill="freeze"/>
    </text>
    <text x="100" y="55" text-anchor="middle" fill="${colors.valueText}" font-size="16" font-weight="bold" font-family="Arial, sans-serif">
      Learn &amp; Grow
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.7s" fill="freeze"/>
    </text>
    <text x="100" y="75" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      Every line counts!
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.9s" fill="freeze"/>
    </text>
  </g>
  
  <g transform="translate(520, 420)">
    <!-- Shine Card -->
    <rect width="200" height="100" fill="${colors.cardBackground}" stroke="${colors.cardBorder}" stroke-width="1" rx="8" filter="url(#shadow)">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="3.6s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="50,0;0,0" dur="0.6s" begin="3.6s" fill="freeze"/>
    </rect>
    <text x="100" y="30" text-anchor="middle" fill="${colors.labelText}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">SHINE
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="3.8s" fill="freeze"/>
    </text>
    <text x="100" y="55" text-anchor="middle" fill="${colors.valueText}" font-size="16" font-weight="bold" font-family="Arial, sans-serif">
      Make Impact
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="4s" fill="freeze"/>
    </text>
    <text x="100" y="75" text-anchor="middle" fill="${colors.labelText}" font-size="12" font-family="Arial, sans-serif">
      Your future is bright!
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="4.2s" fill="freeze"/>
    </text>
  </g>
  
  <!-- Footer -->
  <text x="${width/2}" y="570" text-anchor="middle" fill="${colors.footerText}" font-size="12" font-family="Arial, sans-serif">
    Generated by my-github-rank • Your coding journey starts now! • ${new Date().toLocaleDateString()}
    <animate attributeName="opacity" values="0;1" dur="0.5s" begin="5s" fill="freeze"/>
  </text>
</svg>`.trim();
}

// Export the functions for use in GitHub Actions
// CLI execution moved to src/cli.ts to prevent conflicts when bundled
