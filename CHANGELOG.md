# 📜 Changelog

All notable changes to the **Vanigan WhatsApp Bot** will be documented in this file.

---

## [1.1.0] - 2026-03-11 (Latest)
### ✨ Added
- **Interactive Messaging**: Replaced text-based menus with interactive **List** and **Button** messages for a premium UX.
- **Visual Enhancements**: Added a high-quality introductory **Welcome Banner** (image) with caption.
- **Session Navigation**: Improved "Back" (0) and "Main Menu" (9) functionality across all states.
- **Comprehensive Documentation**: Added a full suite of `.md` documentation files for GitHub and future upgrades.

### 🐛 Fixed
- Improved webhook acknowledgment reliability (always sends 200 OK for valid objects).
- Fixed state machine dead ends in the "Add Business" flow.

---

## [1.0.0] - 2026-03-09
### ✨ Initial Release
- Core Node.js Express framework set up.
- Meta WhatsApp Cloud API integration (v18.0).
- Basic state-managed bot with text menus (1-6).
- Support for Business, Organizer, and Member search (mock data).
- Initial "Add Business" data collection flow.
- Deployment configuration for Render (`render.yaml`).
- Frontend Vite + React starter project configured.

---

## [0.1.0] - 2026-03-01
### 🛠️ Beta Development
- Initial webhook verification tests.
- Mock menu designs for district-level networking.
- Initial architecture planning for the state machine.
- Local development setup with `dotenv` and `axios`.

---

> [!NOTE]  
> Future changes will follow the [Semantic Versioning](https://semver.org/) format.
