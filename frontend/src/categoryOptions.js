// categoryOptions.js
// Fixed set of selectable tags per category. Keeping these as a controlled
// vocabulary (instead of free text) is what makes the Jaccard matching
// actually mean something - two people typing "ml" vs "machine learning"
// would never match otherwise.

const CATEGORY_OPTIONS = {
  "Study Partner": [
    "dsa",
    "competitive programming",
    "machine learning",
    "web development",
    "quiet study",
    "group study",
    "late-night study",
    "early-morning study",
    "exam-focused",
    "concept building",
  ],
  "Project Teammate": [
    "frontend",
    "backend",
    "machine learning",
    "ui/ux design",
    "fast-paced",
    "planner",
    "hackathons",
    "long-term projects",
    "leads the team",
    "prefers execution over planning",
  ],
  "Roommate": [
    "early riser",
    "night owl",
    "tidy",
    "relaxed about mess",
    "introvert",
    "extrovert",
    "non-smoker",
    "vegetarian",
    "enjoys music at home",
    "needs a quiet space to study",
  ],
  "Mentor": [
    "placement guidance",
    "research guidance",
    "higher studies abroad",
    "competitive programming",
    "open source",
    "career advice",
    "technical deep-dives",
    "soft skills / interviews",
  ],
};

export default CATEGORY_OPTIONS;
