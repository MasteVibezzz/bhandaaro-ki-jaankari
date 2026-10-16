# Bhandaaro Ki Jaankari
### भंडारों की जानकारी

A community-driven platform for discovering and sharing Bhandaara, Langar, Prasadam, and other free-food locations in Pune, India.

## Motivation

Information about free community meals is often shared through word of mouth, posters, or local groups. Bhandaaro Ki Jaankari explores how a bilingual, map-based interface can bring that information together and make it easier to find nearby meal locations.

## Project status

**The current version is a frontend prototype.** It demonstrates the interface and user journeys for a future community platform.

- Location listings, reviews, availability indicators, and community statistics include seeded demonstration data.
- Added locations and selected user/activity state use browser `localStorage`; there is no shared database or cross-device synchronization.
- Sign-up and sign-in are simulated client-side flows, not real authentication.
- Ratings, reviews, and check-ins demonstrate the intended experience; they are not a verified, live community service.

A backend, persistent database, and real authentication are planned. The prototype's meal listings and opening status should not be treated as verified real-time information.

## Features

The prototype includes:

- **Map and list views** for exploring free-food locations in Pune.
- **Search** by location name or address.
- **Filters** for daily, regular, and festival locations, plus displayed availability.
- **Hindi and English** interface switching.
- **Add-location form** with a map-based coordinate picker and local browser storage.
- **Community check-in flow** with feedback and a rating selector.
- **Sample ratings, reviews, activity feed, and statistics.**
- **Sign-up and sign-in interfaces** demonstrating account-related journeys.
- **Responsive layouts** and styles that support system dark-mode preferences.

## Tech stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Page structure and forms |
| CSS3 | Styling, responsive layouts, and color themes |
| JavaScript | Interface behavior and client-side state |
| Leaflet.js | Interactive maps and location selection |
| OpenStreetMap | Map tiles |
| Font Awesome | Interface icons |
| Browser localStorage | Local prototype data and user state |

There is no build system, backend service, or package installation requirement in the current version.

## Running locally

### Prerequisites

- A modern web browser.
- Git, if cloning the repository.
- An internet connection for CDN-hosted libraries, icons, and map tiles.

### Setup

Clone the repository and enter its directory:

```bash
git clone https://github.com/MasteVibezzz/bhandaaro-ki-jaankari.git
cd bhandaaro-ki-jaankari
```

Open `index.html` in your browser. No API keys or environment variables are required.

If your browser restricts storage when opening local files, serve the folder with a local static server. For example, if Python 3 is installed:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

Prototype data saved in localStorage belongs to that browser and origin. Clearing site storage removes locally saved data.

## Project structure

```text
bhandaaro-ki-jaankari/
├── index.html   # Page layout and forms
├── style.css    # Styling and responsive layouts
├── app.js       # Maps, interactions, sample data, and local state
└── README.md    # Project documentation
```

## Development roadmap

The following items are planned improvements, not completed features:

- [ ] Introduce a REST API for locations, reviews, and check-ins.
- [ ] Add a persistent database and shared data across users and devices.
- [ ] Replace simulated account flows with secure authentication and authorization.
- [ ] Connect rating and review submissions to persistent records.
- [ ] Add community verification, moderation, and reporting for location information.
- [ ] Improve meal schedules, availability updates, and location accuracy.
- [ ] Organize the application into maintainable modules.
- [ ] Add automated tests, accessibility checks, and validation.
- [ ] Publish a hosted demo with screenshots and deployment documentation.

## Author

Created by **Manit Bhatia** — [@MasteVibezzz](https://github.com/MasteVibezzz).

This project explores frontend development, interactive maps, bilingual interfaces, and technology for community needs.
