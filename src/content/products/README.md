# content/products

The schema for every future BGrowth product, defined in `types.ts`
(`ContentManifest`, `ContentProduct`, and their supporting types).

No sample products exist yet — this phase is architecture only (see the
top-level `content/README.md`). Once populated, each product will live in
its own folder:

```
content/products/start-cleaning-business/
  manifest.json   — conforms to ContentManifest
  product.json    — conforms to ContentProduct

content/products/mobile-notary-basics/
  manifest.json
  product.json
```

No loader, registry, or build step reads this folder yet.
