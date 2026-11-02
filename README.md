# MTA → Tokenizer Conditions

In Foundry Setup → Add-on Modules → Install Module, paste this Manifest URL:

```text
https://raw.githubusercontent.com/m00nwtchr/CofD-Tokenizer-Bridge/master/module.json
```

Install, then enable **MTA → Tokenizer Conditions** in your world's Manage Modules.
The download uses GitHub's source ZIP for master. Requires Foundry 14, mta, and
Tokenizer 2 with the documented `conditions.setOnToken/onToken/all` API (1.7+).
Enable Tokenizer's **Show conditions on map tokens**.

The active GM syncs Condition/Tilt Items on creation, update and deletion, on
scene loading, on token creation, on GM changes, and on Tokenizer setting updates.
Both linked and unlinked placed tokens are scanned across scenes. A connected GM
is required; changes are reconciled when the GM reconnects.

Item names are lowercased and passed to Tokenizer's existing `forStatus` mapping.
Unmapped names fall back to matching ring IDs. Explicit No ring mappings are
respected. Configure custom names in Tokenizer's Condition Rings → Status mappings
using the lowercase Item name. Unknown rings are skipped.

Only Items with mta's **status visibility = All** are synced. Owner-only and hidden
Items are excluded because manually selected Tokenizer rings are shared with all
viewers. mta's separate Show Conditions on Tokens option can stay off.

Unrelated manual rings are retained; the module records which rings it manages.
Tokenizer stores each ring once, so manually selecting an already automatic ring
cannot register a second independent claim. A ring selected manually BEFORE the
bridge first manages it is retained. Rings applied by earlier console experiments
are initially treated as manual: clear those once before enabling the bridge.

Force a resync from the console:

    await game.modules.get("mta-tokenizer-bridge").api.sync();

Before uninstalling: remove the synced Conditions/Tilts (or temporarily set their
visibility to hidden) while the bridge is enabled, to remove its automatic rings.
Disabling the bridge alone leaves the last synced rings on the tokens.

Validation: isolated mocked-API tests; not yet tested inside a live Foundry world.
