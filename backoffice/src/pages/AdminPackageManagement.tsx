import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Users, Check, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface PackageFeature {
  id: number;
  name: string;
  included: boolean;
}

interface AdminPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: PackageFeature[];
  isPopular: boolean;
  maxShops: number;
  status: 'active' | 'inactive';
  subscriberCount: number;
}

const AdminPackageManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AdminPackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setPackages([
        {
          id: 1,
          name: 'Basic',
          description: 'Perfect for small businesses getting started',
          price: 29,
          billingCycle: 'monthly',
          features: [
            { id: 1, name: 'Up to 5 products', included: true },
            { id: 2, name: 'Basic analytics', included: true },
            { id: 3, name: 'Email support', included: true },
            { id: 4, name: 'Advanced analytics', included: false },
            { id: 5, name: 'Priority support', included: false },
            { id: 6, name: 'Custom branding', included: false }
          ],
          isPopular: false,
          maxShops: 1,
          status: 'active',
          subscriberCount: 145
        },
        {
          id: 2,
          name: 'Standard',
          description: 'Great for growing businesses',
          price: 59,
          billingCycle: 'monthly',
          features: [
            { id: 1, name: 'Up to 50 products', included: true },
            { id: 2, name: 'Basic analytics', included: true },
            { id: 3, name: 'Email support', included: true },
            { id: 4, name: 'Advanced analytics', included: true },
            { id: 5, name: 'Priority support', included: false },
            { id: 6, name: 'Custom branding', included: false }
          ],
          isPopular: true,
          maxShops: 3,
          status: 'active',
          subscriberCount: 289
        },
        {
          id: 3,
          name: 'Premium',
          description: 'For established businesses',
          price: 99,
          billingCycle: 'monthly',
          features: [
            { id: 1, name: 'Unlimited products', included: true },
            { id: 2, name: 'Basic analytics', included: true },
            { id: 3, name: 'Email support', included: true },
            { id: 4, name: 'Advanced analytics', included: true },
            { id: 5, name: 'Priority support', included: true },
            { id: 6, name: 'Custom branding', included: true }
          ],
          isPopular: false,
          maxShops: 10,
          status: 'active',
          subscriberCount: 78
        }
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (pkg: AdminPackage) => {
    setSelectedPackage(pkg);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedPackage(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDelete = (packageId: number) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      setPackages(packages.filter(pkg => pkg.id !== packageId));
    }
  };

  const handleToggleStatus = (packageId: number) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId 
        ? { ...pkg, status: pkg.status === 'active' ? 'inactive' : 'active' }
        : pkg
    ));
  };

  const PackageCard = ({ pkg }: { pkg: AdminPackage }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-200 ${
      pkg.isPopular 
        ? 'border-blue-500 dark:border-blue-400' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {pkg.isPopular && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium rounded-t-xl">
          Most Popular
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{pkg.description}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            pkg.status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {pkg.status}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">${pkg.price}</span>
            <span className="text-gray-600 dark:text-gray-400">/{pkg.billingCycle}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {pkg.features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-3">
              {feature.included ? (
                <Check size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <X size={16} className="text-gray-400 flex-shrink-0" />
              )}
              <span className={`text-sm ${
                feature.included 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{pkg.maxShops}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Max Shops</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{pkg.subscriberCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Subscribers</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(pkg)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => handleToggleStatus(pkg.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pkg.status === 'active'
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}
          >
            {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleDelete(pkg.id)}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Package Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage subscription packages</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Create Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Packages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{packages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packages.reduce((sum, pkg) => sum + pkg.subscriberCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${packages.reduce((sum, pkg) => sum + (pkg.price * pkg.subscriberCount), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Package size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Packages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packages.filter(pkg => pkg.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {/* Package Creation/Edit Modal would go here */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Package' : 'Create New Package'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Package creation/editing form would be implemented here with all necessary fields.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                {isEditing ? 'Update' : 'Create'} Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackageManagement;