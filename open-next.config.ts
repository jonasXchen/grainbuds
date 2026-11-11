import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page reads the visitor's session cookie, so nothing is revalidated in
// the background: the few prerendered pages are served straight from the
// Worker's static assets, with no R2 bucket or KV namespace to provision.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
