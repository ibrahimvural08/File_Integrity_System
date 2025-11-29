'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { filesAPI } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import {
  Files,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Activity,
} from 'lucide-react';

interface DashboardStats {
  total_files: number;
  total_size: number;
  verified_files: number;
  corrupted_files: number;
  total_downloads: number;
  recent_checks: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await filesAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Files',
      value: stats?.total_files || 0,
      icon: Files,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Storage',
      value: formatBytes(stats?.total_size || 0),
      icon: HardDrive,
      color: 'bg-purple-500',
    },
    {
      title: 'Verified Files',
      value: stats?.verified_files || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Corrupted Files',
      value: stats?.corrupted_files || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Total Downloads',
      value: stats?.total_downloads || 0,
      icon: Download,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your file integrity system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/upload" className="card hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-4 bg-primary-100 rounded-lg">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <p className="text-gray-500">
                Upload a new file and generate its SHA-256 hash
              </p>
            </div>
          </div>
        </Link>

        <Link href="/files" className="card hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-4 bg-green-100 rounded-lg">
              <Files className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">View Files</h3>
              <p className="text-gray-500">
                Manage and verify your uploaded files
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Integrity Checks
          </h2>
        </div>

        {stats?.recent_checks && stats.recent_checks.length > 0 ? (
          <div className="space-y-4">
            {stats.recent_checks.map((check: any) => (
              <div
                key={check.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {check.is_valid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {check.check_type.charAt(0).toUpperCase() +
                        check.check_type.slice(1)}{' '}
                      Check
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(check.checked_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    check.is_valid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {check.is_valid ? 'Valid' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No integrity checks yet. Upload a file to get started!
          </p>
        )}
      </div>
    </div>
  );
}
