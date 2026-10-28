import { apiRequest } from "./api";
export const applicationCredential = () =>
  sessionStorage.getItem("smartmess_application");
export const saveApplication = (credential) =>
  sessionStorage.setItem("smartmess_application", credential);
export const applicantRequest = (path, options = {}) =>
  apiRequest(path, {
    ...options,
    public: true,
    headers: {
      Authorization: `Bearer ${applicationCredential()}`,
      ...options.headers,
    },
  });
