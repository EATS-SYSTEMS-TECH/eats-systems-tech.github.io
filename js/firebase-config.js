// Firebase Web app configuration for the same Firebase project as WiFiGate.
// Populate these public Web SDK values from Firebase Console > Project settings > Your apps.
const productionConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: ""
};

export const isLocalStaging = typeof location !== "undefined"
  && ["127.0.0.1", "localhost"].includes(location.hostname)
  && location.port === "8100";

export const firebaseConfig = isLocalStaging ? {
  apiKey: "fake-api-key",
  authDomain: "demo-wifigate-host.firebaseapp.com",
  projectId: "demo-wifigate-host",
  appId: "1:123456789:web:staging"
} : productionConfig;
