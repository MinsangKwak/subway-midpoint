# SUBWAY-MIDPOINT

🚧 **Test Service (Prototype)**  
🔗 **Live Demo:** https://subway-midpoint.vercel.app  
*(Mock data 기반 테스트 서비스입니다)*

A web-based service that finds the optimal subway midpoint for multiple users  
based on their departure stations.

여러 사용자의 출발지를 기준으로 **가장 합리적인 지하철 중간 지점**을 찾는 웹 서비스입니다.

---

## ✨ Current Status

- Web-based UI implementation (no in-app dependencies)
- Custom design-system-like UI components (Button, TextField, Card)
- Multiple departure input flow with add/remove support
- Subway station search with autocomplete (mock-based)
- Kakao Map integration
  - Map initialization & center movement
  - Marker positioning based on selected station
- Subway line & station data modeling (Line 1, 2, 4 – limited stations)
- Clear separation of data layer (mock/service) and UI layer

> ⚠️ Station search is currently limited to a predefined mock dataset  
> (major stations on Line 1, 2, and 4 only).

---

## 🧱 Project Structure

```
src/
├─ app/
│ └─ App.tsx # Application shell
├─ pages/
│ └─ HomePage.tsx # Main page & business logic
├─ services/
│ └─ subway/
│    ├─ subway.mock.ts    # Mock subway line & station data
│    ├─ subway.service.ts # Search & data normalization logic
│    └─ subway.types.ts   # Subway domain types
├─ ui/
│ ├─ Button/
│ ├─ Card/
│ ├─ Input/
│ ├─ Map/                # KakaoMap component
│ └─ BottomSheetModal/
├─ main.tsx
└─ styles/
```

---

## 📌 Data Limitation (Important)

This service currently uses a **mock subway dataset** for development and testing.

- Supported lines: **Line 1, Line 2, Line 4**
- Supported stations: **Major stations only**
- Full subway network search is NOT available yet

This limitation exists to validate:
- UI/UX flow
- Map interaction
- Midpoint calculation logic

Full dataset integration will be addressed in a later phase.

---

## 🎨 UI Components

All UI components are implemented as **pure, reusable components**.

- **Button**
  - size: `large | small`
  - fullWidth / disabled support
- **TextField**
  - placeholder / value / onChange support
- **Card**
  - Layout container for page composition

> Components are implemented using **CSS Modules**  
> and follow a design-system-oriented structure.

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

The app will run on:

```bash
http://localhost:5173
```

## 🛠 Tech Stack

### Core
- React 19
- TypeScript
- Vite

### Styling
- CSS Modules
- react-icons

### Code Quality
- ESLint
- Prettier

### 🧭 Next Steps
- Dynamic departure input management (add/remove users)
- Subway line & station data modeling
- Midpoint calculation algorithm
- Result visualization
- Mobile-first UI refinements

### 📌 Project Goal
- Build a scalable web service with logic-first architecture,clean UI separation, and extensible component design.