# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Storefront themes

Admins can open **Admin → Customize** to apply a built-in store design, import a theme JSON file, or export the current theme. Imported themes use the `my-store-theme` format at version `1`; export a theme in the admin to get a complete editable example. A template contains appearance settings (`config`) and homepage section order and visibility (`homepage`). Product data, store copy, and checkout are not part of a theme file. The product collection must remain enabled so existing products continue to appear.

Theme JSON is a settings format, not a Shopify theme ZIP or Liquid/HTML/JavaScript runtime. Imported files are validated against this app's supported layouts, palettes, fonts, and product styles. Exported templates always include the product collection so existing products remain visible. Changes update the live preview and are published with **Save changes**.

## Product delivery costs

Admins can optionally set a delivery cost per item when adding or editing a product. Leave it blank for products with no product-specific delivery charge. Buyers see a delivery row on the product details and in their cart; configured delivery costs are included in the Stripe checkout and saved with the order. For an existing Supabase database, apply `database/migrations/004_product_delivery_cost.sql` before using this field. New database installs get the column from `database/schema.sql`.
