import { simpleGit, SimpleGit } from 'simple-git';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface UserProgressRequest {
  username: string;
  days: number;
  maxCommits?: number; // default 10
}

export interface UserRankingSnapshot {
  commitHash: string;
  commitDate: Date;
  followersRank?: number;
  publicContributionsRank?: number;
  totalContributionsRank?: number;
  followersCount?: number;
  publicContributions?: number;
  totalContributions?: number;
  country: string;
}

export interface UserProgressSummary {
  username: string;
  country: string;
  daysAnalyzed: number;
  commitsAnalyzed: number;
  followersProgress: {
    rankChange: number; // positive = improved (lower rank number), negative = declined
    startRank?: number;
    endRank?: number;
    countChange: number;
  };
  publicContributionsProgress: {
    rankChange: number;
    startRank?: number;
    endRank?: number;
    countChange: number;
  };
  totalContributionsProgress: {
    rankChange: number;
    startRank?: number;
    endRank?: number;
    countChange: number;
  };
  snapshots: UserRankingSnapshot[];
}

export class UserProgressTracker {
  private repoPath: string;
  private markdownPath: string;
  private git: SimpleGit;

  constructor(repositoryPath: string = process.cwd()) {
    this.repoPath = repositoryPath;
    this.markdownPath = join(repositoryPath, 'src', 'top-github-users', 'markdown');
    this.git = simpleGit(repositoryPath);
  }

  /**
   * Main method to track user progress across commits
   */
  async trackUserProgress(request: UserProgressRequest): Promise<UserProgressSummary> {
    console.log(`🔍 Tracking progress for @${request.username} over ${request.days} days...`);

    // Step 1: Find user's country
    const country = await this.findUserCountry(request.username);
    if (!country) {
      throw new Error(`User @${request.username} not found in any country data`);
    }

    console.log(`📍 Found @${request.username} in ${country}`);

    // Step 2: Get recent commits within the specified time period
    const commits = await this.getCommitsForTimeRange(request.days, request.maxCommits || 10);
    console.log(`📅 Analyzing ${commits.length} commits over ${request.days} days`);

    if (commits.length === 0) {
      throw new Error(`No commits found in the last ${request.days} days`);
    }

    // Step 3: Get user ranking snapshots for each commit
    const snapshots = await this.getUserRankingSnapshots(request.username, country, commits);

    // Step 4: Calculate progress summary
    const summary = this.calculateProgressSummary(request.username, country, request.days, snapshots);

    console.log(`✅ Analysis complete! User went ${summary.followersProgress.rankChange > 0 ? 'up' : 'down'} by ${Math.abs(summary.followersProgress.rankChange)} positions in followers ranking`);

    return summary;
  }

  /**
   * Find which country a user belongs to by searching through all country markdown files
   */
  private async findUserCountry(username: string): Promise<string | null> {
    const countries = ['afghanistan', 'albania', 'algeria', 'andorra', 'angola', 'argentina', 'armenia', 'australia', 'austria', 'azerbaijan', 'bahrain', 'bangladesh', 'belarus', 'belgium', 'benin', 'bhutan', 'bolivia', 'bosnia_and_herzegovina', 'botswana', 'brazil', 'bulgaria', 'burkina_faso', 'burundi', 'cambodia', 'cameroon', 'canada', 'chad', 'chile', 'china', 'colombia', 'congo', 'croatia', 'cuba', 'cyprus', 'czechia', 'denmark', 'dominican_republic', 'ecuador', 'egypt', 'el_salvador', 'estonia', 'ethiopia', 'finland', 'france', 'georgia', 'germany', 'ghana', 'greece', 'guatemala', 'honduras', 'hong_kong', 'hungary', 'iceland', 'india', 'indonesia', 'iran', 'iraq', 'ireland', 'israel', 'italy', 'jamaica', 'japan', 'jordan', 'kazakhstan', 'kenya', 'kuwait', 'laos', 'latvia', 'lebanon', 'lithuania', 'luxembourg', 'madagascar', 'malawi', 'malaysia', 'maldives', 'mali', 'malta', 'mauritania', 'mauritius', 'mexico', 'moldova', 'mongolia', 'montenegro', 'morocco', 'myanmar', 'namibia', 'nepal', 'netherlands', 'new_zealand', 'nicaragua', 'nigeria', 'norway', 'oman', 'pakistan', 'palestine', 'panama', 'paraguay', 'peru', 'philippines', 'poland', 'portugal', 'qatar', 'romania', 'russia', 'rwanda', 'san_marino', 'saudi_arabia', 'senegal', 'serbia', 'sierra_leone', 'singapore', 'slovakia', 'slovenia', 'south_africa', 'south_korea', 'spain', 'sri_lanka', 'sudan', 'sweden', 'switzerland', 'syria', 'taiwan', 'tanzania', 'thailand', 'tunisia', 'turkey', 'uganda', 'ukraine', 'united_arab_emirates', 'united_kingdom', 'united_states', 'uruguay', 'uzbekistan', 'venezuela', 'vietnam', 'yemen', 'zambia', 'zimbabwe'];

    for (const country of countries) {
      try {
        const followersFile = join(this.markdownPath, 'followers', `${country}.md`);
        const content = await readFile(followersFile, 'utf-8');

        // Look for the username in the markdown content
        const userRegex = new RegExp(`<a href="https://github\\.com/${username}"`, 'i');
        if (userRegex.test(content)) {
          return country;
        }
      } catch (error) {
        // File might not exist, continue to next country
        continue;
      }
    }

    return null;
  }

