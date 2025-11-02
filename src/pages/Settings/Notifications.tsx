import { useState, useEffect } from "preact/hooks";
import { api } from "../../api/client";
import { Session, User } from "../../api/api";
import {
  FaBell,
  FaBellSlash,
  FaDesktop,
  FaEnvelope,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { JSX } from "preact/jsx-runtime";

interface NotificationSubscription {
  id: string;
  eventType: string; // Changed from literal type to allow API flexibility
  methods: ("email" | "push")[];
  createdAt: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationsSettingsProps {}

interface NotificationEvent {
  key: string;
  displayName: string;
  description: string;
}

// Configuration for available notification events
const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    key: "chess_match_created",
    displayName: "Match Notices",
    description:
      "Receive notifications when chess matches are created or updated.",
  },
];

interface NotificationMethod {
  key: "email" | "push";
  displayName: string;
  icon: JSX.Element;
  supported: boolean;
}

// Global notification methods configuration
const NOTIFICATION_METHODS: NotificationMethod[] = [
  {
    key: "email",
    displayName: "Email",
    icon: <FaEnvelope />,
    supported: true, // Email is always supported
  },
  {
    key: "push",
    displayName: "Browser Push",
    icon: <FaDesktop />,
    supported: false, // Will be updated based on browser support
  },
];

