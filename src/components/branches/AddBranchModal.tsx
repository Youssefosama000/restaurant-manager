import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { addBranch } from "../../api/branches";
import locations from "../../data/egypt-locations.json";

/* ─── Leaflet pin (matches landing page style) ─────────────── */
const greenPin = L.divIcon({
  className: "",
  html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#4CB050"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3" fill="#4CB050"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

/* ─── Map helpers ───────────────────────────────────────────── */
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPlace(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ─── Types ─────────────────────────────────────────────────── */
interface Area  { name: string; lat: number; lng: number }
interface City  { id: string; name: string; lat: number; lng: number; areas: Area[] }
const cities: City[] = (locations as { cities: City[] }).cities;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;

export default function AddBranchModal({ onClose, onSuccess }: Props) {

  const [branchName,          setBranchName]          = useState("");
  const [branchContactNumber, setBranchContactNumber] = useState("");
  const [city,                setCity]                = useState("");
  const [area,                setArea]                = useState("");
  const [streetNumber,        setStreetNumber]        = useState("");
  const [streetName,          setStreetName]          = useState("");
  const [lat,                 setLat]                 = useState(DEFAULT_LAT);
  const [lng,                 setLng]                 = useState(DEFAULT_LNG);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const selectedCity = cities.find((c) => c.name === city);
  const selectedArea = selectedCity?.areas.find((a) => a.name === area);

  function handleCityChange(cityName: string) {
    const c = cities.find((x) => x.name === cityName);
    setCity(cityName);
    setArea("");
    if (c) { setLat(c.lat); setLng(c.lng); }
    setError(null);
  }

  function handleAreaChange(areaName: string) {
    const a = selectedCity?.areas.find((x) => x.name === areaName);
    setArea(areaName);
    if (a) { setLat(a.lat); setLng(a.lng); }
    setError(null);
  }

  function pinMoved(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addBranch({
        branchName,
        branchContactNumber,
        city,
        area,
        streetNumber,
        streetName,
        Latitude:  String(lat),
        Longitude: String(lng),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add branch.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border bg-white placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors";
  const labelCls = "block text-xs font-semibold text-slyce-dark mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-slyce-border">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-primary" />
            <h2 className="text-base font-semibold text-slyce-dark">Add New Branch</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
          >
            <X size={16} className="text-slyce-grey" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Branch Name + Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Branch Name</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Maadi Branch"
                  value={branchName}
                  onChange={(e) => { setBranchName(e.target.value); setError(null); }}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Contact Number</label>
                <input
                  className={inputCls}
                  placeholder="+20 1XX XXX XXXX"
                  value={branchContactNumber}
                  onChange={(e) => { setBranchContactNumber(e.target.value); setError(null); }}
                  required
                />
              </div>
            </div>

            {/* City + Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <select
                  className={inputCls}
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                >
                  <option value="">Select city…</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Area</label>
                <select
                  className={inputCls}
                  value={area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  disabled={!city}
                  required
                >
                  <option value="">Select area…</option>
                  {(selectedCity?.areas ?? []).map((a) => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Street */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Street Number</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 12"
                  value={streetNumber}
                  onChange={(e) => { setStreetNumber(e.target.value); setError(null); }}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Street Name</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Ahmed Orabi St"
                  value={streetName}
                  onChange={(e) => { setStreetName(e.target.value); setError(null); }}
                  required
                />
              </div>
            </div>

            {/* Interactive map */}
            <div>
              <label className={labelCls}>Pin Location</label>
              <p className="text-[10px] text-slyce-grey mb-2">
                Select a city &amp; area above, then drag the pin or tap the map to set the exact spot.
              </p>
              <div className="rounded-xl overflow-hidden border border-slyce-border" style={{ height: 220 }}>
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  style={{ width: "100%", height: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FlyTo lat={lat} lng={lng} />
                  <ClickToPlace onPlace={pinMoved} />
                  <Marker
                    position={[lat, lng]}
                    icon={greenPin}
                    draggable
                    eventHandlers={{
                      dragend(e) {
                        const pos = (e.target as L.Marker).getLatLng();
                        pinMoved(pos.lat, pos.lng);
                      },
                    }}
                  />
                </MapContainer>
              </div>

              {/* Coordinates badge */}
              <div className="flex items-center gap-1.5 text-xs text-slyce-grey bg-cream rounded-xl px-3 py-2 mt-2">
                <MapPin size={12} className="text-green-primary shrink-0" />
                <span>
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                  {(selectedArea ?? selectedCity)
                    ? ` — ${selectedArea?.name ?? selectedCity?.name}`
                    : " — drag the pin to your exact location"}
                </span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slyce-border flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slyce-border text-sm font-semibold text-slyce-dark hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-primary text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Adding…" : "Add Branch"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
