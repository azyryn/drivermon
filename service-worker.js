const DRIVERMON_CACHE="drivermon-app-v1";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/drivermon-icon-180.png",
  "./assets/drivermon-icon-192.png",
  "./assets/drivermon-icon-512.png",
  "./assets/drivermon-icon-maskable-512.png",
  "./assets/drivermon-splash.png"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(DRIVERMON_CACHE);
    await Promise.allSettled(APP_SHELL.map(async url=>{
      const response=await fetch(url,{cache:"reload"});
      if(response.ok)await cache.put(url,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith("drivermon-app-")&&name!==DRIVERMON_CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request);
        if(fresh.ok){
          const cache=await caches.open(DRIVERMON_CACHE);
          cache.put("./index.html",fresh.clone());
        }
        return fresh;
      }catch(error){
        return (await caches.match(request))||(await caches.match("./index.html"));
      }
    })());
    return;
  }

  if(["style","script","image","font","manifest"].includes(request.destination)){
    event.respondWith((async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      const response=await fetch(request);
      if(response.ok){
        const cache=await caches.open(DRIVERMON_CACHE);
        cache.put(request,response.clone());
      }
      return response;
    })());
  }
});