export function NotificationsSettings(props: NotificationsSettingsProps) {
  // User data state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Core state management
  const [subscriptions, setSubscriptions] = useState<
    NotificationSubscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Push notification state
  const [registeringPush, setRegisteringPush] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // UI feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ⚠️ INVALID VAPID KEY - Push notifications will fail until you generate valid VAPID keys
  // Generate valid keys using: npm install -g web-push
  // then: web-push generate-vapid-keys
  // Place the generated public key here
  // For instructions, see: https://developer.mozilla.org/en-US/docs/Web/API/Push_API/VAPID_keys
  const VAPID_PUBLIC_KEY =
    "BP7lZ9EBTKuO9ArR-ymCZoCauu0VJYxCrn09weZ7fCPMVpTxvUHoUoG2TY_I2ELGx512TOc1AuP3uMAk2nMug1Y"; // Set to valid public key when available

  // Registration lock to prevent concurrent operations
  const [registrationLock, setRegistrationLock] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  // VAPID key validation
  const validateVapidKey = (key: string): boolean => {
    try {
      // VAPID keys should be URL-safe base64 encoded
      const decoded = urlBase64ToUint8Array(key);
      // Should be 65 bytes (public key length for p256)
      return decoded.length === 65;
    } catch {
      return false;
    }
  };

  // Error categorization types
  type NotificationErrorType =
    | "browser_not_supported"
    | "permission_denied"
    | "permission_not_granted"
    | "service_worker_failed"
    | "vapid_key_invalid"
    | "push_service_unavailable"
    | "network_error"
    | "unknown";

  interface NotificationError {
    type: NotificationErrorType;
    message: string;
    recoverable: boolean;
    userMessage: string;
    actionRequired: string;
  }

  // Categorize errors for better handling
  const categorizeError = (error: any, context: string): NotificationError => {
    const errorMessage = error?.message || error?.toString() || "Unknown error";

    // Service Worker errors
    if (context === "service_worker_registration") {
      if (errorMessage.includes("Script URL")) {
        return {
          type: "service_worker_failed",
          message: errorMessage,
          recoverable: true,
          userMessage:
            "Service worker registration failed. This is usually recoverable.",
          actionRequired:
            "Try refreshing the page or checking your browser console.",
        };
      }
      if (errorMessage.includes("permission")) {
        return {
          type: "permission_denied",
          message: errorMessage,
          recoverable: false,
          userMessage: "Service worker permission denied.",
          actionRequired: "Check your browser settings and try again.",
        };
      }
    }

    // Permission errors
    if (context === "permission_request" && errorMessage.includes("denied")) {
      return {
        type: "permission_denied",
        message: errorMessage,
        recoverable: false,
        userMessage: "Notification permission was denied.",
        actionRequired: "Enable notifications in your browser settings.",
      };
    }

    // VAPID key errors
    if (
      context === "push_subscription" &&
      errorMessage.includes("applicationServerKey")
    ) {
      return {
        type: "vapid_key_invalid",
        message: errorMessage,
        recoverable: true,
        userMessage: "Invalid VAPID key configuration.",
        actionRequired:
          "Contact administrator to fix the server configuration.",
      };
    }

    // Push service errors
    if (
      context === "push_subscription" &&
      (errorMessage.includes("service") || errorMessage.includes("unavailable"))
    ) {
      return {
        type: "push_service_unavailable",
        message: errorMessage,
        recoverable: true,
        userMessage: "Push notification service is temporarily unavailable.",
        actionRequired: "Try again later or check your internet connection.",
      };
    }

    // Network errors
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return {
        type: "network_error",
        message: errorMessage,
        recoverable: true,
        userMessage: "Network connection issue.",
        actionRequired: "Check your internet connection and try again.",
      };
    }

    // Default unknown error
    return {
      type: "unknown",
      message: errorMessage,
      recoverable: true,
      userMessage: "An unexpected error occurred.",
      actionRequired: "Try again or contact support if the issue persists.",
    };
  };

  /**
   * Load user data to check email verification status
   */
  const loadUserData = async () => {
    try {
      setUserLoading(true);
      const sessionResponse = await api.auth.apiGetSessionList();

      if (!sessionResponse.data) {
        throw new Error("No session data received");
      }

      setCurrentUser(sessionResponse.data.user);
    } catch (err: any) {
      console.error("Notifications user data load error:", err);
      // Don't set error here, let the main loading handle it
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    initializeNotifications();
  }, []);

  /**
   * Initialize notification system by checking browser support,
   * registering service worker, and loading existing subscriptions
   */
  const initializeNotifications = async () => {
    try {
      // Check browser support for push notifications
      const isBrowserSupported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      console.log("Browser support check:", {
        serviceWorker: "serviceWorker" in navigator,
        PushManager: "PushManager" in window,
        Notification: "Notification" in window,
        isBrowserSupported,
      });

      // Validate VAPID key
      const hasValidVapidKey =
        VAPID_PUBLIC_KEY &&
        VAPID_PUBLIC_KEY.length > 0 &&
        validateVapidKey(VAPID_PUBLIC_KEY);
      const isPushSupported = isBrowserSupported && hasValidVapidKey;

      setPushSupported(isPushSupported);

      // Update push method support (only enable if both browser supports AND valid VAPID key)
      NOTIFICATION_METHODS[1].supported = isPushSupported;

      if (isBrowserSupported) {
        // Check permission status safely
        try {
          setPushPermission(Notification.permission);
        } catch (permError) {
          console.warn(
            "Could not get notification permission status:",
            permError
          );
          setPushPermission("default");
        }

        // Only attempt SW registration if we have a valid VAPID key
        if (hasValidVapidKey) {
          try {
            console.log(
              "🔄 Init: Attempting initial service worker registration..."
            );
            await registerServiceWorker();
            console.log("✅ Init: Service worker registered successfully");
          } catch (swError) {
            console.error(
              "⚠️ Init: Initial service worker registration failed:",
              swError
            );
            console.log("🔄 Init: Attempting automatic retry in 2 seconds...");

            // Wait a bit and retry once automatically
            setTimeout(async () => {
              try {
                console.log("🔄 Init: Retrying service worker registration...");
                await registerServiceWorker();
                console.log("✅ Init: Service worker registered on retry!");
              } catch (retryError) {
                console.error(
                  "❌ Init: Retry also failed, user will need manual intervention:",
                  retryError
                );
                // At this point, user will need to click the manual retry button
                // The error is already set by registerServiceWorker
              }
            }, 2000);
          }
        }
      }

      // Load existing notification subscriptions
      await loadSubscriptions();
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      setError("Failed to initialize notification system");
    }
  };

  /**
   * Register service worker for push notifications
   * Checks for existing registrations, provides comprehensive logging,
   * and handles automatic retries
   */
  const registerServiceWorker = async (): Promise<void> => {
    // Prevent concurrent registrations
    if (registrationLock) {
      console.log("🟡 SW Registration: Already in progress, skipping");
      return;
    }

    console.log("🔵 SW Registration: Starting registration process...");

    // Check if push is supported (browser + VAPID) - we still try to register SW even if VAPID is invalid
    const hasValidVapidKey =
      VAPID_PUBLIC_KEY &&
      VAPID_PUBLIC_KEY.length > 0 &&
      validateVapidKey(VAPID_PUBLIC_KEY);
    const browserSupported = "serviceWorker" in navigator;
    const pushActuallySupported = browserSupported && hasValidVapidKey;

    if (!pushActuallySupported) {
      console.log(
        "🔴 SW Registration: Invalid/missing VAPID key or browser not supported",
        {
          hasVapidKey: !!VAPID_PUBLIC_KEY,
          vapidLength: VAPID_PUBLIC_KEY?.length || 0,
          vapidValid: hasValidVapidKey,
          browserSupported,
        }
      );
      // Don't return here - we can still register SW, just can't do push
    }

    setRegistrationLock(true);

    try {
      // First check if service worker is already registered
      console.log("🔍 SW Registration: Checking existing registrations...");
      const existingRegistrations =
        await navigator.serviceWorker.getRegistrations();
      const siteRegistration = existingRegistrations.find((reg) => {
        // Check if this registration handles our site
        const regScope = new URL(reg.scope);
        const currentOrigin = new URL(window.location.origin);
        return regScope.origin === currentOrigin.origin;
      });

      if (siteRegistration) {
        console.log(
          "🟢 SW Registration: Found existing registration:",
          siteRegistration
        );

        // Check if it's active and has push manager
        if (siteRegistration.active && siteRegistration.pushManager) {
          console.log(
            "🟢 SW Registration: Existing registration is active with push manager"
          );
          setServiceWorkerRegistered(true);
          setRegistrationLock(false);
          return;
        } else if (siteRegistration.active) {
          console.log(
            "🟡 SW Registration: Existing registration active but no push manager, re-registering"
          );
          // Service worker active but no push manager - unregister and re-register
          await siteRegistration.unregister();
          console.log(
            "✅ SW Registration: Unregistered inactive/old service worker"
          );
        } else {
          console.log(
            "🟡 SW Registration: Existing registration not active, cleaning up"
          );
          await siteRegistration.unregister();
        }
      } else {
        console.log(
          "🔍 SW Registration: No existing registration found for this site"
        );
      }

      // Attempt to register the service worker
      console.log("🚀 SW Registration: Registering /sw.js...");
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ SW Registration: Registration successful:", {
        scope: registration.scope,
        state: registration.active?.state || "installing",
        url: registration.active?.scriptURL || "pending",
      });

      // Wait for the service worker to be ready with timeout
      console.log(
        "⏳ SW Registration: Waiting for service worker ready state..."
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Service worker ready timeout (10s)")),
          10000
        )
      );

      await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
      console.log("✅ SW Registration: Service worker is ready");

      // Refresh reference to ensure we have the latest registration
      const finalRegistration = await navigator.serviceWorker.ready;

      // Verify push manager is available
      if (finalRegistration.pushManager) {
        console.log("✅ SW Registration: Push manager available");
        setServiceWorkerRegistered(true);

        // Log successful registration details
        console.log("🎉 SW Registration: Complete success!", {
          scope: finalRegistration.scope,
          hasPushManager: !!finalRegistration.pushManager,
          workerState: finalRegistration.active?.state,
        });
      } else {
        throw new Error("Push manager not available on final registration");
      }
    } catch (err) {
      console.error("❌ SW Registration: Failed:", err);
      const errorDetails = {
        message: err?.message || "Unknown error",
        name: err?.name || "Error",
        stack: err?.stack?.split("\n")[0] || "No stack trace",
      };
      console.error("❌ SW Registration: Error details:", errorDetails);

      setServiceWorkerRegistered(false);

      // Categorize the error for better user feedback
      const categorizedError = categorizeError(
        err,
        "service_worker_registration"
      );

      // For recoverable errors, show helpful message with automatic retry suggestion
      if (categorizedError.recoverable) {
        console.log(
          "🔄 SW Registration: Error is recoverable, suggesting manual retry"
        );
        setError(
          `Service worker registration failed: ${categorizedError.userMessage}. ${categorizedError.actionRequired}`
        );
      } else {
        console.log("🛑 SW Registration: Error is permanent");
        setError(
          `Service worker registration failed permanently: ${categorizedError.userMessage}`
        );
      }

      throw err;
    } finally {
      setRegistrationLock(false);
      console.log("🔒 SW Registration: Process complete, lock released");
    }
  };

  /**
   * Load user's current notification subscriptions from API
   */
  const loadSubscriptions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.notifications.getNotificationsSubscriptions();
      setSubscriptions(response.data || []);
    } catch (err: any) {
      console.error("Load subscriptions error:", err);

      if (err?.error?.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to load notification settings. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request permission for browser push notifications
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!pushSupported) return false;

    try {
      setError(null);
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        setSuccess("Push notification permission granted!");
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } else {
        setError(
          "Push notification permission denied. You can change this in your browser settings."
        );
        return false;
      }
    } catch (err) {
      console.error("Permission request failed:", err);
      setError("Failed to request permission for notifications");
      return false;
    }
  };

  /**
   * Register push subscription with the server
   * Handles existing subscriptions to prevent duplicates and infinite loading
   */
  const registerOrUpdatePushSubscription = async (): Promise<void> => {
    if (!pushSupported || !serviceWorkerRegistered) {
      throw new Error("Push notifications not supported");
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription exists, create one
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY
          ) as BufferSource,
        });
      }

      // Validate subscription keys
      const p256dhKey = subscription.getKey("p256dh");
      const authKey = subscription.getKey("auth");

      if (!p256dhKey || !authKey) {
        throw new Error("Failed to get subscription keys");
      }

      // Prepare subscription data for API
      const pushData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
        },
      };

      await api.notifications.postNotificationsRegisterPush({
        pushSubscription: pushData,
      });

      setSuccess("Push notifications registered successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Push registration error:", err);
      throw new Error(
        err?.error?.message ||
          err?.message ||
          "Failed to register for push notifications"
      );
    }
  };

  /**
   * Toggle notification subscription for a specific event and method
   * Handles both email and push methods independently, allowing both to be enabled simultaneously
   */
  const toggleSubscription = async (
    eventType: string,
    method: "email" | "push"
  ): Promise<void> => {
    try {
      const actionKey = `${eventType}-${method}`;
      setUpdating(actionKey);
      setError(null);
      setSuccess(null);

      const existingSubscription = subscriptions.find(
        (sub) => sub.eventType === eventType
      );

      // Determine if the specific method is currently subscribed
      const methodSubscribed =
        existingSubscription?.methods.includes(method) ?? false;

      if (methodSubscribed) {
        // Remove only this specific method from the subscription
        // If this was the only method, unsubscribe entirely from the event
        if (existingSubscription.methods.length === 1) {
          // Only one method remains, unsubscribe from the event entirely
          await api.notifications.postNotificationsUnsubscribe({
            eventType: eventType as "chess_match_created",
          });
        } else {
          // Multiple methods exist, update subscription to remove only this method
          const remainingMethods = existingSubscription.methods.filter(
            (m) => m !== method
          );
          await api.notifications.postNotificationsSubscribe({
            eventType: eventType as "chess_match_created",
            methods: remainingMethods,
          });
        }

        setSuccess(
          `${
            method === "email" ? "Email" : "Push"
          } notifications disabled for ${eventType.replace("_", " ")}`
        );
      } else {
        // Add this method to the existing subscription (or create new if none exists)
        if (existingSubscription) {
          // Add the new method to existing methods
          const updatedMethods = [...existingSubscription.methods, method];
          await api.notifications.postNotificationsSubscribe({
            eventType: eventType as "chess_match_created",
            methods: updatedMethods,
          });
        } else {
          // No existing subscription for this event, create new one
          await handleNewSubscription(eventType, method);
        }

        setSuccess(
          `${
            method === "email" ? "Email" : "Push"
          } notifications enabled for ${eventType.replace("_", " ")}`
        );
      }

      setTimeout(() => setSuccess(null), 3000);
      await loadSubscriptions();
    } catch (err: any) {
      console.error("Toggle subscription error:", err);
      setError(
        "Failed to update notification settings, MAKE SURE YOU'VE VERIFIED YOUR EMAIL"
      );
    } finally {
      setUpdating(null);
    }
  };

  /**
   * Handle new subscription setup, including push-specific logic
   */
  const handleNewSubscription = async (
    eventType: string,
    method: "email" | "push"
  ): Promise<void> => {
    if (method === "push") {
      // Handle push notification setup
      if (pushPermission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error("Push permission denied");
        }
      }

      // Register push subscription (handles existing subscriptions properly)
      await registerOrUpdatePushSubscription();
    }

    // Subscribe to the notification event
    await api.notifications.postNotificationsSubscribe({
      eventType: eventType as "chess_match_created",
      methods: [method],
    });
  };

  /**
   * Convert URL-safe base64 to Uint8Array for VAPID key
   */
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /**
   * Convert ArrayBuffer to base64 string
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  /**
   * Check if user is subscribed to a specific event and method
   */
  const isSubscribed = (
    eventType: string,
    method: "email" | "push"
  ): boolean => {
    return subscriptions.some(
      (sub) => sub.eventType === eventType && sub.methods.includes(method)
    );
  };

  /**
   * Get the display name for a notification method
   */
  const getMethodDisplayName = (method: "email" | "push"): string => {
    return (
      NOTIFICATION_METHODS.find((m) => m.key === method)?.displayName || method
    );
  };

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Email Verification Banner */}
        {currentUser && !currentUser.emailVerified && (
          <div className="alert alert-warning mb-6">
            <FaExclamationTriangle />
            <div>
              <h3 className="font-bold">Email Not Verified</h3>
              <div className="text-sm mt-1">
                Your email address is not verified. Email notifications may not
                be delivered reliably. Please verify your email to ensure you
                receive all notifications.
                <a
                  href={`/email-verification?email=${encodeURIComponent(
                    currentUser.email
                  )}`}
                  className="btn btn-sm btn-info ml-2"
                >
                  Verify Email
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a href="/settings" className="btn btn-ghost btn-sm">
            ← Back to Settings
          </a>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FaBell />
            Notification Settings
          </h1>
        </div>

        {/* Push Notification Status */}
        {pushSupported && (
          <div className="alert alert-info mb-6">
            <FaInfoCircle />
            <div>
              <h3 className="font-bold">Push Notification Status</h3>
              <div className="text-sm mt-1 space-y-1">
                <div>
                  <strong>Browser Support:</strong>{" "}
                  <span className="text-green-700 font-semibold">
                    Supported
                  </span>
                </div>
                <div>
                  <strong>Permission:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      pushPermission === "granted"
                        ? "text-green-700"
                        : pushPermission === "denied"
                        ? "text-error"
                        : "text-warning"
                    }`}
                  >
                    {pushPermission === "granted"
                      ? "Granted"
                      : pushPermission === "denied"
                      ? "Blocked"
                      : "Not Requested"}
                  </span>
                </div>
                <div>
                  <strong>Service Worker:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      serviceWorkerRegistered ? "text-green-700" : "text-error"
                    }`}
                  >
                    {serviceWorkerRegistered ? "Registered" : "Failed"}
                  </span>
                  {!serviceWorkerRegistered && (
                    <button
                      className="btn btn-xs btn-primary ml-2"
                      onClick={async () => {
                        try {
                          setError(null);
                          await registerServiceWorker();
                          setSuccess("Service Worker registered successfully!");
                          setTimeout(() => setSuccess(null), 3000);
                        } catch (err) {
                          setError(
                            "Failed to register service worker. Check the browser console for details."
                          );
                        }
                      }}
                    >
                      Retry Registration
                    </button>
                  )}
                </div>
                {pushPermission === "denied" && (
                  <div className="mt-2 text-xs">
                    <FaExclamationTriangle className="inline mr-1" />
                    Browser notifications are blocked. You can enable them in
                    your browser settings to receive push notifications.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VAPID Key Warning - Most Important */}
        {VAPID_PUBLIC_KEY === null && (
          <div className="alert alert-error mb-6">
            <FaExclamationTriangle />
            <div>
              <h3 className="font-bold">Push Notifications Unavailable</h3>
              <div className="text-sm mt-1 space-y-2">
                <p>
                  <strong>⚠️ VAPID Key Missing:</strong> Push notifications are
                  disabled because no valid VAPID public key is configured.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Browser Support Warnings */}
        {VAPID_PUBLIC_KEY !== null && !pushSupported && (
          <div className="alert alert-warning mb-6">
            <FaExclamationTriangle />
            <div>
              <h3 className="font-bold">Browser Not Supported</h3>
              <div className="text-sm">
                Your browser doesn't support push notifications. Browser push
                notifications will not be available. Email notifications are
                still supported.
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings Table */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              Notification Preferences
            </h2>
            <p className="text-sm opacity-70 mb-6">
              Configure how you want to be notified about different events on
              the platform.
            </p>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Description</th>
                    {NOTIFICATION_METHODS.map((method) => (
                      <th key={method.key} className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {method.icon}
                          {method.displayName}
                          {!method.supported && (
                            <span className="text-xs text-error">
                              (Not supported)
                            </span>
                          )}
                          {method.key === "push" &&
                            pushPermission === "denied" && (
                              <span className="text-xs text-error">
                                (Blocked)
                              </span>
                            )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_EVENTS.map((event) => (
                    <tr key={event.key}>
                      <td className="font-semibold">{event.displayName}</td>
                      <td className="text-sm opacity-80 max-w-xs">
                        {event.description}
                      </td>

                      {NOTIFICATION_METHODS.map((method) => {
                        const actionKey = `${event.key}-${method.key}`;
                        const subscribed = isSubscribed(event.key, method.key);
                        const isUpdating = updating === actionKey;

                        return (
                          <td key={method.key} className="text-center">
                            <button
                              className={`btn btn-sm ${
                                subscribed
                                  ? "btn-success"
                                  : "btn-outline btn-neutral"
                              } ${
                                isUpdating || registeringPush ? "loading" : ""
                              }`}
                              onClick={() =>
                                toggleSubscription(event.key, method.key)
                              }
                              disabled={
                                isUpdating ||
                                !method.supported ||
                                (method.key === "push" &&
                                  pushPermission === "denied") ||
                                registeringPush
                              }
                            >
                              {!isUpdating && !registeringPush && (
                                <>
                                  {subscribed ? (
                                    <>
                                      <FaBellSlash className="mr-1" />
                                      On
                                    </>
                                  ) : (
                                    <>
                                      <FaBell className="mr-1" />
                                      Off
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Subscriptions Summary */}
        {subscriptions.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-xl">Active Notifications</h2>
              <p className="text-sm opacity-70 mb-4">
                Overview of your current notification subscriptions.
              </p>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Methods</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="font-semibold">
                          {subscription.eventType
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {subscription.methods.map((method) => (
                              <div
                                key={method}
                                className="flex items-center gap-2 badge badge-outline"
                              >
                                {
                                  NOTIFICATION_METHODS.find(
                                    (m) => m.key === method
                                  )?.icon
                                }
                                {getMethodDisplayName(method)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="text-sm opacity-80">
                          {new Date(
                            subscription.createdAt
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="alert alert-info">
            <FaInfoCircle />
            <div>
              <h3 className="font-bold">Browser Notifications</h3>
              <div className="text-sm mt-1">
                Push notifications require permission and a modern browser.
                You'll be prompted to allow notifications when enabling them.
              </div>
            </div>
          </div>

          <div className="alert alert-info">
            <FaEnvelope />
            <div>
              <h3 className="font-bold">Email Notifications</h3>
              <div className="text-sm mt-1">
                Email notifications are sent to your registered email address.
                Make sure your email is verified for reliable delivery.
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="alert alert-error mt-6">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mt-6">
            <FaBell />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}
