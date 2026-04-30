import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './CouponUploader.css';
import axios from 'axios';
const CouponUploader = () => {
    const [coupons, setCoupons] = useState([]);
    const [dragging, setDragging] = useState(false);
    useEffect(() => {
        if (coupons.length > 0) {
            toast.info('coupons loaded successfully');
        }
    }, [coupons]);
    const validateCoupons = (couponsList) => {
        const validCoupons = couponsList.filter((current) => {
            return (current.discountAmount >= 1 &&
                current.discountAmount <= 1000 &&
                !isNaN(Date.parse(current.expiryDate)));
        });
        return validCoupons;
    };
    const handleFileDrop = (file) => {
        if (!file || file.type !== 'application/json') {
            toast.error('Invalid file type');
            throw new Error('Invalid file type');
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log(e);
            const parsedCoupons = JSON.parse(e.target.result);
            if (!Array.isArray(parsedCoupons)) {
                toast.error('Invalid format, expected an array of coupons');
                throw new Error('Invalid format, expected an array of coupons');
            }
            const validCoupons = validateCoupons(parsedCoupons);
            setCoupons(validCoupons);
        };
        reader.readAsText(file);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        console.log(e.dataTransfer.files);
        handleFileDrop(e.dataTransfer.files[0]);
        setDragging(false);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };
    const handleFileChange = (e) => {
        const file = e.target?.files?.[0];
        handleFileDrop(file);
    };
    const handleUpload = async (e) => {
        if (coupons.length == 0) {
            toast.error('No coupons to upload');
            return;
        }
        try {
            const res = await axios.post('https://jsonplaceholder.typicode.com/posts', coupons);
            toast.success('Coupons Uploaded to the Server Successfully');
        }
        catch (err) {
            toast.error('Error while uploading...');
            console.error(err);
        }
    };
    return (_jsxs("div", { className: "CouponUploader", children: [_jsx("header", { children: _jsx("h1", { children: "Coupon Uploader" }) }), _jsxs("div", { className: `drop-zone ${dragging && `dragging`}`, onDragOver: handleDragOver, onDrop: handleDrop, onDragLeave: handleDragLeave, children: [_jsx("p", { children: "Please drag and drop the coupons file (JSON)" }), _jsx("span", { children: "or" }), _jsx("input", { type: "file", accept: 'application/json', onChange: handleFileChange })] }), coupons.length == 0 && _jsx("p", { className: "no-coupons", children: "No coupons to loaded, please load the coupons by dropping the coupon file" }), coupons.length > 0 && (_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Code" }), _jsx("th", { children: "Amount" }), _jsx("th", { children: "Expiry" })] }) }), _jsx("tbody", { children: coupons.map((current) => {
                            return (_jsxs("tr", { children: [_jsx("td", { children: current.code }), _jsx("td", { children: current.discountAmount }), _jsx("td", { children: current.expiryDate })] }, current.code));
                        }) })] })), _jsx("button", { onClick: handleUpload, children: "Upload Coupons to Server" })] }));
};
export default CouponUploader;
