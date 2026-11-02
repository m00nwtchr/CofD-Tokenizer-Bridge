const ID = "mta-tokenizer-bridge";
let started = false;
let queue = Promise.resolve();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = a => [...new Set(a)];

// Exported for isolated tests; no world data is changed here.
export function mappedRings(actor, api) {
  const known = new Set(api.all().map(r => typeof r === "string" ? r : r.id ?? r.name));
  return unique(actor.items
    .filter(i => ["condition", "tilt"].includes(i.type))
    // Token flags are shared: never publish Owner-only or hidden conditions.
    .filter(i => i.system.statusVisibility === "All")
    .map(i => i.name.toLowerCase())
    .map(name => {
      const mapped = api.forStatus(name);
      return mapped === undefined ? name : mapped;
    })
    .filter(name => name && known.has(name)));
}

export function mergeRings(current, previous, desired) {
  const managed = previous.managed ?? [];
  const manual = unique([
    ...(previous.manual ?? []).filter(r => current.includes(r)),
    ...current.filter(r => !managed.includes(r)),
  ]);
  return { rings: unique([...manual, ...desired]), state: { manual, managed: desired } };
}

async function syncAll() {
  if (game.system.id !== "mta" || game.users.activeGM?.id !== game.user.id) return;
  const api = game.modules.get("tokenizer-2")?.api?.conditions;
  if (!api?.setOnToken || !api?.onToken || !api?.all) return;
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      if (!token.actor) continue;
      const desired = mappedRings(token.actor, api);
      const current = api.onToken(token);
      const previous = token.getFlag(ID, "sync") ?? {};
      const { rings, state } = mergeRings(current, previous, desired);
      if (!same(current, rings)) await api.setOnToken(token, rings);
      if (!same(previous, state)) await token.setFlag(ID, "sync", state);
    }
  }
}

function schedule() {
  if (!started) return;
  queue = queue.then(syncAll).catch(error => {
    console.error(`${ID} | Condition sync failed`, error);
    ui.notifications.error("MTA Tokenizer condition sync failed; see browser console.");
  });
}
function start() {
  if (started || !game.ready || !game.modules.get("tokenizer-2")?.api?.conditions) return;
  started = true;
  game.modules.get(ID).api = { sync: () => { schedule(); return queue; } };
  schedule();
}
Hooks.once("ready", start);
Hooks.once("tokenizer-2.ready", start);
for (const event of ["createItem", "updateItem", "deleteItem"]) {
  Hooks.on(event, item => {
    if (item.parent?.documentName === "Actor" && ["condition", "tilt"].includes(item.type)) schedule();
  });
}
Hooks.on("createToken", schedule);
Hooks.on("canvasReady", schedule);
Hooks.on("updateUser", schedule);
Hooks.on("updateToken", (_token, changes) => {
  if ("actorId" in changes || "actorLink" in changes || "delta" in changes) schedule();
});
Hooks.on("updateSetting", setting => {
  if (setting.key?.startsWith("tokenizer-2.")) schedule();
});
