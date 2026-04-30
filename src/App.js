import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './App.css';
import CouponUploader from './components/CouponUploader';
import { ToastContainer } from 'react-toastify';
const App = () => {
    return (_jsxs("div", { className: "App", children: [_jsx(CouponUploader, {}), _jsx(ToastContainer, { position: 'top-right', autoClose: 2000 })] }));
};
export default App;
