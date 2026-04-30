import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './CouponUploader.css';
import axios from 'axios';

type Coupon = {
  code: string;
  discountAmount: number;
  expiryDate: string;
};

const CouponUploader = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dragging, setDragging] = useState<Boolean>(false);

  const validateCoupons = (couponsList: Coupon[]) => {
    const validCoupons = couponsList.filter((current) => {
      return (
        current.discountAmount >= 1 &&
        current.discountAmount <= 1000 &&
        !isNaN(Date.parse(current.expiryDate))
      );
    });

    return validCoupons;
  };

  const handleFileDrop = (file: unknown) => {
    if (!file || file.type !== 'application/json') {
      toast.error('Invalid file type');
      throw new Error('Invalid file type');
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent) => {
      console.log(e);
      const parsedCoupons = JSON.parse(e.target.result);

      if (!Array.isArray(parsedCoupons)) {
        toast.error('Invalid format, expected an array of coupons');
        throw new Error('Invalid format, expected an array of coupons');
      }

      const validCoupons = validateCoupons(parsedCoupons);
      setCoupons(validCoupons);
      toast.info('Coupons Loaded Successfully');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(e.dataTransfer.files);
    handleFileDrop(e.dataTransfer.files[0]);
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    handleFileDrop(file);
  }

  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (coupons.length == 0) {
      toast.error('No coupons to upload');
      return;
    }

    try {
      const res = await axios.post('https://jsonplaceholder.typicode.com/posts', coupons);
      toast.success('Coupons Uploaded to the Server Successfully');
    } catch (err) {
      toast.error('Error while uploading...');
      console.error(err);
    }
  };

  return (
    <div className="CouponUploader">
      <header>
        <h1>Coupon Uploader</h1>
      </header>

      <div
        className={`drop-zone ${dragging && `dragging`}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <p>Please drag and drop the coupons file (JSON)</p>
        <span>or</span>
        <input type="file" accept='application/json' onChange={handleFileChange} />
      </div>

      {coupons.length == 0 && <p className="no-coupons">No coupons to loaded, please load the coupons by dropping the coupon file</p>}
      {coupons.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Amount</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((current) => {
              return (
                <tr key={current.code}>
                  <td>{current.code}</td>
                  <td>{current.discountAmount}</td>
                  <td>{current.expiryDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button onClick={handleUpload}>Upload Coupons to Server</button>
    </div>
  );
};

export default CouponUploader;
