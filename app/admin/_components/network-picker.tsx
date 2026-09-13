"use client";

import { Building2, MapPin } from "lucide-react";
import type { CityRow, DistributorRow } from "@/lib/network-types";
import {
  ALL_CITIES_ID,
  ALL_DISTRIBUTORS_ID,
  formatDistributorLabel,
} from "@/lib/network-types";
import { input as inputClass, muted } from "@/lib/admin-theme";

type NetworkPickerProps = {
  cities: CityRow[];
  distributors: DistributorRow[];
  selectedCityId: string;
  selectedDistributorId: string;
  onCityChange: (cityId: string) => void;
  onDistributorChange: (distributorId: string) => void;
  isLight?: boolean;
};

export function NetworkPicker({
  cities,
  distributors,
  selectedCityId,
  selectedDistributorId,
  onCityChange,
  onDistributorChange,
  isLight = false,
}: NetworkPickerProps) {
  const filteredDistributors = (
    selectedCityId === ALL_CITIES_ID
      ? distributors
      : distributors.filter((d) => d.cityId === selectedCityId)
  ).filter((d) => d.isActive);

  function handleCityChange(cityId: string) {
    onCityChange(cityId);
    if (cityId !== ALL_CITIES_ID && selectedDistributorId !== ALL_DISTRIBUTORS_ID) {
      const stillValid = distributors.some(
        (d) => d.id === selectedDistributorId && d.cityId === cityId,
      );
      if (!stillValid) {
        onDistributorChange(ALL_DISTRIBUTORS_ID);
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <MapPin className={`h-4 w-4 shrink-0 ${muted(isLight)}`} />
        <select
          value={selectedCityId}
          onChange={(e) => handleCityChange(e.target.value)}
          className={`min-w-[180px] rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-all sm:min-w-[200px] ${inputClass(isLight)}`}
        >
          <option value={ALL_CITIES_ID}>Toutes les villes ({cities.length})</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name} — {city.distributorCount} distributeur
              {city.distributorCount > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Building2 className={`h-4 w-4 shrink-0 ${muted(isLight)}`} />
        <select
          value={selectedDistributorId}
          onChange={(e) => onDistributorChange(e.target.value)}
          className={`min-w-[220px] rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-all sm:min-w-[280px] ${inputClass(isLight)}`}
        >
          <option value={ALL_DISTRIBUTORS_ID}>
            Tous les distributeurs ({filteredDistributors.length})
          </option>
          {filteredDistributors.map((distributor) => (
            <option key={distributor.id} value={distributor.id}>
              {formatDistributorLabel(distributor)} ({distributor.totalBoxes} casiers)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
