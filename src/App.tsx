import { useCallback, useEffect, useMemo, useState } from "react";
import GlobeVisualisation, {
  type CountrySelection,
} from "./components/GlobeVisualisation";
import { getCountryFromLatLon } from "./utils/threeGeoJSON";

interface SelectedCountry extends CountrySelection {
  reverseGeocodedName?: string;
  reverseLookupError?: string;
}

function App() {
  const [selection, setSelection] = useState<SelectedCountry | null>(null);
  const [isReverseLookupLoading, setIsReverseLookupLoading] = useState(false);

  const handleCountrySelect = useCallback((data: CountrySelection) => {
    console.group("Globe selection");
    console.log(
      "User guess (lat, lon):",
      data.lat.toFixed(4),
      data.lon.toFixed(4)
    );
    console.log("Metadata:", data.countryProperties ?? "Unknown");
    console.groupEnd();

    setSelection({
      ...data,
      reverseGeocodedName: undefined,
      reverseLookupError: undefined,
    });
  }, []);

  // todo: make hook for this
  useEffect(() => {
    if (!selection) {
      setIsReverseLookupLoading(false);
      return;
    }

    const { lat, lon } = selection;
    let isCancelled = false;

    setIsReverseLookupLoading(true);
    getCountryFromLatLon(lat, lon)
      .then((country) => {
        if (isCancelled) return;
        setSelection((prev) =>
          prev && prev.lat === lat && prev.lon === lon
            ? {
                ...prev,
                reverseGeocodedName: country,
                reverseLookupError: undefined,
              }
            : prev
        );
        setIsReverseLookupLoading(false);
      })
      .catch(() => {
        if (isCancelled) return;
        setSelection((prev) =>
          prev && prev.lat === lat && prev.lon === lon
            ? {
                ...prev,
                reverseLookupError:
                  "Unable to reach the reverse geocoding service.",
              }
            : prev
        );
        setIsReverseLookupLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selection?.lat, selection?.lon]);

  const metadataEntries = useMemo(() => {
    if (!selection?.countryProperties) return [];

    const { countryProperties } = selection;
    return [
      { label: "Continent", value: countryProperties.continent },
      { label: "ISO A3", value: countryProperties.iso_a3 },
      { label: "Economy", value: countryProperties.economy },
      { label: "Income Group", value: countryProperties.income_grp },
      { label: "Population", value: countryProperties.pop_est },
    ];
  }, [selection]);

  const formatMetadataValue = (value: unknown) => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    return "Unknown";
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <GlobeVisualisation onCountrySelect={handleCountrySelect} />
      </div>

      <aside
        className="absolute bottom-4 left-4 w-80 bg-black/70 backdrop-blur rounded-xl border border-white/10 p-4 space-y-4 shadow-lg pointer-events-auto"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Country details</h2>
          {selection && (
            <span className="text-xs text-white/70">
              {selection.lat.toFixed(2)}°, {selection.lon.toFixed(2)}°
            </span>
          )}
        </div>

        {selection ? (
          <>
            <div>
              <p className="text-sm text-white/60">GeoJSON dataset</p>
              <p className="text-xl font-bold">
                {selection.countryProperties?.name ?? "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-sm text-white/60">Reverse geocoding</p>
              <p className="text-base">
                {isReverseLookupLoading && !selection.reverseGeocodedName
                  ? "Fetching country..."
                  : selection.reverseLookupError
                  ? selection.reverseLookupError
                  : selection.reverseGeocodedName ?? "Unknown"}
              </p>
            </div>

            {metadataEntries.length > 0 ? (
              <dl className="grid grid-cols-1 gap-2 text-sm">
                {metadataEntries.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex items-center justify-between border-b border-white/5 pb-1"
                  >
                    <dt className="text-white/60">{entry.label}</dt>
                    <dd className="font-medium">
                      {formatMetadataValue(entry.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-white/70">
                No metadata found for this country.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-white/70">
            Click anywhere on the globe to view the country and metadata for
            that location.
          </p>
        )}
      </aside>
    </div>
  );
}

export default App;
