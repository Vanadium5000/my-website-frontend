import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import { useLocation } from "preact-iso";
import {
  FaGoogle,
  FaTwitter,
  FaGithub,
  FaDiscord,
  FaFacebook,
  FaLink,
} from "react-icons/fa";

interface ConnectedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  scopes: string[];
}

interface ConnectedAccountsProps {}

export function ConnectedAccountsSettings(props: ConnectedAccountsProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { route } = useLocation();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountsResponse = await api.auth.apiListAccountsList();
      setAccounts(accountsResponse.data || []);
    } catch (err: any) {
      console.error("Connected accounts load error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to load accounts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkAccount = async (providerId: string, accountId: string) => {
    try {
      setUnlinking(providerId);
      setError(null);

      await api.auth.apiUnlinkAccountCreate({
        providerId,
        accountId,
      });

      setSuccess(`Successfully unlinked ${getProviderDisplayName(providerId)}`);
      await loadAccounts();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Unlink account error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to unlink account"
      );
    } finally {
      setUnlinking(null);
    }
  };

  const handleLinkAccount = async (provider: string) => {
    try {
      setLinking(provider);
      setError(null);

      const linkData = (
        await api.auth.apiLinkSocialCreate({
          provider,
          callbackURL: `${window.location.origin}/settings/accounts`,
        })
      ).data;

      // Redirect to the oauth2 login
      window.location.href = linkData.url;

      // The API should handle the redirect automatically,
      // so if we get here without a redirect, it succeeded
      // setSuccess(`Successfully linked ${getProviderDisplayName(provider)}`);
      await loadAccounts();
    } catch (err: any) {
      console.error("Link account error:", err);
      setError(err?.error?.message || err?.message || "Failed to link account");
    } finally {
      setLinking(null);
    }
  };

  const getProviderDisplayName = (providerId: string) => {
    const names: { [key: string]: string } = {
      google: "Google",
      twitter: "Twitter",
      github: "GitHub",
      discord: "Discord",
      facebook: "Facebook",
    };
    return names[providerId] || providerId;
  };

  const getProviderIcon = (providerId: string) => {
    const icons: { [key: string]: any } = {
      google: <FaGoogle />,
      twitter: <FaTwitter />,
      github: <FaGithub />,
      discord: <FaDiscord />,
      facebook: <FaFacebook />,
    };
    return icons[providerId] || <FaLink />;
  };

  const isAccountLinked = (provider: string) => {
    return accounts.some((account) => account.providerId === provider);
  };

  const availableProviders = ["google", "twitter", "github", "discord"];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold">Connected Accounts</h1>
          </div>

          {/* Linked Accounts */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Linked Accounts</h2>

              {accounts.length === 0 ? (
                <p className="text-gray-500">
                  No accounts linked yet. Connect your social accounts below.
                </p>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-base-300 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-10">
                            <span className="text-lg">
                              {getProviderIcon(account.providerId)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {getProviderDisplayName(account.providerId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Connected on{" "}
                            {new Date(account.createdAt).toLocaleDateString()}
                          </div>
                          {account.scopes && account.scopes.length > 0 && (
                            <div className="text-xs text-gray-400">
                              Scopes: {account.scopes.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className={`btn btn-sm btn-outline btn-error ${
                          unlinking === account.providerId ? "loading" : ""
                        }`}
                        onClick={() =>
                          handleUnlinkAccount(
                            account.providerId,
                            account.accountId
                          )
                        }
                        disabled={unlinking !== null}
                      >
                        {unlinking === account.providerId
                          ? "Unlinking..."
                          : "Unlink"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Providers to Link */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Connect New Account</h2>
              <p className="text-sm text-gray-600 mb-6">
                Connect your social accounts to easily sign in and link your
                profiles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProviders.map((provider) => {
                  const isLinked = isAccountLinked(provider);
                  return (
                    <div
                      key={provider}
                      className={`flex items-center justify-between p-4 border border-base-300 rounded-lg ${
                        isLinked ? "bg-base-200" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-10">
                            <span className="text-lg">
                              {getProviderIcon(provider)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {getProviderDisplayName(provider)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isLinked
                              ? "Already connected"
                              : "Available to connect"}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`btn btn-sm ${
                          isLinked ? "btn-disabled" : "btn-primary"
                        } ${linking === provider ? "loading" : ""}`}
                        onClick={() => handleLinkAccount(provider)}
                        disabled={isLinked || linking !== null}
                      >
                        {isLinked
                          ? "Connected"
                          : linking === provider
                          ? "Connecting..."
                          : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mt-6">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mt-6">
              <span>{success}</span>
            </div>
          )}

          <div className="alert alert-info mt-6">
            <div>
              <h3 className="font-bold">About Connected Accounts</h3>
              <div className="text-sm mt-2">
                <p className="mb-2">
                  Connecting social accounts allows you to:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sign in more easily using your social credentials</li>
                  <li>Link your profiles across different platforms</li>
                  <li>Import profile information and avatars</li>
                  <li>Maintain a unified account across services</li>
                </ul>
                <p className="mt-2 text-yellow-600">
                  <strong>Note:</strong> Unlinking an account will remove the
                  connection but won't delete your account. Make sure you have
                  other ways to sign in before unlinking your last connected
                  account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
