import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CouponUploader from './CouponUploader';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('axios');

import { toast } from 'react-toastify';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_COUPONS = [
  { code: 'SAVE10', discountAmount: 10, expiryDate: '2099-01-01' },
  { code: 'HALF50', discountAmount: 50, expiryDate: '2099-06-30' },
];

/** Creates a File object whose text content is the serialised value passed in */
function makeJsonFile(content: unknown, name = 'coupons.json'): File {
  return new File([JSON.stringify(content)], name, {
    type: 'application/json',
  });
}

/** Drives FileReader.onload synchronously with the given text */
function mockFileReader(text: string) {
  const mockReader = {
    onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
    readAsText(this: typeof mockReader) {
      this.onload?.({
        target: { result: text },
      } as unknown as ProgressEvent<FileReader>);
    },
  };

  jest
    .spyOn(global, 'FileReader')
    .mockImplementation(() => mockReader as unknown as FileReader);

  return mockReader;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CouponUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Initial render', () => {
    it('renders the page heading', () => {
      render(<CouponUploader />);
      expect(screen.getByText('Coupon Uploader')).toBeInTheDocument();
    });

    it('renders the drop zone with instructions', () => {
      render(<CouponUploader />);
      expect(
        screen.getByText(/drag and drop the coupons file/i)
      ).toBeInTheDocument();
    });

    it('renders the file input', () => {
      render(<CouponUploader />);
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('renders the Upload button', () => {
      render(<CouponUploader />);
      expect(
        screen.getByRole('button', { name: /upload coupons/i })
      ).toBeInTheDocument();
    });

    it('shows the empty-state message when no coupons are loaded', () => {
      render(<CouponUploader />);
      expect(screen.getByText(/no coupons to loaded/i)).toBeInTheDocument();
    });

    it('does NOT render the table when there are no coupons', () => {
      render(<CouponUploader />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── validateCoupons (exercised indirectly via file input) ──────────────────

  describe('Coupon validation', () => {
    it('filters out coupons with discountAmount below 1', () => {
      const coupons = [
        { code: 'ZERO', discountAmount: 0, expiryDate: '2099-01-01' },
        { code: 'VALID', discountAmount: 5, expiryDate: '2099-01-01' },
      ];
      mockFileReader(JSON.stringify(coupons));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, { target: { files: [makeJsonFile(coupons)] } });

      expect(screen.queryByText('ZERO')).not.toBeInTheDocument();
      expect(screen.getByText('VALID')).toBeInTheDocument();
    });

    it('filters out coupons with discountAmount above 1000', () => {
      const coupons = [
        { code: 'OVER', discountAmount: 1001, expiryDate: '2099-01-01' },
        { code: 'MAX', discountAmount: 1000, expiryDate: '2099-01-01' },
      ];
      mockFileReader(JSON.stringify(coupons));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, { target: { files: [makeJsonFile(coupons)] } });

      expect(screen.queryByText('OVER')).not.toBeInTheDocument();
      expect(screen.getByText('MAX')).toBeInTheDocument();
    });

    it('filters out coupons with an invalid expiryDate', () => {
      const coupons = [
        { code: 'BADDATE', discountAmount: 10, expiryDate: 'not-a-date' },
        { code: 'GOODDATE', discountAmount: 10, expiryDate: '2099-01-01' },
      ];
      mockFileReader(JSON.stringify(coupons));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, { target: { files: [makeJsonFile(coupons)] } });

      expect(screen.queryByText('BADDATE')).not.toBeInTheDocument();
      expect(screen.getByText('GOODDATE')).toBeInTheDocument();
    });

    it('accepts coupons at the boundary values (1 and 1000)', () => {
      const coupons = [
        { code: 'MIN', discountAmount: 1, expiryDate: '2099-01-01' },
        { code: 'MAX', discountAmount: 1000, expiryDate: '2099-01-01' },
      ];
      mockFileReader(JSON.stringify(coupons));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, { target: { files: [makeJsonFile(coupons)] } });

      expect(screen.getByText('MIN')).toBeInTheDocument();
      expect(screen.getByText('MAX')).toBeInTheDocument();
    });
  });

  // ── File input (click-to-browse) ───────────────────────────────────────────

  describe('handleFileChange – file input', () => {
    it('loads valid coupons and renders the table', () => {
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('SAVE10')).toBeInTheDocument();
      expect(screen.getByText('HALF50')).toBeInTheDocument();
    });

    it('shows toast.info after valid coupons are loaded', async () => {
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('coupons loaded successfully');
      });
    });

    it('shows toast.error and throws for a non-JSON file', () => {
      render(<CouponUploader />);
      const txtFile = new File(['hello'], 'data.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]')!;

      expect(() =>
        fireEvent.change(input, { target: { files: [txtFile] } })
      ).toThrow('Invalid file type');

      expect(toast.error).toHaveBeenCalledWith('Invalid file type');
    });

    it('shows toast.error when the JSON content is not an array', () => {
      mockFileReader(JSON.stringify({ code: 'OOPS' }));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;

      expect(() =>
        fireEvent.change(input, {
          target: { files: [makeJsonFile({ code: 'OOPS' })] },
        })
      ).toThrow('Invalid format, expected an array of coupons');

      expect(toast.error).toHaveBeenCalledWith(
        'Invalid format, expected an array of coupons'
      );
    });

    it('hides the empty-state message after coupons are loaded', () => {
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(
        screen.queryByText(/no coupons to loaded/i)
      ).not.toBeInTheDocument();
    });
  });

  // ── Drag and drop ──────────────────────────────────────────────────────────

  describe('Drag and drop', () => {
    it('adds the "dragging" class on dragOver', () => {
      render(<CouponUploader />);
      const dropZone = document.querySelector('.drop-zone')!;

      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass('dragging');
    });

    it('removes the "dragging" class on dragLeave', () => {
      render(<CouponUploader />);
      const dropZone = document.querySelector('.drop-zone')!;

      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).not.toHaveClass('dragging');
    });

    it('removes the "dragging" class after a successful drop', () => {
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const dropZone = document.querySelector('.drop-zone')!;

      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(dropZone).not.toHaveClass('dragging');
    });

    it('loads coupons when a valid JSON file is dropped', () => {
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const dropZone = document.querySelector('.drop-zone')!;

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(screen.getByText('SAVE10')).toBeInTheDocument();
    });

    it('shows toast.error when a non-JSON file is dropped', () => {
      render(<CouponUploader />);
      const dropZone = document.querySelector('.drop-zone')!;
      const txtFile = new File(['hello'], 'bad.txt', { type: 'text/plain' });

      expect(() =>
        fireEvent.drop(dropZone, { dataTransfer: { files: [txtFile] } })
      ).toThrow('Invalid file type');

      expect(toast.error).toHaveBeenCalledWith('Invalid file type');
    });
  });

  // ── Upload button ──────────────────────────────────────────────────────────

  describe('handleUpload', () => {
    it('shows toast.error when Upload is clicked with no coupons', async () => {
      render(<CouponUploader />);
      const btn = screen.getByRole('button', { name: /upload coupons/i });

      await userEvent.click(btn);

      expect(toast.error).toHaveBeenCalledWith('No coupons to upload');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('calls axios.post and shows success toast on a successful upload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      const btn = screen.getByRole('button', { name: /upload coupons/i });
      await userEvent.click(btn);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'https://jsonplaceholder.typicode.com/posts',
          VALID_COUPONS
        );
        expect(toast.success).toHaveBeenCalledWith(
          'Coupons Uploaded to the Server Successfully'
        );
      });
    });

    it('shows toast.error when axios.post rejects', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      mockFileReader(JSON.stringify(VALID_COUPONS));

      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      const btn = screen.getByRole('button', { name: /upload coupons/i });
      await userEvent.click(btn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error while uploading...');
      });
    });
  });

  // ── Table rendering ────────────────────────────────────────────────────────

  describe('Coupon table', () => {
    beforeEach(() => {
      mockFileReader(JSON.stringify(VALID_COUPONS));
    });

    it('renders correct column headers', () => {
      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Expiry')).toBeInTheDocument();
    });

    it('renders one row per valid coupon', () => {
      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      // 1 header row + 2 data rows = 3 total
      expect(screen.getAllByRole('row')).toHaveLength(3);
    });

    it('displays the coupon code, amount, and expiry in each row', () => {
      render(<CouponUploader />);
      const input = document.querySelector('input[type="file"]')!;
      fireEvent.change(input, {
        target: { files: [makeJsonFile(VALID_COUPONS)] },
      });

      expect(screen.getByText('SAVE10')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('2099-01-01')).toBeInTheDocument();
    });
  });
});