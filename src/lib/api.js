const configured = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);
export const API_BASE_URL = configured.endsWith("/api")
  ? configured
  : `${configured}/api`;

const SESSION_KEYS = ["mess_api_token", "mess_api_role", "mess_api_user"];
export function getToken() {
  return sessionStorage.getItem("mess_api_token");
}
function assertCurrentSession(token, isPublic) {
  if (!isPublic && token !== getToken()) {
    throw Object.assign(
      new Error("The account changed while this request was running."),
      {
        name: "AbortError",
        code: "SESSION_CHANGED",
      },
    );
  }
}

export async function apiRequest(path, options = {}) {
  const { raw = false, public: isPublic = false, ...fetchOptions } = options;
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(!isPublic && token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(
      new Error(
        "Cannot reach the server. Check your connection and try again.",
      ),
      { code: "NETWORK_ERROR" },
    );
  }
  assertCurrentSession(token, isPublic);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    assertCurrentSession(token, isPublic);
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((x) => `${x.loc.at(-1)}: ${x.msg}`).join(" · ")
          : detail?.message || "The request could not be completed.";
    if (response.status === 401 && token && !isPublic)
      window.dispatchEvent(
        new CustomEvent("smartmess:unauthorized", { detail: { token } }),
      );
    throw Object.assign(new Error(message), {
      status: response.status,
      code: detail?.code,
      data: detail,
    });
  }
  const result = raw
    ? await response.blob()
    : response.status === 204
      ? null
      : await response.json();
  assertCurrentSession(token, isPublic);
  return result;
}

export function saveSession({ token, role, user }) {
  sessionStorage.setItem("mess_api_token", token);
  sessionStorage.setItem("mess_api_role", role);
  sessionStorage.setItem("mess_api_user", JSON.stringify(user));
  // Remove the old shared session so logging into another tab cannot replace it.
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}
export function clearSession() {
  SESSION_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}
export function loadSession() {
  try {
    // One-time migration preserves a valid pre-upgrade login in this tab.
    if (!getToken() && localStorage.getItem("mess_api_token")) {
      const legacyUser = JSON.parse(
        localStorage.getItem("mess_api_user") || "null",
      );
      if (legacyUser)
        saveSession({
          token: localStorage.getItem("mess_api_token"),
          role: legacyUser.role,
          user: legacyUser,
        });
    }
    const token = getToken();
    const user = JSON.parse(sessionStorage.getItem("mess_api_user") || "null");
    return token && user ? { token, user, role: user.role } : null;
  } catch {
    clearSession();
    return null;
  }
}
export function queryString(values) {
  return new URLSearchParams(
    Object.entries(values).filter(([, value]) => value !== "" && value != null),
  ).toString();
}
export async function download(path, filename) {
  const blob = await apiRequest(path, { raw: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
