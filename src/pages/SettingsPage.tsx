import { useState } from "react";
import { ImagePlus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import { updateRestaurantLogo } from "../api/restaurants";

export default function SettingsPage() {
  const { restaurantId } = useAuth();

  const [logoUrl,     setLogoUrl]     = useState("");
  const [logoSaving,  setLogoSaving]  = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [logoError,   setLogoError]   = useState<string | null>(null);

  async function handleLogoUpdate() {
    if (!logoUrl.trim())  { setLogoError("Please enter a valid image URL."); return; }
    if (!restaurantId)    { setLogoError("Not logged in — try logging out and back in."); return; }
    setLogoError(null);
    setLogoSaving(true);
    try {
      await updateRestaurantLogo(restaurantId, logoUrl.trim());
      setLogoSuccess(true);
      setLogoUrl("");
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Logo update failed.");
    } finally {
      setLogoSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slyce-dark">Settings</h1>
        <p className="text-xs text-slyce-grey mt-0.5">Manage your restaurant account</p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <ImagePlus size={16} className="text-slyce-grey" />
            <h2 className="text-sm font-semibold text-slyce-dark">Restaurant Logo</h2>
          </div>
          <p className="text-xs text-slyce-grey mb-4">
            Update your restaurant’s logo by providing a publicly accessible image URL.
          </p>

          {logoUrl.trim() && (
            <div className="mb-4 flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-14 h-14 rounded-xl object-cover border border-slyce-border"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
              />
              <p className="text-xs text-slyce-grey">Preview</p>
            </div>
          )}

          {logoError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-3">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {logoError}
            </div>
          )}
          {logoSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-xl mb-3">
              <CheckCircle size={13} /> Logo updated successfully!
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/your-logo.jpg"
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors"
            />
            <button
              onClick={handleLogoUpdate}
              disabled={logoSaving || !logoUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {logoSaving ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {logoSaving ? "Saving…" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
