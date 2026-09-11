// api.js
// Small wrapper around fetch so we don't repeat ourselves in every page.
// Backend is expected to be running on localhost:5000 (see backend/app.py).

const BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "something went wrong");
  }

  return data;
}

export const registerUser = (name, email, password) =>
  request("/register", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const loginUser = (email, password) =>
  request("/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getProfile = (userId) => request(`/profile/${userId}`);

export const updateProfile = (userId, bio, interests, personality_tags) =>
  request(`/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ bio, interests, personality_tags }),
  });

export const getCategories = () => request("/categories");

export const submitQuestionnaire = (userId, category, tags) =>
  request("/questionnaire", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, category, tags }),
  });

export const getMatches = (userId, category) =>
  request(`/matches/${userId}/${encodeURIComponent(category)}`);

export const sendMessage = (senderId, receiverId, body) =>
  request("/messages", {
    method: "POST",
    body: JSON.stringify({ sender_id: senderId, receiver_id: receiverId, body }),
  });

export const getConversation = (userId, otherId) =>
  request(`/messages/${userId}/${otherId}`);
