// Provider-agnostic shapes. Nothing in this file — or anywhere else in
// Identity — imports an identity/auth provider's SDK. See ARCHITECTURE.md's
// Identity Architecture section for the full
// Application → BGrowth Identity™ → Provider Adapter → Firebase/Supabase/...
// flow this supports.

// Known providers are listed for autocomplete, but the `(string & {})`
// union member means an unlisted future provider is still a valid
// IdentityProviderId without a type change — mirrors
// modules/commerce/types/provider.ts's ProviderId pattern.
export type KnownIdentityProviderId = 'firebase' | 'supabase' | 'clerk' | 'auth0' | 'cognito' | 'custom'

export type IdentityProviderId = KnownIdentityProviderId | (string & {})
