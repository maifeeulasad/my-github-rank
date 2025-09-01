# GitHub User Rank Tracker

🚀 A powerful GitHub Action that tracks GitHub user ranking progress over time by analyzing git commit history.

This action analyzes a user's ranking changes across different metrics (followers, public contributions, total contributions) by examining historical data from git commits, providing insights into how a user's GitHub presence has evolved.

## Features

- 📊 Track ranking changes across followers, public contributions, and total contributions
- 🌍 Automatically detects user's country from ranking data
- 📅 Configurable time range for analysis
- 📈 Historical snapshots showing ranking progression
- 🎯 CLI tool for local development and testing
- ⚡ Fast analysis with configurable commit limits

## Usage

### As a GitHub Action

You can use this action in your workflows like this:

```yaml
name: 'Track User Progress'
on: [push]

jobs:
  track:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Track GitHub User Progress
        uses: maifeeulasad/my-github-rank@v1
        id: tracker
        with:
          username: 'maifeeulasad'
          days: '7'
          max-commits: '10'
          
      - name: Display Results
        run: |
          echo "Country: ${{ steps.tracker.outputs.country }}"
          echo "Followers Rank Change: ${{ steps.tracker.outputs.followers-rank-change }}"
          echo "${{ steps.tracker.outputs.summary }}"
```

### As a CLI Tool

For local development and testing:

```bash
# Track a user with default settings (7 days, 10 commits)
npm run track maifeeulasad

# Track with custom time range and commit limit
npm run track maifeeulasad 14 20

# Get help
npm run track --help
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `username` | GitHub username to track | Yes | - |
| `days` | Number of days to look back | No | `7` |
| `max-commits` | Maximum number of commits to analyze | No | `10` |

## Outputs

| Output | Description |
|--------|-------------|
| `country` | The country where the user is ranked |
| `followers-rank-change` | Change in followers ranking (positive = improvement) |
| `public-contributions-rank-change` | Change in public contributions ranking |
| `total-contributions-rank-change` | Change in total contributions ranking |
| `commits-analyzed` | Number of commits that were analyzed |
| `summary` | Formatted markdown summary of the progress report |

## How It Works

1. **User Discovery**: Searches through country-specific ranking files to find the user's location
2. **Git Analysis**: Examines git commit history within the specified timeframe
3. **Historical Snapshots**: For each commit, retrieves the user's ranking at that point in time
4. **Progress Calculation**: Compares rankings between the earliest and latest snapshots
5. **Report Generation**: Creates a comprehensive progress report with ranking changes

## Example Output

```
📊 PROGRESS REPORT FOR @MAIFEEULASAD
🌍 Country: BANGLADESH
📅 Period: 7 days (5 commits analyzed)

👥 FOLLOWERS RANKING:
   Rank: #45 → #42 ⬆️ (improved by 3)
   Count: +12 followers

🔓 PUBLIC CONTRIBUTIONS RANKING:
   Rank: #23 → #20 ⬆️ (improved by 3)
   Count: +45 contributions

📊 TOTAL CONTRIBUTIONS RANKING:
   Rank: #18 → #15 ⬆️ (improved by 3)
   Count: +67 contributions
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the action:
   ```bash
   npm run build
   ```

3. Package for distribution:
   ```bash
   npm run package
   ```

4. Test locally:
   ```bash
   npm run track <username>
   ```

## Requirements

- The repository must contain markdown ranking files in the `markdown/` directory
- Git history must be available for the specified time range
- The target user must exist in the ranking data

## License

MIT License - see [LICENSE](LICENSE) file for details.

4. Run all (build + package):
   ```bash
   npm run all
   ```

## Publishing

The action is automatically built and published when you push to the `main` branch or create a new tag starting with `v`.

To publish a new version:

1. Update the version in `package.json`
2. Create a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

The GitHub workflow will automatically build and commit the compiled action to the repository.