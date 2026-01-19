/**
 * Multi-Tenant Context Example
 * 
 * This React Context provides tenant-scoped state management.
 * Every component that consumes this context automatically gets
 * data scoped to the current restaurant.
 * 
 * Architecture:
 * - URL contains restaurant slug: /joes-coffee/menu
 * - Context extracts slug and loads that restaurant's config
 * - All child components receive tenant-scoped data
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { RestaurantService } from '../services/RestaurantService';

// Types
interface RestaurantConfig {
    id: string;
    name: string;
    slug: string;
    theme: ThemeConfig;
    subscription: SubscriptionTier;
}

interface ThemeConfig {
    primaryColor: string;
    accentColor: string;
    logo?: string;
}

type SubscriptionTier = 'free' | 'barista' | 'roaster' | 'tycoon';

interface RestaurantContextType {
    // Current restaurant configuration
    config: RestaurantConfig | null;
    isLoading: boolean;

    // Tenant-scoped data queries will use this ID
    restaurantId: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

/**
 * RestaurantProvider
 * 
 * Wraps the app and provides tenant context to all children.
 * Extracts restaurant slug from URL and loads configuration.
 */
export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { slug } = useParams<{ slug: string }>();
    const [config, setConfig] = useState<RestaurantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            setConfig(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Subscribe to restaurant config (real-time updates)
        const unsubscribe = RestaurantService.subscribeToConfig(
            slug,
            (loadedConfig) => {
                setConfig(loadedConfig);
                setIsLoading(false);

                // Apply theme colors dynamically
                if (loadedConfig.theme) {
                    applyTheme(loadedConfig.theme);
                }
            },
            () => {
                console.warn(`Restaurant "${slug}" not found`);
                setConfig(null);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [slug]);

    const value: RestaurantContextType = {
        config,
        isLoading,
        restaurantId: config?.id || null
    };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

/**
 * useRestaurant Hook
 * 
 * Provides access to restaurant context from any component.
 * Throws if used outside of RestaurantProvider.
 */
export const useRestaurant = (): RestaurantContextType => {
    const context = useContext(RestaurantContext);

    if (!context) {
        throw new Error('useRestaurant must be used within RestaurantProvider');
    }

    return context;
};

/**
 * Apply theme colors to CSS variables
 */
function applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;

    if (theme.primaryColor) {
        root.style.setProperty('--color-primary', theme.primaryColor);
    }
    if (theme.accentColor) {
        root.style.setProperty('--color-accent', theme.accentColor);
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================
//
// In any component:
//
//   const { restaurantId, config } = useRestaurant();
//
//   // All queries automatically scoped to this restaurant
//   const orders = await OrderService.getByRestaurant(restaurantId);
//
//   // Theme is automatically applied
//   // <div style={{ background: config.theme.primaryColor }}>
//
// ============================================================================

// ============================================================================
// WHY THIS PATTERN MATTERS FOR MULTI-TENANCY
// ============================================================================
//
// Single Codebase, Many Restaurants:
// - joes-coffee → sees only Joe's menu, orders, config
// - marias-cafe → sees only Maria's menu, orders, config
//
// Data Isolation:
// - Every query includes `where('restaurantId', '==', restaurantId)`
// - Security rules also check restaurantId
// - One restaurant can never see another's data
//
// ============================================================================
