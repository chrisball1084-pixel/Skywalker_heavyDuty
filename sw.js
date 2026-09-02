// Skywalker Training — Service Worker (v6.12.0)
// Beim Versionswechsel CACHE-Namen aendern, dann raeumt activate() alles Alte weg.
var CACHE = "sky-training-v6.12.0";
var SHELL = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(SHELL);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      if(k !== CACHE) return caches.delete(k);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

// Netz zuerst, damit neue Versionen sofort ankommen; offline aus dem Cache.
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  if(e.request.url.indexOf(self.location.origin) !== 0) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      if(r && r.status === 200){
        var copy = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(m){
        return m || caches.match("./index.html");
      });
    })
  );
});
