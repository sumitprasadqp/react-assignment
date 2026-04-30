import React, { useState } from 'react';
import './CouponUploader.css';

type Coupon = {
  code: string;
  discountAmount: number;
  expireDate: string;
};

const CouponUploader = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dragging, setDragging] = useState<Boolean>(false);

  const handleFileDrop = (file: unknown) => {
    if (!file || file.type !== 'application/json') {
      alert('Invalid file type');
      return;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(e.dataTransfer.files);
    handleFileDrop(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
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
      </div>

      {
        coupons.length == 0 && <p>No coupons to display</p>
      }
      {
        coupons.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Amount</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {
                coupons.map((current) => {
                  return (
                    <tr key={current.code}>
                      <td>{current.code}</td>
                      <td>{current.discountAmount}</td>
                      <td>{current.expireDate}</td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        )
      }

      <button>Upload Coupons to Server</button>
    </div>
  );
};

export default CouponUploader;
