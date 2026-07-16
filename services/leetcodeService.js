const normalizeUsername = (input) => {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /leetcode\.com\/(?:(?:profile|u)\/)?([^\/\?\#]+)/i,
  );
  const username = urlMatch ? urlMatch[1] : trimmed;
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
    return null;
  }
  return username;
};

const buildProfileUrl = (username) => `https://leetcode.com/${username}/`;

const fetchJson = async (url, payload) => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Referer: "https://leetcode.com/",
  };
  let res;
  try {
    res = await fetch(url, {
      method: payload ? "POST" : "GET",
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  } catch (error) {
    const requestError = new Error(
      `LeetCode GraphQL request failed: ${error.message}`,
    );
    requestError.status = 502;
    throw requestError;
  }
  if (!res.ok) {
    const error = new Error(
      `LeetCode GraphQL request failed: ${res.status} ${res.statusText}`,
    );
    error.status = 502;
    throw error;
  }
  try {
    return await res.json();
  } catch (error) {
    const parseError = new Error(
      `LeetCode GraphQL response could not be parsed: ${error.message}`,
    );
    parseError.status = 502;
    throw parseError;
  }
};

const buildQueryPayload = (username) => ({
  query: `query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      userAvatar
      ranking
      realName
      reputation
      countryName
      aboutMe
    }
    submissionCalendar
    languageProblemCount {
      languageName
      problemsSolved
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    badges {
      id
      displayName
      icon
      creationDate
    }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
  }
  userContestRankingHistory(username: $username) {
    contest { title startTime }
    rating
    ranking
    problemsSolved
    totalProblems
    finishTimeInSeconds
  }
  recentSubmissionList(username: $username, limit: 20) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
    memory
    runtime
  }
}
`,
  variables: { username },
});

const buildProfileFromResponse = (resp, username) => {
  if (Array.isArray(resp?.errors) && resp.errors.length) {
    const error = new Error(
      `LeetCode GraphQL error: ${resp.errors
        .map((item) => item.message)
        .filter(Boolean)
        .join("; ")}`,
    );
    error.status = 502;
    throw error;
  }

  const matchedUser = resp?.data?.matchedUser;
  if (!matchedUser) {
    const error = new Error("LeetCode profile not found");
    error.status = 404;
    throw error;
  }

  const stats = matchedUser.submitStats?.acSubmissionNum || [];
  const totalStats = matchedUser.submitStats?.totalSubmissionNum || [];
  
  const easy = stats.find((item) => item.difficulty === "Easy")?.count || 0;
  const medium = stats.find((item) => item.difficulty === "Medium")?.count || 0;
  const hard = stats.find((item) => item.difficulty === "Hard")?.count || 0;
  const total = easy + medium + hard;
  
  const totalAllSubmissions = totalStats.reduce((sum, item) => sum + (item.submissions || 0), 0);
  const totalAcSubmissions = stats.reduce((sum, item) => sum + (item.submissions || 0), 0);
  const acceptanceRate = totalAllSubmissions > 0 ? Number(((totalAcSubmissions / totalAllSubmissions) * 100).toFixed(2)) : 0;

  const contestData = resp?.data?.userContestRankingHistory || [];
  
  const topicCounts = new Map();
  if (matchedUser.tagProblemCounts) {
    ["advanced", "intermediate", "fundamental"].forEach((level) => {
      const tags = matchedUser.tagProblemCounts[level] || [];
      tags.forEach((t) => {
        if (!t.tagName) return;
        const solved = Number(t.problemsSolved) || 0;
        topicCounts.set(
          t.tagName,
          (topicCounts.get(t.tagName) || 0) + solved,
        );
      });
    });
  }
  const knownTopics = [...topicCounts.entries()]
    .map(([topic, solved]) => ({ topic, solved }))
    .sort((a, b) => b.solved - a.solved || a.topic.localeCompare(b.topic));
  const skills = knownTopics.map((item) => item.topic);

  let currentStreak = 0;
  let submissionCalendar = {};
  try {
     submissionCalendar = JSON.parse(matchedUser.submissionCalendar || "{}");
     const timestamps = Object.keys(submissionCalendar).map(Number).sort((a,b) => b - a);
     if (timestamps.length > 0) {
        let now = Math.floor(Date.now() / 1000);
        let daysSet = new Set(timestamps.map(t => Math.floor(t / 86400)));
        let todayDay = Math.floor(now / 86400);
        
        let checkDay = todayDay;
        if (!daysSet.has(checkDay)) {
           checkDay = todayDay - 1;
        }
        if (daysSet.has(checkDay)) {
           while (daysSet.has(checkDay)) {
             currentStreak++;
             checkDay--;
           }
        }
     }
  } catch(e) {}

  const programmingLanguages = Array.isArray(matchedUser.languageProblemCount) ? 
    matchedUser.languageProblemCount.map(lang => ({
      name: lang.languageName,
      solved: lang.problemsSolved
    })) : [];

  const bestRating = Array.isArray(contestData) && contestData.length > 0 
    ? Math.max(...contestData.map(c => c.rating || 0)) 
    : (Number(resp?.data?.userContestRanking?.rating) || 0);

  // recentProblems — deduplicated list of ACCEPTED distinct problems from recentSubmissionList
  const rawRecentSubmissions = resp?.data?.recentSubmissionList || [];
  const recentProblems = rawRecentSubmissions
    .filter(s => s.statusDisplay === 'Accepted')
    .reduce((acc, s) => {
      if (!acc.find(p => p.titleSlug === s.titleSlug)) {
        acc.push({
          title: s.title,
          titleSlug: s.titleSlug,
          lang: s.lang,
          timestamp: s.timestamp,
        });
      }
      return acc;
    }, []);

  // ── [LC-AUDIT] Structured log — printed on every sync/connect ──
  console.log('[LC-AUDIT] GraphQL parsed values:', JSON.stringify({
    username: matchedUser.username,
    acceptedSubmissions: totalAcSubmissions,
    totalSubmissions: totalAllSubmissions,
    acceptanceRate,
    currentStreak,
    totalContests: Array.isArray(contestData) ? contestData.length : 0,
    bestRating,
    programmingLanguagesCount: programmingLanguages.length,
    knownTopicsCount: knownTopics.length,
    skillsCount: skills.length,
    recentSubmissionsCount: rawRecentSubmissions.length,
    recentProblemsCount: recentProblems.length,
    lastSynced: new Date().toISOString(),
  }, null, 2));

  return {
    username: matchedUser.username,
    displayName: matchedUser.profile?.realName || "",
    profileUrl: buildProfileUrl(username),
    about: matchedUser.profile?.aboutMe || "",
    countryName: matchedUser.profile?.countryName || "",
    ranking: Number(matchedUser.profile?.ranking) || 0,
    reputation: Number(matchedUser.profile?.reputation) || 0,
    totalSolved: total,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    acceptanceRate,
    successPercentage: acceptanceRate,
    totalSubmissions: totalAllSubmissions,
    acceptedSubmissions: totalAcSubmissions,
    currentStreak,
    submissionCalendar,
    programmingLanguages,
    knownTopics,
    recentSubmissions: rawRecentSubmissions,
    recentProblems,
    contestRating: Number(resp?.data?.userContestRanking?.rating) || 0,
    bestRating,
    globalRank: Number(resp?.data?.userContestRanking?.globalRanking) || 0,
    totalContests: Array.isArray(contestData) ? contestData.length : 0,
    badges: Array.isArray(matchedUser.badges) ? matchedUser.badges.map(b => ({
      name: b.displayName,
      icon: b.icon,
      earnedDate: b.creationDate
    })) : [],
    skills,
    contestHistory: Array.isArray(contestData)
      ? contestData.map((item) => ({
          contestName: item.contest?.title || "Unknown Contest",
          rating: item.rating,
          ranking: item.ranking,
          problemsSolved: item.problemsSolved,
          totalProblems: item.totalProblems,
          finishTimeInSeconds: item.finishTimeInSeconds,
          eventTime: item.contest?.startTime || 0,
        }))
      : [],
    avatar: matchedUser.profile?.userAvatar || "",
  };
};

const fetchLeetCodeProfile = async (username) => {
  const payload = buildQueryPayload(username);
  const response = await fetchJson("https://leetcode.com/graphql", payload);
  return buildProfileFromResponse(response, username);
};

module.exports = {
  normalizeUsername,
  buildProfileUrl,
  fetchLeetCodeProfile,
};