  /**
   * Get git commits within the specified time range
   */
  private async getCommitsForTimeRange(days: number, maxCommits: number): Promise<Array<{ hash: string, date: Date }>> {
    try {
      const log = await this.git.log({
        maxCount: maxCommits
      });

      const commits = log.all.map(commit => ({
        hash: commit.hash,
        date: new Date(commit.date)
      }));

      // Filter by days manually since git date filtering is tricky
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const filteredCommits = commits.filter(commit => commit.date >= sinceDate);

      return filteredCommits.length > 0 ? filteredCommits : commits.slice(0, Math.min(3, commits.length));
    } catch (error) {
      console.error('Error getting git commits:', error);
      throw error;
    }
  }

  /**
   * Get user ranking snapshots for each commit
   */
  private async getUserRankingSnapshots(
    username: string,
    country: string,
    commits: Array<{ hash: string, date: Date }>
  ): Promise<UserRankingSnapshot[]> {
    const snapshots: UserRankingSnapshot[] = [];

    // Stash any uncommitted changes
    try {
      await this.git.stash(['push', '-m', 'Auto-stash for user progress tracking']);
      console.log('💾 Stashed uncommitted changes');
    } catch (error) {
      // No changes to stash or already clean
    }

    // Get current branch
    const currentBranch = await this.git.branch();
    const originalBranch = currentBranch.current;

    for (const commit of commits) {
      try {
        console.log(`📸 Analyzing commit ${commit.hash.substring(0, 8)} from ${commit.date.toISOString()}`);

        // Checkout to this commit
        await this.git.checkout(commit.hash);

        // Get user rankings for all three categories
        const followersRank = await this.getUserRankInFile(username, country, 'followers');
        const publicContribRank = await this.getUserRankInFile(username, country, 'public_contributions');
        const totalContribRank = await this.getUserRankInFile(username, country, 'total_contributions');

        const snapshot: UserRankingSnapshot = {
          commitHash: commit.hash,
          commitDate: commit.date,
          country,
          followersRank: followersRank?.rank,
          followersCount: followersRank?.value,
          publicContributionsRank: publicContribRank?.rank,
          publicContributions: publicContribRank?.value,
          totalContributionsRank: totalContribRank?.rank,
          totalContributions: totalContribRank?.value,
        };

        snapshots.push(snapshot);
      } catch (error) {
        console.warn(`⚠️  Could not analyze commit ${commit.hash}: ${error}`);
      }
    }

    // Checkout back to original branch
    try {
      await this.git.checkout(originalBranch || 'main');
    } catch {
      try {
        await this.git.checkout('master');
      } catch {
        console.warn('Could not return to original branch');
      }
    }

    // Restore stashed changes
    try {
      await this.git.stash(['pop']);
      console.log('🔄 Restored stashed changes');
    } catch (error) {
      // No stash to pop or other issue
    }

    return snapshots;
  }

