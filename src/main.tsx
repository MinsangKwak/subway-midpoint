import { createRoot } from 'react-dom/client';
import './ui/Common/style.css'; // reset / common 전역 적용
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
