/* MyCanvas Studio — localStorage persistence. All original. */
(function () {
  "use strict";
  const KEY = "mycanvas.projects.v1";

  const Store = {
    _read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
      catch (e) { return {}; }
    },
    _write(map) {
      try { localStorage.setItem(KEY, JSON.stringify(map)); return true; }
      catch (e) { console.warn("save failed (storage full?)", e); return false; }
    },

    list() {
      const map = this._read();
      return Object.values(map).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    get(id) {
      const m = this._read();
      return m[id] ? m[id].doc : null;
    },
    save(doc, thumb) {
      const map = this._read();
      doc.updatedAt = Date.now();
      map[doc.id] = { doc, thumb: thumb || (map[doc.id] && map[doc.id].thumb) || null, updatedAt: doc.updatedAt };
      return this._write(map);
    },
    remove(id) {
      const map = this._read();
      delete map[id];
      return this._write(map);
    },
    duplicate(doc) {
      const U = window.MC.U;
      const c = U.clone(doc);
      c.id = U.uid("doc");
      c.name = doc.name + " copy";
      c.createdAt = Date.now();
      c.updatedAt = Date.now();
      c.pages.forEach((p) => { p.id = U.uid("pg"); p.elements.forEach((e) => (e.id = U.uid("el"))); });
      const map = this._read();
      map[c.id] = { doc: c, thumb: null, updatedAt: c.updatedAt };
      this._write(map);
      return c;
    },
    setThumb(id, dataUrl) {
      const map = this._read();
      if (map[id]) { map[id].thumb = dataUrl; map[id].updatedAt = map[id].updatedAt || Date.now(); this._write(map); }
    },
    importJson(str) {
      const doc = JSON.parse(str);
      if (!doc || !Array.isArray(doc.pages) || doc.pages.length === 0) throw new Error("Not a valid design file");
      if (!doc.id) doc.id = window.MC.U.uid("doc");
      return doc;
    },
  };

  window.MC = window.MC || {};
  window.MC.Store = Store;
})();
