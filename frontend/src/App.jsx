import { Route, Routes } from 'react-router-dom';
import CheckoutLayout from './components/CheckoutLayout.jsx';
import AmountPage from './pages/AmountPage.jsx';
import CardPage from './pages/CardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import TestPage from './pages/TestPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/checkout/:sessionId" element={<CheckoutLayout />}>
        <Route index element={<AmountPage />} />
        <Route path="card" element={<CardPage />} />
      </Route>
      <Route path="/mockpay/checkout/:sessionId" element={<CheckoutLayout />}>
        <Route index element={<AmountPage />} />
        <Route path="card" element={<CardPage />} />
      </Route>
      <Route path="/result/:paymentId" element={<ResultPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/mockpay/result/:paymentId" element={<ResultPage />} />
      <Route path="/" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
