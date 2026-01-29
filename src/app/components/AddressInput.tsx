import React, { useState, useEffect, useRef } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { MapPin } from 'lucide-react';

interface AddressData {
  country: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  street: string;
}

interface AddressInputProps {
  value: AddressData | string;
  onChange: (address: AddressData) => void;
}

// Comprehensive country list (All alphabetical A-Z)
const COUNTRIES = [
  { value: 'Afghanistan', label: '🇦🇫 Afghanistan' },
  { value: 'Algeria', label: '🇩🇿 Algeria' },
  { value: 'Argentina', label: '🇦🇷 Argentina' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Austria', label: '🇦🇹 Austria' },
  { value: 'Bahrain', label: '🇧🇭 Bahrain' },
  { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
  { value: 'Belgium', label: '🇧🇪 Belgium' },
  { value: 'Brazil', label: '🇧🇷 Brazil' },
  { value: 'Brunei', label: '🇧🇳 Brunei Darussalam' },
  { value: 'Cambodia', label: '🇰🇭 Cambodia' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Chile', label: '🇨🇱 Chile' },
  { value: 'China', label: '🇨🇳 China' },
  { value: 'Colombia', label: '🇨🇴 Colombia' },
  { value: 'Czech Republic', label: '🇨🇿 Czech Republic' },
  { value: 'Denmark', label: '🇩🇰 Denmark' },
  { value: 'Egypt', label: '🇪🇬 Egypt' },
  { value: 'Ethiopia', label: '🇪🇹 Ethiopia' },
  { value: 'Fiji', label: '🇫🇯 Fiji' },
  { value: 'Finland', label: '🇫🇮 Finland' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'Ghana', label: '🇬🇭 Ghana' },
  { value: 'Greece', label: '🇬🇷 Greece' },
  { value: 'Hong Kong', label: '🇭🇰 Hong Kong' },
  { value: 'India', label: '🇮🇳 India' },
  { value: 'Indonesia', label: '🇮🇩 Indonesia' },
  { value: 'Ireland', label: '🇮🇪 Ireland' },
  { value: 'Italy', label: '🇮🇹 Italy' },
  { value: 'Japan', label: '🇯🇵 Japan' },
  { value: 'Jordan', label: '🇯🇴 Jordan' },
  { value: 'Kazakhstan', label: '🇰🇿 Kazakhstan' },
  { value: 'Kenya', label: '🇰🇪 Kenya' },
  { value: 'Kuwait', label: '🇰🇼 Kuwait' },
  { value: 'Kyrgyzstan', label: '🇰🇬 Kyrgyzstan' },
  { value: 'Laos', label: '🇱🇦 Laos' },
  { value: 'Macau', label: '🇲🇴 Macau' },
  { value: 'Malaysia', label: '🇲🇾 Malaysia' },
  { value: 'Maldives', label: '🇲🇻 Maldives' },
  { value: 'Mexico', label: '🇲🇽 Mexico' },
  { value: 'Morocco', label: '🇲🇦 Morocco' },
  { value: 'Myanmar', label: '🇲🇲 Myanmar' },
  { value: 'Nepal', label: '🇳🇵 Nepal' },
  { value: 'Netherlands', label: '🇳🇱 Netherlands' },
  { value: 'New Zealand', label: '🇳🇿 New Zealand' },
  { value: 'Nigeria', label: '🇳🇬 Nigeria' },
  { value: 'North Korea', label: '🇰🇵 North Korea' },
  { value: 'Norway', label: '🇳🇴 Norway' },
  { value: 'Oman', label: '🇴🇲 Oman' },
  { value: 'Pakistan', label: '🇵🇰 Pakistan' },
  { value: 'Papua New Guinea', label: '🇵🇬 Papua New Guinea' },
  { value: 'Peru', label: '🇵🇪 Peru' },
  { value: 'Philippines', label: '🇵🇭 Philippines' },
  { value: 'Poland', label: '🇵🇱 Poland' },
  { value: 'Portugal', label: '🇵🇹 Portugal' },
  { value: 'Qatar', label: '🇶🇦 Qatar' },
  { value: 'Russia', label: '🇷🇺 Russia' },
  { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
  { value: 'Singapore', label: '🇸🇬 Singapore' },
  { value: 'South Africa', label: '🇿🇦 South Africa' },
  { value: 'South Korea', label: '🇰🇷 South Korea' },
  { value: 'Spain', label: '🇪🇸 Spain' },
  { value: 'Sri Lanka', label: '🇱🇰 Sri Lanka' },
  { value: 'Sweden', label: '🇸🇪 Sweden' },
  { value: 'Switzerland', label: '🇨🇭 Switzerland' },
  { value: 'Taiwan', label: '🇹🇼 Taiwan' },
  { value: 'Tajikistan', label: '🇹🇯 Tajikistan' },
  { value: 'Thailand', label: '🇹🇭 Thailand' },
  { value: 'Timor-Leste', label: '🇹🇱 Timor-Leste' },
  { value: 'Tunisia', label: '🇹🇳 Tunisia' },
  { value: 'Turkey', label: '🇹🇷 Turkey' },
  { value: 'Turkmenistan', label: '🇹🇲 Turkmenistan' },
  { value: 'Ukraine', label: '🇺🇦 Ukraine' },
  { value: 'United Arab Emirates', label: '🇦🇪 United Arab Emirates' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'Uzbekistan', label: '🇺🇿 Uzbekistan' },
  { value: 'Venezuela', label: '🇻🇪 Venezuela' },
  { value: 'Vietnam', label: '🇻🇳 Vietnam' },
];

// Data provinsi Indonesia (major provinces)
const INDONESIA_PROVINCES = [
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Banten',
  'DI Yogyakarta',
  'Bali',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Kepulauan Riau',
  'Lampung',
  'Kalimantan Timur',
  'Kalimantan Selatan',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Utara',
  'Sulawesi Selatan',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Papua',
  'Maluku',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Aceh',
];

// Data kota per provinsi (sample - major cities only)
const INDONESIA_CITIES: Record<string, string[]> = {
  'DKI Jakarta': [
    'Jakarta Pusat',
    'Jakarta Utara',
    'Jakarta Barat',
    'Jakarta Selatan',
    'Jakarta Timur',
    'Kepulauan Seribu',
  ],
  'Jawa Barat': [
    'Bandung',
    'Bekasi',
    'Bogor',
    'Depok',
    'Cirebon',
    'Sukabumi',
    'Tasikmalaya',
    'Cimahi',
    'Banjar',
  ],
  'Jawa Tengah': [
    'Semarang',
    'Surakarta (Solo)',
    'Magelang',
    'Salatiga',
    'Pekalongan',
    'Tegal',
  ],
  'Jawa Timur': [
    'Surabaya',
    'Malang',
    'Kediri',
    'Madiun',
    'Mojokerto',
    'Pasuruan',
    'Probolinggo',
    'Blitar',
  ],
  'Banten': [
    'Tangerang',
    'Tangerang Selatan',
    'Serang',
    'Cilegon',
  ],
  'DI Yogyakarta': [
    'Yogyakarta',
    'Bantul',
    'Sleman',
    'Kulonprogo',
    'Gunungkidul',
  ],
  'Bali': [
    'Denpasar',
    'Badung',
    'Gianyar',
    'Tabanan',
    'Buleleng',
  ],
  'Sumatera Utara': [
    'Medan',
    'Binjai',
    'Tebing Tinggi',
    'Pematang Siantar',
  ],
};

export const AddressInput: React.FC<AddressInputProps> = ({ value, onChange }) => {
  // Parse initial value (could be old string format or new object format)
  const parseInitialValue = (): AddressData => {
    if (typeof value === 'string') {
      // Legacy format - single string
      return {
        country: '',
        province: '',
        city: '',
        district: '',
        village: '',
        postalCode: '',
        street: value || '',
      };
    } else if (value && typeof value === 'object') {
      // New format - structured object
      return {
        country: value.country || '',
        province: value.province || '',
        city: value.city || '',
        district: value.district || '',
        village: value.village || '',
        postalCode: value.postalCode || '',
        street: value.street || '',
      };
    } else {
      // Empty
      return {
        country: '',
        province: '',
        city: '',
        district: '',
        village: '',
        postalCode: '',
        street: '',
      };
    }
  };

  const [addressData, setAddressData] = useState<AddressData>(parseInitialValue());
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCustomProvince, setShowCustomProvince] = useState(false);
  const [showCustomCity, setShowCustomCity] = useState(false);
  
  // Use ref to track if we're internally updating (to prevent infinite loop)
  const isInternalUpdate = useRef(false);

  // Re-parse when value prop changes from external source (important for loading saved data)
  useEffect(() => {
    // Skip if this is an internal update (from onChange callback)
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const parsed = parseInitialValue();
    const currentJSON = JSON.stringify(addressData);
    const parsedJSON = JSON.stringify(parsed);
    
    // Only update if value actually changed from external source
    if (currentJSON !== parsedJSON) {
      setAddressData(parsed);
    }
  }, [value]);

  // Check if country is Indonesia (case-insensitive)
  const isIndonesia = addressData.country.toLowerCase().trim() === 'indonesia';

  // Update available cities when province changes (Indonesia only)
  useEffect(() => {
    if (isIndonesia && addressData.province) {
      const cities = INDONESIA_CITIES[addressData.province] || [];
      setAvailableCities(cities);
      
      // Reset city if it's not in the new province
      if (addressData.city && !cities.includes(addressData.city)) {
        updateField('city', '');
      }
    } else {
      setAvailableCities([]);
    }
  }, [addressData.province, isIndonesia]);

  // Notify parent when address changes
  useEffect(() => {
    // Mark this as an internal update to prevent re-parsing from value prop
    isInternalUpdate.current = true;
    onChange(addressData);
  }, [addressData]);

  const updateField = (field: keyof AddressData, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // When country changes, reset Indonesia-specific fields
  const handleCountryChange = (newCountry: string) => {
    const wasIndonesia = isIndonesia;
    const willBeIndonesia = newCountry.toLowerCase().trim() === 'indonesia';
    
    updateField('country', newCountry);
    
    // If switching from Indonesia to other country, reset specific fields
    if (wasIndonesia && !willBeIndonesia) {
      updateField('district', '');
      updateField('village', '');
      setShowCustomProvince(false);
      setShowCustomCity(false);
    }
    
    // If switching to different country, reset province/city
    if (wasIndonesia !== willBeIndonesia) {
      updateField('province', '');
      updateField('city', '');
    }
  };

  const showProvinceSelect = isIndonesia && !showCustomProvince;
  const showCitySelect = isIndonesia && availableCities.length > 0 && !showCustomCity;

  return (
    <div className="space-y-4">
      {/* Country - Dropdown with All Countries */}
      <div>
        <Label htmlFor="country" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#D4AF37]" />
          Country <span className="text-red-500">*</span>
        </Label>
        <Select
          value={addressData.country}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* All countries in alphabetical order */}
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Select your country from the list
        </p>
      </div>

      {/* Province/State - Different UI for Indonesia vs Other */}
      <div>
        <Label htmlFor="province">
          {isIndonesia ? 'Province (Provinsi)' : 'State/Province'} <span className="text-red-500">*</span>
        </Label>
        
        {showProvinceSelect ? (
          // INDONESIA: Dropdown with predefined provinces
          <div className="space-y-2">
            <Select
              value={addressData.province}
              onValueChange={(value) => {
                if (value === 'OTHER_CUSTOM') {
                  setShowCustomProvince(true);
                  updateField('province', '');
                } else {
                  updateField('province', value);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {INDONESIA_PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
                <SelectItem value="OTHER_CUSTOM" className="text-[#D4AF37] font-medium">
                  ✏️ Type manually...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          // OTHER COUNTRIES or Custom Indonesia: Manual input
          <div className="space-y-2">
            <Input
              id="province"
              value={addressData.province}
              onChange={(e) => updateField('province', e.target.value)}
              placeholder={isIndonesia ? 'e.g., DKI Jakarta' : 'e.g., California, Texas, etc.'}
              className="mt-1"
            />
            {isIndonesia && (
              <button
                type="button"
                onClick={() => {
                  setShowCustomProvince(false);
                  updateField('province', '');
                }}
                className="text-xs text-[#D4AF37] hover:text-[#C5A572] font-medium"
              >
                ← Choose from list
              </button>
            )}
          </div>
        )}
      </div>

      {/* City - Different UI for Indonesia vs Other */}
      <div>
        <Label htmlFor="city">
          {isIndonesia ? 'City (Kota/Kabupaten)' : 'City'} <span className="text-red-500">*</span>
        </Label>
        
        {showCitySelect ? (
          // INDONESIA with available cities: Dropdown
          <div className="space-y-2">
            <Select
              value={addressData.city}
              onValueChange={(value) => {
                if (value === 'OTHER_CUSTOM') {
                  setShowCustomCity(true);
                  updateField('city', '');
                } else {
                  updateField('city', value);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
                <SelectItem value="OTHER_CUSTOM" className="text-[#D4AF37] font-medium">
                  ✏️ Type manually...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          // OTHER COUNTRIES or Custom: Manual input
          <div className="space-y-2">
            <Input
              id="city"
              value={addressData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder={isIndonesia ? 'e.g., Jakarta Selatan' : 'e.g., Los Angeles, New York, etc.'}
              className="mt-1"
            />
            {isIndonesia && showCitySelect && (
              <button
                type="button"
                onClick={() => {
                  setShowCustomCity(false);
                  updateField('city', '');
                }}
                className="text-xs text-[#D4AF37] hover:text-[#C5A572] font-medium"
              >
                ← Choose from list
              </button>
            )}
          </div>
        )}
      </div>

      {/* District (Kecamatan) - ONLY for Indonesia */}
      {isIndonesia && (
        <div>
          <Label htmlFor="district">District (Kecamatan)</Label>
          <Input
            id="district"
            value={addressData.district}
            onChange={(e) => updateField('district', e.target.value)}
            placeholder="e.g., Kebayoran Baru"
            className="mt-1"
          />
        </div>
      )}

      {/* Village (Kelurahan) - ONLY for Indonesia */}
      {isIndonesia && (
        <div>
          <Label htmlFor="village">Village (Kelurahan)</Label>
          <Input
            id="village"
            value={addressData.village}
            onChange={(e) => updateField('village', e.target.value)}
            placeholder="e.g., Senayan"
            className="mt-1"
          />
        </div>
      )}

      {/* Postal Code */}
      <div>
        <Label htmlFor="postalCode">Postal Code {isIndonesia ? '(Kode Pos)' : ''}</Label>
        <Input
          id="postalCode"
          value={addressData.postalCode}
          onChange={(e) => {
            // Only allow numbers and letters (some countries use alphanumeric postal codes)
            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            updateField('postalCode', value);
          }}
          placeholder={isIndonesia ? 'e.g., 12190' : 'e.g., 90001, SW1A 1AA, etc.'}
          maxLength={10}
          className="mt-1"
        />
      </div>

      {/* Street Address / Detail */}
      <div>
        <Label htmlFor="street">
          Street Address (Detail) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="street"
          value={addressData.street}
          onChange={(e) => updateField('street', e.target.value)}
          placeholder={isIndonesia 
            ? 'e.g., Jl. Sudirman No. 123, RT 001 / RW 002' 
            : 'e.g., 123 Main Street, Apt 4B'
          }
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          {isIndonesia 
            ? 'Include street name, number, RT/RW, building name, etc.'
            : 'Include street name, number, building name, unit, etc.'
          }
        </p>
      </div>

      {/* Full Address Preview */}
      <div className="pt-2 border-t border-gray-200">
        <Label className="text-gray-600 text-xs">Full Address Preview:</Label>
        <div className="mt-2 p-3 bg-gradient-to-br from-[#D4AF37]/5 to-[#FFD700]/5 border border-[#D4AF37]/20 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">
            {isIndonesia 
              ? // INDONESIA format
                [
                  addressData.street,
                  addressData.village && `Kel. ${addressData.village}`,
                  addressData.district && `Kec. ${addressData.district}`,
                  addressData.city,
                  addressData.province,
                  addressData.postalCode,
                  addressData.country,
                ]
                  .filter(Boolean)
                  .join(', ')
              : // OTHER COUNTRIES format
                [
                  addressData.street,
                  addressData.city,
                  addressData.province,
                  addressData.postalCode,
                  addressData.country,
                ]
                  .filter(Boolean)
                  .join(', ')
            }
            {![
              addressData.street,
              addressData.city,
              addressData.province,
              addressData.country,
            ].some(Boolean) && (
              <span className="text-gray-400 italic">
                Address will appear here as you fill in the fields...
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert AddressData to readable string
export const formatAddressToString = (address: AddressData | string): string => {
  if (typeof address === 'string') {
    return address;
  }
  
  if (!address) {
    return '';
  }

  const isIndonesia = address.country?.toLowerCase().trim() === 'indonesia';

  if (isIndonesia) {
    // Indonesia format with Kelurahan, Kecamatan
    return [
      address.street,
      address.village && `Kel. ${address.village}`,
      address.district && `Kec. ${address.district}`,
      address.city,
      address.province,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  } else {
    // International format (simpler)
    return [
      address.street,
      address.city,
      address.province,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  }
};

export type { AddressData };