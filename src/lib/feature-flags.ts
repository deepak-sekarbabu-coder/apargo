/**
 * Feature flags utility for controlling feature visibility
 */

export const FeatureFlags = {
  /**
   * Generic feature flag checker
   * @param flagName - The environment variable name
   * @param defaultValue - Default value if env var is not set
   * @returns boolean indicating if feature is enabled
   */
  isFeatureEnabled: (flagName: string, defaultValue: boolean = false): boolean => {
    const envValue = process.env[flagName];
    if (envValue === undefined) return defaultValue;
    return envValue === 'true';
  },
} as const;
