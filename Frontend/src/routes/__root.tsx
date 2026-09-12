import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

import { formatApiError } from "../api/client";
import { BackendStatusBanner } from "../components/backend-status-banner";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const userFriendlyError = formatApiError(
    error,
    "An unexpected error occurred while loading this page.",
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <BackendStatusBanner />
      <div className="max-w-md text-center py-12">
        <h1 className="text-2xl font-bold tracking-tight text-cream">Unable to display page</h1>
        <div className="mt-4 rounded-xl border border-fire/50 bg-fire/15 p-4 text-sm text-cream text-left">
          {userFriendlyError}
        </div>
        <p className="mt-3 text-sm text-cream/70">
          You can try refreshing the view or return to the home companion.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-sun px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-sun/90 shadow-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-clay bg-surface px-5 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-clay"
          >
            Back Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SmritiSetu | Bridging Memories, Empowering Lives" },
      {
        name: "description",
        content: "SmritiSetu: Cognitive assistance, multilingual voice, and elder care companion for North Eastern India.",
      },
      { name: "author", content: "SmritiSetu" },
      { property: "og:title", content: "SmritiSetu | Bridging Memories, Empowering Lives" },
      {
        property: "og:description",
        content: "SmritiSetu: Cognitive assistance, multilingual voice, and elder care companion for North Eastern India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider } from "../context/auth-context";
import { I18nProvider } from "../i18n/i18nContext";
import { Toaster } from "../components/ui/sonner";
import { VoiceTriggerButton } from "@/features/voice/components/VoiceTriggerButton";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <BackendStatusBanner />
          <Outlet />
          <VoiceTriggerButton />
          <Toaster position="bottom-right" />
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
