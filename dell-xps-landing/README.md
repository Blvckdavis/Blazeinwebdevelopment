# Dell XPS 13 cinematic landing page

React + Vite, Tailwind CSS v4, GSAP ScrollTrigger, and the official @gsap/react hook.

## Run locally

```powershell
cd dell-xps-landing
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Open the URL printed by Vite. `npm.cmd` avoids PowerShell execution-policy restrictions on npm.ps1.

## Checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

Browser tests use an installed Google Chrome in an isolated profile. Install Chrome before running them on another machine, or change `channel` in playwright.config.js to an installed Playwright browser. Tests save screenshots to artifacts/.

## Experience

One route, three chapters: introduction (0–100vh), engineering (100–200vh), and purchase finale (200–300vh; panel centered at 250vh). Small, short viewports can grow to fit the content. Header and chapter links support direct navigation without forced scrolling. Native scrolling drives film playback speed (0.65–1.3x), subtle background depth, sequential feature entrances, and the finale reveal.

The film is muted, loops, and starts at its product reveal. Pause persists while scrolling or switching browser tabs. Reduced-motion preferences stop the film and remove entrance/parallax animation while retaining every section. A local poster covers loading, autoplay restrictions, and film failures.

## Assets and content

- `public/dell-xps-explosion.mp4`: copied from the supplied `product_-_dell_-_xps13__liquid__teaser (1080p).mp4`; original retained. No file named dell-xps-explosion.mp4 was present in the empty workspace.
- `public/dell-xps-poster.jpg`: actual still extracted from the supplied film, no external image requests.
- The supplied film is 1920 × 1080, 55.06 seconds, approximately 32.7 MB. Compress or deliver through a media CDN before a high-traffic release if needed.
- Product specifications, model year, and price follow the supplied creative brief. They are static copy, not verified inventory or a live Dell offer.
- BUY XPS 13 opens Dell's official XPS catalog. This frontend does not process orders.

The implementation follows Tailwind's Vite integration (https://tailwindcss.com/docs/installation/using-vite) and GSAP's React cleanup guidance (https://gsap.com/resources/React/).

## Cinematic layers and technical specs

- The optional Three.js scene is lazy-loaded separately from the landing page. Three locally lit Icosahedron meshes use MeshDistortMaterial with metalness 1, roughness 0.1, and distortion 0.4. Scroll progress controls their rotation; a bounded time step drives their float and liquid surface. No external HDR asset is required.
- The GPU pixel ratio is capped at 1.5. Pausing the film also pauses the scene. The scene uses demand rendering while paused or hidden and is omitted entirely for reduced motion. Video failures stop decorative motion. A boundary outside the lazy scene handles failed imports and renderer errors while retaining the product interface.
- The headline reveals each character from y:20 with a 0.05-second stagger. Its accessible name stays intact.
- The custom cursor uses difference blending and expands over controls. It runs only for fine pointers with hover and no reduced-motion preference. It is also rendered inside the native modal's top layer; touch and reduced-motion visitors retain their normal pointer behavior.
- View Full Specs opens a 400px frosted drawer that fits narrower screens. Its nine exact key/value pairs follow the latest user-supplied brief; the main performance and memory copy use that same configuration. The list scrolls independently. Escape, the close button, and clicking outside dismiss it; focus returns to the opener after the GSAP exit. Background scroll remains locked through the exit animation.

Browser coverage includes the existing responsive journey plus drawer data/focus/dismissal, the custom cursor, WebGL pause, reduced motion, a blocked scene chunk, and a browser launched with WebGL disabled. Reference APIs: https://r3f.docs.pmnd.rs/api/canvas and https://drei.docs.pmnd.rs/shaders/mesh-distort-material.