  /**
   * Get user's rank and value from a specific markdown file
   */
  private async getUserRankInFile(
    username: string,
    country: string,
    category: 'followers' | 'public_contributions' | 'total_contributions'
  ): Promise<{ rank: number, value: number } | null> {
    try {
      const filePath = join(this.markdownPath, category, `${country}.md`);
      const content = await readFile(filePath, 'utf-8');

      // Find the table section
      const tableStartRegex = /<table>\s*<tr>\s*<th>#<\/th>/;
      const tableStartMatch = content.match(tableStartRegex);

      if (!tableStartMatch) {
        return null;
      }

      const tableContent = content.substring(tableStartMatch.index!);
      const rows = tableContent.split('<tr>').slice(1); // Skip header row

      let rank = 1;
      for (const row of rows) {
        if (!row.includes('<td>')) continue;

        // Extract username from the row
        const usernameMatch = row.match(/<a href="https:\/\/github\.com\/([^"]+)"/);
        if (!usernameMatch) {
          rank++;
          continue;
        }

        const rowUsername = usernameMatch[1];
        if (rowUsername === username) {
          // Extract the value (followers, contributions, etc.)
          const tdElements = row.match(/<td[^>]*>([^<]+)<\/td>/g);
          if (tdElements && tdElements.length > 0) {
            // The last <td> usually contains the value we want
            const lastTd = tdElements[tdElements.length - 1];
            const valueMatch = lastTd.match(/>([0-9,]+)</);
            if (valueMatch) {
              const value = parseInt(valueMatch[1].replace(/,/g, ''));
              return { rank, value };
            }
          }
        }
        rank++;
      }

      return null;
    } catch (error) {
      console.warn(`Could not read ${category} file for ${country}: ${error}`);
      return null;
    }
  }

  /**
   * Calculate progress summary from snapshots
   */
  private calculateProgressSummary(
    username: string,
    country: string,
    days: number,
    snapshots: UserRankingSnapshot[]
  ): UserProgressSummary {
    const validSnapshots = snapshots.filter(s =>
      s.followersRank !== undefined ||
      s.publicContributionsRank !== undefined ||
      s.totalContributionsRank !== undefined
    );

    if (validSnapshots.length === 0) {
      throw new Error('No valid ranking data found in any commits');
    }

    // Sort by date (oldest first)
    validSnapshots.sort((a, b) => a.commitDate.getTime() - b.commitDate.getTime());

    const first = validSnapshots[0];
    const last = validSnapshots[validSnapshots.length - 1];

    return {
      username,
      country,
      daysAnalyzed: days,
      commitsAnalyzed: validSnapshots.length,
      followersProgress: {
        rankChange: this.calculateRankChange(first.followersRank, last.followersRank),
        startRank: first.followersRank,
        endRank: last.followersRank,
        countChange: this.calculateCountChange(first.followersCount, last.followersCount),
      },
      publicContributionsProgress: {
        rankChange: this.calculateRankChange(first.publicContributionsRank, last.publicContributionsRank),
        startRank: first.publicContributionsRank,
        endRank: last.publicContributionsRank,
        countChange: this.calculateCountChange(first.publicContributions, last.publicContributions),
      },
      totalContributionsProgress: {
        rankChange: this.calculateRankChange(first.totalContributionsRank, last.totalContributionsRank),
        startRank: first.totalContributionsRank,
        endRank: last.totalContributionsRank,
        countChange: this.calculateCountChange(first.totalContributions, last.totalContributions),
      },
      snapshots: validSnapshots,
    };
  }

  /**
   * Calculate rank change (positive = improvement, negative = decline)
   */
  private calculateRankChange(startRank?: number, endRank?: number): number {
    if (startRank === undefined || endRank === undefined) return 0;
    return startRank - endRank; // Lower rank number = better position
  }

  /**
   * Calculate count change
   */
  private calculateCountChange(startCount?: number, endCount?: number): number {
    if (startCount === undefined || endCount === undefined) return 0;
    return endCount - startCount;
  }
}
