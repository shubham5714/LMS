"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';
import { useUserContext } from '@/shared/contextapi/UserContext';
import { useTenantContext } from '@/shared/contextapi/TenantContext';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { 
  RouteProtectionProps, 
  TenantRoute, 
  TenantSwitcherModalProps,
  Tenant 
} from '@/shared/types/routeProtection';

const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  show,
  onHide,
  onSelectTenant,
  assignedTenants
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTenantId) {
      onSelectTenant(selectedTenantId);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Select Tenant</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>You have access to multiple tenants. Please select a tenant to continue:</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Choose Tenant</Form.Label>
            <Form.Select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              required
            >
              <option value="">Select a tenant...</option>
              {assignedTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" disabled={!selectedTenantId}>
              Continue
            </Button>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const RouteProtection: React.FC<RouteProtectionProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { userData, isLoading: userLoading } = useUserContext();
  const { assignedTenants, selectedTenantIds, setSelectedTenantIds, isLoading: tenantLoading } = useTenantContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [routeData, setRouteData] = useState<TenantRoute | null>(null);

  // Function to fetch route protection data from tenant_routes table
  const fetchRouteData = async (routePath: string): Promise<TenantRoute | null> => {
    try {
      // Normalize the route path - remove trailing slash
      const normalizedPath = routePath.replace(/\/$/, '');
      
      // Note: `tenant_routes` might (accidentally) contain duplicate rows for the same route.
      // Fetch only one row to avoid Supabase `.single()` coercion failures.
      const { data, error } = await supabase
        .from('tenant_routes')
        .select('*')
        .eq('route', normalizedPath)
        .limit(1);

      if (error) {
        console.error('Error fetching route data:', error.message);
        return null;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return null;
      }
      
      // Map the database fields to our expected interface
      const mappedData: TenantRoute = {
        id: row.id,
        route_path: row.route,
        type: row.type,
        allowed_tenants: row.allowed_tenants || [],
        allowed_roles: row.allowed_roles || []
      };
      
      return mappedData;
    } catch (error) {
      console.error('Exception fetching route data:', error);
      return null;
    }
  };

  // Function to handle tenant selection from modal
  const handleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds(tenantId);
    setShowTenantModal(false);
  };

  // Main protection logic
  useEffect(() => {
    const protectRoute = async () => {
      // Wait for contexts to load
      if (userLoading || tenantLoading) {
        return;
      }

      // If modal is showing, don't run protection logic
      if (showTenantModal) {
        return;
      }

      // If no user data, let middleware handle authentication
      if (!userData) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch route data
        const route = await fetchRouteData(pathname);
        
        // If no route data found, allow access (route not protected)
        if (!route) {
          setRouteData(null);
          setIsLoading(false);
          return;
        }

        setRouteData(route);

        // Check route type and apply appropriate protection
        if (route.type === 'common') {
          // Common route - check role only
          const hasRoleAccess = route.allowed_roles.includes(userData.role);
          
          if (hasRoleAccess) {
            setIsLoading(false);
          } else {
            router.push('/authentication/error/401-error/');
          }
        } 
        else if (route.type === 'client') {
          // Client route - check tenant selection
          
          // Check if user has multiple tenants and selectedTenantIds is 'all'
          if (assignedTenants.length > 1 && selectedTenantIds === 'all') {
            setShowTenantModal(true);
            setIsLoading(false);
            return;
          }
          
          // Get the current selected tenant ID
          let currentTenantId: string;
          if (selectedTenantIds === 'all') {
            // If only one tenant assigned, use that one
            if (assignedTenants.length === 1) {
              currentTenantId = assignedTenants[0].id;
            } else {
              router.push('/authentication/error/401-error/');
              return;
            }
          } else {
            // User has selected a specific tenant
            currentTenantId = Array.isArray(selectedTenantIds) ? selectedTenantIds[0] : selectedTenantIds;
          }
          
          // Check role access
          const hasRoleAccess = route.allowed_roles.includes(userData.role);
          
          if (!hasRoleAccess) {
            router.push('/authentication/error/401-error/');
            return;
          }
          
          // Check tenant access
          const hasTenantAccess = route.allowed_tenants.includes(currentTenantId);
          
          if (!hasTenantAccess) {
            router.push('/authentication/error/401-error/');
            return;
          }
          
          setIsLoading(false);
        } else {
          console.error('Unknown route type:', route.type);
          router.push('/authentication/error/401-error/');
        }

      } catch (error) {
        console.error('Error in route protection:', error);
        router.push('/authentication/error/401-error/');
      }
    };

    protectRoute();
  }, [pathname, userData, assignedTenants, selectedTenantIds, userLoading, tenantLoading, showTenantModal, router]);

  // Show loading spinner while checking access
  if (isLoading || userLoading || tenantLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      {children}
      <TenantSwitcherModal
        show={showTenantModal}
        onHide={() => {
          setShowTenantModal(false);
          router.push('/authentication/error/401-error/');
        }}
        onSelectTenant={handleTenantSelection}
        assignedTenants={assignedTenants as Tenant[]}
      />
    </>
  );
};

export default RouteProtection;
