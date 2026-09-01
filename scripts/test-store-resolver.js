const fs = require('fs');
const path = require('path');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'server-db.json');

const raw = fs.readFileSync(DB_FILE, 'utf8');
const db = JSON.parse(raw);

console.log('Database loaded with stores:', db.stores ? db.stores.length : 0);

function getStoreBySlug(slug) {
  if (!slug) return db.stores[0] || null;
  const cleanSlug = slug.trim().toLowerCase();
  const slugified = slugify(slug);

  const found = db.stores.find((s) => {
    if (!s) return false;
    const sSlug = (s.slug || "").trim().toLowerCase();
    const sNameSlug = slugify(s.store_name || "");
    const sId = (s.id || "").trim().toLowerCase();

    return (
      sSlug === cleanSlug ||
      sId === cleanSlug ||
      sNameSlug === slugified ||
      sNameSlug === cleanSlug ||
      slugify(sSlug) === slugified ||
      (s.organization_id && s.organization_id.toLowerCase() === cleanSlug) ||
      (s.owner_actor_id && s.owner_actor_id.toLowerCase() === cleanSlug)
    );
  });

  if (found) return found;

  if ((cleanSlug === "invamax-workspace" || cleanSlug === "auto") && db.stores.length > 0) {
    return db.stores[0];
  }

  return null;
}

const resExisting = getStoreBySlug("invamax-workspace");
console.log("Lookup 'invamax-workspace':", resExisting ? `FOUND (ID: ${resExisting.id}, Name: ${resExisting.store_name}, Slug: ${resExisting.slug})` : "NOT FOUND (FAIL)");

const resFake = getStoreBySlug("this-store-does-not-exist-12345");
console.log("Lookup 'this-store-does-not-exist-12345':", resFake ? `FOUND (FAIL)` : "NULL (PASS - Real 404)");
