<div align="center">

# 🌳 TreeMap-ITE
### Interactive tree observation and environmental mapping

**An educational, collaborative web project connecting geographic visualization and environmental data.**

[**🌐 Live website**](https://treemap.savi.tec.br/) · [**👤 Leonardo Ribeiro**](https://github.com/leoribeirodev)

</div>

---

## About the project

TreeMap-ITE helps visualize tree observations associated with educational and community activities in the Bauru region of São Paulo, Brazil. The web interface integrates interactive maps, species information, observation cards, and environmental-measurement processing.

> **Public source snapshot:** This repository contains selected frontend/source components for portfolio and educational review. It is **not** the complete production system or a fully functional standalone deployment. The protected PHP API, administrative interface, gallery service configuration, email service configuration, scientific data redistribution, and event photos are intentionally excluded.

## Features visible in the source

- Interactive maps built with **Leaflet** and OpenStreetMap tiles
- Geographic markers, observation details, and recent-observation cards
- Desktop/mobile statistics and responsive UI
- Support for observation measurements, including `C=...;A=...` and an older slash-separated format
- Integration layer for retrieving and normalizing externally sourced observation data
- Environmental calculation routines that require separate scientific reference data
- Public information pages explaining the project and how to contribute
- Frontend escaping of observation text and HTTP(S)-only validation for external image URLs in this curated snapshot

## Tech stack

`HTML5` · `CSS3` · `JavaScript` · `Tailwind CSS` · `Leaflet` · `Font Awesome` · `JSON` · `REST-style API integration`

**Backend in production:** protected PHP service (not included here).  
**Scientific reference:** a separate wood-density dataset is used by the live application (not distributed in this snapshot).

## Structure

```text
.
├── index.html                 # Main map and UI
├── sobre.html                 # About page (gallery integration removed)
├── contribuir.html            # Contribution guide (email form disabled)
├── api.js                     # Frontend observation fetching and rendering
├── dados-ambientais.js       # Species/environmental reference logic
├── calculos-ambientais.js    # Environmental calculation routines
├── style.css
├── assets/img/                # Minimal site branding assets
└── docs/                      # Architecture and disclosure notes
```

## Running the public snapshot locally

1. Download or clone the repository.
2. From the project directory, start a static HTTP server:

   ```bash
   python -m http.server 8000
   ```

3. Open `http://localhost:8000`.

The static layout and base map can be previewed, but **observation data will not load** because the frontend references a protected endpoint at `/api/api.php`, whose implementation is intentionally absent. The project gallery and email submission are also disabled in this snapshot. Environmental calculations that require the excluded dataset will be unavailable. For the full working experience, visit the [official TreeMap website](https://treemap.savi.tec.br/).

## Source disclosure and security

- This curated snapshot adds output encoding for externally sourced observation text and validates image URL schemes; these hardening changes are **not** claimed to be deployed on the live site.

- No authentication, administrative interface, server credentials or private PHP implementation are distributed here.
- Frontend JavaScript is not a secure location for secrets. Never add private API keys, tokens or credentials to this repository.
- This repository was assembled as a **separate, curated source snapshot**; it is not a copy of the production Git history.
- Some visual assets are included solely for project identification; their publication/redistribution rights should be confirmed before making the repository public.
- A public source snapshot should not be used as a replacement for a security review of the live service.

## Credits and attribution

TreeMap-ITE is a **collaborative educational project**. The live service is associated with the Instituição Toledo de Ensino (ITE) and community tree-observation work. Third-party services and libraries (including Leaflet, OpenStreetMap and Pl@ntNet) retain their respective ownership and terms.

This repository is included in **Leonardo Ribeiro's development portfolio** to document work with web interfaces, interactive maps and API-driven data presentation. It does not claim sole authorship of the institutional project.

## Licensing

**No open-source license is granted by this snapshot.** Source visibility does not automatically authorize reuse or redistribution. A license may be added after confirming the project owner's requirements and rights for the included materials.
