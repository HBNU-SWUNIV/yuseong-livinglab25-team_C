import React, { useState, useRef } from 'react';
import { recipientsApi } from '../../services/api';

const CsvUpload = ({ onSuccess, onCancel, onError }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 파일 선택 처리
  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      onError('CSV 파일만 업로드 가능합니다.');
    }
  };

  // 파일 입력 변경
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // 파일 업로드 실행
  const handleUpload = async () => {
    if (!file) {
      onError('업로드할 파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    try {
      const result = await recipientsApi.uploadCsv(file);
      onSuccess(result);
    } catch (err) {
      onError('CSV 파일 업로드에 실패했습니다.');
      console.error('CSV 업로드 오류:', err);
    } finally {
      setUploading(false);
    }
  };

  // 파일 제거
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`csv-upload ${dragOver ? 'dragover' : ''}`}>
      <h3>CSV 파일 일괄 업로드</h3>
      
      <div
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div>
            <p>선택된 파일: <strong>{file.name}</strong></p>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="btn btn-sm btn-secondary"
            >
              파일 제거
            </button>
          </div>
        ) : (
          <div>
            <p>CSV 파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              지원 형식: .csv
            </p>
          </div>
        )}
      </div>

      <div className="upload-info">
        <h4>CSV 파일 형식 안내:</h4>
        <p>첫 번째 행은 헤더로 다음 순서를 따라주세요:</p>
        <code>이름,전화번호,주소,생년월일,비상연락처</code>
        <br />
        <small>
          • 이름과 전화번호는 필수 항목입니다<br />
          • 전화번호는 010-1234-5678 또는 01012345678 형식<br />
          • 생년월일은 YYYY-MM-DD 형식 (예: 1950-01-01)<br />
          • 주소와 비상연락처는 선택사항입니다
        </small>
      </div>

      <div className="form-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          취소
        </button>
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="btn btn-primary"
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  );
};

export default CsvUpload;