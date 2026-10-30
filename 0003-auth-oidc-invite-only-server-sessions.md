# 0003. OIDC sign-in, invite-only, server-side sessions

Status: Accepted
Date: 2026-10-29

## Context

Most E Noa staff use Google Workspace today. The company is moving toward Microsoft, with an Entra ID migration planned. PM_System must work with Google now and Microsoft later, and Chris wants to control exactly who can get in, regardless of who has a company account.

## Decision

- Sign-in only through OpenID Connect: Google now, Microsoft Entra ID later (Phase 14). The app never stores passwords. MFA is enforced by the identity provider.
- Implement OIDC inside the app with Authlib, using the Authorization Code flow with PKCE.
- Store each provider identity in a `user_identities` table so one user can have both a Google and a Microsoft identity.
- Invite-only: a sign-in succeeds only for an existing active user or a valid, unexpired invite for that email, on an allowed domain, with a verified email.
- Sessions are stored server-side. The browser holds a random token in a `__Host-session` cookie (Secure, HttpOnly, SameSite=Lax). The database stores only its hash.
- Linking a second provider to an existing user requires the user to be signed in already, or an Admin to do it. Matching by email alone is never enough to link (prevents account takeover).

## Consequences

- No per-user fees for an identity service, and no lock-in to one.
- Sessions can be revoked instantly (deactivation, sign out everywhere), which signed tokens stored only in the browser cannot do.
- The app owns the OIDC code, so it must be implemented carefully and tested (state, nonce, issuer, audience, signatures). Authlib does most of this.
- Adding Microsoft later is a new provider configuration and a linking flow, not a redesign.

## Alternatives considered

- Firebase Authentication or Google Identity Platform: managed and supports multiple providers, but ties sign-in to Google Cloud and adds a client-side SDK. Revisit if the product is sold and needs per-customer identity providers.
- Hosted identity services (Auth0, Clerk, WorkOS): fast to set up, but per-user pricing and another vendor holding staff identities.
- JWTs stored in the browser instead of server sessions: harder to revoke immediately and easier to get wrong.
