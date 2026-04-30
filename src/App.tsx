import './App.css'
import CouponUploader from './components/CouponUploader';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <div className="App">
      <CouponUploader />
      <ToastContainer position='top-right' autoClose={2000} />
    </div>
  );
}

export default App
