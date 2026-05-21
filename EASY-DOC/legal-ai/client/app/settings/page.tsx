'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import FeatureToggle from '../../components/FeatureToggle';
import { FeatureFlags, defaultFeatures, getFeatures, saveFeatures, featureDescriptions } from '../../lib/features';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRestartAlert, setShowRestartAlert] = useState(false);

  useEffect(() => {
    // Load saved features on mount
    const saved = getFeatures();
    setFeatures(saved);
  }, []);

  const handleToggle = (key: keyof FeatureFlags, value: boolean) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Show restart alert for critical features
    if (key === 'chatbot' || key === 'aiAssistant') {
      setShowRestartAlert(true);
    }
  };

  const handleSave = () => {
    saveFeatures(features);
    setHasChanges(false);
    setShowRestartAlert(false);
    
    // Show success message (in a real app, use toast)
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all features to default?')) {
      setFeatures(defaultFeatures);
      saveFeatures(defaultFeatures);
      setHasChanges(false);
      setShowRestartAlert(false);
    }
  };

  const featureKeys = Object.keys(defaultFeatures) as (keyof FeatureFlags)[];

  // Group features by category
  const coreFeatures = ['uploadDocument', 'chatbot', 'aiAssistant', 'notifications'];
  const analysisFeatures = ['riskAnalysis', 'documentSummary', 'clauseExtraction'];
  const exportFeatures = ['pdfExport', 'shareReport'];
  const advancedFeatures = ['compareDocuments', 'savedQueries', 'templates'];

  const renderFeatureGroup = (title: string, keys: string[]) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {keys.map((key) => (
          <FeatureToggle
            key={key}
            featureKey={key as keyof FeatureFlags}
            features={features}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar className="w-64 shrink-0 hidden lg:flex" />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Settings</h1>
              <p className="text-gray-600">
                Enable or disable features to customize your Legal AI experience. 
                Changes are saved automatically to your browser.
              </p>
            </div>

            {/* Restart Alert */}
            {showRestartAlert && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Some changes may require a refresh</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Disabling core AI features like Chatbot or AI Assistant may require a page refresh to take full effect.
                  </p>
                </div>
              </div>
            )}

            {/* Feature Groups */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              {renderFeatureGroup('Core Features', coreFeatures)}
              {renderFeatureGroup('Analysis Features', analysisFeatures)}
              {renderFeatureGroup('Export & Sharing', exportFeatures)}
              {renderFeatureGroup('Advanced Features', advancedFeatures)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Reset to Defaults</span>
              </button>

              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  hasChanges
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

            {/* Disabled Features Preview */}
            {hasChanges && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Preview of Changes</h4>
                <div className="text-sm text-blue-700">
                  {Object.entries(features).map(([key, value]) => {
                    const defaultValue = defaultFeatures[key as keyof FeatureFlags];
                    if (value !== defaultValue) {
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className={value ? 'text-green-600' : 'text-red-600'}>
                            {value ? '✓ Enabled' : '✗ Disabled'}
                          </span>
                          <span>{featureDescriptions[key as keyof FeatureFlags].label}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
