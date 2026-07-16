const normalizeUsername = (input) => {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /hackerrank\.com\/(?:profile\/)?([^\/\?\#]+)/i,
  );
  const username = urlMatch ? urlMatch[1] : trimmed;
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
    return null;
  }
  return username;
};

const buildProfileUrl = (username) => `https://www.hackerrank.com/${username}`;

const fetchJson = async (url) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (compatible; AI-Recruitment-Platform/1.0)",
      Referer: "https://www.hackerrank.com/",
    },
  });
  if (!res.ok) {
    throw new Error(
      `HackerRank request failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
};

const fetchHackerRankProfile = async (username) => {
  const profileUrl = buildProfileUrl(username);
  const res = await fetch(profileUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("HackerRank profile not found");
    }
    throw new Error(`HackerRank request failed: ${res.status}`);
  }

  return {
    username,
    profileUrl,
    verified: true,
  };
};

module.exports = {
  normalizeUsername,
  buildProfileUrl,
  fetchHackerRankProfile,
};
