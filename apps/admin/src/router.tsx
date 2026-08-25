import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { getToken } from "./api";
import { detectLocale, isLocale, localizedPath, stripLocalePrefix } from "./i18n/core";
import { LocaleLayout } from "./i18n/LocaleLayout";
import { safeNextPath } from "./lib/nextPath";
import { LandingPage } from "./pages/LandingPage";
import { PricingPage } from "./pages/PricingPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { LicensesPage } from "./pages/admin/LicensesPage";
import { PoliciesPage } from "./pages/admin/PoliciesPage";
import { SessionsPage } from "./pages/admin/SessionsPage";
import { ApiKeysPage } from "./pages/admin/ApiKeysPage";
import { BillingPage } from "./pages/admin/BillingPage";
import { DocsLayout } from "./pages/docs/DocsLayout";
import { DocsSectionPage } from "./pages/docs/DocsSectionPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const rootIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: localizedPath(detectLocale(), "/") });
  },
});

const localeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$locale",
  beforeLoad: ({ params, location }) => {
    if (!isLocale(params.locale)) {
      const suffix = location.pathname.replace(/^\/[^/]+/, "") || "/";
      throw redirect({ to: localizedPath(detectLocale(), suffix) });
    }
  },
  component: LocaleLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: "/",
  component: LandingPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: "pricing",
  component: PricingPage,
});

const docsRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: "docs",
  component: DocsLayout,
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({ to: localizedPath(params.locale as "en" | "zh" | "ja", "/docs/quickstart") });
  },
});

const docsSectionRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "$section",
  component: DocsSectionPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: "admin/login",
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: safeNextPath(search.next),
  }),
  component: LoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: "admin",
  beforeLoad: ({ params, location }) => {
    if (!getToken()) {
      const next = safeNextPath(stripLocalePrefix(location.pathname));
      throw redirect({
        to: localizedPath(params.locale as "en" | "zh" | "ja", "/admin/login"),
        search: next ? { next } : {},
      });
    }
  },
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: DashboardPage,
});

const productsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "products",
  component: ProductsPage,
});

const licensesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "licenses",
  component: LicensesPage,
});

const policiesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "policies",
  component: PoliciesPage,
});

const sessionsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "sessions",
  component: SessionsPage,
});

const apiKeysRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "api-keys",
  component: ApiKeysPage,
});

const billingRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "billing",
  component: BillingPage,
});

const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  localeRoute.addChildren([
    indexRoute,
    pricingRoute,
    docsRoute.addChildren([docsIndexRoute, docsSectionRoute]),
    adminLoginRoute,
    adminRoute.addChildren([
      adminIndexRoute,
      productsRoute,
      licensesRoute,
      policiesRoute,
      sessionsRoute,
      apiKeysRoute,
      billingRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
