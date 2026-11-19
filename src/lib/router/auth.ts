import {
  notFound,
  type ParsedLocation,
  redirect,
} from "@tanstack/react-router";

/**
 * - `loading`: a staff token exists and the current user is not loaded yet.
 * - `user`: a signed-in staff user. This wins over a patient token.
 * - `patient`: a patient signed in with an OTP.
 * - `anonymous`: no session.
 */
export type AuthStatus = "loading" | "user" | "patient" | "anonymous";

/** The part of the app a route belongs to. It selects the chrome. */
export type Area = "app" | "patient" | "public";

export interface RouterAuth {
  /** Read at navigation time, so guards see a sign-in or sign-out at once. */
  readonly status: AuthStatus;
}

let resolveStatus: () => AuthStatus = () => "loading";

/**
 * The `auth` object in the router context. `AuthUserProvider` registers the
 * resolver. The object identity never changes; the provider calls
 * `router.invalidate()` when the status changes, so the guards run again.
 */
export const routerAuth: RouterAuth = {
  get status() {
    return resolveStatus();
  },
};

export function setAuthStatusResolver(resolver: () => AuthStatus) {
  resolveStatus = resolver;
}

/** The area for routes that do not set one (for example, a not-found). */
export function defaultArea(status: AuthStatus): Area {
  return status === "user" ? "app" : "public";
}

/** True when a page of `area` can render for a session with `status`. */
export function isAreaAllowed(area: Area, status: AuthStatus) {
  if (area === "app") return status === "user";
  if (area === "patient") return status === "patient";
  return status !== "user";
}

interface GuardOptions {
  context: { auth: RouterAuth };
  location: ParsedLocation;
}

/** Context that a guard adds. `area` is absent while the session loads. */
export interface AreaContext {
  area?: Area;
}

function hashOf(location: ParsedLocation) {
  return location.hash ? `#${location.hash}` : "";
}

/** Goes to `pathname` and keeps the query string and hash, as raviger did. */
export function redirectKeepingQuery(
  pathname: string,
  location: ParsedLocation,
) {
  return redirect({
    href: pathname + location.searchStr + hashOf(location),
    replace: true,
  });
}

/**
 * Sends the user to the staff sign-in. `redirect` holds the absolute URL,
 * which `AuthUserProvider` opens after a successful sign-in.
 */
export function redirectToLogin(location: ParsedLocation) {
  const target = window.location.origin + location.href;
  return redirect({
    href: `/login?${new URLSearchParams({ redirect: target })}`,
    replace: true,
  });
}

/** `_app`: staff pages. */
export function requireStaff({ context, location }: GuardOptions): AreaContext {
  switch (context.auth.status) {
    case "loading":
      return {};
    case "user":
      return { area: "app" };
    default:
      throw redirectToLogin(location);
  }
}

/** `_patient`: patient portal pages. Staff users get a not-found, as before. */
export function requirePatient({
  context,
  location,
}: GuardOptions): AreaContext {
  switch (context.auth.status) {
    case "loading":
      return {};
    case "patient":
      return { area: "patient" };
    case "user":
      throw notFound();
    default:
      throw redirectToLogin(location);
  }
}

/** `_public`: sign-in and other public pages. Staff users go to `/`. */
export function publicOnly({ context, location }: GuardOptions): AreaContext {
  switch (context.auth.status) {
    case "loading":
      return {};
    case "user":
      throw redirectKeepingQuery("/", location);
    default:
      return { area: "public" };
  }
}

/** Shared URL with a staff page and a public page (`/`, `/licenses`). */
export function staffOrPublic({ context }: GuardOptions): AreaContext {
  switch (context.auth.status) {
    case "loading":
      return {};
    case "user":
      return { area: "app" };
    default:
      return { area: "public" };
  }
}

/** Shared URL with a staff page and a patient page (`/patient/:id`). */
export function staffOrPatient({
  context,
  location,
}: GuardOptions): AreaContext {
  switch (context.auth.status) {
    case "loading":
      return {};
    case "user":
      return { area: "app" };
    case "patient":
      return { area: "patient" };
    default:
      throw redirectToLogin(location);
  }
}
