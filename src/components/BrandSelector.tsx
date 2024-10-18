import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Brand {
  id: string;
  name: string;
}

interface BrandSelectorProps {
  onBrandSelect: (brand: string) => void;
  onNotificationAcknowledge: (acknowledged: boolean) => void;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ onBrandSelect, onNotificationAcknowledge }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandName = e.target.value;
    setSelectedBrand(brandName);
    onBrandSelect(brandName);

    const notificationKey = brandName as keyof typeof t.brandNotifications;
    setNotification(t(`brandNotifications.${notificationKey}`));
    setAcknowledged(false);
    onNotificationAcknowledge(false);
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onNotificationAcknowledge(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">{t('brand')}</label>
        <select
          id="brand"
          name="brand"
          value={selectedBrand}
          onChange={handleBrandChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="">{t('selectBrand')}</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.name}>{brand.name}</option>
          ))}
        </select>
      </div>
      {notification && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">{t('importantNotice')}</p>
          <p>{notification}</p>
          <div className="mt-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={handleAcknowledge}
                className="form-checkbox h-5 w-5 text-indigo-600"
              />
              <span className="ml-2 text-gray-700">{t('acknowledgeInformation')}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSelector;