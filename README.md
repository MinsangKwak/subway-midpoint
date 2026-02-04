# SUBWAY-MIDPOINT

A web-based service that finds the optimal subway midpoint for multiple users  
based on their departure stations.

여러 사용자의 출발지를 기준으로 **가장 합리적인 지하철 중간 지점**을 찾는 웹 서비스입니다.

---

## ✨ Current Status

- Web-based UI implementation (no in-app dependencies)
- Custom **design-system-like components** (Button, Card, TextField)
- Departure input flow with CTA actions
- Clean separation of App / Page / UI layers
- Ready for future business logic and algorithm integration

> This project is currently focused on **web deployment**.  
> There are no Toss in-app or TDS dependencies.

---

## 🧱 Project Structure

```
src/
├─ app/
│ └─ App.tsx # Application shell
├─ pages/
│ └─ HomePage.tsx # Main page & business logic
├─ ui/
│ ├─ Button/ # Reusable button component
│ ├─ Card/ # Layout container
│ └─ Input/ # TextField component
├─ main.tsx
└─ styles/
```

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